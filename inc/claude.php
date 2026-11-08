<?php
/**
 * Ars Preuge – napojenie na Claude (Anthropic API).
 * Kľúč je uložený len na serveri (option arsp_claude_key), prehliadač ho nikdy nedostane.
 * Volanie ide priamo cez HTTP (wp_remote_post), lebo plugin sa inštaluje bez Composera a musí bežať aj na PHP 7.4.
 */
if (!defined('ABSPATH')) exit;

define('ARSP_CLAUDE_MODEL', 'claude-opus-5-5');
define('ARSP_CLAUDE_URL', 'https://api.anthropic.com/v1/messages');

function arsp_claude_key() { return trim((string) get_option('arsp_claude_key', '')); }
function arsp_claude_masked() { $k = arsp_claude_key(); return $k === '' ? '' : substr($k, 0, 7) . '…' . substr($k, -4); }

/**
 * Jedna požiadavka na Claude so štruktúrovanou odpoveďou (JSON podľa $schema).
 * Vráti array('data' => …, 'usage' => …, 'model' => …) alebo WP_Error so zrozumiteľnou správou.
 */
function arsp_claude_call($content, $system, $schema, $effort = 'medium', $max_tokens = 16000) {
    $key = arsp_claude_key();
    if ($key === '') return new WP_Error('ai_no_key', 'Napojenie na Claude nie je nastavené – administrátor musí vložiť API kľúč (WordPress → Ars Preuge).', array('status' => 400));
    if (function_exists('set_time_limit')) @set_time_limit(300);
    $body = array(
        'model' => ARSP_CLAUDE_MODEL,
        'max_tokens' => $max_tokens,
        'system' => $system,
        'output_config' => array('effort' => $effort, 'format' => array('type' => 'json_schema', 'schema' => $schema)),
        'fallbacks' => 'default',                       /* keď Claude požiadavku odmietne, API ju zopakuje na vhodnom náhradnom modeli */
        'messages' => array(array('role' => 'user', 'content' => $content)),
    );
    $headers = array('content-type' => 'application/json', 'x-api-key' => $key, 'anthropic-version' => '2026-10-21', 'anthropic-beta' => 'server-side-fallback-2026-07-01');
    $res = wp_remote_post(ARSP_CLAUDE_URL, array('timeout' => 240, 'headers' => $headers, 'body' => wp_json_encode($body)));
    $code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
    $j = is_wp_error($res) ? null : json_decode((string) wp_remote_retrieve_body($res), true);
    /* ak by náhradný model (fallbacks) nebol pre účet dostupný, zopakovať raz bez neho */
    if ($code === 400 && is_array($j) && stripos((string) ($j['error']['message'] ?? ''), 'fallback') !== false) {
        unset($body['fallbacks'], $headers['anthropic-beta']);
        $res = wp_remote_post(ARSP_CLAUDE_URL, array('timeout' => 240, 'headers' => $headers, 'body' => wp_json_encode($body)));
        $code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
        $j = is_wp_error($res) ? null : json_decode((string) wp_remote_retrieve_body($res), true);
    }
    if (is_wp_error($res)) return new WP_Error('ai_net', 'Nepodarilo sa spojiť s Claude (' . $res->get_error_message() . '). Skúste znova; ak to trvá dlho, hosting môže mať nízky časový limit.', array('status' => 502));
    if ($code >= 400 || !is_array($j)) {
        $type = is_array($j) ? (string) ($j['error']['type'] ?? '') : '';
        $msg  = is_array($j) ? (string) ($j['error']['message'] ?? '') : '';
        if ($code === 401 || $type === 'authentication_error') $t = 'API kľúč je neplatný alebo zrušený – vložte nový v administrácii WordPressu.';
        elseif ($code === 402 || $type === 'billing_error') $t = 'Na účte Claude Console chýba kredit alebo je dosiahnutý limit výdavkov.';
        elseif ($code === 403 || $type === 'permission_error') $t = 'Kľúč nemá oprávnenie na túto požiadavku.';
        elseif ($code === 429 || $type === 'rate_limit_error') $t = 'Príliš veľa požiadaviek naraz – skúste o minútu.';
        elseif ($code === 529 || $code >= 500 || $type === 'overloaded_error') $t = 'Claude je práve preťažený – skúste o chvíľu znova.';
        elseif ($code === 413 || $type === 'request_too_large') $t = 'Dokument je príliš veľký na spracovanie.';
        else $t = 'Claude požiadavku neprijal' . ($msg ? ': ' . $msg : '.');
        return new WP_Error('ai_api', $t, array('status' => 502, 'code' => $code, 'type' => $type));
    }
    $stop = (string) ($j['stop_reason'] ?? '');
    if ($stop === 'refusal') return new WP_Error('ai_refusal', 'Claude tento dokument odmietol spracovať.', array('status' => 422));
    if ($stop === 'max_tokens') return new WP_Error('ai_long', 'Odpoveď bola príliš dlhá a nedokončila sa – skúste kratší dokument.', array('status' => 422));
    $text = '';
    foreach ((array) ($j['content'] ?? array()) as $b) { if (($b['type'] ?? '') === 'text') $text .= (string) ($b['text'] ?? ''); }
    $data = json_decode($text, true);
    if (!is_array($data)) return new WP_Error('ai_json', 'Odpoveď od Claude sa nepodarilo prečítať.', array('status' => 502));
    return array('data' => $data, 'usage' => $j['usage'] ?? array(), 'model' => (string) ($j['model'] ?? ''));
}

