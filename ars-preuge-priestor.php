<?php
/**
 * Plugin Name: Ars Preuge – pracovný priestor
 * Description: Tímová aplikácia OZ Ars Preuge (projekty, granty, podujatia, zabezpečenie, financie, kontakty, úlohy). Otvára sa na adrese /priestor/ pre prihlásených členov tímu.
 * Version: 1.5.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: OZ Ars Preuge
 * Text Domain: ars-preuge-priestor
 */

if (!defined('ABSPATH')) exit;

define('ARSP_VER', '1.5.0');
define('ARSP_DIR', plugin_dir_path(__FILE__));
define('ARSP_CAP', 'arsp_access');
define('ARSP_SLUG', 'priestor');

/* ---------------------------------------------------------------- helpers */

function arsp_table() { global $wpdb; return $wpdb->prefix . 'arsp_docs'; }

function arsp_now_ms() { return (int) round(microtime(true) * 1000); }

function arsp_upload_dir() {
    $u = wp_upload_dir(null, false);
    $dir = trailingslashit($u['basedir']) . 'arsp';
    if (!is_dir($dir)) {
        wp_mkdir_p($dir);
        // block direct web access – files are served only through the plugin with a permission check
        @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
        @file_put_contents($dir . '/index.php', "<?php // silence\n");
    }
    return $dir;
}

function arsp_valid_col($c) { return is_string($c) && preg_match('/^[A-Za-z_]{1,40}$/', $c); }
function arsp_valid_id($i)  { return is_string($i) && preg_match('/^[A-Za-z0-9_.\-]{1,80}$/', $i); }

function arsp_user_id_str($uid) { return 'wp_' . (int) $uid; }

function arsp_profile($u) {
    return array(
        'id'        => arsp_user_id_str($u->ID),
        'name'      => $u->display_name ? $u->display_name : $u->user_login,
        'avatarUrl' => get_avatar_url($u->ID, array('size' => 64)),
    );
}

/* ------------------------------------------------------- activation/setup */

register_activation_hook(__FILE__, 'arsp_activate');

function arsp_activate() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $t = arsp_table();
    $charset = $wpdb->get_charset_collate();
    dbDelta("CREATE TABLE $t (
        col varchar(40) NOT NULL,
        id varchar(80) NOT NULL,
        data longtext NOT NULL,
        updated bigint(20) NOT NULL DEFAULT 0,
        deleted tinyint(1) NOT NULL DEFAULT 0,
        PRIMARY KEY  (col,id),
        KEY updated (updated)
    ) $charset;");

    // capability + team role
    foreach (array('administrator', 'editor') as $r) {
        $role = get_role($r);
        if ($role) $role->add_cap(ARSP_CAP);
    }
    if (!get_role('arsp_team')) {
        add_role('arsp_team', 'Tím Ars Preuge', array('read' => true, ARSP_CAP => true));
    }

    arsp_seed();
    arsp_rewrite();
    flush_rewrite_rules();
    update_option('arsp_version', ARSP_VER);
}

register_deactivation_hook(__FILE__, function () { flush_rewrite_rules(); });

/* safety net: if the plugin was installed/updated without the activation hook (e.g. synced from GitHub), finish setup */
add_action('init', function () {
    if (get_option('arsp_version') !== ARSP_VER) arsp_activate();
}, 20);

/** Import bundled data the first time (only into an empty table). */
function arsp_seed() {
    global $wpdb;
    $t = arsp_table();
    $count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $t");
    if ($count > 0 || get_option('arsp_seeded')) return;
    $file = ARSP_DIR . 'data/seed.json';
    if (!file_exists($file)) return;
    arsp_import(file_get_contents($file), (array) glob(ARSP_DIR . 'data/assets/*'));
    // the bundled data are private – remove them from the public plugin folder once imported
    foreach ((array) glob(ARSP_DIR . 'data/assets/*') as $src) @unlink($src);
    @unlink($file);
}

