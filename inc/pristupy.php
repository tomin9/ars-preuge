<?php
/**
 * Prístupy (fáza 1): kto čo vidí a čo smie meniť – podľa oblastí.
 *
 * Skupiny (WordPress → Ars Preuge → Prístupy, len administrátor) majú pri každej oblasti úroveň
 * 0 = bez prístupu · 1 = len čítať · 2 = upravovať. Používateľovi sa pridelí jedna alebo viac skupín,
 * práva sa sčítajú (platí vyššia úroveň). Kto nemá žiadnu skupinu, má plný prístup ako doteraz;
 * administrátori majú plný prístup vždy. Obmedzuje server: /sync nepošle zakázané kolekcie, /doc odmietne zápis.
 * Osobná výnimka = skupina pre jedného človeka.
 *
 * Fáza 2 – rozsah: skupina môže byť obmedzená na vybrané projekty a/alebo podujatia. Potom človek vidí len záznamy,
 * ktoré do rozsahu patria (podujatia projektu, granty, úlohy, platby, program, spolupráce…); z prepojených záznamov
 * mimo rozsahu sa posielajú len „menovky“ (id + názov), aby mená v zoznamoch neboli prázdne. Prvé načítanie je úplné;
 * ak sa niečo dostane do rozsahu len cudzou zmenou prepojenia, obmedzenému sa ukáže po obnovení stránky.
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

/** Rozsah používateľa: null = celý priestor, inak array('projects'=>ids, 'events'=>ids) – zjednotenie skupín.
 *  Skupina bez vybraných projektov a podujatí znamená celý priestor (rozsah sa potom neobmedzuje). */
function arsp_acc_scope($uid = 0) {
    $uid = $uid ? (int) $uid : get_current_user_id();
    if (arsp_acc_user($uid) === null) return null;
    $gids = get_user_meta($uid, 'arsp_acc', true);
    $groups = arsp_acc_groups();
    $P = array(); $E = array();
    foreach ((array) $gids as $gid) {
        if (empty($groups[$gid])) continue;
        $sc = isset($groups[$gid]['scope']) ? (array) $groups[$gid]['scope'] : array();
        $sp = isset($sc['projects']) ? (array) $sc['projects'] : array();
        $se = isset($sc['events']) ? (array) $sc['events'] : array();
        if (!$sp && !$se) return null;   /* aspoň jedna skupina bez rozsahu → celý priestor */
        foreach ($sp as $x) $P[$x] = true;
        foreach ($se as $x) $E[$x] = true;
    }
    return array('projects' => array_keys($P), 'events' => array_keys($E));
}

/** Všetky nezmazané záznamy ako kolekcia → id → pole (na výpočet rozsahu). */
function arsp_acc_all_docs() {
    global $wpdb; $t = arsp_table();
    $by = array();
    foreach ($wpdb->get_results("SELECT col,id,data FROM $t WHERE deleted=0", ARRAY_A) as $r) {
        $d = json_decode($r['data'], true);
        $by[$r['col']][$r['id']] = is_array($d) ? $d : array();
    }
    return $by;
}

/** Množiny záznamov v rozsahu (P projekty, E podujatia, G granty, L položky, nox = je v rozsahu podujatie NOX). */
function arsp_acc_sets($by, $scope) {
    $g = function ($c) use ($by) { return isset($by[$c]) ? $by[$c] : array(); };
    $P = array_fill_keys($scope['projects'], true);
    $E = array_fill_keys($scope['events'], true);
    foreach ($g('events') as $id => $d) if (!empty($d['projectId']) && isset($P[$d['projectId']])) $E[$id] = true;
    $G = array(); $nox = false;
    foreach ($g('events') as $id => $d) if (isset($E[$id])) {
        foreach ((array) (isset($d['grantIds']) ? $d['grantIds'] : array()) as $x) if ($x) $G[$x] = true;
        if (stripos((string) (isset($d['name']) ? $d['name'] : ''), 'nox') !== false) $nox = true;
    }
    foreach ($g('grants') as $id => $d) if (!empty($d['projectId']) && isset($P[$d['projectId']])) $G[$id] = true;
    $L = array();
    foreach ($g('budgetLines') as $id => $d) if (!empty($d['grantId']) && isset($G[$d['grantId']])) $L[$id] = true;
    return array('P' => $P, 'E' => $E, 'G' => $G, 'L' => $L, 'nox' => $nox, 'by' => $by);
}