/** Obsah pre Claude z nahraného súboru (podľa id v arsp_assets) – PDF, obrázok alebo text. */
function arsp_claude_asset_block($id) {
    $id = preg_replace('/[^0-9a-f]/', '', strtolower((string) $id));
    $map = get_option('arsp_assets', array());
    if (!$id || empty($map[$id])) return new WP_Error('not_found', 'Súbor sa nenašiel.', array('status' => 404));
    $path = arsp_upload_dir() . '/' . basename($map[$id]['file']);
    if (!is_readable($path)) return new WP_Error('not_found', 'Súbor sa nenašiel.', array('status' => 404));
    if (filesize($path) > 30 * 1024 * 1024) return new WP_Error('too_big', 'Súbor je väčší ako 30 MB.', array('status' => 400));
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $mime = (string) $map[$id]['type'];
    if ($ext === 'pdf' || $mime === 'application/pdf') return array('type' => 'document', 'source' => array('type' => 'base64', 'media_type' => 'application/pdf', 'data' => base64_encode(file_get_contents($path))));
    $img = array('jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif');
    if (isset($img[$ext])) return array('type' => 'image', 'source' => array('type' => 'base64', 'media_type' => $img[$ext], 'data' => base64_encode(file_get_contents($path))));
    if ($ext === 'txt' || $ext === 'csv') return array('type' => 'text', 'text' => (string) file_get_contents($path));
    return new WP_Error('unsupported', 'Tento typ súboru Claude neprečíta – uložte ho ako PDF.', array('status' => 400));
}

/** Obsah pre Claude z verejnej stránky alebo PDF na webe (wp_safe_remote_get nepustí na interné adresy). */
function arsp_claude_url_block($url) {
    $url = esc_url_raw(trim((string) $url));
    if (!preg_match('#^https?://#i', $url)) return new WP_Error('bad_url', 'Zadajte celý odkaz začínajúci https://', array('status' => 400));
    $res = wp_safe_remote_get($url, array('timeout' => 30, 'redirection' => 5, 'limit_response_size' => 30 * 1024 * 1024,
        'headers' => array('User-Agent' => 'Mozilla/5.0 (compatible; ArsPreuge-Priestor)', 'Accept-Language' => 'sk,en;q=0.8')));
    if (is_wp_error($res) || (int) wp_remote_retrieve_response_code($res) >= 400) return new WP_Error('fetch_failed', 'Stránku sa nepodarilo otvoriť. Ak je výzva za prihlásením do grantového systému, stiahnite ju ako PDF a nahrajte.', array('status' => 502));
    $ct = strtolower((string) wp_remote_retrieve_header($res, 'content-type'));
    $body = (string) wp_remote_retrieve_body($res);
    if (strpos($ct, 'application/pdf') !== false || substr($body, 0, 5) === '%PDF-') return array('type' => 'document', 'source' => array('type' => 'base64', 'media_type' => 'application/pdf', 'data' => base64_encode($body)));
    $body = preg_replace('#<(script|style|noscript|svg)[^>]*>.*?</\1>#is', ' ', $body);
    $text = html_entity_decode(wp_strip_all_tags($body), ENT_QUOTES, 'UTF-8');
    $text = trim(preg_replace('/[ \t]+/u', ' ', preg_replace('/\s*\n\s*/u', "\n", $text)));
    if (mb_strlen($text) < 200) return new WP_Error('empty_page', 'Na stránke sa nenašiel text výzvy (možno je za prihlásením alebo sa načítava až v prehliadači). Stiahnite výzvu ako PDF a nahrajte ju.', array('status' => 422));
    if (mb_strlen($text) > 400000) return new WP_Error('too_long', 'Stránka je príliš dlhá. Stiahnite samotnú výzvu ako PDF a nahrajte ju.', array('status' => 422));
    return array('type' => 'text', 'text' => "Text stránky " . $url . ":\n\n" . $text);
}