/** Import a data export (JSON keyed by collection → id → document) plus its files. Returns number of records. */
function arsp_import($raw, $files) {
    global $wpdb;
    $t = arsp_table();
    // records created in the original app belong to the person who imports them
    $me = get_current_user_id();
    if ($me) $raw = str_replace('u_Z2WcLSBICP_K2yIrGl43vA', arsp_user_id_str($me), $raw);
    $seed = json_decode($raw, true);
    if (!is_array($seed)) return 0;
    $now = arsp_now_ms(); $n = 0;
    foreach ($seed as $col => $docs) {
        if (!arsp_valid_col($col) || !is_array($docs)) continue;
        foreach ($docs as $id => $doc) {
            if (!arsp_valid_id((string) $id)) continue;
            $wpdb->replace($t, array(
                'col' => $col, 'id' => (string) $id,
                'data' => wp_json_encode($doc, JSON_UNESCAPED_UNICODE),
                'updated' => $now, 'deleted' => 0,
            ), array('%s', '%s', '%s', '%d', '%d'));
            $n++;
        }
    }
    $dir = arsp_upload_dir();
    $map = get_option('arsp_assets', array());
    foreach ($files as $src) {
        $base = basename($src);
        if (!preg_match('/^([0-9a-f]{32})\.([a-z0-9]{2,5})$/', $base, $m)) continue;
        if (@copy($src, $dir . '/' . $base)) {
            $type = wp_check_filetype($base);
            $map[$m[1]] = array('file' => $base, 'type' => $type['type'] ? $type['type'] : 'application/octet-stream');
        }
    }
    update_option('arsp_assets', $map, false);
    update_option('arsp_seeded', 1, false);
    return $n;
}

add_action('admin_post_arsp_import', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_import');
    $back = admin_url('admin.php?page=arsp');
    if (!empty($_FILES['arsp_file']['error']) && in_array($_FILES['arsp_file']['error'], array(UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE), true)) { wp_safe_redirect(add_query_arg('arsp_msg', 'big', $back)); exit; }
    if (empty($_FILES['arsp_file']['tmp_name']) || !empty($_FILES['arsp_file']['error'])) { wp_safe_redirect(add_query_arg('arsp_msg', 'nofile', $back)); exit; }
    $f = $_FILES['arsp_file'];
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    $n = 0;
    if ($ext === 'json') {
        $n = arsp_import(file_get_contents($f['tmp_name']), array());
    } elseif ($ext === 'zip' && class_exists('ZipArchive')) {
        $tmp = arsp_upload_dir() . '/import-' . wp_generate_password(12, false);
        wp_mkdir_p($tmp);
        $z = new ZipArchive();
        if ($z->open($f['tmp_name']) === true) {
            $json = null; $files = array();
            for ($i = 0; $i < $z->numFiles; $i++) {
                $name = $z->getNameIndex($i); $base = basename($name);
                if ($base === 'seed.json') $json = $z->getFromIndex($i);
                elseif (preg_match('/^[0-9a-f]{32}\.[a-z0-9]{2,5}$/', $base)) { file_put_contents($tmp . '/' . $base, $z->getFromIndex($i)); $files[] = $tmp . '/' . $base; }
            }
            $z->close();
            if ($json) $n = arsp_import($json, $files);
        }
        foreach ((array) glob($tmp . '/*') as $x) @unlink($x);
        @rmdir($tmp);
    }
    wp_safe_redirect(add_query_arg(array('arsp_msg' => $n ? 'ok' : 'bad', 'arsp_n' => $n), $back)); exit;
});

/* ---------------------------------------------------------------- routing */

function arsp_rewrite() {
    add_rewrite_rule('^' . ARSP_SLUG . '/?$', 'index.php?arsp_app=1', 'top');
}
add_action('init', 'arsp_rewrite');

add_filter('query_vars', function ($v) { $v[] = 'arsp_app'; $v[] = 'arsp_blob'; return $v; });

function arsp_app_url() {
    return get_option('permalink_structure') ? home_url('/' . ARSP_SLUG . '/') : add_query_arg('arsp_app', '1', home_url('/'));
}