/** Patrí záznam do rozsahu? (podľa prepojení; nový záznam sa posudzuje podľa posielaných polí) */
function arsp_acc_doc_in_scope($col, $id, $d, $S) {
    $has = function ($set, $k) use ($d) { return !empty($d[$k]) && isset($set[$d[$k]]); };
    switch ($col) {
        case 'projects': return isset($S['P'][$id]);
        case 'events': return isset($S['E'][$id]) || $has($S['P'], 'projectId');
        case 'grants': return isset($S['G'][$id]) || $has($S['P'], 'projectId');
        case 'budgetLines': return $has($S['G'], 'grantId');
        case 'tasks': return $has($S['P'], 'projectId') || $has($S['E'], 'eventId') || $has($S['G'], 'grantId');
        case 'transactions': return $has($S['P'], 'projectId') || $has($S['E'], 'eventId') || $has($S['G'], 'grantId') || $has($S['G'], 'cofinGrantId') || $has($S['L'], 'lineId');
        case 'partnerships': case 'programItems': return $has($S['E'], 'eventId');
        case 'zabezpecenie': case 'zabdodavky': return $S['nox'];
        case 'contacts': return isset($S['C'][$id]);
        case 'comments':
            $p = explode(':', (string) (isset($d['parent']) ? $d['parent'] : ''), 2);
            if (count($p) < 2) return false;
            $pid = strtok($p[1], '~'); $pc = $p[0];
            $pd = isset($S['by'][$pc][$pid]) ? $S['by'][$pc][$pid] : null;
            return $pd !== null && $pc !== 'comments' && arsp_acc_doc_in_scope($pc, $pid, $pd, $S);
        case 'settings': return true;
    }
    return false;
}

