<?php
/**
 * Prístupy (fáza 1): kto čo vidí a čo smie meniť – podľa oblastí.
 *
 * Skupiny (WordPress → Ars Preuge → Prístupy, len administrátor) majú pri každej oblasti úroveň
 * 0 = bez prístupu · 1 = len čítať · 2 = upravovať. Používateľovi sa pridelí jedna alebo viac skupín,
 * práva sa sčítajú (platí vyššia úroveň). Kto nemá žiadnu skupinu, má plný prístup ako doteraz;
 * administrátori majú plný prístup vždy. Obmedzuje server: /sync nepošle zakázané kolekcie, /doc odmietne zápis.
 * Osobná výnimka = skupina pre jedného človeka. Rozsah (len vybrané projekty / podujatia) príde vo fáze 2.
 */
if (!defined('ABSPATH')) exit;

/** Oblasti: názov pre ľudí + kolekcie, ktoré do nej patria. */
function arsp_acc_areas() {
    return array(
        'dianie'     => array('label' => 'Projekty a podujatia', 'cols' => array('projects', 'events', 'partnerships', 'programItems', 'zabezpecenie', 'zabdodavky')),
        'ulohy'      => array('label' => 'Úlohy', 'cols' => array('tasks')),
        'granty'     => array('label' => 'Granty (bez platieb)', 'cols' => array('grants', 'budgetLines')),
        'financie'   => array('label' => 'Financie (platby)', 'cols' => array('transactions')),
        'kontakty'   => array('label' => 'Kontakty', 'cols' => array('contacts')),
        'nastavenia' => array('label' => 'Nastavenia', 'cols' => array('settings')),
    );
}

function arsp_acc_col_area($col) {
    static $map = null;
    if ($map === null) { $map = array(); foreach (arsp_acc_areas() as $a => $x) foreach ($x['cols'] as $c) $map[$c] = $a; }
    return isset($map[$col]) ? $map[$col] : '';
}

function arsp_acc_groups() { $g = get_option('arsp_acc_groups', array()); return is_array($g) ? $g : array(); }

/** Práva používateľa: null = plný prístup, inak pole oblasť → 0/1/2. */
function arsp_acc_user($uid = 0) {
    $uid = $uid ? (int) $uid : get_current_user_id();
    if (!$uid || user_can($uid, 'manage_options')) return null;
    $gids = get_user_meta($uid, 'arsp_acc', true);
    if (!is_array($gids) || !$gids) return null;
    $groups = arsp_acc_groups();
    $acc = array_fill_keys(array_keys(arsp_acc_areas()), 0);
    $found = false;
    foreach ($gids as $gid) {
        if (empty($groups[$gid])) continue;
        $found = true;
        foreach ((array) (isset($groups[$gid]['areas']) ? $groups[$gid]['areas'] : array()) as $a => $l) {
            $l = (int) $l;
            if (isset($acc[$a]) && $l > $acc[$a]) $acc[$a] = $l;
        }
    }
    return $found ? $acc : null;   /* skupina medzitým zmazaná → ako bez skupiny (plný prístup) */
}

function arsp_acc_level($area, $acc) { if ($acc === null) return 2; return isset($acc[$area]) ? (int) $acc[$area] : 0; }
/** Má prihlásený na oblasť aspoň úroveň $lvl? */
function arsp_acc_can($area, $lvl) { return arsp_acc_level($area, arsp_acc_user()) >= $lvl; }

/** Oblasť jedného záznamu (komentár patrí k oblasti svojho rodiča "kolekcia:id…"). */
function arsp_acc_doc_area($col, $doc) {
    if ($col !== 'comments') return arsp_acc_col_area($col);
    $p = '';
    if (is_array($doc) && isset($doc['parent'])) $p = (string) $doc['parent'];
    elseif (is_object($doc) && isset($doc->parent)) $p = (string) $doc->parent;
    $pc = strtok($p, ':');
    return $pc ? arsp_acc_col_area($pc) : '';
}

/** Filtrovanie odpovede /sync: docs = položky {c,i,u,x,d}. Pri obmedzenom prístupe sa zakázané kolekcie neposielajú;
 *  bez práva na financie sa z nastavení vynechajú počiatočné zostatky. */