add_action('template_redirect', function () {
    if (get_query_var('arsp_blob')) { arsp_serve_blob((string) get_query_var('arsp_blob')); exit; }
    if (!get_query_var('arsp_app')) return;

    if (!is_user_logged_in()) { auth_redirect(); exit; }
    if (!current_user_can(ARSP_CAP)) {
        wp_die('Na pracovný priestor Ars Preuge nemáte prístup. Požiadajte správcu stránky, aby vám pridelil rolu „Tím Ars Preuge“.', 'Bez prístupu', array('response' => 403));
    }
    nocache_headers();
    header('Content-Type: text/html; charset=utf-8');

    $html = file_get_contents(ARSP_DIR . 'app/index.html');
    $cfg = array(
        'rest'  => esc_url_raw(rest_url('arsp/v1/')),
        'nonce' => wp_create_nonce('wp_rest'),
        'me'    => arsp_profile(wp_get_current_user()),
        'blob'  => home_url('/?arsp_blob='),
        'home'  => home_url('/'),
        'admin' => current_user_can('manage_options') ? admin_url() : '',
        'logout'=> wp_logout_url(home_url('/')),
    );
    $inject = '<script>window.ARSP=' . wp_json_encode($cfg) . ';var ARSP_BLOB=window.ARSP.blob;</script>'
            . '<script>' . file_get_contents(ARSP_DIR . 'app/shim.js') . '</script>';
    $pos = strpos($html, '<script>');
    $html = substr($html, 0, $pos) . $inject . "\n" . substr($html, $pos);
    echo $html;
    exit;
});

function arsp_serve_blob($id) {
    if (!is_user_logged_in() || !current_user_can(ARSP_CAP)) { status_header(403); echo 'Forbidden'; return; }
    $id = preg_replace('/[^0-9a-f]/', '', strtolower($id));
    $map = get_option('arsp_assets', array());
    if (!$id || empty($map[$id])) { status_header(404); echo 'Not found'; return; }
    $path = arsp_upload_dir() . '/' . basename($map[$id]['file']);
    if (!file_exists($path)) { status_header(404); echo 'Not found'; return; }
    nocache_headers();
    header('Content-Type: ' . $map[$id]['type']);
    header('Content-Length: ' . filesize($path));
    header('Content-Disposition: inline; filename="' . basename($path) . '"');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
}

/* ------------------------------------------------------------------- REST */

