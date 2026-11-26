<?php
/**
 * Ars Preuge – prihlásenie pre ChatGPT, Claude a iné aplikácie s MCP (od 2.1.10), OAuth 2.1.
 * Človek z tímu pri pripájaní v okne prihlási svojím účtom vo WordPresse a klikne „Povoliť“; aplikácia potom na /wp-json/arsp/v1/mcp
 * vidí to isté, čo on (prístupy z inc/pristupy.php). Hermes ďalej používa kľúč z Ars Preuge → AI (inc/mcp.php) – to sa nemení.
 *
 * Adresy (všetky obslúži WordPress pri „init“, nič sa nepridáva do .htaccess):
 *   /.well-known/oauth-protected-resource   – opis chráneného servera (RFC 9728; aj /arsp-oauth/.well-known/…, na ktorú odkazuje hlavička WWW-Authenticate)
 *   /.well-known/oauth-authorization-server – opis prihlasovania (RFC 8414; vydavateľ je <web>/arsp-oauth, opis je na všetkých adresách,
 *                                             kde ho aplikácie hľadajú: …/oauth-authorization-server/arsp-oauth, …/openid-configuration…, /arsp-oauth/.well-known/…)
 *   /arsp-oauth/register  – aplikácia sa sama zaregistruje (RFC 7591), návratová adresa len chatgpt.com, claude.ai, claude.com alebo localhost
 *   /arsp-oauth/authorize – okno so súhlasom (PKCE S256 povinné, odpoveď s „iss“ podľa RFC 9207)
 *   /arsp-oauth/token     – výmena kódu za token a obnovenie tokenu
 *   /arsp-oauth/revoke    – zrušenie pripojenia (RFC 7009)
 * Uložené: aplikácie v možnosti arsp_oauth_clients; každé pripojenie (človek + aplikácia) v arsp_oag_<id> (len odtlačky obnovovacích tokenov),
 * kedy sa naposledy použilo v arsp_oauth_used. Prístupový token je podpísaný (HMAC, platí 1 hodinu, neukladá sa); obnovovací token
 * je „<id pripojenia>.<náhodný reťazec>“, pri každom obnovení sa vymení (starý platí ešte 2 minúty – kvôli súbežným požiadavkám).
 * Správca vidí pripojenia v Ars Preuge → AI, môže ich odpojiť a celé pripájanie vypnúť.
 */
if (!defined('ABSPATH')) exit;

define('ARSP_OAUTH_AT_TTL', 3600);
define('ARSP_OAUTH_RT_TTL', 90 * DAY_IN_SECONDS);