/** Schéma údajov o výzve – zodpovedá poliam grantu v aplikácii. */
function arsp_claude_call_schema() {
    $s = array('anyOf' => array(array('type' => 'string'), array('type' => 'null')));
    $d = array('anyOf' => array(array('type' => 'string', 'format' => 'date'), array('type' => 'null')));
    $n = array('anyOf' => array(array('type' => 'number'), array('type' => 'null')));
    $p = array(
        'provider' => $s, 'program' => $s, 'callNo' => $s, 'callUrl' => $s,
        'callOpen' => $d, 'submitTo' => $d, 'spendFrom' => $d, 'realFrom' => $d, 'realTo' => $d, 'settleDue' => $d,
        'callMin' => $n, 'callMax' => $n, 'cofinPct' => $s,
        'callApplicants' => $s, 'callPurpose' => $s, 'callAttach' => $s, 'callText' => $s,
    );
    return array('type' => 'object', 'properties' => $p, 'required' => array_keys($p), 'additionalProperties' => false);
}

function arsp_claude_call_system() {
    return "Pomáhaš občianskemu združeniu Ars Preuge (kultúra, Prievidza) spracovať grantové výzvy. Z výzvy vytiahni údaje do daných polí.\n"
        . "- Vypĺňaj len to, čo vo výzve naozaj je. Ak údaj chýba alebo si nie si istý, daj null – nehádaj.\n"
        . "- Dátumy vo formáte RRRR-MM-DD. Sumy v eurách ako číslo (bez meny a medzier).\n"
        . "- provider: kto dotáciu poskytuje (napr. Fond na podporu umenia). program: názov programu/podprogramu. callNo: označenie výzvy.\n"
        . "- callOpen/submitTo: od kedy a do kedy sa podávajú žiadosti. spendFrom: od kedy možno čerpať (oprávnenosť výdavkov). realFrom/realTo: obdobie realizácie projektu. settleDue: termín vyúčtovania.\n"
        . "- callMin/callMax: najnižšia a najvyššia možná dotácia na jednu žiadosť. cofinPct: povinné spolufinancovanie, krátko (napr. „5 % z rozpočtu“).\n"
        . "- callApplicants: kto môže žiadať. callPurpose: na čo možno dotáciu použiť a čo je neoprávnené. callAttach: povinné prílohy a podmienky ako odrážky. callText: hodnotiace kritériá a ďalšie dôležité poznámky.\n"
        . "- Texty píš po slovensky, vecne a stručne (odrážky „- “), bez úvodných fráz.";
}

add_action('rest_api_init', function () {
    $perm = function () { return current_user_can(ARSP_CAP); };
    /* Načítanie výzvy: { asset: id nahraného súboru } alebo { url: odkaz } → navrhované údaje (nič sa neukladá) */
    register_rest_route('arsp/v1', '/ai/vyzva', array(
        'methods' => 'POST', 'permission_callback' => $perm,
        'callback' => function (WP_REST_Request $r) {
            $lock = 'arsp_ai_busy_' . get_current_user_id();
            if (get_transient($lock)) return new WP_Error('busy', 'Claude ešte číta predchádzajúci dokument – počkajte, kým skončí.', array('status' => 429));
            $block = $r->get_param('asset') ? arsp_claude_asset_block($r->get_param('asset')) : arsp_claude_url_block($r->get_param('url'));
            if (is_wp_error($block)) return $block;
            set_transient($lock, 1, 300);
            $content = array($block, array('type' => 'text', 'text' => 'Toto je grantová výzva. Vytiahni z nej údaje podľa pokynov. Dnešný dátum: ' . wp_date('Y-m-d') . '.'));
            $out = arsp_claude_call($content, arsp_claude_call_system(), arsp_claude_call_schema(), 'medium', 16000);
            delete_transient($lock);
            if (is_wp_error($out)) return $out;
            return array('fields' => $out['data'], 'usage' => $out['usage'], 'model' => $out['model']);
        },
    ));
});