add_action('rest_api_init', function () {
    $perm = function () { return current_user_can(ARSP_CAP); };

    register_rest_route('arsp/v1', '/sync', array(
        'methods' => 'GET', 'permission_callback' => $perm,
        'callback' => function (WP_REST_Request $r) {
            global $wpdb; $t = arsp_table();
            $since = max(0, (int) $r->get_param('since'));
            $now = arsp_now_ms();
            $rows = $wpdb->get_results($wpdb->prepare(
                "SELECT col,id,data,updated,deleted FROM $t WHERE updated > %d ORDER BY updated ASC", $since), ARRAY_A);
            $out = array(); $max = $since;
            foreach ($rows as $row) {
                $u = (int) $row['updated']; if ($u > $max) $max = $u;
                $out[] = array('c' => $row['col'], 'i' => $row['id'], 'u' => $u, 'x' => (int) $row['deleted'],
                    'd' => $row['deleted'] ? null : json_decode($row['data']));
            }
            return array('now' => $now, 'max' => $max, 'docs' => $out);
        },
    ));

    register_rest_route('arsp/v1', '/doc', array(
        'methods' => 'POST', 'permission_callback' => $perm,
        'callback' => function (WP_REST_Request $r) {
            global $wpdb; $t = arsp_table();
            $col = (string) $r->get_param('col'); $id = (string) $r->get_param('id'); $op = (string) $r->get_param('op');
            if (!arsp_valid_col($col) || !arsp_valid_id($id) || !in_array($op, array('set', 'update', 'delete'), true)) {
                return new WP_Error('invalid_argument', 'Neplatná požiadavka', array('status' => 400));
            }
            $data = $r->get_param('data');
            $cur = $wpdb->get_row($wpdb->prepare("SELECT data,updated,deleted FROM $t WHERE col=%s AND id=%s", $col, $id), ARRAY_A);
            $upd = arsp_now_ms();
            if ($cur && (int) $cur['updated'] >= $upd) $upd = (int) $cur['updated'] + 1;

            if ($op === 'delete') {
                $wpdb->replace($t, array('col' => $col, 'id' => $id, 'data' => '{}', 'updated' => $upd, 'deleted' => 1), array('%s', '%s', '%s', '%d', '%d'));
                return array('ok' => true, 'u' => $upd);
            }
            if (!is_array($data)) $data = array();
            if ($op === 'update') {
                if (!$cur || $cur['deleted']) return new WP_Error('not_found', 'Záznam neexistuje', array('status' => 404));
                $old = json_decode($cur['data'], true); if (!is_array($old)) $old = array();
                foreach ($data as $k => $v) $old[$k] = $v;
                $data = $old;
            }
            $json = wp_json_encode((object) $data, JSON_UNESCAPED_UNICODE);
            if (strlen($json) > 900000) return new WP_Error('invalid_argument', 'Záznam je príliš veľký', array('status' => 400));
            $wpdb->replace($t, array('col' => $col, 'id' => $id, 'data' => $json, 'updated' => $upd, 'deleted' => 0), array('%s', '%s', '%s', '%d', '%d'));
            return array('ok' => true, 'u' => $upd, 'd' => json_decode($json));
        },
    ));

    register_rest_route('arsp/v1', '/users', array(
        'methods' => 'GET', 'permission_callback' => $perm,
        'callback' => function (WP_REST_Request $r) {
            $out = array();
            $ids = array_filter(explode(',', (string) $r->get_param('ids')));
            if ($ids) {
                foreach ($ids as $s) {
                    if (!preg_match('/^wp_(\d+)$/', $s, $m)) continue;
                    $u = get_userdata((int) $m[1]);
                    if ($u) $out[$s] = arsp_profile($u);
                }
                return (object) $out;
            }
            $q = trim((string) $r->get_param('q'));
            $args = array('number' => 20, 'orderby' => 'display_name', 'capability' => ARSP_CAP);
            if ($q !== '') { $args['search'] = '*' . $q . '*'; $args['search_columns'] = array('display_name', 'user_login', 'user_email', 'user_nicename'); }
            $list = array();
            foreach (get_users($args) as $u) $list[] = arsp_profile($u);
            return $list;
        },
    ));

    register_rest_route('arsp/v1', '/upload', array(
        'methods' => 'POST', 'permission_callback' => $perm,
        'callback' => function (WP_REST_Request $r) {
            $files = $r->get_file_params();
            if (empty($files['file']) || !empty($files['file']['error'])) return new WP_Error('invalid_argument', 'Súbor chýba', array('status' => 400));
            $f = $files['file'];
            if ($f['size'] > 25 * 1024 * 1024) return new WP_Error('invalid_argument', 'Súbor je väčší ako 25 MB', array('status' => 400));
            $allowed = array('pdf','jpg','jpeg','png','gif','webp','svg','doc','docx','xls','xlsx','ppt','pptx','odt','ods','txt','csv','zip','mp3','mp4','mov','heic');
            $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
            $type = (string) $r->get_param('type');
            if (!in_array($ext, $allowed, true)) {
                $guess = array('application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif');
                $ext = isset($guess[$f['type']]) ? $guess[$f['type']] : (isset($guess[$type]) ? $guess[$type] : '');
                if (!$ext) return new WP_Error('invalid_argument', 'Tento typ súboru nie je povolený', array('status' => 400));
            }
            if ($ext === 'svg') $ext = 'svg.txt'; // never serve uploaded svg as active content
            $id = bin2hex(random_bytes(16));
            $name = $id . '.' . $ext;
            if (!move_uploaded_file($f['tmp_name'], arsp_upload_dir() . '/' . $name)) {
                return new WP_Error('internal', 'Súbor sa nepodarilo uložiť', array('status' => 500));
            }
            $mime = $type ? $type : ($f['type'] ? $f['type'] : 'application/octet-stream');
            if ($ext === 'svg.txt' || preg_match('/html|javascript|xml/i', $mime)) $mime = 'text/plain';
            $map = get_option('arsp_assets', array());
            $map[$id] = array('file' => $name, 'type' => $mime);
            update_option('arsp_assets', $map, false);
            return array('id' => $id);
        },
    ));
});

/* ------------------------------------------------------------ admin + UI */

add_action('admin_menu', function () {
    add_menu_page('Ars Preuge', 'Ars Preuge', ARSP_CAP, 'arsp', 'arsp_admin_page', 'dashicons-art', 3);
});