function arsp_acc_filter_sync($docs, $acc) {
    if ($acc === null) return $docs;
    $out = array();
    foreach ($docs as $row) {
        $col = $row['c'];
        if ($col === 'settings') {
            if (arsp_acc_level('financie', $acc) < 1 && !$row['x'] && is_object($row['d'])) {
                $d = clone $row['d']; unset($d->openBank, $d->openCash); $row['d'] = $d;
            }
            $out[] = $row;   /* nastavenia na čítanie potrebuje aplikácia vždy (kategórie, typy úloh) */
            continue;
        }
        $area = $row['x'] ? arsp_acc_col_area($col) : arsp_acc_doc_area($col, $row['d']);
        if ($col === 'comments' && $row['x']) continue;   /* zmazaný komentár – rodič už nepoznáme */
        if ($area && arsp_acc_level($area, $acc) >= 1) $out[] = $row;
    }
    return array_values($out);
}

/** Kontrola zápisu /doc. $data = nové dáta (pri set/update), $curDoc = doterajší záznam (alebo null). Vráti true alebo WP_Error. */
function arsp_acc_check_write($col, $op, $data, $curDoc, $acc) {
    if ($acc === null) return true;
    $deny = function () { return new WP_Error('forbidden', 'Na túto úpravu nemáte právo. Požiadajte správcu o rozšírenie prístupu.', array('status' => 403)); };
    if ($col === 'settings') return arsp_acc_level('nastavenia', $acc) >= 2 ? true : $deny();
    $area = arsp_acc_doc_area($col, $curDoc !== null ? $curDoc : $data);
    if ($col === 'comments' && !$area && is_array($data)) $area = arsp_acc_doc_area($col, $data);
    if (!$area || arsp_acc_level($area, $acc) < 2) return $deny();
    return true;
}

/* ------------------------------------------------------- administrácia */

function arsp_acc_admin_section() {
    if (!current_user_can('manage_options')) return;
    $areas = arsp_acc_areas();
    $groups = arsp_acc_groups();
    echo '<h2 id="arsp-pristupy">Prístupy</h2>';
    if (isset($_GET['arsp_acc'])) echo '<div class="notice notice-success"><p>Prístupy sú uložené.</p></div>';
    echo '<p>Kto nemá pridelenú žiadnu skupinu (a každý administrátor), vidí a môže upravovať všetko ako doteraz. '
        . 'Obmedzenia platia len pre ľudí so skupinou – server im nepošle dáta oblastí bez prístupu a zápis bez práva „upravovať“ odmietne. '
        . 'Osobná výnimka = skupina pre jedného človeka. Viac skupín sa sčíta (platí vyššie právo).</p>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    wp_nonce_field('arsp_acc_save');
    echo '<input type="hidden" name="action" value="arsp_acc_save">';
    $sel = function ($name, $v) {
        $o = array(0 => 'Bez prístupu', 1 => 'Len čítať', 2 => 'Upravovať');
        $h = '<select name="' . esc_attr($name) . '">';
        foreach ($o as $k => $l) $h .= '<option value="' . $k . '"' . ((int) $v === $k ? ' selected' : '') . '>' . $l . '</option>';
        return $h . '</select>';
    };
    echo '<h3>Skupiny</h3><table class="widefat striped" style="max-width:1100px"><thead><tr><th>Skupina</th>';
    foreach ($areas as $x) echo '<th>' . esc_html($x['label']) . '</th>';
    echo '<th>Zmazať</th></tr></thead><tbody>';
    foreach ($groups as $gid => $g) {
        echo '<tr><td><input type="text" name="g[' . esc_attr($gid) . '][name]" value="' . esc_attr($g['name']) . '" required></td>';
        foreach ($areas as $a => $x) echo '<td>' . $sel('g[' . esc_attr($gid) . '][areas][' . $a . ']', isset($g['areas'][$a]) ? $g['areas'][$a] : 0) . '</td>';
        echo '<td style="text-align:center"><input type="checkbox" name="g[' . esc_attr($gid) . '][del]" value="1" aria-label="Zmazať skupinu"></td></tr>';
    }
    echo '<tr><td><input type="text" name="new_name" placeholder="+ nová skupina (napr. Dobrovoľníci NOX)"></td>';
    foreach ($areas as $a => $x) echo '<td>' . $sel('new_areas[' . $a . ']', 0) . '</td>';
    echo '<td></td></tr></tbody></table>';
    echo '<h3>Ľudia</h3>';
    if (!$groups) echo '<p class="description">Najprv vytvorte skupinu, potom ju tu pridelíte ľuďom.</p>';
    echo '<table class="widefat striped" style="max-width:1100px"><thead><tr><th>Používateľ</th><th>Skupiny</th><th>Výsledok</th></tr></thead><tbody>';
    foreach (get_users(array('capability' => ARSP_CAP, 'orderby' => 'display_name', 'number' => 300)) as $u) {
        $mine = get_user_meta($u->ID, 'arsp_acc', true); if (!is_array($mine)) $mine = array();
        echo '<tr><td>' . esc_html($u->display_name) . ' <span class="description">(' . esc_html($u->user_email) . ')</span></td><td>';
        if (user_can($u, 'manage_options')) { echo '<em>administrátor – vždy všetko</em></td><td>plný prístup</td></tr>'; continue; }
        echo '<input type="hidden" name="u[' . (int) $u->ID . '][x]" value="1"> ';
        foreach ($groups as $gid => $g) {
            echo '<label style="margin-right:14px;white-space:nowrap"><input type="checkbox" name="u[' . (int) $u->ID . '][g][]" value="' . esc_attr($gid) . '"' . (in_array($gid, $mine, true) ? ' checked' : '') . '> ' . esc_html($g['name']) . '</label>';
        }
        $acc = arsp_acc_user($u->ID);
        echo '</td><td>' . ($acc === null ? 'plný prístup' : esc_html(implode(' · ', array_map(function ($a, $l) use ($areas) { return $areas[$a]['label'] . ': ' . ($l === 2 ? 'upravovať' : ($l === 1 ? 'čítať' : '–')); }, array_keys($acc), $acc)))) . '</td></tr>';
    }
    echo '</tbody></table><p><button class="button button-primary">Uložiť prístupy</button></p></form>';
}