/* ------------------------------------------------------- administrácia */

function arsp_claude_admin_section() {
    if (!current_user_can('manage_options')) return;
    echo '<h2>Napojenie na Claude</h2>';
    if (isset($_GET['arsp_ai'])) {
        $m = sanitize_key($_GET['arsp_ai']);
        $txt = array('saved' => array('success', 'Kľúč je uložený.'), 'removed' => array('success', 'Kľúč je odstránený.'), 'ok' => array('success', 'Spojenie funguje – Claude odpovedal.'), 'empty' => array('error', 'Vložte kľúč.'));
        if (isset($txt[$m])) echo '<div class="notice notice-' . $txt[$m][0] . '"><p>' . esc_html($txt[$m][1]) . '</p></div>';
        elseif ($m === 'err') echo '<div class="notice notice-error"><p>' . esc_html((string) get_transient('arsp_ai_test_err')) . '</p></div>';
    }
    echo '<p>Pracovný priestor vie s pomocou Claude prečítať grantovú výzvu (a neskôr formulár žiadosti či zmluvu) a navrhnúť údaje. Kľúč vytvoríte na <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener">platform.claude.com → API keys</a> (ideálne cez servisný účet a bez dátumu vypršania). Je uložený len na tomto serveri, tím ho nevidí. Platí sa za použitie podľa cenníka Anthropic; v Claude Console si môžete nastaviť mesačný limit výdavkov.</p>';
    $mask = arsp_claude_masked();
    echo '<p>Stav: ' . ($mask ? 'kľúč je uložený (<code>' . esc_html($mask) . '</code>), model <code>' . esc_html(ARSP_CLAUDE_MODEL) . '</code>' : '<b>kľúč nie je nastavený</b>') . '</p>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    wp_nonce_field('arsp_claude');
    echo '<input type="hidden" name="action" value="arsp_claude"><input type="password" name="arsp_key" autocomplete="off" placeholder="' . ($mask ? 'nový kľúč (nahradí uložený)' : 'sk-ant-…') . '" style="width:360px"> ';
    echo '<button class="button button-primary" name="arsp_do" value="save">Uložiť kľúč</button>';
    if ($mask) echo ' <button class="button" name="arsp_do" value="test">Vyskúšať spojenie</button> <button class="button" name="arsp_do" value="remove" onclick="return confirm(\'Odstrániť kľúč? Načítanie výziev prestane fungovať.\')">Odstrániť kľúč</button>';
    echo '</form>';
}

add_action('admin_post_arsp_claude', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_claude');
    $do = sanitize_key($_POST['arsp_do'] ?? '');
    $back = admin_url('admin.php?page=arsp');
    if ($do === 'remove') { delete_option('arsp_claude_key'); wp_safe_redirect(add_query_arg('arsp_ai', 'removed', $back)); exit; }
    if ($do === 'save') {
        $k = trim(wp_unslash((string) ($_POST['arsp_key'] ?? '')));
        if ($k === '') { wp_safe_redirect(add_query_arg('arsp_ai', 'empty', $back)); exit; }
        update_option('arsp_claude_key', $k, false);
        wp_safe_redirect(add_query_arg('arsp_ai', 'saved', $back)); exit;
    }
    if ($do === 'test') {
        $schema = array('type' => 'object', 'properties' => array('ok' => array('type' => 'boolean')), 'required' => array('ok'), 'additionalProperties' => false);
        $r = arsp_claude_call(array(array('type' => 'text', 'text' => 'Toto je skúška spojenia. Odpovedz ok: true.')), 'Odpovedáš len skúšobným JSON.', $schema, 'low', 2000);
        if (is_wp_error($r)) { set_transient('arsp_ai_test_err', $r->get_error_message(), 300); wp_safe_redirect(add_query_arg('arsp_ai', 'err', $back)); exit; }
        wp_safe_redirect(add_query_arg('arsp_ai', 'ok', $back)); exit;
    }
    wp_safe_redirect($back); exit;
});