/** Kontakty v rozsahu: na ktoré sa odkazujú záznamy rozsahu + ich organizácie + kontakty prepojené na projekt/podujatie. */
function arsp_acc_contacts($S) {
    $C = array();
    $by = $S['by'];
    $ref = function ($col, $keys) use ($by, $S, &$C) {
        foreach ((isset($by[$col]) ? $by[$col] : array()) as $id => $d) {
            if (!arsp_acc_doc_in_scope($col, $id, $d, $S)) continue;
            foreach ($keys as $k) if (!empty($d[$k])) $C[$d[$k]] = true;
        }
    };
    $ref('transactions', array('contactId'));
    $ref('partnerships', array('contactId'));
    $ref('programItems', array('contactId', 'prepId'));
    $ref('grants', array('providerId'));
    foreach ((isset($by['contacts']) ? $by['contacts'] : array()) as $id => $d) {
        foreach ((array) (isset($d['projectIds']) ? $d['projectIds'] : array()) as $x) if (isset($S['P'][$x])) $C[$id] = true;
        foreach ((array) (isset($d['eventIds']) ? $d['eventIds'] : array()) as $x) if (isset($S['E'][$x])) $C[$id] = true;
    }
    foreach (array_keys($C) as $id) {   /* organizácie ľudí v rozsahu */
        $d = isset($by['contacts'][$id]) ? $by['contacts'][$id] : array();
        foreach ((array) (isset($d['orgIds']) ? $d['orgIds'] : array()) as $o) $C[$o] = true;
    }
    return $C;
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
function arsp_acc_check_write($col, $op, $data, $curDoc, $acc, $id = '') {
    if ($acc === null) return true;
    $deny = function () { return new WP_Error('forbidden', 'Na túto úpravu nemáte právo. Požiadajte správcu o rozšírenie prístupu.', array('status' => 403)); };
    if ($col === 'settings') return arsp_acc_level('nastavenia', $acc) >= 2 ? true : $deny();
    $area = arsp_acc_doc_area($col, $curDoc !== null ? $curDoc : $data);
    if ($col === 'comments' && !$area && is_array($data)) $area = arsp_acc_doc_area($col, $data);
    if (!$area || arsp_acc_level($area, $acc) < 2) return $deny();
    $scope = arsp_acc_scope();
    if ($scope !== null) {   /* rozsah: upravovaný aj nový záznam musí patriť do rozsahu */
        $S = arsp_acc_sets(arsp_acc_all_docs(), $scope);
        if ($col === 'contacts') $S['C'] = arsp_acc_contacts($S);
        $ref = $curDoc !== null ? $curDoc : $data;
        if (!arsp_acc_doc_in_scope($col, (string) $id, is_array($ref) ? $ref : array(), $S)) return $deny();
    }
    return true;
}

/* menovky: odkazy záznamu na projekty / podujatia / kontakty (mimo rozsahu sa pošle len názov) */
function arsp_acc_refs($col, $d, &$refs) {
    $add = function ($c, $v) use (&$refs) { if ($v) $refs[$c][$v] = true; };
    if (isset($d['projectId'])) $add('projects', $d['projectId']);
    if (isset($d['eventId'])) $add('events', $d['eventId']);
    foreach (array('contactId', 'prepId', 'providerId') as $k) if (isset($d[$k])) $add('contacts', $d[$k]);
}
function arsp_acc_stub($col, $d) {
    $v = function ($k) use ($d) { return isset($d[$k]) ? $d[$k] : null; };
    if ($col === 'projects') return array('name' => $v('name'), 'color' => $v('color'));
    if ($col === 'events') return array('name' => $v('name'), 'date' => $v('date'));
    return array('name' => $v('name'), 'ctype' => $v('ctype'));
}

/** Celé filtrovanie /sync: oblasti (fáza 1) + rozsah s menovkami (fáza 2). $full = prvé načítanie (since 0). */
function arsp_acc_sync($docs, $full) {
    $acc = arsp_acc_user();
    if ($acc === null) return $docs;
    $docs = arsp_acc_filter_sync($docs, $acc);
    $scope = arsp_acc_scope();
    if ($scope === null) return $docs;
    $S = arsp_acc_sets(arsp_acc_all_docs(), $scope);
    $S['C'] = arsp_acc_contacts($S);
    $out = array(); $refs = array(); $sentFull = array();
    foreach ($docs as $r) {
        $col = $r['c'];
        if ($col === 'settings' || $r['x']) { $out[] = $r; continue; }   /* zmazané: len id, oblasť už prešla */
        $d = is_object($r['d']) ? (array) $r['d'] : (array) $r['d'];
        if (!arsp_acc_doc_in_scope($col, $r['i'], $d, $S)) continue;
        $out[] = $r; $sentFull[$col . ':' . $r['i']] = true;
        arsp_acc_refs($col, $d, $refs);
    }
    /* menovky k odkazom mimo rozsahu (kontakty mimo oblasti Kontakty tiež – len meno) */
    foreach ($refs as $col => $ids) {
        foreach (array_keys($ids) as $id) {
            if (isset($sentFull[$col . ':' . $id])) continue;
            $d = isset($S['by'][$col][$id]) ? $S['by'][$col][$id] : null;
            if ($d === null) continue;
            $inScope = arsp_acc_doc_in_scope($col, $id, $d, $S) && ($col !== 'contacts' || isset($S['C'][$id]));
            $area = arsp_acc_col_area($col);
            if ($inScope && arsp_acc_level($area, $acc) >= 1) { if ($full) $out[] = array('c' => $col, 'i' => $id, 'u' => 1, 'x' => 0, 'd' => (object) $d); continue; }
            $out[] = array('c' => $col, 'i' => $id, 'u' => 1, 'x' => 0, 'd' => (object) arsp_acc_stub($col, $d));
        }
    }
    return array_values($out);
}

/* ------------------------------------------------------- administrácia */

/** Zoznam na výber rozsahu: id → názov (projekty / podujatia). */
function arsp_acc_pick($col) {
    global $wpdb; $t = arsp_table();
    $o = array();
    foreach ($wpdb->get_results($wpdb->prepare("SELECT id,data FROM $t WHERE col=%s AND deleted=0", $col), ARRAY_A) as $r) {
        $d = json_decode($r['data'], true);
        $o[$r['id']] = (string) (is_array($d) && !empty($d['name']) ? $d['name'] : $r['id']);
    }
    natcasesort($o);
    return $o;
}

function arsp_acc_admin_section() {
    if (!current_user_can('manage_options')) return;
    $areas = arsp_acc_areas();
    $groups = arsp_acc_groups();
    $projs = arsp_acc_pick('projects'); $evs = arsp_acc_pick('events');
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
    $multi = function ($name, $all, $cur) {
        $h = '<select name="' . esc_attr($name) . '[]" multiple size="4" style="min-width:220px">';
        foreach ($all as $id => $nm) $h .= '<option value="' . esc_attr($id) . '"' . (in_array($id, $cur, true) ? ' selected' : '') . '>' . esc_html($nm) . '</option>';
        return $h . '</select>';
    };
    $scopeRow = function ($pfx, $g) use ($multi, $projs, $evs, $areas) {
        $sc = isset($g['scope']) ? (array) $g['scope'] : array();
        $sp = isset($sc['projects']) ? (array) $sc['projects'] : array(); $se = isset($sc['events']) ? (array) $sc['events'] : array();
        return '<tr><td colspan="' . (count($areas) + 2) . '" style="padding:6px 10px 14px;border-bottom:2px solid #c3c4c7"><b>Rozsah:</b> nič nevybrané = celý priestor; inak len vybrané projekty a podujatia (a všetko, čo do nich patrí).'
            . '<div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:6px"><label>Projekty<br>' . $multi($pfx . '[sp]', $projs, $sp) . '</label><label>Podujatia<br>' . $multi($pfx . '[se]', $evs, $se) . '</label></div>'
            . '<p class="description">Výber zrušíte kliknutím so stlačeným Ctrl (na Macu Cmd). Mená prepojených záznamov mimo rozsahu vidno (len názov), ich obsah nie.</p></td></tr>';
    };
    echo '<h3>Skupiny</h3><table class="widefat" style="max-width:1200px"><thead><tr><th>Skupina</th>';
    foreach ($areas as $x) echo '<th>' . esc_html($x['label']) . '</th>';
    echo '<th>Zmazať</th></tr></thead><tbody>';
    foreach ($groups as $gid => $g) {
        echo '<tr><td><input type="text" name="g[' . esc_attr($gid) . '][name]" value="' . esc_attr($g['name']) . '" required></td>';
        foreach ($areas as $a => $x) echo '<td>' . $sel('g[' . esc_attr($gid) . '][areas][' . $a . ']', isset($g['areas'][$a]) ? $g['areas'][$a] : 0) . '</td>';
        echo '<td style="text-align:center"><input type="checkbox" name="g[' . esc_attr($gid) . '][del]" value="1" aria-label="Zmazať skupinu"></td></tr>';
        echo $scopeRow('g[' . esc_attr($gid) . ']', $g);
    }
    echo '<tr><td><input type="text" name="new_name" placeholder="+ nová skupina (napr. Dobrovoľníci NOX)"></td>';
    foreach ($areas as $a => $x) echo '<td>' . $sel('new_areas[' . $a . ']', 0) . '</td>';
    echo '<td></td></tr>' . $scopeRow('new_scope', array()) . '</tbody></table>';
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
        $sc = $acc === null ? null : arsp_acc_scope($u->ID);
        $scTxt = $sc === null ? '' :  ' · rozsah: ' . count($sc['projects']) . ' projektov + ' . count($sc['events']) . ' podujatí';
        echo '</td><td>' . ($acc === null ? 'plný prístup' : esc_html(implode(' · ', array_map(function ($a, $l) use ($areas) { return $areas[$a]['label'] . ': ' . ($l === 2 ? 'upravovať' : ($l === 1 ? 'čítať' : '–')); }, array_keys($acc), $acc))) . esc_html($scTxt)) . '</td></tr>';
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
        $ids = function ($v) { $o = array(); foreach ((array) $v as $x) { $x = (string) $x; if (arsp_valid_id($x)) $o[] = $x; } return $o; };
        $sp = $ids(isset($g['sp']) ? $g['sp'] : array()); $se = $ids(isset($g['se']) ? $g['se'] : array());
        $groups[$gid] = array('name' => $name, 'areas' => $as) + ($sp || $se ? array('scope' => array('projects' => $sp, 'events' => $se)) : array());
    }
    $newName = sanitize_text_field(isset($_POST['new_name']) ? wp_unslash($_POST['new_name']) : '');
    if ($newName !== '') {
        $as = array(); foreach ($areas as $a) $as[$a] = $lvl(isset($_POST['new_areas'][$a]) ? $_POST['new_areas'][$a] : 0);
        $ids = function ($v) { $o = array(); foreach ((array) $v as $x) { $x = (string) wp_unslash($x); if (arsp_valid_id($x)) $o[] = $x; } return $o; };
        $ns = isset($_POST['new_scope']) ? (array) $_POST['new_scope'] : array();
        $sp = $ids(isset($ns['sp']) ? $ns['sp'] : array()); $se = $ids(isset($ns['se']) ? $ns['se'] : array());
        $groups['g' . substr(md5(uniqid('', true)), 0, 10)] = array('name' => $newName, 'areas' => $as) + ($sp || $se ? array('scope' => array('projects' => $sp, 'events' => $se)) : array());
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
