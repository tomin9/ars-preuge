<?php
/**
 * Prenos pracovného priestoru na inú stránku 1:1 – úplná záloha (ZIP) so všetkými záznamami aj nahranými súbormi.
 *
 * Balík obsahuje: seed.json (všetky záznamy), assets.json (zoznam nahraných súborov s typom), users.json (e-maily členov tímu,
 * na ktorých sa záznamy odvolávajú) a priečinok files/ so súbormi. API kľúč ku Claude sa neprenáša (zadá sa na novej stránke znova).
 *
 * Stará stránka: „Pripraviť úplnú zálohu“ → balík sa dá stiahnuť alebo ho nová stránka stiahne sama cez dočasnú adresu (platí 1 hodinu).
 * Nová stránka: „Import z adresy“ alebo nahratie ZIP. Členovia tímu sa spárujú podľa e-mailu (na novej stránke majú iné čísla účtov).
 * Nič sa nemaže – záznamy s rovnakým ID sa prepíšu, ostatné ostanú.
 */
if (!defined('ABSPATH')) exit;

add_filter('query_vars', function ($v) { $v[] = 'arsp_backup'; return $v; });

/* staré balíky (staršie ako 1 hodina) sa zmažú */
function arsp_backup_cleanup() {
    foreach ((array) glob(arsp_upload_dir() . '/zaloha-*.zip') as $f) {
        if (is_file($f) && filemtime($f) < time() - HOUR_IN_SECONDS) @unlink($f);
    }
}

/** Vytvorí ZIP a vráti array(token, cesta, počet záznamov, počet súborov) alebo WP_Error. */
function arsp_backup_build() {
    if (!class_exists('ZipArchive')) return new WP_Error('nozip', 'Server nemá rozšírenie ZipArchive – úplnú zálohu nevie vytvoriť. Požiadajte hosting o zapnutie PHP rozšírenia „zip“.');
    if (function_exists('set_time_limit')) @set_time_limit(0);
    arsp_backup_cleanup();
    global $wpdb; $t = arsp_table();
    $out = array(); $n = 0;
    foreach ($wpdb->get_results("SELECT col,id,data FROM $t WHERE deleted=0", ARRAY_A) as $r) {
        $out[$r['col']][$r['id']] = json_decode($r['data']); $n++;
    }
    $seed = wp_json_encode($out, JSON_UNESCAPED_UNICODE);
    /* členovia tímu, na ktorých sa záznamy odvolávajú (zodpovedný, kto zmenil…) – aby sa na novej stránke dali spárovať podľa e-mailu */
    $users = array();
    if (preg_match_all('/"wp_(\d+)"/', $seed, $m)) {
        foreach (array_unique($m[1]) as $uid) {
            $u = get_userdata((int) $uid);
            if ($u) $users['wp_' . (int) $uid] = array('email' => strtolower((string) $u->user_email), 'name' => $u->display_name, 'login' => $u->user_login);
        }
    }
    $dir = arsp_upload_dir();
    $map = (array) get_option('arsp_assets', array());
    $token = wp_generate_password(32, false, false);
    $path = $dir . '/zaloha-' . $token . '.zip';
    $z = new ZipArchive();
    if ($z->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) return new WP_Error('zipfail', 'Zálohu sa nepodarilo vytvoriť (zápis na server zlyhal).');
    $assets = array(); $nf = 0;
    foreach ($map as $id => $a) {
        $file = basename((string) (isset($a['file']) ? $a['file'] : ''));
        if (!$file || !is_file($dir . '/' . $file)) continue;
        $z->addFile($dir . '/' . $file, 'files/' . $file);
        if (method_exists($z, 'setCompressionName')) @$z->setCompressionName('files/' . $file, ZipArchive::CM_STORE);   /* PDF a fotky sú už zbalené */
        $assets[$id] = array('file' => $file, 'type' => isset($a['type']) ? $a['type'] : 'application/octet-stream');
        $nf++;
    }
    $z->addFromString('seed.json', $seed);
    $z->addFromString('assets.json', wp_json_encode($assets));
    $z->addFromString('users.json', wp_json_encode($users, JSON_UNESCAPED_UNICODE));
    $z->addFromString('info.json', wp_json_encode(array('site' => home_url('/'), 'version' => ARSP_VER, 'created' => gmdate('c'), 'records' => $n, 'files' => $nf)));
    if (!$z->close()) { @unlink($path); return new WP_Error('zipfail', 'Zálohu sa nepodarilo dokončiť – možno je na serveri málo miesta.'); }
    set_transient('arsp_bk_' . $token, array('file' => basename($path), 'records' => $n, 'files' => $nf, 'size' => filesize($path)), HOUR_IN_SECONDS);
    return array($token, $path, $n, $nf);
}