function arsp_oauth_on() { return get_option('arsp_oauth_on', '1') === '1'; }
/** vydavateľ s cestou /arsp-oauth: opis je potom aj na /arsp-oauth/.well-known/… – to sa k WordPressu dostane, aj keď si hosting /.well-known/ nechá pre seba */
function arsp_oauth_issuer() { return untrailingslashit(home_url('/arsp-oauth')); }
function arsp_oauth_url($p) { return home_url('/arsp-oauth/' . $p); }
function arsp_oauth_resource() { return rest_url('arsp/v1/mcp'); }
function arsp_oauth_prm_url() { return home_url('/arsp-oauth/.well-known/oauth-protected-resource'); }
function arsp_oauth_scopes() { return array('mcp', 'offline_access'); }
function arsp_oauth_b64($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function arsp_oauth_unb64($s) { $s = strtr((string) $s, '-_', '+/'); return base64_decode($s . str_repeat('=', (4 - strlen($s) % 4) % 4), true); }
function arsp_oauth_rand($n = 32) { return arsp_oauth_b64(random_bytes($n)); }
/** odtlačok tajného reťazca (do databázy sa nikdy neukladá samotný token ani heslo aplikácie) */
function arsp_oauth_h($s) { return 'h' . hash_hmac('sha256', (string) $s, wp_salt('auth') . '|arsp-oauth'); }
function arsp_oauth_key() { return hash_hmac('sha256', 'arsp-oauth-access', wp_salt('auth'), true); }

/** návratová adresa aplikácie: len známe aplikácie (ChatGPT, Claude) alebo vlastný počítač (localhost) */
function arsp_oauth_redirect_ok($u) {
    $p = wp_parse_url((string) $u);
    if (!is_array($p) || empty($p['scheme']) || empty($p['host']) || isset($p['fragment'])) return false;
    $host = strtolower($p['host']); $local = in_array($host, array('localhost', '127.0.0.1', '[::1]'), true);
    if ($p['scheme'] === 'http') return $local;
    if ($p['scheme'] !== 'https') return false;
    return $local || in_array($host, (array) apply_filters('arsp_oauth_redirect_hosts', array('chatgpt.com', 'chat.openai.com', 'claude.ai', 'claude.com')), true);
}
/** zrozumiteľný názov aplikácie podľa návratovej adresy */
function arsp_oauth_app_name($ru, $name = '') {
    $host = strtolower((string) wp_parse_url((string) $ru, PHP_URL_HOST));
    if (in_array($host, array('chatgpt.com', 'chat.openai.com'), true)) $known = 'ChatGPT';
    elseif (in_array($host, array('claude.ai', 'claude.com'), true)) $known = 'Claude';
    else $known = '';
    $name = trim(wp_strip_all_tags((string) $name));
    if ($known !== '' && ($name === '' || stripos($name, $known) === false)) return $known . ($name !== '' ? ' (' . $name . ')' : '');
    return $name !== '' ? $name : ($known !== '' ? $known : $host);
}

/* ------------------------------------------------------------------ aplikácie a pripojenia */

function arsp_oauth_clients() { $c = get_option('arsp_oauth_clients', array()); return is_array($c) ? $c : array(); }
function arsp_oauth_client($id) { $c = arsp_oauth_clients(); return (is_string($id) && $id !== '' && isset($c[$id])) ? $c[$id] : null; }

function arsp_oauth_grant($gid) {
    if (!is_string($gid) || !preg_match('/^[A-Za-z0-9_-]{16,40}$/', $gid)) return null;
    $g = get_option('arsp_oag_' . $gid, null);
    return is_array($g) ? $g : null;
}
function arsp_oauth_grant_save($gid, $g) { update_option('arsp_oag_' . $gid, $g, false); }
function arsp_oauth_grant_del($gid) {
    if (!arsp_oauth_grant($gid)) return;
    delete_option('arsp_oag_' . $gid);
    $u = get_option('arsp_oauth_used', array()); if (is_array($u) && isset($u[$gid])) { unset($u[$gid]); update_option('arsp_oauth_used', $u, false); }
}
/** všetky pripojenia (id => údaje) – čítajú sa priamo z tabuľky možností, aby sa zoznam nemohol rozísť */
function arsp_oauth_grants() {
    global $wpdb; $out = array();
    $names = $wpdb->get_col($wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like('arsp_oag_') . '%'));
    foreach ((array) $names as $n) { $gid = substr($n, 9); $g = arsp_oauth_grant($gid); if ($g) $out[$gid] = $g; }
    return $out;
}

/** vydá prístupový a nový obnovovací token pripojenia (zmení $g – treba ho potom uložiť) */
function arsp_oauth_issue($gid, &$g) {
    $now = time();
    $p = arsp_oauth_b64(wp_json_encode(array('g' => $gid, 'u' => (int) $g['u'], 'e' => $now + ARSP_OAUTH_AT_TTL)));
    $at = 'arsp1.' . $p . '.' . arsp_oauth_b64(hash_hmac('sha256', $p, arsp_oauth_key(), true));
    $rt = $gid . '.' . arsp_oauth_rand(32);
    $rts = isset($g['rts']) && is_array($g['rts']) ? $g['rts'] : array();
    foreach ($rts as $h => $x) if ((int) $x < $now) unset($rts[$h]);
    $rts[arsp_oauth_h($rt)] = $now + ARSP_OAUTH_RT_TTL;
    arsort($rts); $g['rts'] = array_slice($rts, 0, 5, true);
    return array('access_token' => $at, 'token_type' => 'Bearer', 'expires_in' => ARSP_OAUTH_AT_TTL, 'refresh_token' => $rt, 'scope' => implode(' ', arsp_oauth_scopes()));
}

/** overí prístupový token; vráti id používateľa vo WordPresse alebo 0 */
function arsp_oauth_check($tok) {
    if (!arsp_oauth_on()) return 0;
    $x = explode('.', (string) $tok);
    if (count($x) !== 3 || $x[0] !== 'arsp1') return 0;
    if (!hash_equals(arsp_oauth_b64(hash_hmac('sha256', $x[1], arsp_oauth_key(), true)), $x[2])) return 0;
    $d = json_decode((string) arsp_oauth_unb64($x[1]), true);
    if (!is_array($d) || empty($d['g']) || empty($d['u']) || (int) $d['e'] < time()) return 0;
    $g = arsp_oauth_grant((string) $d['g']);
    if (!$g || (int) $g['u'] !== (int) $d['u'] || !user_can((int) $d['u'], ARSP_CAP)) return 0;
    $used = get_option('arsp_oauth_used', array()); if (!is_array($used)) $used = array();
    if (time() - (int) (isset($used[$d['g']]) ? $used[$d['g']] : 0) > 600) { $used[$d['g']] = time(); update_option('arsp_oauth_used', $used, false); }
    return (int) $d['u'];
}

