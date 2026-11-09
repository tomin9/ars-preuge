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
        'projekty'   => array('label' => 'Projekty', 'cols' => array('projects')),
        'podujatia'  => array('label' => 'Podujatia', 'cols' => array('events', 'partnerships', 'programItems', 'zabezpecenie', 'zabdodavky')),
        'granty'     => array('label' => 'Granty', 'cols' => array('grants', 'budgetLines')),
        'financie'   => array('label' => 'Financie', 'cols' => array('transactions')),   /* sekcia Financie v menu (denník, zostatky); platby projektov/podujatí/grantov vidno aj bez nej – arsp_acc_tx_visible */
        /* úlohy nie sú oblasť (od 1.100.0): vidieť a upravovať sa dajú podľa toho, ku čomu patria – arsp_acc_task_visible / arsp_acc_task_editable */
        'kontakty'   => array('label' => 'Kontakty', 'cols' => array('contacts')),
        'inventar'   => array('label' => 'Inventár', 'cols' => array()),   /* sekcia Inventár (od 1.102.0) – zatiaľ bez záznamov; kolekcia sa doplní, keď sa ujasní obsah */
        /* nastavenia nie sú oblasť (od 1.99.0) – upravujú sa vo WordPresse len administrátorom; aplikácia si pár vecí ukladá sama, pozri arsp_acc_settings_keys() */
    );
}

function arsp_acc_col_area($col) {
    static $map = null;
    if ($map === null) { $map = array(); foreach (arsp_acc_areas() as $a => $x) foreach ($x['cols'] as $c) $map[$c] = $a; }
    return isset($map[$col]) ? $map[$col] : '';
}

function arsp_acc_groups() {
    $g = get_option('arsp_acc_groups', array()); if (!is_array($g)) return array();
    foreach ($g as $k => $x) {   /* do 1.97: jedna oblasť „Projekty a podujatia“ (dianie) → platí pre obe nové */
        if (isset($x['areas']['dianie'])) {
            if (!isset($x['areas']['projekty'])) $g[$k]['areas']['projekty'] = (int) $x['areas']['dianie'];
            if (!isset($x['areas']['podujatia'])) $g[$k]['areas']['podujatia'] = (int) $x['areas']['dianie'];
            unset($g[$k]['areas']['dianie']);
        }
    }
    return $g;
}

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
    if (!$found) return null;   /* skupina medzitým zmazaná → ako bez skupiny (plný prístup) */
    /* väzby: kto má projekty, vidí aj ich granty a podujatia; kto má granty, vidí aj podujatia (aspoň na čítanie) */
    if ($acc['projekty'] >= 1) { $acc['granty'] = max($acc['granty'], 1); $acc['podujatia'] = max($acc['podujatia'], 1); }
    if ($acc['granty'] >= 1) $acc['podujatia'] = max($acc['podujatia'], 1);
    return $acc;
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
        case 'tasks': return $has($S['P'], 'projectId') || $has($S['E'], 'eventId') || $has($S['G'], 'grantId')
            || (!empty($d['assignee']) && isset(arsp_acc_me_keys()[(string) $d['assignee']]));   /* moje úlohy vidím vždy */
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

/** Ktoré polia spoločných nastavení smie obmedzený človek meniť z aplikácie a s akým právom (stačí jedno z nich). */
function arsp_acc_settings_keys() {
    return array('zbOrder' => array('podujatia'), 'cats' => array('podujatia', 'financie'), 'roleTags' => array('kontakty'));
}

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
/** Hodnoty „Zodpovedný“, ktoré znamenajú prihláseného: jeho účet a jeho kontakty (ručne prepojené alebo s rovnakým e-mailom). */
function arsp_acc_me_keys() {
    static $k = null;
    if ($k !== null) return $k;
    $uid = get_current_user_id(); $k = array('wp_' . $uid => true);
    $u = function_exists('get_userdata') ? get_userdata($uid) : null;
    $em = $u ? strtolower((string) $u->user_email) : '';
    $by = arsp_acc_all_docs();
    foreach ((isset($by['contacts']) ? $by['contacts'] : array()) as $id => $c) {
        $w = isset($c['wpUser']) ? (string) $c['wpUser'] : '';
        if ($w === 'wp_' . $uid || ($w === '' && $em !== '' && strtolower(trim((string) (isset($c['email']) ? $c['email'] : ''))) === $em)) $k['c:' . $id] = true;
    }
    return $k;
}