/* dočasná adresa na stiahnutie balíka (bez prihlásenia – chráni ju 32-znakový kľúč, platí 1 hodinu) */
add_action('template_redirect', function () {
    $tok = (string) get_query_var('arsp_backup');
    if ($tok === '') return;
    $tok = preg_replace('/[^A-Za-z0-9]/', '', $tok);
    $b = $tok ? get_transient('arsp_bk_' . $tok) : false;
    $path = $b ? arsp_upload_dir() . '/' . basename($b['file']) : '';
    if (!$b || !is_file($path)) { status_header(404); nocache_headers(); echo 'Záloha neexistuje alebo už vypršala.'; exit; }
    if (function_exists('set_time_limit')) @set_time_limit(0);
    while (ob_get_level()) ob_end_clean();
    nocache_headers();
    header('Content-Type: application/zip');
    header('Content-Length: ' . filesize($path));
    header('Content-Disposition: attachment; filename="ars-preuge-uplna-zaloha-' . gmdate('Y-m-d') . '.zip"');
    readfile($path);
    exit;
}, 1);

/** Import úplnej zálohy zo ZIP súboru na disku. Vráti pole s výsledkom alebo WP_Error. */
function arsp_import_full_zip($zipPath) {
    if (!class_exists('ZipArchive')) return new WP_Error('nozip', 'Server nemá rozšírenie ZipArchive.');
    if (function_exists('set_time_limit')) @set_time_limit(0);
    $z = new ZipArchive();
    if ($z->open($zipPath) !== true) return new WP_Error('bad', 'Súbor nie je platný ZIP.');
    $seed = $z->getFromName('seed.json');
    if ($seed === false) { $z->close(); return new WP_Error('bad', 'V balíku chýba seed.json – nie je to záloha pracovného priestoru.'); }
    $assets = json_decode((string) $z->getFromName('assets.json'), true);
    $users = json_decode((string) $z->getFromName('users.json'), true);
    if (!is_array($assets) || !is_array($users)) { $z->close(); return 'old'; }   /* starý formát balíka – spracuje pôvodný import */

    /* členovia tímu: staré číslo účtu → nové podľa e-mailu */
    $remap = array(); $missing = array();
    foreach ($users as $old => $u) {
        $nu = !empty($u['email']) ? get_user_by('email', $u['email']) : false;
        if ($nu) { $new = arsp_user_id_str($nu->ID); $remap[$old] = $new; }
        else {   /* bez účtu na novej stránke → meno ako text (staré číslo by tu mohlo patriť inému človeku) */
            $missing[] = (!empty($u['name']) ? $u['name'] : $old) . (!empty($u['email']) ? ' (' . $u['email'] . ')' : '');
            $remap[$old] = '~' . str_replace(array('"', '\\'), '', !empty($u['name']) ? $u['name'] : 'Člen tímu');
        }
    }
    if ($remap) $seed = preg_replace_callback('/"(wp_\d+)"/', function ($m) use ($remap) { return isset($remap[$m[1]]) ? '"' . $remap[$m[1]] . '"' : $m[0]; }, $seed);

    /* súbory: rovnaké mená aj typy ako na pôvodnej stránke */
    $dir = arsp_upload_dir();
    $map = (array) get_option('arsp_assets', array());
    $nf = 0; $bad = 0;
    foreach ($assets as $id => $a) {
        if (!preg_match('/^[0-9a-f]{32}$/', (string) $id)) continue;
        $file = basename((string) (isset($a['file']) ? $a['file'] : ''));
        if (!preg_match('/^[0-9a-f]{32}\.[a-z0-9.]{2,10}$/', $file)) continue;
        $in = $z->getStream('files/' . $file);
        if (!$in) { $bad++; continue; }
        $outF = @fopen($dir . '/' . $file, 'wb');
        if (!$outF) { fclose($in); $bad++; continue; }
        stream_copy_to_stream($in, $outF); fclose($in); fclose($outF);
        $map[$id] = array('file' => $file, 'type' => isset($a['type']) ? (string) $a['type'] : 'application/octet-stream');
        $nf++;
    }
    $z->close();
    update_option('arsp_assets', $map, false);
    $n = arsp_import($seed, array());   /* záznamy (rovnaké ID = prepíše sa) */
    return array('records' => $n, 'files' => $nf, 'badfiles' => $bad, 'users' => count($remap) - count($missing), 'missing' => $missing);
}