add_action('admin_post_arsp_acc_save', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_acc_save');
    $areas = array_keys(arsp_acc_areas());
    $lvl = function ($v) { $v = (int) $v; return $v === 2 ? 2 : ($v === 1 ? 1 : 0); };
    $groups = array();
    foreach ((array) (isset($_POST['g']) ? wp_unslash($_POST['g']) : array()) as $gid => $g) {
        if (!preg_match('/^g[a-z0-9]{1,20}$/', (string) $gid) || !empty($g['del'])) continue;
        $name = sanitize_text_field(isset($g['name']) ? $g['name'] : ''); if ($name === '') continue;
        $as = array(); foreach ($areas as $a) $as[$a] = $lvl(isset($g['areas'][$a]) ? $g['areas'][$a] : 0);
        $groups[$gid] = array('name' => $name, 'areas' => $as);
    }
    $newName = sanitize_text_field(isset($_POST['new_name']) ? wp_unslash($_POST['new_name']) : '');
    if ($newName !== '') {
        $as = array(); foreach ($areas as $a) $as[$a] = $lvl(isset($_POST['new_areas'][$a]) ? $_POST['new_areas'][$a] : 0);
        $groups['g' . substr(md5(uniqid('', true)), 0, 10)] = array('name' => $newName, 'areas' => $as);
    }
    update_option('arsp_acc_groups', $groups, false);
    foreach ((array) (isset($_POST['u']) ? $_POST['u'] : array()) as $uid => $row) {
        $uid = (int) $uid;
        if (!$uid || user_can($uid, 'manage_options') || !user_can($uid, ARSP_CAP)) continue;
        $gids = array_values(array_intersect(array_map('sanitize_key', (array) (isset($row['g']) ? $row['g'] : array())), array_keys($groups)));
        if ($gids) update_user_meta($uid, 'arsp_acc', $gids); else delete_user_meta($uid, 'arsp_acc');
    }
    wp_safe_redirect(add_query_arg('arsp_acc', '1', admin_url('admin.php?page=arsp')) . '#arsp-pristupy'); exit;
});