function arsp_admin_page() {
    $url = arsp_app_url();
    global $wpdb; $t = arsp_table();
    $rows = $wpdb->get_results("SELECT col, COUNT(*) n FROM $t WHERE deleted=0 GROUP BY col", ARRAY_A);
    echo '<div class="wrap"><h1>Ars Preuge – pracovný priestor</h1>';
    if (isset($_GET['arsp_msg'])) {
        $m = sanitize_key($_GET['arsp_msg']);
        if ($m === 'ok') echo '<div class="notice notice-success"><p>Import hotový – načítaných záznamov: ' . (int) $_GET['arsp_n'] . '.</p></div>';
        elseif ($m === 'big') echo '<div class="notice notice-error"><p>Súbor je väčší, ako server dovolí nahrať (' . esc_html(size_format(wp_max_upload_size())) . '). Požiadajte hosting o zvýšenie limitu <code>upload_max_filesize</code> a <code>post_max_size</code> aspoň na 10 MB.</p></div>';
        else echo '<div class="notice notice-error"><p>Import sa nepodaril – skontrolujte, či ste nahrali správny súbor.</p></div>';
    }
    echo '<p><a class="button button-primary button-hero" href="' . esc_url($url) . '" target="_blank">Otvoriť pracovný priestor</a></p>';
    echo '<p>Adresa pre tím: <code>' . esc_html($url) . '</code></p>';
    echo '<h2>Kto má prístup</h2><p>Administrátori, redaktori (Editor) a používatelia s rolou <b>Tím Ars Preuge</b>. Nového člena pridáte cez <a href="' . esc_url(admin_url('user-new.php')) . '">Používatelia → Pridať nového</a> a zvolíte rolu „Tím Ars Preuge“.</p>';
    echo '<h2>Uložené záznamy</h2><ul>';
    foreach ($rows as $r) echo '<li>' . esc_html($r['col']) . ': ' . (int) $r['n'] . '</li>';
    echo '</ul>';
    if (current_user_can('manage_options')) {
        $exp = wp_nonce_url(admin_url('admin-post.php?action=arsp_export'), 'arsp_export');
        echo '<h2>Záloha</h2><p><a class="button" href="' . esc_url($exp) . '">Stiahnuť zálohu dát (JSON)</a></p>';
        echo '<h2>Import dát</h2><p>Nahrajte balík dát (<code>.zip</code> so súborom seed.json a dokumentmi, alebo zálohu <code>.json</code>). Záznamy s rovnakým ID sa prepíšu, ostatné zostanú.</p>';
        echo '<form method="post" enctype="multipart/form-data" action="' . esc_url(admin_url('admin-post.php')) . '">';
        wp_nonce_field('arsp_import');
        echo '<input type="hidden" name="action" value="arsp_import"><input type="file" name="arsp_file" accept=".zip,.json" required> ';
        echo '<button class="button button-primary">Importovať</button> <span class="description">max. ' . esc_html(size_format(wp_max_upload_size())) . '</span></form>';
    }
    echo '</div>';
}

add_action('admin_post_arsp_export', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_export');
    global $wpdb; $t = arsp_table();
    $out = array();
    foreach ($wpdb->get_results("SELECT col,id,data FROM $t WHERE deleted=0", ARRAY_A) as $r) {
        $out[$r['col']][$r['id']] = json_decode($r['data']);
    }
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="ars-preuge-zaloha-' . gmdate('Y-m-d') . '.json"');
    echo wp_json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
});

/* link in the admin bar for quick access */
add_action('admin_bar_menu', function ($bar) {
    if (!current_user_can(ARSP_CAP)) return;
    $bar->add_node(array('id' => 'arsp', 'title' => 'Pracovný priestor', 'href' => arsp_app_url()));
}, 80);

/* shortcode for a button on any page: [ars_preuge_priestor] */
add_shortcode('ars_preuge_priestor', function () {
    return '<a class="wp-element-button" href="' . esc_url(arsp_app_url()) . '">Pracovný priestor Ars Preuge</a>';
});

/* team members land in the workspace after login instead of the dashboard */
add_filter('login_redirect', function ($to, $requested, $user) {
    if ($user instanceof WP_User && !is_wp_error($user) && in_array('arsp_team', (array) $user->roles, true)
        && (!$requested || strpos($requested, 'wp-admin') !== false)) {
        return arsp_app_url();
    }
    return $to;
}, 10, 3);