function arsp_import_result_redirect($res, $back) {
    if (is_wp_error($res)) { set_transient('arsp_imp_msg_' . get_current_user_id(), array('err' => $res->get_error_message()), 600); }
    else set_transient('arsp_imp_msg_' . get_current_user_id(), $res, 600);
    wp_safe_redirect(add_query_arg('arsp_imp', '1', $back)); exit;
}

/* stará stránka: pripraviť balík */
add_action('admin_post_arsp_backup_make', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_backup_make');
    $back = admin_url('admin.php?page=arsp');
    $r = arsp_backup_build();
    if (is_wp_error($r)) { set_transient('arsp_imp_msg_' . get_current_user_id(), array('err' => $r->get_error_message()), 600); wp_safe_redirect(add_query_arg('arsp_imp', '1', $back)); exit; }
    wp_safe_redirect(add_query_arg('arsp_bk', $r[0], $back) . '#arsp-prenos'); exit;
});

/* nová stránka: stiahnuť balík z adresy (server→server, bez limitu na nahrávanie) */
add_action('admin_post_arsp_import_url', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_import_url');
    $back = admin_url('admin.php?page=arsp');
    $url = esc_url_raw(trim((string) wp_unslash(isset($_POST['arsp_url']) ? $_POST['arsp_url'] : '')));
    if (!$url || !preg_match('~^https?://~i', $url)) arsp_import_result_redirect(new WP_Error('url', 'Vložte adresu zálohy zo starej stránky.'), $back);
    if (function_exists('set_time_limit')) @set_time_limit(0);
    $tmp = arsp_upload_dir() . '/import-' . wp_generate_password(12, false) . '.zip';
    $res = wp_safe_remote_get($url, array('timeout' => 600, 'stream' => true, 'filename' => $tmp, 'redirection' => 3));
    if (is_wp_error($res) || (int) wp_remote_retrieve_response_code($res) !== 200) {
        @unlink($tmp);
        arsp_import_result_redirect(new WP_Error('dl', 'Zálohu sa nepodarilo stiahnuť' . (is_wp_error($res) ? ' (' . $res->get_error_message() . ')' : ' – adresa možno vypršala (platí 1 hodinu). Na starej stránke pripravte zálohu znova.')), $back);
    }
    $r = arsp_import_full_zip($tmp);
    @unlink($tmp);
    if ($r === 'old') $r = new WP_Error('old', 'Toto je starší typ balíka – nahrajte ho cez „Import dát“ nižšie.');
    arsp_import_result_redirect($r, $back);
});