/* ------------------------------------------------------------------ pomocníci pre odpovede */

function arsp_oauth_json($data, $status = 200) {
    nocache_headers(); status_header($status);
    header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('Access-Control-Allow-Origin: *');
    echo wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function arsp_oauth_err($code, $desc, $status = 400) { arsp_oauth_json(array('error' => $code, 'error_description' => $desc), $status); }

/** hlavička Authorization – niektoré hostingy ju PHP neodovzdajú priamo */
function arsp_oauth_auth_header() {
    foreach (array('HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION') as $k) if (!empty($_SERVER[$k])) return (string) $_SERVER[$k];
    if (function_exists('apache_request_headers')) foreach ((array) apache_request_headers() as $k => $v) if (strtolower((string) $k) === 'authorization') return (string) $v;
    return '';
}
/** telo POST požiadavky (formulár alebo JSON) */
function arsp_oauth_body() {
    $ct = isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($ct, 'json') !== false) { $j = json_decode((string) file_get_contents('php://input'), true); return is_array($j) ? $j : array(); }
    return wp_unslash($_POST);
}
function arsp_oauth_s($P, $k) { return isset($P[$k]) && is_scalar($P[$k]) ? trim((string) $P[$k]) : ''; }
/** id a heslo aplikácie: z tela (client_secret_post) alebo z hlavičky Basic (client_secret_basic) */
function arsp_oauth_creds($P) {
    $id = arsp_oauth_s($P, 'client_id'); $sec = arsp_oauth_s($P, 'client_secret');
    if (preg_match('/^\s*Basic\s+(\S+)/i', arsp_oauth_auth_header(), $m)) {
        $d = base64_decode($m[1], true);
        if ($d !== false && strpos($d, ':') !== false) { list($a, $b) = explode(':', $d, 2); $id = urldecode($a); $sec = urldecode($b); }
    } elseif (isset($_SERVER['PHP_AUTH_USER']) && $id === '') { $id = (string) $_SERVER['PHP_AUTH_USER']; $sec = isset($_SERVER['PHP_AUTH_PW']) ? (string) $_SERVER['PHP_AUTH_PW'] : ''; }
    return array($id, $sec);
}
/** overí aplikáciu pri výmene tokenov; pri chybe odpovie a skončí */
function arsp_oauth_auth_client($P) {
    list($cid, $sec) = arsp_oauth_creds($P);
    $cl = arsp_oauth_client($cid);
    if (!$cl) arsp_oauth_err('invalid_client', 'Neznáma aplikácia – pripojte ju znova.', 401);
    if ($cl['m'] !== 'none' && ($sec === '' || empty($cl['s']) || !hash_equals($cl['s'], arsp_oauth_h($sec)))) arsp_oauth_err('invalid_client', 'Nesprávne heslo aplikácie.', 401);
    return array($cid, $cl);
}

/* ------------------------------------------------------------------ smerovanie */