/** Úloha je viditeľná aj bez práva na oblasť Úlohy, ak patrí k projektu/podujatiu (s právom na Projekty a podujatia)
 *  alebo ku grantu (s právom na Granty), alebo ju má prihlásený na starosti. Rozsah (fáza 2) sa uplatní potom. */
function arsp_acc_task_visible($d, $acc) {
    if (!empty($d['assignee']) && isset(arsp_acc_me_keys()[(string) $d['assignee']])) return true;
    if (!empty($d['projectId']) && arsp_acc_level('projekty', $acc) >= 1) return true;
    if (!empty($d['eventId']) && arsp_acc_level('podujatia', $acc) >= 1) return true;
    if (!empty($d['grantId']) && arsp_acc_level('granty', $acc) >= 1) return true;
    return false;
}

/** Platba je viditeľná aj bez práva na Financie, ak patrí k projektu / podujatiu / grantu, ktorý človek vidí. */
function arsp_acc_tx_visible($d, $acc) {
    if (arsp_acc_level('financie', $acc) >= 1) return true;
    if (!empty($d['projectId']) && arsp_acc_level('projekty', $acc) >= 1) return true;
    if (!empty($d['eventId']) && arsp_acc_level('podujatia', $acc) >= 1) return true;
    if ((!empty($d['grantId']) || !empty($d['cofinGrantId'])) && arsp_acc_level('granty', $acc) >= 1) return true;
    return false;
}

/** Skryť sumy platieb? Len bez práva na Financie a len ak to majú zapnuté všetky skupiny človeka (platí voľnejšie). */
function arsp_acc_hide_amounts($uid = 0) {
    $acc = arsp_acc_user($uid);
    if ($acc === null || arsp_acc_level('financie', $acc) >= 1) return false;
    $uid = $uid ? (int) $uid : get_current_user_id();
    $groups = arsp_acc_groups(); $any = false;
    foreach ((array) get_user_meta($uid, 'arsp_acc', true) as $gid) {
        if (empty($groups[$gid])) continue;
        if (empty($groups[$gid]['hideAmt'])) return false;
        $any = true;
    }
    return $any;
}

/** Úlohu smie upravovať, kto ju má na starosti, alebo kto smie upravovať projekt / podujatie / grant, ku ktorému patrí. */
function arsp_acc_task_editable($d, $acc) {
    if (!empty($d['assignee']) && isset(arsp_acc_me_keys()[(string) $d['assignee']])) return true;
    if (!empty($d['projectId']) && arsp_acc_level('projekty', $acc) >= 2) return true;
    if (!empty($d['eventId']) && arsp_acc_level('podujatia', $acc) >= 2) return true;
    if (!empty($d['grantId']) && arsp_acc_level('granty', $acc) >= 2) return true;
    return false;
}

function arsp_acc_filter_sync($docs, $acc) {
    if ($acc === null) return $docs;
    $out = array();
    $taskVis = null;   /* id úloh viditeľných bez práva na oblasť Úlohy (pre komentáre k nim) */
    $hideAmt = arsp_acc_hide_amounts();
    $tv = function ($tid) use (&$taskVis, $acc) {
        if ($taskVis === null) { $taskVis = array(); $by = arsp_acc_all_docs(); foreach ((isset($by['tasks']) ? $by['tasks'] : array()) as $i => $d) if (arsp_acc_task_visible($d, $acc)) $taskVis[$i] = true; }
        return isset($taskVis[$tid]);
    };
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
        if ($col === 'transactions' && $row['x']) { $out[] = $row; continue; }   /* zmazaná platba – len id, nech zmizne aj u neho */
        if ($col === 'transactions' && !$row['x']) {   /* platby: aj bez Financií, ak patria k viditeľnému; sumy prípadne skryté */
            $d = (array) $row['d'];
            if (!arsp_acc_tx_visible($d, $acc)) continue;
            if ($hideAmt) { $m = clone $row['d']; unset($m->amount); $m->_masked = 1; $row['d'] = $m; }
            $out[] = $row; continue;
        }
        if ($area && arsp_acc_level($area, $acc) >= 1) { $out[] = $row; continue; }
        /* Úlohy a Kalendár vidí každý – ale len úlohy z jeho oblastí, rozsahu alebo priradené jemu */
        if ($col === 'tasks') { if ($row['x'] || arsp_acc_task_visible((array) $row['d'], $acc)) $out[] = $row; continue; }
        if ($col === 'comments') {   /* komentáre k úlohám – ak je úloha viditeľná */
            $p = explode(':', (string) (is_object($row['d']) && isset($row['d']->parent) ? $row['d']->parent : ''), 2);
            if (count($p) === 2 && $p[0] === 'tasks' && $tv(strtok($p[1], '~'))) $out[] = $row;
        }
    }
    return array_values($out);
}