/* časť stránky Ars Preuge v administrácii */
function arsp_prenos_admin_section() {
    echo '<h2 id="arsp-prenos">Prenos na inú stránku (všetko vrátane súborov)</h2>';
    $msg = get_transient('arsp_imp_msg_' . get_current_user_id());
    if ($msg && isset($_GET['arsp_imp'])) {
        delete_transient('arsp_imp_msg_' . get_current_user_id());
        if (!empty($msg['err'])) echo '<div class="notice notice-error"><p>' . esc_html($msg['err']) . '</p></div>';
        else {
            echo '<div class="notice notice-success"><p>Prenos hotový – záznamov: <b>' . (int) $msg['records'] . '</b>, súborov: <b>' . (int) $msg['files'] . '</b>'
                . ($msg['users'] ? ', spárovaných členov tímu: <b>' . (int) $msg['users'] . '</b>' : '') . '.'
                . (!empty($msg['badfiles']) ? ' <b>' . (int) $msg['badfiles'] . ' súborov sa nepodarilo uložiť.</b>' : '') . '</p>';
            if (!empty($msg['missing'])) echo '<p>Títo ľudia na tejto stránke zatiaľ nemajú účet (podľa e-mailu): ' . esc_html(implode(', ', $msg['missing'])) . '. Pri ich úlohách je zatiaľ len napísané meno. Ak im založíte účet s rovnakým e-mailom a spustíte prenos znova, priradia sa k účtu – opakujte ho však len kým ste na tejto stránke ešte nič nemenili (prenos prepíše záznamy stavom zo starej stránky).</p>';
            echo '<p>API kľúč ku Claude sa neprenáša – zadajte ho vyššie znova.</p></div>';
        }
    }
    $tok = isset($_GET['arsp_bk']) ? preg_replace('/[^A-Za-z0-9]/', '', (string) $_GET['arsp_bk']) : '';
    $b = $tok ? get_transient('arsp_bk_' . $tok) : false;
    echo '<p><b>1. Na starej stránke</b> pripravte úplnú zálohu – obsahuje všetky záznamy aj nahrané súbory (zmluvy, faktúry, PDF, obrázky). Na tejto stránke sa nič nezmení.</p>';
    if ($b) {
        $link = add_query_arg('arsp_backup', $tok, home_url('/'));
        echo '<div class="notice notice-info inline"><p>Záloha je pripravená: ' . (int) $b['records'] . ' záznamov, ' . (int) $b['files'] . ' súborov, ' . esc_html(size_format($b['size'])) . '.</p>'
            . '<p><a class="button" href="' . esc_url($link) . '">Stiahnuť zálohu (ZIP)</a></p>'
            . '<p>Adresa na prenos (platí 1 hodinu, nikomu ju neposielajte – kto ju má, stiahne všetky dáta):<br><input type="text" readonly value="' . esc_attr($link) . '" style="width:100%;max-width:720px" onclick="this.select()"></p></div>';
    }
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="margin:8px 0 18px">';
    wp_nonce_field('arsp_backup_make');
    echo '<input type="hidden" name="action" value="arsp_backup_make"><button class="button">Pripraviť úplnú zálohu</button></form>';
    echo '<p><b>2. Na novej stránke</b> vložte adresu na prenos zo starej stránky. Nová stránka si zálohu stiahne sama (bez limitu na veľkosť nahrávaného súboru) a členov tímu spáruje podľa e-mailu – najprv im preto založte účty s rovnakými e-mailmi.</p>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    wp_nonce_field('arsp_import_url');
    echo '<input type="hidden" name="action" value="arsp_import_url"><input type="url" name="arsp_url" placeholder="https://stara-stranka.sk/?arsp_backup=…" style="width:100%;max-width:560px" required> <button class="button button-primary">Importovať z adresy</button></form>';
    echo '<p class="description">Úplnú zálohu (ZIP) môžete nahrať aj cez „Import dát“ nižšie, ak to dovolí limit veľkosti súboru.</p>';
}