add_action('init', 'arsp_oauth_route', 1);
function arsp_oauth_route() {
    if (empty($_SERVER['REQUEST_URI'])) return;
    $path = (string) wp_parse_url((string) $_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $base = rtrim((string) wp_parse_url(home_url('/'), PHP_URL_PATH), '/');
    if ($base !== '' && strpos($path, $base . '/') === 0) $path = substr($path, strlen($base));
    if (preg_match('#^(/arsp-oauth)?/\.well-known/oauth-protected-resource(/.*)?$#', $path)) $what = 'prm';
    elseif (preg_match('#^(/arsp-oauth)?/\.well-known/(oauth-authorization-server|openid-configuration)(/.*)?$#', $path)) $what = 'meta';
    elseif (preg_match('#^/arsp-oauth/(authorize|token|register|revoke)/?$#', $path, $m)) $what = $m[1];
    else return;
    if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
    $method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';
    if ($method === 'OPTIONS' && $what !== 'authorize') {
        status_header(204); header('Access-Control-Allow-Origin: *'); header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, MCP-Protocol-Version'); header('Access-Control-Max-Age: 86400'); exit;
    }
    if (!arsp_oauth_on() && ($what === 'prm' || $what === 'meta')) arsp_oauth_err('not_found', 'Pripájanie aplikácií je vypnuté.', 404);
    switch ($what) {
        case 'prm': arsp_oauth_json(array(
            'resource' => arsp_oauth_resource(),
            'authorization_servers' => array(arsp_oauth_issuer()),
            'scopes_supported' => arsp_oauth_scopes(),
            'bearer_methods_supported' => array('header'),
            'resource_name' => 'Ars Preuge – pracovný priestor',
        ));
        case 'meta': $am = array('none', 'client_secret_post', 'client_secret_basic'); arsp_oauth_json(array(
            'issuer' => arsp_oauth_issuer(),
            'authorization_endpoint' => arsp_oauth_url('authorize'),
            'token_endpoint' => arsp_oauth_url('token'),
            'registration_endpoint' => arsp_oauth_url('register'),
            'revocation_endpoint' => arsp_oauth_url('revoke'),
            'scopes_supported' => arsp_oauth_scopes(),
            'response_types_supported' => array('code'),
            'response_modes_supported' => array('query'),
            'grant_types_supported' => array('authorization_code', 'refresh_token'),
            'token_endpoint_auth_methods_supported' => $am,
            'revocation_endpoint_auth_methods_supported' => $am,
            'code_challenge_methods_supported' => array('S256'),
            'authorization_response_iss_parameter_supported' => true,
        ));
        case 'register':  if ($method !== 'POST') arsp_oauth_err('invalid_request', 'Použite POST.', 405); arsp_oauth_register(); break;
        case 'token':     if ($method !== 'POST') arsp_oauth_err('invalid_request', 'Použite POST.', 405); arsp_oauth_token(); break;
        case 'revoke':    if ($method !== 'POST') arsp_oauth_err('invalid_request', 'Použite POST.', 405); arsp_oauth_revoke(); break;
        case 'authorize': arsp_oauth_authorize(); break;
    }
    exit;
}

/* ------------------------------------------------------------------ registrácia aplikácie (RFC 7591) */

function arsp_oauth_register() {
    if (!arsp_oauth_on()) arsp_oauth_err('invalid_client_metadata', 'Pripájanie aplikácií je vypnuté (WordPress → Ars Preuge → AI).', 403);
    $in = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($in)) arsp_oauth_err('invalid_client_metadata', 'Telo požiadavky musí byť JSON.');
    $ru = array();
    foreach ((isset($in['redirect_uris']) && is_array($in['redirect_uris']) ? $in['redirect_uris'] : array()) as $u) if (is_string($u) && $u !== '') $ru[] = $u;
    $ru = array_values(array_unique($ru));
    if (!$ru || count($ru) > 10) arsp_oauth_err('invalid_redirect_uri', 'Chýba návratová adresa (redirect_uris).');
    foreach ($ru as $u) if (!arsp_oauth_redirect_ok($u)) arsp_oauth_err('invalid_redirect_uri', 'Návratová adresa ' . $u . ' nie je povolená – pripojiť sa dá ChatGPT, Claude alebo aplikácia na vlastnom počítači.');
    $m = arsp_oauth_s($in, 'token_endpoint_auth_method');
    if (!in_array($m, array('none', 'client_secret_post', 'client_secret_basic'), true)) $m = 'none';
    $name = arsp_oauth_app_name($ru[0], function_exists('mb_substr') ? mb_substr(arsp_oauth_s($in, 'client_name'), 0, 80) : substr(arsp_oauth_s($in, 'client_name'), 0, 80));
    $cid = 'arsp_' . arsp_oauth_rand(18); $sec = $m !== 'none' ? arsp_oauth_rand(32) : '';
    $all = arsp_oauth_clients();
    if (count($all) >= 100) {   /* ochrana pred zahltením: odstránia sa najstaršie aplikácie bez pripojenia */
        $used = array(); foreach (arsp_oauth_grants() as $g) $used[$g['c']] = true;
        uasort($all, function ($a, $b) { return (int) $a['t'] - (int) $b['t']; });
        foreach ($all as $id => $c) { if (count($all) < 100) break; if (empty($used[$id])) unset($all[$id]); }
    }
    $all[$cid] = array('n' => $name, 'r' => $ru, 'm' => $m, 's' => $sec !== '' ? arsp_oauth_h($sec) : '', 't' => time());
    update_option('arsp_oauth_clients', $all, false);
    $out = array('client_id' => $cid, 'client_id_issued_at' => time(), 'client_name' => $name, 'redirect_uris' => $ru,
        'grant_types' => array('authorization_code', 'refresh_token'), 'response_types' => array('code'), 'token_endpoint_auth_method' => $m,
        'scope' => implode(' ', arsp_oauth_scopes()));
    if ($sec !== '') { $out['client_secret'] = $sec; $out['client_secret_expires_at'] = 0; }
    arsp_oauth_json($out, 201);
}