/** Kontrola zápisu /doc. $data = nové dáta (pri set/update), $curDoc = doterajší záznam (alebo null). Vráti true alebo WP_Error. */
function arsp_acc_check_write($col, $op, $data, $curDoc, $acc, $id = '') {
    if ($acc === null) return true;
    $deny = function () { return new WP_Error('forbidden', 'Na túto úpravu nemáte právo. Požiadajte správcu o rozšírenie prístupu.', array('status' => 403)); };
    if ($col === 'settings') {   /* aplikácia ukladá do nastavení len pár vecí pri bežnej práci – povolené podľa oblasti, ku ktorej patria */
        $old = is_array($curDoc) ? $curDoc : array(); $new = is_array($data) ? $data : array();
        foreach (array_unique(array_merge(array_keys($old), array_keys($new))) as $k) {
            $a = isset($old[$k]) ? $old[$k] : null; $b = isset($new[$k]) ? $new[$k] : null;
            if (!array_key_exists($k, $new)) continue;   /* čo aplikácia neposlala (napr. skryté zostatky), ostáva – pozri zlúčenie v /doc */
            if (wp_json_encode($a) === wp_json_encode($b)) continue;
            $need = arsp_acc_settings_keys(); $ok = false;
            foreach (isset($need[$k]) ? $need[$k] : array() as $area) if (arsp_acc_level($area, $acc) >= 2) $ok = true;
            if (!$ok) return $deny();
        }
        return true;
    }
    if ($col === 'tasks') {   /* úloha: stará aj nová podoba musí byť upraviteľná (nedá sa „presunúť“ k cudziemu) */
        if ($curDoc !== null && !arsp_acc_task_editable($curDoc, $acc)) return $deny();
        if ($op !== 'delete' && !arsp_acc_task_editable(array_merge($curDoc !== null ? $curDoc : array(), is_array($data) ? $data : array()), $acc)) return $deny();
    } else {
        $ref0 = $curDoc !== null ? $curDoc : $data;
        $p = ($col === 'comments' && is_array($ref0) && isset($ref0['parent'])) ? explode(':', (string) $ref0['parent'], 2) : array();
        if (count($p) === 2 && $p[0] === 'tasks') {   /* komentár k úlohe: stačí, že úlohu vidí */
            $by = arsp_acc_all_docs(); $tid = strtok($p[1], '~');
            if (!isset($by['tasks'][$tid]) || !arsp_acc_task_visible($by['tasks'][$tid], $acc)) return $deny();
        } else {
            $area = arsp_acc_doc_area($col, $ref0);
            if ($col === 'comments' && !$area && is_array($data)) $area = arsp_acc_doc_area($col, $data);
            if (!$area || arsp_acc_level($area, $acc) < 2) return $deny();
        }
    }
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
    if ($col === 'projects') return array('name' => $v('name'), 'color' => $v('color'), '_stub' => 1);
    if ($col === 'events') return array('name' => $v('name'), 'date' => $v('date'), '_stub' => 1);
    return array('name' => $v('name'), 'ctype' => $v('ctype'), '_stub' => 1);
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

/* Fáza 3 – súbory a fotky: obmedzený človek dostane nahraný súbor alebo album, len ak patrí k záznamu, ktorý smie vidieť. */
function arsp_acc_can_see_ref($needle, $cols = null) {
    $acc = arsp_acc_user();
    if ($acc === null) return true;
    global $wpdb; $t = arsp_table();
    $like = '%' . $wpdb->esc_like($needle) . '%';
    $rows = $cols
        ? $wpdb->get_results($wpdb->prepare("SELECT col,id,data FROM $t WHERE deleted=0 AND col IN ('" . implode("','", array_map('esc_sql', $cols)) . "') AND data LIKE %s", $like), ARRAY_A)
        : $wpdb->get_results($wpdb->prepare("SELECT col,id,data FROM $t WHERE deleted=0 AND data LIKE %s", $like), ARRAY_A);
    if (!$rows) return false;
    $scope = arsp_acc_scope();
    $S = null;
    foreach ($rows as $r) {
        $d = json_decode($r['data'], true); if (!is_array($d)) $d = array();
        $area = arsp_acc_doc_area($r['col'], $d);
        if ($r['col'] === 'settings' || !$area || arsp_acc_level($area, $acc) < 1) continue;
        if ($scope === null) return true;
        if ($S === null) { $S = arsp_acc_sets(arsp_acc_all_docs(), $scope); $S['C'] = arsp_acc_contacts($S); }
        if (arsp_acc_doc_in_scope($r['col'], $r['id'], $d, $S)) return true;
    }
    return false;
}

/** Album Google Fotiek: patrí k podujatiu, ktoré človek smie vidieť? (porovnáva sa photosUrl a albums[].url) */
function arsp_acc_can_see_album($url) {
    $acc = arsp_acc_user();
    if ($acc === null) return true;
    if (arsp_acc_level('podujatia', $acc) < 1) return false;
    $by = arsp_acc_all_docs();
    $scope = arsp_acc_scope();
    $S = $scope === null ? null : arsp_acc_sets($by, $scope);
    foreach ((isset($by['events']) ? $by['events'] : array()) as $id => $d) {
        $urls = array(isset($d['photosUrl']) ? (string) $d['photosUrl'] : '');
        foreach ((array) (isset($d['albums']) ? $d['albums'] : array()) as $a) if (is_array($a) && !empty($a['url'])) $urls[] = (string) $a['url'];
        if (!in_array($url, $urls, true)) continue;
        if ($S === null || arsp_acc_doc_in_scope('events', $id, $d, $S)) return true;
    }
    return false;
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
    $gnames = array(); foreach ($groups as $gid => $g) $gnames[$gid] = $g['name'];
    if (isset($_GET['arsp_acc'])) echo '<div class="notice notice-success is-dismissible"><p>Prístupy sú uložené.</p></div>';
    echo '<div class="arsp-card arsp-note"><p><b>Ako to funguje:</b> kto nemá pridelenú žiadnu skupinu (a každý administrátor), vidí a môže upravovať všetko ako doteraz. '
        . 'Obmedzenia platia len pre ľudí so skupinou – server im nepošle dáta oblastí bez prístupu a zápis bez práva „Upravovať“ odmietne. '
        . 'Osobná výnimka = skupina pre jedného človeka. Viac skupín sa sčíta (platí vyššie právo).</p></div>';
    echo '<form method="post" id="arsp-acc-form" action="' . esc_url(admin_url('admin-post.php')) . '">';
    wp_nonce_field('arsp_acc_save');
    echo '<input type="hidden" name="action" value="arsp_acc_save">';
    /* oblasť ako štítok s ikonou: kliknutím sa prepína Bez prístupu → Len čítať → Upravovať (skript v inc/admin.php) */
    $LV = array(0 => array('hidden', 'bez prístupu'), 1 => array('visibility', 'len čítať'), 2 => array('edit', 'upravovať'));
    $tg = function ($name, $label, $v) use ($LV) {
        $v = (int) $v;
        return '<button type="button" class="arsp-tg arsp-tg-' . $v . '" title="' . esc_attr($label . ': ' . $LV[$v][1] . ' – kliknutím zmeníte') . '" data-label="' . esc_attr($label) . '">'
            . '<input type="hidden" name="' . esc_attr($name) . '" value="' . $v . '">' . esc_html($label) . '<span class="dashicons dashicons-' . $LV[$v][0] . '"></span></button>';
    };
    /* výber so štítkami: píšete a ponuka sa filtruje (skript v inc/admin.php) */
    $pick = function ($name, $src, $all, $cur, $ph) {
        $h = '<div class="arsp-pick" data-name="' . esc_attr($name) . '" data-src="' . esc_attr($src) . '">';
        foreach ($cur as $id) if (isset($all[$id])) $h .= '<span class="arsp-chip"><input type="hidden" name="' . esc_attr($name) . '" value="' . esc_attr($id) . '">' . esc_html($all[$id]) . '<button type="button" class="arsp-x" aria-label="Odobrať">×</button></span>';
        return $h . '<input type="text" class="arsp-pin" placeholder="' . esc_attr($ph) . '" autocomplete="off"><div class="arsp-drop" hidden></div></div>';
    };
    $row = function ($pfx, $g, $isNew) use ($tg, $pick, $areas, $projs, $evs) {
        $sc = isset($g['scope']) ? (array) $g['scope'] : array();
        $sp = isset($sc['projects']) ? (array) $sc['projects'] : array(); $se = isset($sc['events']) ? (array) $sc['events'] : array();
        $sname = $isNew ? 'new_scope' : $pfx;
        $h = ($isNew ? '<button type="button" class="arsp-newbtn" onclick="var n=this.nextElementSibling;n.hidden=false;this.hidden=true;n.querySelector(\'.arsp-gname\').focus();">+ Nová skupina</button>' : '')
            . '<div class="arsp-grp' . ($isNew ? ' arsp-new' : '') . '"' . ($isNew ? ' hidden' : '') . '><div class="arsp-gline">';
        $h .= $isNew ? '<input type="text" name="new_name" class="arsp-gname" placeholder="Názov skupiny">'
                     : '<input type="text" name="' . $pfx . '[name]" class="arsp-gname" value="' . esc_attr($g['name']) . '" required>';
        $h .= '<div class="arsp-tgs">';
        foreach ($areas as $a => $x) $h .= $tg($isNew ? 'new_areas[' . $a . ']' : $pfx . '[areas][' . $a . ']', $x['label'], isset($g['areas'][$a]) ? $g['areas'][$a] : 0);
        $h .= '<label class="arsp-tg arsp-amt' . (!empty($g['hideAmt']) ? ' on' : '') . '" title="Sumy platieb sa nepošlú a v aplikácii budú rozmazané (neplatí pre toho, kto má Financie)"><input type="checkbox" name="' . ($isNew ? 'new_hideAmt' : $pfx . '[hideAmt]') . '" value="1"' . (!empty($g['hideAmt']) ? ' checked' : '') . ' onchange="this.parentNode.classList.toggle(\'on\',this.checked)">skryť sumy<span class="dashicons dashicons-money-alt"></span></label>';
        $h .= '</div>' . ($isNew ? '<span class="arsp-trash-sp"></span>' : '<button type="button" class="arsp-trash" data-del="' . esc_attr($pfx . '[del]') . '" data-nm="' . esc_attr($g['name']) . '" title="Zmazať skupinu" aria-label="Zmazať skupinu"><span class="dashicons dashicons-trash"></span></button>') . '</div>';
        $h .= '<div class="arsp-sline"><span class="arsp-slab" title="' . esc_attr($sp || $se ? 'Len vybrané projekty a podujatia a všetko, čo do nich patrí.' : 'Nič nevybrané = celý priestor.') . '">Rozsah</span>'
            . $pick($sname . '[sp][]', 'projects', $projs, $sp, $sp ? 'Pridať projekt…' : 'Všetky projekty – pridať…')
            . $pick($sname . '[se][]', 'events', $evs, $se, $se ? 'Pridať podujatie…' : 'Všetky podujatia – pridať…') . '</div></div>';
        return $h;
    };
    echo '<h2 class="arsp-h2">Skupiny</h2><p class="arsp-legend">Kliknutím na oblasť meníte právo: <span class="arsp-tg arsp-tg-0">bez prístupu<span class="dashicons dashicons-hidden"></span></span> <span class="arsp-tg arsp-tg-1">len čítať<span class="dashicons dashicons-visibility"></span></span> <span class="arsp-tg arsp-tg-2">upravovať<span class="dashicons dashicons-edit"></span></span>. Kto má <b>Projekty</b>, vidí aj Granty a Podujatia; kto má <b>Granty</b>, vidí aj Podujatia (aspoň na čítanie). Rozsah: prázdne = celý priestor.</p><div class="arsp-card arsp-flush">';
    foreach ($groups as $gid => $g) echo $row('g[' . esc_attr($gid) . ']', $g, false);
    echo $row('', array(), true);
    echo '</div>';
    echo '<h2 class="arsp-h2">Ľudia</h2><div class="arsp-card arsp-flush">';
    if (!$groups) echo '<p class="description" style="padding:14px 18px 0">Najprv vytvorte skupinu, potom ju tu pridelíte ľuďom.</p>';
    echo '<table class="arsp-pt"><thead><tr><th>Používateľ</th><th>Skupiny</th><th>Výsledok</th></tr></thead><tbody>';
    $lvlTxt = array(0 => '–', 1 => 'čítať', 2 => 'upravovať');
    foreach (get_users(array('capability' => ARSP_CAP, 'orderby' => 'display_name', 'number' => 300)) as $u) {
        $mine = get_user_meta($u->ID, 'arsp_acc', true); if (!is_array($mine)) $mine = array();
        echo '<tr><td><div class="arsp-who">' . get_avatar($u->ID, 32) . '<div><b>' . esc_html($u->display_name) . '</b><span>' . esc_html($u->user_email) . '</span></div></div></td><td>';
        if (user_can($u, 'manage_options')) { echo '<span class="arsp-pill">administrátor</span><div class="arsp-hint">Na obmedzenie zmeňte rolu na „Tím Ars Preuge“.</div></td><td><span class="arsp-pill arsp-full">plný prístup</span></td></tr>'; continue; }
        echo '<input type="hidden" name="u[' . (int) $u->ID . '][x]" value="1">' . $pick('u[' . (int) $u->ID . '][g][]', 'groups', $gnames, $mine, '+ pridať skupinu');
        $acc = arsp_acc_user($u->ID);
        echo '</td><td>';
        if ($acc === null) echo '<span class="arsp-pill arsp-full">plný prístup</span>';
        else {
            foreach ($acc as $a => $l) echo '<span class="arsp-pill arsp-l' . (int) $l . '">' . esc_html($areas[$a]['label']) . ': ' . $lvlTxt[(int) $l] . '</span>';
            $sc = arsp_acc_scope($u->ID);
            if (arsp_acc_hide_amounts($u->ID)) echo '<span class="arsp-pill arsp-scp">sumy platieb skryté</span>';
            if ($sc !== null) echo '<span class="arsp-pill arsp-scp">rozsah: ' . count($sc['projects']) . ' projektov, ' . count($sc['events']) . ' podujatí</span>';
        }
        echo '</td></tr>';
    }
    echo '</tbody></table></div><p class="arsp-save"><button class="button button-primary button-large">Uložiť prístupy</button></p></form>';
    echo '<script>window.ARSP_OPTS=' . wp_json_encode(array('projects' => (object) $projs, 'events' => (object) $evs, 'groups' => (object) $gnames), JSON_UNESCAPED_UNICODE) . ';</script>';
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
        $groups[$gid] = array('name' => $name, 'areas' => $as) + ($sp || $se ? array('scope' => array('projects' => $sp, 'events' => $se)) : array()) + (!empty($g['hideAmt']) ? array('hideAmt' => 1) : array());
    }
    $newName = sanitize_text_field(isset($_POST['new_name']) ? wp_unslash($_POST['new_name']) : '');
    if ($newName !== '') {
        $as = array(); foreach ($areas as $a) $as[$a] = $lvl(isset($_POST['new_areas'][$a]) ? $_POST['new_areas'][$a] : 0);
        $ids = function ($v) { $o = array(); foreach ((array) $v as $x) { $x = (string) wp_unslash($x); if (arsp_valid_id($x)) $o[] = $x; } return $o; };
        $ns = isset($_POST['new_scope']) ? (array) $_POST['new_scope'] : array();
        $sp = $ids(isset($ns['sp']) ? $ns['sp'] : array()); $se = $ids(isset($ns['se']) ? $ns['se'] : array());
        $groups['g' . substr(md5(uniqid('', true)), 0, 10)] = array('name' => $newName, 'areas' => $as) + ($sp || $se ? array('scope' => array('projects' => $sp, 'events' => $se)) : array()) + (!empty($_POST['new_hideAmt']) ? array('hideAmt' => 1) : array());
    }
    update_option('arsp_acc_groups', $groups, false);
    foreach ((array) (isset($_POST['u']) ? $_POST['u'] : array()) as $uid => $row) {
        $uid = (int) $uid;
        if (!$uid || user_can($uid, 'manage_options') || !user_can($uid, ARSP_CAP)) continue;
        $gids = array_values(array_intersect(array_map('sanitize_key', (array) (isset($row['g']) ? $row['g'] : array())), array_keys($groups)));
        if ($gids) update_user_meta($uid, 'arsp_acc', $gids); else delete_user_meta($uid, 'arsp_acc');
    }
    wp_safe_redirect(add_query_arg('arsp_acc', '1', admin_url('admin.php?page=arsp-pristupy'))); exit;
});