/* ------------------------------------------------------------------ okno so súhlasom */

function arsp_oauth_authorize() {
    $post = isset($_SERVER['REQUEST_METHOD']) && strtoupper((string) $_SERVER['REQUEST_METHOD']) === 'POST';
    $P = wp_unslash($post ? $_POST : $_GET);
    $keys = array('response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'code_challenge', 'code_challenge_method', 'resource');
    $q = array(); foreach ($keys as $k) { $v = arsp_oauth_s($P, $k); if ($v !== '') $q[$k] = $v; }
    $g = function ($k) use ($q) { return isset($q[$k]) ? $q[$k] : ''; };
    if (!arsp_oauth_on()) arsp_oauth_page('Pripájanie je vypnuté', '<p>Správca pracovného priestoru vypol pripájanie aplikácií (WordPress → Ars Preuge → AI).</p>', 403);
    $cid = $g('client_id'); $cl = arsp_oauth_client($cid);
    if (!$cl) arsp_oauth_page('Neznáma aplikácia', '<p>Táto aplikácia nie je zaregistrovaná alebo jej registrácia vypršala. Skúste ju v ChatGPT alebo Claude pripojiť znova.</p>', 400);
    $ru = $g('redirect_uri');
    if ($ru === '' && count($cl['r']) === 1) $ru = $cl['r'][0];
    if (!in_array($ru, $cl['r'], true)) arsp_oauth_page('Neplatná návratová adresa', '<p>Aplikácia poslala návratovú adresu, ktorú pri registrácii neuviedla. Skúste ju pripojiť znova.</p>', 400);
    $back = function ($a) use ($ru, $g) {
        if ($g('state') !== '') $a['state'] = $g('state');
        $a['iss'] = arsp_oauth_issuer();
        nocache_headers();
        wp_redirect($ru . (strpos($ru, '?') === false ? '?' : '&') . http_build_query($a, '', '&', PHP_QUERY_RFC3986), 302);
        exit;
    };
    if ($g('response_type') !== 'code') $back(array('error' => 'unsupported_response_type'));
    if (!preg_match('/^[A-Za-z0-9_-]{43,128}$/', $g('code_challenge')) || $g('code_challenge_method') !== 'S256') $back(array('error' => 'invalid_request', 'error_description' => 'PKCE (S256) is required'));
    $here = arsp_oauth_url('authorize') . '?' . http_build_query($q, '', '&', PHP_QUERY_RFC3986);
    if (!is_user_logged_in()) { nocache_headers(); wp_redirect(wp_login_url($here)); exit; }
    $u = wp_get_current_user();
    if (!current_user_can(ARSP_CAP)) arsp_oauth_page('Bez prístupu', '<p>Účet <b>' . esc_html($u->display_name) . '</b> nemá prístup do pracovného priestoru Ars Preuge.</p><p><a href="' . esc_url(wp_logout_url($here)) . '">Prihlásiť sa iným účtom</a></p>', 403);
    $app = esc_html($cl['n']); $host = esc_html((string) wp_parse_url($ru, PHP_URL_HOST));
    if ($post) {
        if (!wp_verify_nonce(arsp_oauth_s($P, '_wpnonce'), 'arsp_oauth_' . $cid)) arsp_oauth_page('Platnosť stránky vypršala', '<p>Stránka bola otvorená príliš dlho. Spustite pripájanie v aplikácii znova.</p>', 400);
        if (arsp_oauth_s($P, 'arsp_ok') !== '1') $back(array('error' => 'access_denied', 'error_description' => 'Používateľ prístup nepovolil.'));
        $code = arsp_oauth_rand(32);
        set_transient('arsp_oac_' . substr(arsp_oauth_h($code), 1, 40), array('c' => $cid, 'r' => $ru, 'u' => (int) $u->ID, 'ch' => $g('code_challenge')), 600);
        $back(array('code' => $code));
    }
    $hidden = ''; foreach ($q as $k => $v) $hidden .= '<input type="hidden" name="' . esc_attr($k) . '" value="' . esc_attr($v) . '">';
    $body = '<p class="lead">Aplikácia <b>' . $app . '</b> <span class="muted">(' . $host . ')</span> chce pracovať s pracovným priestorom Ars Preuge pod vaším účtom <b>' . esc_html($u->display_name) . '</b>.</p>'
        . '<ul><li>Uvidí to, čo vidíte vy v pracovnom priestore: úlohy, termíny, podujatia, granty a kontakty (meno, e-mail, telefón).</li>'
        . '<li>Môže <b>pridať novú úlohu</b>. Nič nemaže ani neprepisuje.</li>'
        . '<li>Čo si prečíta, odošle firme, ktorá aplikáciu prevádzkuje.</li>'
        . '<li>Pripojenie zrušíte odpojením v aplikácii alebo u správcu (WordPress → Ars Preuge → AI).</li></ul>'
        . '<form method="post" action="' . esc_url(arsp_oauth_url('authorize')) . '">' . $hidden . wp_nonce_field('arsp_oauth_' . $cid, '_wpnonce', false, false)
        . '<div class="row"><button class="btn" name="arsp_ok" value="0">Zamietnuť</button><button class="btn pri" name="arsp_ok" value="1">Povoliť</button></div></form>'
        . '<p class="muted small">Ak ste o pripojenie nežiadali vy, kliknite na Zamietnuť.</p>';
    arsp_oauth_page('Pripojiť ' . $cl['n'] . '?', $body);
}

/** jednoduchá stránka v štýle aplikácie (farby z app/css/00-farby.css, svetlý aj tmavý režim) */
function arsp_oauth_page($title, $body, $status = 200) {
    nocache_headers(); status_header($status);
    header('Content-Type: text/html; charset=utf-8'); header('X-Frame-Options: DENY'); header("Content-Security-Policy: frame-ancestors 'none'");
    echo '<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">'
        . '<title>' . esc_html($title) . ' – Ars Preuge</title><style>'
        . ':root{--bg:#F1F2EE;--surface:#FFFFFF;--ink:#1C222C;--muted:#5B6371;--line:#D6D9D1;--accent:#2F4DB8;--accent-ink:#FFFFFF;color-scheme:light}'
        . '@media (prefers-color-scheme:dark){:root{--bg:#14171D;--surface:#1C2028;--ink:#E5E8EE;--muted:#9AA2B1;--line:#323845;--accent:#8FA5FF;--accent-ink:#0E1220;color-scheme:dark}}'
        . 'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;background:var(--bg);color:var(--ink);'
        . 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI Variable","Segoe UI",system-ui,Roboto,"Helvetica Neue",Arial,sans-serif;font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}'
        . '.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:24px;max-width:460px;width:100%;box-sizing:border-box}'
        . '.brand{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 6px}h1{font-size:20px;line-height:1.3;margin:0 0 14px}'
        . 'ul{margin:0 0 18px;padding-left:20px}li{margin:4px 0}.lead{margin:0 0 12px}.muted{color:var(--muted)}.small{font-size:13px;margin:14px 0 0}a{color:var(--accent)}'
        . '.row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}'
        . '.btn{cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:9px 16px;border-radius:8px;font-weight:600;font-size:14px;font-family:inherit}'
        . '.btn:hover{border-color:var(--muted)}.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}.btn.pri:hover{filter:brightness(1.08)}'
        . '</style></head><body><main class="card"><p class="brand">Ars Preuge – pracovný priestor</p><h1>' . esc_html($title) . '</h1>' . $body . '</main></body></html>';
    exit;
}

/* ------------------------------------------------------------------ tokeny */

function arsp_oauth_token() {
    $P = arsp_oauth_body();
    if (!arsp_oauth_on()) arsp_oauth_err('invalid_grant', 'Pripájanie aplikácií je vypnuté (WordPress → Ars Preuge → AI).');
    list($cid, $cl) = arsp_oauth_auth_client($P);
    $gt = arsp_oauth_s($P, 'grant_type');
    if ($gt === 'authorization_code') {
        $code = arsp_oauth_s($P, 'code'); $key = 'arsp_oac_' . substr(arsp_oauth_h($code), 1, 40);
        $c = $code !== '' ? get_transient($key) : false;
        if ($c !== false) delete_transient($key);   /* kód platí len raz */
        if (!is_array($c) || $c['c'] !== $cid) arsp_oauth_err('invalid_grant', 'Kód je neplatný alebo vypršal.');
        $ru = arsp_oauth_s($P, 'redirect_uri');
        if ($ru !== '' && $ru !== $c['r']) arsp_oauth_err('invalid_grant', 'Návratová adresa nesúhlasí.');
        $v = arsp_oauth_s($P, 'code_verifier');
        if (!preg_match('/^[A-Za-z0-9._~-]{43,128}$/', $v) || !hash_equals((string) $c['ch'], arsp_oauth_b64(hash('sha256', $v, true)))) arsp_oauth_err('invalid_grant', 'Overenie PKCE zlyhalo.');
        if (!user_can((int) $c['u'], ARSP_CAP)) arsp_oauth_err('invalid_grant', 'Účet nemá prístup do pracovného priestoru.');
        foreach (arsp_oauth_grants() as $old => $og) if ((int) $og['u'] === (int) $c['u'] && $og['c'] === $cid) arsp_oauth_grant_del($old);   /* opätovné pripojenie nahradí staré */
        $gid = arsp_oauth_rand(16);
        $g = array('u' => (int) $c['u'], 'c' => $cid, 'n' => $cl['n'], 't' => time(), 'rts' => array());
        $out = arsp_oauth_issue($gid, $g);
        arsp_oauth_grant_save($gid, $g);
        arsp_oauth_json($out);
    }
    if ($gt === 'refresh_token') {
        $rt = arsp_oauth_s($P, 'refresh_token'); $gid = (string) strstr($rt, '.', true);
        $g = $gid !== '' ? arsp_oauth_grant($gid) : null; $h = arsp_oauth_h($rt);
        if (!$g || $g['c'] !== $cid || empty($g['rts'][$h]) || (int) $g['rts'][$h] < time() || !user_can((int) $g['u'], ARSP_CAP)) arsp_oauth_err('invalid_grant', 'Prihlásenie vypršalo alebo bolo zrušené – pripojte aplikáciu znova.');
        $g['rts'][$h] = min((int) $g['rts'][$h], time() + 120);   /* starý token platí ešte 2 minúty */
        $out = arsp_oauth_issue($gid, $g);
        arsp_oauth_grant_save($gid, $g);
        arsp_oauth_json($out);
    }
    arsp_oauth_err('unsupported_grant_type', 'Podporované sú len authorization_code a refresh_token.');
}

/** zrušenie pripojenia (RFC 7009) – obnovovacím aj prístupovým tokenom; odpoveď je vždy 200 */
function arsp_oauth_revoke() {
    $P = arsp_oauth_body();
    list($cid) = arsp_oauth_auth_client($P);
    $t = arsp_oauth_s($P, 'token'); $gid = '';
    if (strpos($t, 'arsp1.') === 0) {
        $x = explode('.', $t);
        if (count($x) === 3 && hash_equals(arsp_oauth_b64(hash_hmac('sha256', $x[1], arsp_oauth_key(), true)), $x[2])) { $d = json_decode((string) arsp_oauth_unb64($x[1]), true); if (is_array($d) && !empty($d['g'])) $gid = (string) $d['g']; }
    } else {
        $gid = (string) strstr($t, '.', true); $g = arsp_oauth_grant($gid);
        if (!$g || empty($g['rts'][arsp_oauth_h($t)])) $gid = '';
    }
    $g = $gid !== '' ? arsp_oauth_grant($gid) : null;
    if ($g && $g['c'] === $cid) arsp_oauth_grant_del($gid);
    nocache_headers(); status_header(200); header('Content-Type: application/json; charset=utf-8'); echo '{}'; exit;
}

/* ------------------------------------------------------------------ MCP: výzva na prihlásenie pri chýbajúcom tokene */

add_filter('rest_post_dispatch', function ($res, $server, $req) {
    if (!arsp_oauth_on() || !($res instanceof WP_REST_Response) || (int) $res->get_status() !== 401) return $res;
    if (strpos((string) $req->get_route(), '/arsp/v1/mcp') !== 0) return $res;
    $v = 'Bearer resource_metadata="' . arsp_oauth_prm_url() . '", scope="' . implode(' ', arsp_oauth_scopes()) . '"';
    if (function_exists('arsp_mcp_bearer') && arsp_mcp_bearer($req) !== '') $v .= ', error="invalid_token"';
    $res->header('WWW-Authenticate', $v);
    return $res;
}, 10, 3);

/* ------------------------------------------------------------------ administrácia (Ars Preuge → AI) */

function arsp_oauth_admin_section() {
    if (!current_user_can('manage_options')) return;
    $on = arsp_oauth_on();
    echo '<h2 style="margin-top:0">Prepojenie pre ChatGPT a Claude</h2>';
    echo '<p>Každý z tímu si môže do svojho ChatGPT alebo Claude pripojiť pracovný priestor. Pri pripájaní sa prihlási <b>svojím účtom vo WordPresse</b> a klikne „Povoliť“. Aplikácia potom vidí to isté, čo on v pracovnom priestore (podľa Prístupov): úlohy, termíny, podujatia, granty a kontakty (meno, e-mail, telefón). Vie pridať úlohu, nič nemaže ani neprepisuje.</p>';
    echo '<p><b>Adresa servera</b> (skopírujte do ChatGPT alebo Claude):<br><input type="text" readonly value="' . esc_attr(arsp_oauth_resource()) . '" style="width:100%;max-width:560px;font-family:monospace" onclick="this.select()"></p>';
    echo '<p><b>ChatGPT:</b> Doplnky → Pridať → vlastný MCP server · Adresa URL servera: adresa vyššie · Autentifikácia: <b>OAuth</b> · Vytvoriť ako doplnok, potom ho pripojte a prihláste sa.<br>'
        . '<b>Claude:</b> Nastavenia → Konektory → Pridať vlastný konektor · adresa vyššie · Pripojiť.</p>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px">';
    wp_nonce_field('arsp_oauth');
    echo '<input type="hidden" name="action" value="arsp_oauth"><span>Stav: pripájanie je <b>' . ($on ? 'zapnuté' : 'vypnuté') . '</b></span> ';
    echo $on ? '<button class="button" name="arsp_do" value="off" onclick="return confirm(\'Vypnúť pripájanie? Pripojené aplikácie prestanú fungovať, kým ho znova nezapnete.\')">Vypnúť</button>' : '<button class="button button-primary" name="arsp_do" value="on">Zapnúť</button>';
    echo '</form>';
    $G = arsp_oauth_grants(); $used = get_option('arsp_oauth_used', array()); if (!is_array($used)) $used = array();
    if (!$G) { echo '<p class="description">Zatiaľ si nikto nič nepripojil.</p>'; return; }
    uasort($G, function ($a, $b) { return (int) $b['t'] - (int) $a['t']; });
    $fmt = function ($t) { return $t ? wp_date('j. n. Y H:i', (int) $t) : '–'; };
    echo '<table class="widefat striped" style="max-width:760px"><thead><tr><th>Kto</th><th>Aplikácia</th><th>Pripojené</th><th>Naposledy použité</th><th></th></tr></thead><tbody>';
    foreach ($G as $gid => $g) {
        $u = get_userdata((int) $g['u']);
        echo '<tr><td>' . ($u ? esc_html($u->display_name) : '<i>zmazaný účet</i>') . '</td><td>' . esc_html(isset($g['n']) ? $g['n'] : '') . '</td><td>' . esc_html($fmt($g['t'])) . '</td><td>' . esc_html($fmt(isset($used[$gid]) ? $used[$gid] : 0)) . '</td><td>'
            . '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="margin:0">' . wp_nonce_field('arsp_oauth', '_wpnonce', true, false)
            . '<input type="hidden" name="action" value="arsp_oauth"><input type="hidden" name="arsp_gid" value="' . esc_attr($gid) . '">'
            . '<button class="button button-small" name="arsp_do" value="del" onclick="return confirm(\'Odpojiť túto aplikáciu?\')">Odpojiť</button></form></td></tr>';
    }
    echo '</tbody></table>';
}

add_action('admin_post_arsp_oauth', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_oauth');
    $do = sanitize_key(isset($_POST['arsp_do']) ? $_POST['arsp_do'] : '');
    if ($do === 'off') update_option('arsp_oauth_on', '0');
    if ($do === 'on') update_option('arsp_oauth_on', '1');
    if ($do === 'del') arsp_oauth_grant_del(preg_replace('/[^A-Za-z0-9_-]/', '', (string) wp_unslash(isset($_POST['arsp_gid']) ? $_POST['arsp_gid'] : '')));
    wp_safe_redirect(admin_url('admin.php?page=arsp-ai')); exit;
});
