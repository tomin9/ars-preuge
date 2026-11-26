<?php
/**
 * Ars Preuge – pripojenie pre AI agenta (napr. Hermes) cez MCP (Model Context Protocol, prenos „Streamable HTTP“, odpovede JSON).
 * Adresa: /wp-json/arsp/v1/mcp. Agent sa prihlasuje kľúčom v hlavičke X-Arsp-Token (alebo Authorization: Bearer …), ktorý administrátor
 * vytvorí vo WordPresse (Ars Preuge → AI) a priradí ho účtu agenta. Od 2.1.10 sa dá prihlásiť aj cez OAuth (ChatGPT, Claude – inc/oauth.php):
 * človek z tímu sa prihlási svojím účtom a aplikácia vidí to, čo on („osobné“ pripojenie: navyše „moje úlohy“).
 * Agent vidí to isté, čo ten účet (prístupy z inc/pristupy.php platia),
 * nič nemaže ani neprepisuje – jediný zápis je „pridaj_ulohu“. Jednotlivé platby neposiela (len súčty rozpočtu); z kontaktov (od 2.1.8, nástroj „kontakty“)
 * len meno, typ, roly, organizácie s funkciou, e-mail a telefón – nikdy rodné číslo, OP, IBAN, adresu, IČO/DIČ ani poznámky.
 */
if (!defined('ABSPATH')) exit;

/* ------------------------------------------------------------------ prihlásenie */

function arsp_mcp_hash($t) { return hash_hmac('sha256', (string) $t, wp_salt('auth')); }

/** token z hlavičky Authorization: Bearer … (aj keď ju hosting odovzdá PHP inou cestou) */
function arsp_mcp_bearer($r) {
    $h = (string) $r->get_header('authorization');
    if ($h === '' && function_exists('arsp_oauth_auth_header')) $h = arsp_oauth_auth_header();
    return preg_match('/^\s*Bearer\s+(\S+)/i', $h, $m) ? $m[1] : '';
}
/** pripojenie za konkrétneho človeka (OAuth), nie spoločný účet agenta */
function arsp_mcp_personal() { return !empty($GLOBALS['arsp_mcp_personal']); }

function arsp_mcp_auth(WP_REST_Request $r) {
    $GLOBALS['arsp_mcp_personal'] = false;
    $bearer = arsp_mcp_bearer($r);
    $t = trim((string) $r->get_header('x-arsp-token'));
    if ($t === '') $t = $bearer;
    $hash = (string) get_option('arsp_mcp_hash', ''); $uid = (int) get_option('arsp_mcp_user', 0);
    if ($t !== '' && $hash !== '' && $uid && hash_equals($hash, arsp_mcp_hash($t))) {
        wp_set_current_user($uid);
        if (!current_user_can(ARSP_CAP)) return new WP_Error('forbidden', 'Účet AI agenta nemá prístup do pracovného priestoru.', array('status' => 403));
        return true;
    }
    /* od 2.1.10: človek z tímu prihlásený cez OAuth (ChatGPT, Claude) – token overí inc/oauth.php */
    $u = ($bearer !== '' && function_exists('arsp_oauth_check')) ? arsp_oauth_check($bearer) : 0;
    if ($u) { wp_set_current_user($u); $GLOBALS['arsp_mcp_personal'] = true; return true; }
    return new WP_Error('unauthorized', 'Chýba prihlásenie alebo vypršalo. AI agent potrebuje kľúč (WordPress → Ars Preuge → AI), ChatGPT a Claude sa prihlasujú účtom vo WordPresse.', array('status' => 401));
}

/* ------------------------------------------------------------------ dáta (len to, čo účet agenta smie vidieť) */

function arsp_mcp_data() {
    static $D = null;
    if ($D !== null) return $D;
    global $wpdb; $t = arsp_table();
    $rows = array();
    foreach ($wpdb->get_results("SELECT col,id,data,updated FROM $t WHERE deleted=0", ARRAY_A) as $r) {
        $rows[] = array('c' => $r['col'], 'i' => $r['id'], 'u' => (int) $r['updated'], 'x' => 0, 'd' => json_decode($r['data']));
    }
    $rows = function_exists('arsp_acc_sync') ? arsp_acc_sync($rows, true) : $rows;
    $D = array();
    foreach ($rows as $r) {
        if (!empty($r['x']) || $r['d'] === null) continue;
        $d = json_decode(wp_json_encode($r['d']), true);
        if (!is_array($d)) $d = array();
        $d['id'] = (string) $r['i'];
        $D[$r['c']][(string) $r['i']] = $d;
    }
    return $D;
}
/** záznamy kolekcie bez menoviek (_stub = záznam mimo rozsahu, len kvôli menu) */
function arsp_mcp_list($col) {
    $D = arsp_mcp_data(); $out = array();
    foreach ((isset($D[$col]) ? $D[$col] : array()) as $d) if (empty($d['_stub'])) $out[] = $d;
    return $out;
}
function arsp_mcp_get($col, $id) { $D = arsp_mcp_data(); return ($id !== '' && $id !== null && isset($D[$col][(string) $id])) ? $D[$col][(string) $id] : null; }
function arsp_mcp_name($col, $id) {
    $d = arsp_mcp_get($col, $id); if (!$d) return '';
    foreach (array('name', 'title', 'nazov') as $k) if (!empty($d[$k])) return (string) $d[$k];
    return '';
}
function arsp_mcp_norm($s) { $s = remove_accents((string) $s); return trim(preg_replace('/\s+/', ' ', function_exists('mb_strtolower') ? mb_strtolower($s) : strtolower($s))); }
function arsp_mcp_today() { return wp_date('Y-m-d'); }
function arsp_mcp_plus($days) { return wp_date('Y-m-d', time() + (int) $days * DAY_IN_SECONDS); }
function arsp_mcp_isdate($v) { return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v); }
function arsp_mcp_cut($s, $n) { $s = trim((string) $s); return (function_exists('mb_strlen') && mb_strlen($s) > $n) ? mb_substr($s, 0, $n) . '…' : $s; }
function arsp_mcp_lbl($map, $k) { return isset($map[$k]) ? $map[$k] : (string) $k; }

/* názvy stavov – rovnaké ako v aplikácii (OPT v app/js/00-nastavenia.js) */
function arsp_mcp_labels() {
    return array(
        'task'  => array('inbox' => 'Inbox', 'tyzden' => 'Tento týždeň', 'rozpracovane' => 'Rozpracované', 'hotove' => 'Hotové'),
        'prio'  => array('urgentne' => 'Urgentné', 'normalne' => 'Normálne', 'nizka' => 'Nízka'),
        'event' => array('napad' => 'Nápad', 'priprava' => 'V príprave', 'prebieha' => 'Prebieha', 'zrealizovane' => 'Zrealizované', 'zrusene' => 'Zrušené'),
        'grant' => array('napad' => 'Nápad', 'priprava' => 'Píšeme žiadosť', 'podane' => 'Podané', 'schvalene' => 'Schválené', 'zrealizovane' => 'Zrealizované', 'vyuctovane' => 'Vyúčtované', 'nepodporene' => 'Nepodporené', 'pozastavene' => 'Pozastavené'),
        'proj'  => array('napad' => 'Nápad', 'priprava' => 'V príprave', 'prebieha' => 'Prebieha', 'dokoncene' => 'Dokončené', 'pozastavene' => 'Pozastavené'),
        'dielo' => array('nevybavene' => 'Nevybavené', 'riesi' => 'V riešení', 'pripravene' => 'Pripravené'),
        'mkt'   => array('pripravit' => 'Pripraviť', 'vpriprave' => 'V príprave', 'pripravene' => 'Pripravené', 'publikovane' => 'Publikované'),
        'pk'    => array('nezacate' => 'Zadané', 'rozpracovane' => 'Rozpracované', 'hotove' => 'Hotové'),
        'zab'   => array('navrh' => 'Neriešené', 'rozpracovane' => 'Rozpracované', 'potvrdene' => 'Potvrdené'),
    );
}

/** meno človeka: wp_12 = účet vo WordPresse, c:<id> = kontakt, ~Meno = človek mimo tímu */
function arsp_mcp_person($v) {
    $v = (string) $v; if ($v === '') return '';
    if ($v[0] === '~') return substr($v, 1);
    if (strpos($v, 'c:') === 0) { $n = arsp_mcp_name('contacts', substr($v, 2)); return $n !== '' ? $n : 'Kontakt'; }
    if (preg_match('/^wp_(\d+)$/', $v, $m)) { $u = get_userdata((int) $m[1]); if ($u) { $p = arsp_profile($u); return $p['name']; } }
    return $v;
}

/** nájde záznam podľa id alebo časti názvu; viac zhôd = chyba so zoznamom */
function arsp_mcp_find($col, $q, $what) {
    $q = trim((string) $q);
    if ($q === '') return null;
    $d = arsp_mcp_get($col, $q);
    if ($d && empty($d['_stub'])) return $d;
    $n = arsp_mcp_norm($q); $hit = array(); $exact = array();
    foreach (arsp_mcp_list($col) as $x) {
        $name = arsp_mcp_norm(isset($x['name']) ? $x['name'] : (isset($x['title']) ? $x['title'] : ''));
        if ($name === '') continue;
        if ($name === $n) $exact[] = $x;
        elseif (strpos($name, $n) !== false) $hit[] = $x;
    }
    if (count($exact) === 1) return $exact[0];
    if ($exact) $hit = $exact;
    if (count($hit) === 1) return $hit[0];
    if (!$hit) throw new Exception($what . ' „' . $q . '“ ' . ($what === 'Podujatie' ? 'sa nenašlo' : 'sa nenašiel') . ' (alebo k nemu tento účet nemá prístup).');
    $names = array(); foreach (array_slice($hit, 0, 10) as $x) $names[] = (isset($x['name']) ? $x['name'] : $x['title']) . ' (id ' . $x['id'] . ')';
    throw new Exception('Názvu „' . $q . '“ zodpovedá viac záznamov – upresnite: ' . implode('; ', $names));
}

/* ------------------------------------------------------------------ výstupy záznamov */

function arsp_mcp_clean($a) { return array_filter($a, function ($v) { return !($v === '' || $v === null || $v === array()); }); }
function arsp_mcp_task_done($t) { return isset($t['status']) && $t['status'] === 'hotove'; }

function arsp_mcp_task_out($t) {
    $L = arsp_mcp_labels();
    $sub = isset($t['subtasks']) && is_array($t['subtasks']) ? $t['subtasks'] : array();
    $subOpen = 0; foreach ($sub as $s) if (is_array($s) && empty($s['done'])) $subOpen++;
    return arsp_mcp_clean(array(
        'id' => $t['id'], 'nazov' => isset($t['title']) ? (string) $t['title'] : '',
        'stav' => arsp_mcp_lbl($L['task'], isset($t['status']) ? $t['status'] : 'inbox'),
        'termin' => isset($t['due']) ? (string) $t['due'] : '',
        'kto' => arsp_mcp_person(isset($t['assignee']) ? $t['assignee'] : ''),
        'priorita' => !empty($t['priority']) && $t['priority'] !== 'normalne' ? arsp_mcp_lbl($L['prio'], $t['priority']) : '',
        'projekt' => arsp_mcp_name('projects', isset($t['projectId']) ? $t['projectId'] : ''),
        'podujatie' => arsp_mcp_name('events', isset($t['eventId']) ? $t['eventId'] : ''),
        'grant' => arsp_mcp_name('grants', isset($t['grantId']) ? $t['grantId'] : ''),
        'otvorene_podulohy' => $subOpen ?: '',
        'poznamka' => arsp_mcp_cut(isset($t['note']) ? $t['note'] : '', 400),
    ));
}

function arsp_mcp_event_out($e) {
    $L = arsp_mcp_labels(); $g = array();
    foreach ((array) (isset($e['grantIds']) ? $e['grantIds'] : array()) as $id) { $n = arsp_mcp_name('grants', $id); if ($n !== '') $g[] = $n; }
    $days = '';
    if (!empty($e['date']) && arsp_mcp_isdate($e['date'])) $days = (int) round((strtotime($e['date'] . ' 12:00') - strtotime(arsp_mcp_today() . ' 12:00')) / DAY_IN_SECONDS);
    return arsp_mcp_clean(array(
        'id' => $e['id'], 'nazov' => isset($e['name']) ? (string) $e['name'] : '',
        'stav' => arsp_mcp_lbl($L['event'], isset($e['status']) ? $e['status'] : ''),
        'datum' => isset($e['date']) ? (string) $e['date'] : '', 'datum_do' => !empty($e['dateTo']) && $e['dateTo'] !== (isset($e['date']) ? $e['date'] : '') ? (string) $e['dateTo'] : '',
        'cas' => isset($e['time']) ? (string) $e['time'] : '', 'miesto' => isset($e['place']) ? (string) $e['place'] : '',
        'o_kolko_dni' => $days === '' ? '' : $days,
        'projekt' => arsp_mcp_name('projects', isset($e['projectId']) ? $e['projectId'] : ''),
        'granty' => $g,
    ));
}

function arsp_mcp_grant_provider($g) {
    $n = arsp_mcp_name('contacts', isset($g['providerId']) ? $g['providerId'] : '');
    return $n !== '' ? $n : (isset($g['provider']) ? (string) $g['provider'] : '');
}
function arsp_mcp_grant_out($g) {
    $L = arsp_mcp_labels();
    return arsp_mcp_clean(array(
        'id' => $g['id'], 'nazov' => isset($g['name']) ? (string) $g['name'] : '',
        'poskytovatel' => arsp_mcp_grant_provider($g), 'program' => isset($g['program']) ? (string) $g['program'] : '',
        'stav' => arsp_mcp_lbl($L['grant'], isset($g['status']) ? $g['status'] : ''),
        'ziadana_suma' => isset($g['requested']) && $g['requested'] !== '' ? (float) $g['requested'] : '',
        'schvalena_suma' => isset($g['approved']) && $g['approved'] !== '' ? (float) $g['approved'] : '',
        'podavanie_od' => isset($g['callOpen']) ? (string) $g['callOpen'] : '',
        'uzavierka_ziadosti' => isset($g['submitTo']) ? (string) $g['submitTo'] : '',
        'realizacia_od' => isset($g['realFrom']) ? (string) $g['realFrom'] : '', 'realizacia_do' => isset($g['realTo']) ? (string) $g['realTo'] : '',
        'termin_vyuctovania' => isset($g['settleDue']) ? (string) $g['settleDue'] : '',
        'projekt' => arsp_mcp_name('projects', isset($g['projectId']) ? $g['projectId'] : ''),
    ));
}

/** súčty platieb (bez jednotlivých platieb); pri skrytých sumách „skryté“ */
function arsp_mcp_money($list) {
    $inc = 0; $exp = 0; $paid = 0; $masked = false;
    foreach ($list as $x) {
        if (!empty($x['_masked'])) { $masked = true; continue; }
        $a = (float) (isset($x['amount']) ? $x['amount'] : 0);
        if (isset($x['type']) && $x['type'] === 'prijem') $inc += $a;
        else { $exp += $a; if ((!isset($x['paid']) || $x['paid'] !== false) && !empty($x['date'])) $paid += $a; }
    }
    if ($masked) return array('sumy' => 'skryté (tento účet nemá prístup k sumám)');
    return array('prijmy' => round($inc, 2), 'vydavky' => round($exp, 2), 'z_toho_zaplatene' => round($paid, 2), 'planovane' => round($exp - $paid, 2), 'mena' => 'EUR');
}

/* prvý ročník NOX:art – k nemu patria staré záznamy Zabezpečenia bez eventId (ako zbHome v app/js/sekcie/zabezpecenie.js) */
function arsp_mcp_zb_home() {
    $D = arsp_mcp_data(); $best = null; $bk = '';
    foreach ((isset($D['events']) ? $D['events'] : array()) as $e) {
        if (stripos(isset($e['name']) ? $e['name'] : '', 'nox') === false) continue;
        $y = !empty($e['date']) ? substr($e['date'], 0, 4) : (preg_match('/(19|20)\d\d/', isset($e['name']) ? $e['name'] : '', $m) ? $m[0] : '9999');
        $k = $y . '|' . (isset($e['date']) ? $e['date'] : '') . '|' . str_pad((string) (isset($e['createdAt']) ? $e['createdAt'] : 0), 16, '0', STR_PAD_LEFT);
        if ($best === null || strcmp($k, $bk) < 0) { $best = $e['id']; $bk = $k; }
    }
    return $best;
}

/* kontakty: len meno, typ, roly, organizácie, e-mail a telefón (citlivé polia sa nikdy neposielajú) */
function arsp_mcp_contact_tags() {
    $t = array('dobrovolnik' => 'Dobrovoľník', 'partner' => 'Partner', 'sponzor' => 'Sponzor', 'mediapartner' => 'Mediálny partner',
        'tim' => 'Člen tímu', 'umelec' => 'Umelec', 'dodavatel' => 'Dodávateľ', 'medium' => 'Médium', 'institucia' => 'Inštitúcia', 'firma' => 'Firma', 'externy' => 'Externý');
    $st = arsp_mcp_get('settings', 'main'); $rt = $st && isset($st['roleTags']) && is_array($st['roleTags']) ? $st['roleTags'] : array();
    foreach ($rt as $list) foreach ((array) $list as $x) if (is_array($x) && isset($x[0], $x[1])) $t[(string) $x[0]] = (string) $x[1];   /* vlastné roly z aplikácie */
    return $t;
}
function arsp_mcp_contact_roles($c) {
    $T = arsp_mcp_contact_tags(); $k = isset($c['tags']) && is_array($c['tags']) ? $c['tags'] : array();
    if (!$k && !empty($c['role'])) $k = array($c['role']);
    $out = array(); foreach ($k as $x) $out[] = isset($T[$x]) ? $T[$x] : (string) $x;
    return $out;
}
function arsp_mcp_contact_out($c) {
    $types = array('osoba' => 'Osoba', 'firma' => 'Firma', 'organizacia' => 'Organizácia', 'media' => 'Médiá');
    $orgs = array(); $ids = isset($c['orgIds']) && is_array($c['orgIds']) ? $c['orgIds'] : (!empty($c['orgId']) ? array($c['orgId']) : array());
    foreach ($ids as $oid) { $n = arsp_mcp_name('contacts', $oid); if ($n === '') continue; $fn = isset($c['orgFn'][$oid]) ? trim((string) $c['orgFn'][$oid]) : ''; $orgs[] = $fn !== '' ? $n . ' (' . $fn . ')' : $n; }
    $name = trim(implode(' ', array_filter(array(isset($c['titleBefore']) ? trim($c['titleBefore']) : '', isset($c['name']) ? trim($c['name']) : ''))));
    if (!empty($c['titleAfter'])) $name .= ', ' . trim($c['titleAfter']);
    return arsp_mcp_clean(array(
        'id' => $c['id'], 'meno' => $name, 'typ' => arsp_mcp_lbl($types, isset($c['ctype']) && $c['ctype'] !== '' ? $c['ctype'] : 'osoba'),
        'roly' => arsp_mcp_contact_roles($c), 'organizacie' => $orgs, 'funkcia' => isset($c['position']) ? trim((string) $c['position']) : '',
        'email' => isset($c['email']) ? trim((string) $c['email']) : '', 'telefon' => isset($c['phone']) ? trim((string) $c['phone']) : '',
    ));
}

/* ------------------------------------------------------------------ nástroje */

function arsp_mcp_tools() {
    $str = array('type' => 'string'); $int = array('type' => 'integer');
    $date = array('type' => 'string', 'description' => 'Dátum RRRR-MM-DD');
    $T = array(
        array('name' => 'prehlad', 'description' => 'Prehľad na dnes: úlohy po termíne, úlohy na najbližších 7 dní, podujatia na 30 dní a termíny grantov na 60 dní. Dobrý začiatok pre ranný súhrn.',
            'inputSchema' => array('type' => 'object', 'properties' => (object) array())),
        array('name' => 'terminy', 'description' => 'Všetky termíny v zvolenom období zoradené podľa dátumu: termíny úloh, uzávierky a ďalšie termíny grantov, podujatia, položky marketingu a podklady podujatí.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'dni' => $int + array('description' => 'Koľko dní dopredu (predvolene 30, najviac 365).'),
                'aj_po_termine' => array('type' => 'boolean', 'description' => 'Pridať aj nesplnené úlohy a podklady po termíne.')))),
        array('name' => 'ulohy', 'description' => 'Zoznam úloh tímu s filtrami. Vráti id, názov, stav, termín, kto ju má na starosti a ku ktorému projektu / podujatiu / grantu patrí.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'stav' => array('type' => 'string', 'enum' => array('otvorene', 'hotove', 'vsetky'), 'description' => 'Predvolene otvorené.'),
                'kto' => $str + array('description' => 'Meno alebo časť mena človeka.'),
                'podujatie' => $str + array('description' => 'Id alebo názov podujatia.'),
                'projekt' => $str + array('description' => 'Id alebo názov projektu.'),
                'grant' => $str + array('description' => 'Id alebo názov grantu.'),
                'termin_do' => array('type' => 'string', 'description' => 'Len úlohy s termínom do tohto dňa (RRRR-MM-DD).'),
                'hladaj' => $str + array('description' => 'Text v názve úlohy.'),
                'limit' => $int + array('description' => 'Najviac koľko úloh (predvolene 50).')))),
        array('name' => 'pridaj_ulohu', 'description' => 'Pridá novú úlohu do pracovného priestoru (stav Inbox). Použi len vtedy, keď o to človek výslovne požiada.',
            'inputSchema' => array('type' => 'object', 'required' => array('nazov'), 'properties' => array(
                'nazov' => $str + array('description' => 'Čo treba urobiť – krátko.'),
                'termin' => $date,
                'kto' => $str + array('description' => 'Meno člena tímu, ktorý ju má na starosti (musí mať účet v pracovnom priestore).'),
                'podujatie' => $str + array('description' => 'Id alebo názov podujatia, ku ktorému patrí.'),
                'projekt' => $str + array('description' => 'Id alebo názov projektu.'),
                'grant' => $str + array('description' => 'Id alebo názov grantu.'),
                'priorita' => array('type' => 'string', 'enum' => array('urgentne', 'normalne', 'nizka')),
                'poznamka' => $str))),
        array('name' => 'podujatia', 'description' => 'Zoznam podujatí (budúce, minulé alebo všetky) s dátumom, miestom, stavom, projektom a grantmi.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'obdobie' => array('type' => 'string', 'enum' => array('buduce', 'minule', 'vsetky'), 'description' => 'Predvolene budúce (aj práve prebiehajúce a bez dátumu).'),
                'hladaj' => $str + array('description' => 'Text v názve.'),
                'limit' => $int))),
        array('name' => 'podujatie', 'description' => 'Podrobnosti podujatia: program po dňoch, diela, plán marketingu, podklady, otvorené úlohy, stav zabezpečenia a súčty rozpočtu.',
            'inputSchema' => array('type' => 'object', 'required' => array('podujatie'), 'properties' => array('podujatie' => $str + array('description' => 'Id alebo názov podujatia.')))),
        array('name' => 'granty', 'description' => 'Zoznam grantov s poskytovateľom, stavom, sumami a termínmi (uzávierka, realizácia, vyúčtovanie).',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'stav' => array('type' => 'string', 'enum' => array('aktivne', 'vsetky', 'napad', 'priprava', 'podane', 'schvalene', 'zrealizovane', 'vyuctovane', 'nepodporene', 'pozastavene'), 'description' => 'Predvolene aktívne (všetko okrem vyúčtovaných, nepodporených a pozastavených).'),
                'hladaj' => $str))),
        array('name' => 'grant', 'description' => 'Podrobnosti grantu: údaje výzvy, termíny, rozpočtové položky s čerpaním, časti žiadosti, prepojené podujatia a otvorené úlohy.',
            'inputSchema' => array('type' => 'object', 'required' => array('grant'), 'properties' => array('grant' => $str + array('description' => 'Id alebo názov grantu.')))),
        array('name' => 'kontakty', 'description' => 'Vyhľadá kontakty (ľudí, firmy, organizácie, médiá) a vráti meno, typ, roly, organizácie s funkciou, e-mail a telefón. Iné osobné údaje nevracia. Bez filtra vráti prvých 30 kontaktov podľa abecedy.',
            'inputSchema' => array('type' => 'object', 'properties' => array(
                'hladaj' => $str + array('description' => 'Meno, časť mena, názov organizácie, funkcia, e-mail alebo telefón.'),
                'rola' => $str + array('description' => 'Rola, napr. Dobrovoľník, Partner, Sponzor, Mediálny partner, Umelec.'),
                'typ' => array('type' => 'string', 'enum' => array('osoba', 'firma', 'organizacia', 'media')),
                'podujatie' => $str + array('description' => 'Id alebo názov podujatia – len ľudia a partneri tohto podujatia (Spolupráce).'),
                'limit' => $int + array('description' => 'Najviac koľko kontaktov (predvolene 30, najviac 200).')))),
    );
    /* názvy a označenie, čo len číta (ChatGPT sa pri nástrojoch bez readOnlyHint pýta na potvrdenie) */
    $titles = array('prehlad' => 'Prehľad na dnes', 'terminy' => 'Termíny', 'ulohy' => 'Úlohy', 'pridaj_ulohu' => 'Pridať úlohu', 'podujatia' => 'Podujatia',
        'podujatie' => 'Podrobnosti podujatia', 'granty' => 'Granty', 'grant' => 'Podrobnosti grantu', 'kontakty' => 'Kontakty');
    foreach ($T as $i => $t) {
        $T[$i]['title'] = $titles[$t['name']];
        $w = $t['name'] === 'pridaj_ulohu';
        $T[$i]['annotations'] = array('title' => $titles[$t['name']], 'readOnlyHint' => !$w, 'destructiveHint' => false, 'idempotentHint' => !$w, 'openWorldHint' => false);
        if ($t['name'] === 'ulohy' && arsp_mcp_personal()) $T[$i]['inputSchema']['properties']['moje'] = array('type' => 'boolean', 'description' => 'Len úlohy, ktoré má na starosti prihlásený človek (ten, kto sa pýta).');
    }
    return $T;
}
/** id prihláseného človeka a jeho kontaktu (ako „Moje úlohy“ v aplikácii) */
function arsp_mcp_me() { return function_exists('arsp_acc_me_keys') ? arsp_acc_me_keys() : array('wp_' . get_current_user_id() => true); }
function arsp_mcp_mine($t) { $me = arsp_mcp_me(); return !empty($t['assignee']) && isset($me[(string) $t['assignee']]); }

function arsp_mcp_call($name, $a) {
    $a = is_array($a) ? $a : array();
    $L = arsp_mcp_labels(); $today = arsp_mcp_today();
    switch ($name) {

    case 'prehlad': {
        $week = arsp_mcp_plus(7); $over = array(); $soon = array();
        foreach (arsp_mcp_list('tasks') as $t) {
            if (arsp_mcp_task_done($t) || empty($t['due'])) continue;
            if ($t['due'] < $today) $over[] = $t; elseif ($t['due'] <= $week) $soon[] = $t;
        }
        $byDue = function ($x, $y) { return strcmp($x['due'], $y['due']); };
        usort($over, $byDue); usort($soon, $byDue);
        $ev = array(); $m30 = arsp_mcp_plus(30);
        foreach (arsp_mcp_list('events') as $e) {
            if (empty($e['date']) || (isset($e['status']) && $e['status'] === 'zrusene')) continue;
            $to = !empty($e['dateTo']) ? $e['dateTo'] : $e['date'];
            if ($to >= $today && $e['date'] <= $m30) $ev[] = $e;
        }
        usort($ev, function ($x, $y) { return strcmp($x['date'], $y['date']); });
        $gr = arsp_mcp_call('terminy', array('dni' => 60, 'len' => 'granty'));
        $out = array('dnes' => $today,
            'ulohy_po_termine' => array_map('arsp_mcp_task_out', $over),
            'ulohy_na_7_dni' => array_map('arsp_mcp_task_out', $soon),
            'podujatia_na_30_dni' => array_map('arsp_mcp_event_out', $ev),
            'terminy_grantov_na_60_dni' => $gr['terminy']);
        if (arsp_mcp_personal()) {   /* pripojenie za konkrétneho človeka: kto to je a jeho otvorené úlohy */
            $mine = array(); foreach (arsp_mcp_list('tasks') as $t) if (!arsp_mcp_task_done($t) && arsp_mcp_mine($t)) $mine[] = $t;
            usort($mine, function ($x, $y) { return strcmp(!empty($x['due']) ? $x['due'] : '9999', !empty($y['due']) ? $y['due'] : '9999'); });
            $u = wp_get_current_user(); $p = $u && $u->ID ? arsp_profile($u) : array('name' => '');
            $out = array('prihlaseny' => $p['name']) + $out + array('moje_otvorene_ulohy' => array_map('arsp_mcp_task_out', array_slice($mine, 0, 30)));
        }
        return $out;
    }

    case 'terminy': {
        $days = max(1, min(365, (int) (isset($a['dni']) ? $a['dni'] : 30))); $to = arsp_mcp_plus($days);
        $past = !empty($a['aj_po_termine']); $only = isset($a['len']) ? $a['len'] : '';
        $T = array();
        $add = function ($d, $typ, $nazov, $k, $extra = array()) use (&$T, $today, $to, $past) {
            if (!arsp_mcp_isdate($d) || $d > $to || ($d < $today && !$past)) return;
            $T[] = arsp_mcp_clean(array_merge(array('datum' => $d, 'typ' => $typ, 'nazov' => $nazov, 'k_comu' => $k, 'po_termine' => $d < $today ? true : ''), $extra));
        };
        if ($only === '' || $only === 'granty') {
            $GD = array('callOpen' => 'Grant: začiatok podávania žiadostí', 'submitTo' => 'Grant: uzávierka žiadosti', 'realFrom' => 'Grant: začiatok realizácie', 'realTo' => 'Grant: koniec realizácie', 'settleDue' => 'Grant: termín vyúčtovania');
            foreach (arsp_mcp_list('grants') as $g) {
                $st = isset($g['status']) ? $g['status'] : '';
                if (in_array($st, array('vyuctovane', 'nepodporene', 'pozastavene'), true)) continue;
                foreach ($GD as $k => $lbl) if (!empty($g[$k])) {
                    if ($k === 'callOpen' && !in_array($st, array('', 'napad', 'priprava'), true)) continue;
                    if ($k === 'submitTo' && !in_array($st, array('', 'napad', 'priprava'), true)) continue;
                    $add($g[$k], $lbl, isset($g['name']) ? $g['name'] : 'Grant', arsp_mcp_grant_provider($g), array('grant_id' => $g['id']));
                }
            }
        }
        if ($only === '') {
            foreach (arsp_mcp_list('tasks') as $t) {
                if (arsp_mcp_task_done($t) || empty($t['due'])) continue;
                $k = array_filter(array(arsp_mcp_name('events', isset($t['eventId']) ? $t['eventId'] : ''), arsp_mcp_name('grants', isset($t['grantId']) ? $t['grantId'] : ''), arsp_mcp_name('projects', isset($t['projectId']) ? $t['projectId'] : '')));
                $add($t['due'], 'Úloha', isset($t['title']) ? $t['title'] : 'Úloha', implode(' · ', $k), array('kto' => arsp_mcp_person(isset($t['assignee']) ? $t['assignee'] : ''), 'uloha_id' => $t['id']));
            }
            foreach (arsp_mcp_list('events') as $e) {
                if (empty($e['date']) || (isset($e['status']) && $e['status'] === 'zrusene')) continue;
                $add($e['date'], 'Podujatie', isset($e['name']) ? $e['name'] : 'Podujatie', isset($e['place']) ? $e['place'] : '', array('cas' => isset($e['time']) ? $e['time'] : '', 'podujatie_id' => $e['id']));
                $en = isset($e['name']) ? $e['name'] : 'Podujatie';
                $mp = isset($e['mktPlan']['items']) && is_array($e['mktPlan']['items']) ? $e['mktPlan']['items'] : array();
                foreach ($mp as $it) {
                    $st = isset($it['st']) && isset($L['mkt'][$it['st']]) ? $it['st'] : (!empty($it['d']) ? 'publikovane' : 'pripravit');
                    if ($st === 'publikovane' || empty($it['date'])) continue;
                    $add($it['date'], 'Marketing', isset($it['t']) ? $it['t'] : 'Položka', $en, array('stav' => $L['mkt'][$st], 'kto' => arsp_mcp_person(isset($it['who']) ? $it['who'] : ''), 'podujatie_id' => $e['id']));
                }
                $pk = isset($e['podklady']['items']) && is_array($e['podklady']['items']) ? $e['podklady']['items'] : array();
                foreach ($pk as $it) {
                    if ((isset($it['st']) ? $it['st'] : '') === 'hotove' || empty($it['due'])) continue;
                    $add($it['due'], 'Podklad', isset($it['t']) ? $it['t'] : 'Podklad', $en, array('kto' => arsp_mcp_person(isset($it['who']) ? $it['who'] : ''), 'podujatie_id' => $e['id']));
                }
            }
        }
        usort($T, function ($x, $y) { return strcmp($x['datum'], $y['datum']) ?: strcmp($x['typ'], $y['typ']); });
        return array('od' => $today, 'do' => $to, 'terminy' => $T);
    }

    case 'ulohy': {
        $st = isset($a['stav']) ? $a['stav'] : 'otvorene'; $lim = max(1, min(300, (int) (isset($a['limit']) ? $a['limit'] : 50)));
        $ev = isset($a['podujatie']) && $a['podujatie'] !== '' ? arsp_mcp_find('events', $a['podujatie'], 'Podujatie') : null;
        $pr = isset($a['projekt']) && $a['projekt'] !== '' ? arsp_mcp_find('projects', $a['projekt'], 'Projekt') : null;
        $gr = isset($a['grant']) && $a['grant'] !== '' ? arsp_mcp_find('grants', $a['grant'], 'Grant') : null;
        $who = isset($a['kto']) ? arsp_mcp_norm($a['kto']) : ''; $q = isset($a['hladaj']) ? arsp_mcp_norm($a['hladaj']) : '';
        $due = isset($a['termin_do']) && arsp_mcp_isdate($a['termin_do']) ? $a['termin_do'] : '';
        $out = array();
        foreach (arsp_mcp_list('tasks') as $t) {
            $done = arsp_mcp_task_done($t);
            if (($st === 'otvorene' && $done) || ($st === 'hotove' && !$done)) continue;
            if ($ev && (isset($t['eventId']) ? $t['eventId'] : '') !== $ev['id']) continue;
            if ($pr && (isset($t['projectId']) ? $t['projectId'] : '') !== $pr['id']) continue;
            if ($gr && (isset($t['grantId']) ? $t['grantId'] : '') !== $gr['id']) continue;
            if ($due && (empty($t['due']) || $t['due'] > $due)) continue;
            if ($who !== '' && strpos(arsp_mcp_norm(arsp_mcp_person(isset($t['assignee']) ? $t['assignee'] : '')), $who) === false) continue;
            if (!empty($a['moje']) && !arsp_mcp_mine($t)) continue;
            if ($q !== '' && strpos(arsp_mcp_norm(isset($t['title']) ? $t['title'] : ''), $q) === false) continue;
            $out[] = $t;
        }
        usort($out, function ($x, $y) { $a1 = !empty($x['due']) ? $x['due'] : '9999'; $b1 = !empty($y['due']) ? $y['due'] : '9999'; return strcmp($a1, $b1); });
        return array('pocet' => count($out), 'ulohy' => array_map('arsp_mcp_task_out', array_slice($out, 0, $lim)));
    }

    case 'pridaj_ulohu': {
        $title = trim((string) (isset($a['nazov']) ? $a['nazov'] : ''));
        if ($title === '') throw new Exception('Chýba názov úlohy.');
        $d = array('title' => arsp_mcp_cut($title, 200), 'status' => 'inbox', 'priority' => in_array(isset($a['priorita']) ? $a['priorita'] : '', array('urgentne', 'nizka'), true) ? $a['priorita'] : 'normalne', 'org' => 'ars');
        if (!empty($a['termin'])) { if (!arsp_mcp_isdate($a['termin'])) throw new Exception('Termín musí byť v tvare RRRR-MM-DD.'); $d['due'] = $a['termin']; }
        if (!empty($a['podujatie'])) { $e = arsp_mcp_find('events', $a['podujatie'], 'Podujatie'); $d['eventId'] = $e['id']; if (!empty($e['projectId'])) $d['projectId'] = $e['projectId']; }
        if (!empty($a['projekt'])) { $p = arsp_mcp_find('projects', $a['projekt'], 'Projekt'); $d['projectId'] = $p['id']; }
        if (!empty($a['grant'])) { $g = arsp_mcp_find('grants', $a['grant'], 'Grant'); $d['grantId'] = $g['id']; }
        if (!empty($a['poznamka'])) $d['note'] = arsp_mcp_cut($a['poznamka'], 2000);
        if (!empty($a['kto'])) {
            $n = arsp_mcp_norm($a['kto']); $hit = array(); $exact = array(); $all = array();
            foreach (get_users(array('number' => 300, 'capability' => ARSP_CAP)) as $u) {
                $p = arsp_profile($u); $all[] = $p['name']; $pn = arsp_mcp_norm($p['name']);
                if ($pn === $n) $exact[] = $p; elseif (strpos($pn, $n) !== false) $hit[] = $p;
            }
            $m = count($exact) === 1 ? $exact : ($exact ? $exact : $hit);
            if (count($m) !== 1) throw new Exception(($m ? 'Meno „' . $a['kto'] . '“ zodpovedá viacerým ľuďom' : 'V tíme nie je nikto s menom „' . $a['kto'] . '“') . '. Členovia tímu: ' . implode(', ', $all) . '.');
            $d['assignee'] = $m[0]['id'];
        }
        $now = arsp_now_ms(); $me = 'wp_' . get_current_user_id();
        $d += array('createdAt' => $now, 'updatedAt' => $now, 'createdBy' => $me, 'updatedBy' => $me);
        $id = strtolower(wp_generate_password(12, false, false)) . base_convert((string) $now, 10, 36);
        $id = preg_replace('/[^a-z0-9]/', '', $id);
        $chk = function_exists('arsp_acc_check_write') ? arsp_acc_check_write('tasks', 'set', $d, null, arsp_acc_user(), $id) : true;
        if (is_wp_error($chk)) throw new Exception('Tento účet nemá právo pridať túto úlohu (' . $chk->get_error_message() . ')');
        global $wpdb;
        $ok = $wpdb->replace(arsp_table(), array('col' => 'tasks', 'id' => $id, 'data' => wp_json_encode((object) $d, JSON_UNESCAPED_UNICODE), 'updated' => $now, 'deleted' => 0), array('%s', '%s', '%s', '%d', '%d'));
        if (!$ok) throw new Exception('Úlohu sa nepodarilo uložiť.');
        $d['id'] = $id;
        return array('pridane' => true, 'uloha' => arsp_mcp_task_out($d));
    }

    case 'podujatia': {
        $per = isset($a['obdobie']) ? $a['obdobie'] : 'buduce'; $q = isset($a['hladaj']) ? arsp_mcp_norm($a['hladaj']) : ''; $lim = max(1, min(200, (int) (isset($a['limit']) ? $a['limit'] : 50)));
        $out = array();
        foreach (arsp_mcp_list('events') as $e) {
            $to = !empty($e['dateTo']) ? $e['dateTo'] : (isset($e['date']) ? $e['date'] : '');
            if ($per === 'buduce' && $to !== '' && $to < $today) continue;
            if ($per === 'minule' && ($to === '' || $to >= $today)) continue;
            if ($q !== '' && strpos(arsp_mcp_norm(isset($e['name']) ? $e['name'] : ''), $q) === false) continue;
            $out[] = $e;
        }
        usort($out, function ($x, $y) use ($per) { $a1 = !empty($x['date']) ? $x['date'] : '9999'; $b1 = !empty($y['date']) ? $y['date'] : '9999'; return $per === 'minule' ? strcmp($b1, $a1) : strcmp($a1, $b1); });
        return array('pocet' => count($out), 'podujatia' => array_map('arsp_mcp_event_out', array_slice($out, 0, $lim)));
    }

    case 'podujatie': {
        $e = arsp_mcp_find('events', isset($a['podujatie']) ? $a['podujatie'] : '', 'Podujatie');
        if (!$e) throw new Exception('Zadajte id alebo názov podujatia.');
        $prog = array(); $works = array();
        $items = array_filter(arsp_mcp_list('programItems'), function ($x) use ($e) { return (isset($x['eventId']) ? $x['eventId'] : '') === $e['id']; });
        usort($items, function ($x, $y) { return ((float) (isset($x['ord']) ? $x['ord'] : 0) <=> (float) (isset($y['ord']) ? $y['ord'] : 0)) ?: ((isset($x['createdAt']) ? $x['createdAt'] : 0) <=> (isset($y['createdAt']) ? $y['createdAt'] : 0)); });
        foreach ($items as $x) {
            if ((isset($x['kind']) ? $x['kind'] : '') === 'sprievodny') $prog[] = arsp_mcp_clean(array('den' => isset($x['date']) ? $x['date'] : '', 'cas' => isset($x['time']) ? $x['time'] : '', 'nazov' => isset($x['title']) ? $x['title'] : '', 'miesto' => isset($x['place']) ? $x['place'] : '', 'ucinkujuci' => isset($x['author']) ? $x['author'] : ''));
            else $works[] = arsp_mcp_clean(array('blok' => isset($x['section']) ? $x['section'] : '', 'nazov' => isset($x['title']) ? $x['title'] : '', 'autor' => isset($x['author']) ? $x['author'] : '', 'miesto' => isset($x['place']) ? $x['place'] : '', 'stav' => arsp_mcp_lbl($L['dielo'], isset($x['status']) ? $x['status'] : 'nevybavene')));
        }
        usort($prog, function ($x, $y) { return strcmp(isset($x['den']) ? $x['den'] : '9999', isset($y['den']) ? $y['den'] : '9999'); });
        $mk = array(); $areas = array();
        foreach ((array) (isset($e['mktPlan']['areas']) ? $e['mktPlan']['areas'] : array()) as $ar) if (is_array($ar) && isset($ar['id'])) $areas[$ar['id']] = isset($ar['title']) ? $ar['title'] : '';
        foreach ((array) (isset($e['mktPlan']['items']) ? $e['mktPlan']['items'] : array()) as $it) {
            if (!is_array($it)) continue;
            $st = isset($it['st']) && isset($L['mkt'][$it['st']]) ? $it['st'] : (!empty($it['d']) ? 'publikovane' : 'pripravit');
            $mk[] = arsp_mcp_clean(array('oblast' => isset($areas[isset($it['a']) ? $it['a'] : '']) ? $areas[$it['a']] : '', 'nazov' => isset($it['t']) ? $it['t'] : '', 'datum' => isset($it['date']) ? $it['date'] : '', 'stav' => $L['mkt'][$st], 'kto' => arsp_mcp_person(isset($it['who']) ? $it['who'] : '')));
        }
        $pk = array(); $secs = array();
        foreach ((array) (isset($e['podklady']['secs']) ? $e['podklady']['secs'] : array()) as $s) if (is_array($s) && isset($s['id'])) $secs[$s['id']] = isset($s['title']) ? $s['title'] : '';
        foreach ((array) (isset($e['podklady']['items']) ? $e['podklady']['items'] : array()) as $it) {
            if (!is_array($it)) continue;
            $st = isset($it['st']) && isset($L['pk'][$it['st']]) ? $it['st'] : (trim((string) (isset($it['body']) ? $it['body'] : '')) !== '' ? 'rozpracovane' : 'nezacate');
            $pk[] = arsp_mcp_clean(array('druh' => isset($secs[isset($it['s']) ? $it['s'] : '']) ? $secs[$it['s']] : '', 'nazov' => isset($it['t']) ? $it['t'] : '', 'stav' => $L['pk'][$st], 'termin' => isset($it['due']) ? $it['due'] : '', 'kto' => arsp_mcp_person(isset($it['who']) ? $it['who'] : ''), 'zadanie' => arsp_mcp_cut(isset($it['brief']) ? $it['brief'] : '', 300)));
        }
        $tasks = array_filter(arsp_mcp_list('tasks'), function ($t) use ($e) { return (isset($t['eventId']) ? $t['eventId'] : '') === $e['id'] && !arsp_mcp_task_done($t); });
        $home = arsp_mcp_zb_home(); $zn = 0; $zok = 0; $zw = 0; $zul = array();
        foreach (arsp_mcp_list('zabezpecenie') as $z) {
            $eid = !empty($z['eventId']) ? $z['eventId'] : $home;
            if ($eid !== $e['id']) continue;
            $zn++; $s = isset($z['stav']) ? $z['stav'] : 'navrh'; if ($s === 'potvrdene') $zok++; elseif ($s === 'rozpracovane') $zw++;
            foreach ((array) (isset($z['ulohy']) ? $z['ulohy'] : array()) as $u) if (is_array($u) && empty($u['hotovo']) && trim((string) (isset($u['text']) ? $u['text'] : '')) !== '') $zul[] = (isset($z['title']) ? $z['title'] . ': ' : '') . $u['text'];
        }
        $money = arsp_mcp_money(array_filter(arsp_mcp_list('transactions'), function ($x) use ($e) { return (isset($x['eventId']) ? $x['eventId'] : '') === $e['id']; }));
        return arsp_mcp_clean(array(
            'podujatie' => arsp_mcp_event_out($e),
            'koncept' => arsp_mcp_cut(isset($e['dramaturgy']) ? $e['dramaturgy'] : '', 1500),
            'poznamka' => arsp_mcp_cut(isset($e['note']) ? $e['note'] : '', 800),
            'program' => $prog, 'diela' => $works, 'marketing' => $mk, 'podklady' => $pk,
            'otvorene_ulohy' => array_map('arsp_mcp_task_out', array_values($tasks)),
            'zabezpecenie' => $zn ? array('zaznamov' => $zn, 'potvrdene' => $zok, 'rozpracovane' => $zw, 'otvorene_ulohy' => array_slice($zul, 0, 40)) : '',
            'rozpocet' => $money,
        ));
    }

    case 'granty': {
        $st = isset($a['stav']) ? $a['stav'] : 'aktivne'; $q = isset($a['hladaj']) ? arsp_mcp_norm($a['hladaj']) : '';
        $out = array();
        foreach (arsp_mcp_list('grants') as $g) {
            $gs = isset($g['status']) ? $g['status'] : '';
            if ($st === 'aktivne' && in_array($gs, array('vyuctovane', 'nepodporene', 'pozastavene'), true)) continue;
            if ($st !== 'aktivne' && $st !== 'vsetky' && $gs !== $st) continue;
            if ($q !== '' && strpos(arsp_mcp_norm((isset($g['name']) ? $g['name'] : '') . ' ' . arsp_mcp_grant_provider($g) . ' ' . (isset($g['program']) ? $g['program'] : '')), $q) === false) continue;
            $out[] = $g;
        }
        usort($out, function ($x, $y) { return strcmp(!empty($x['submitTo']) ? $x['submitTo'] : '9999', !empty($y['submitTo']) ? $y['submitTo'] : '9999'); });
        return array('pocet' => count($out), 'granty' => array_map('arsp_mcp_grant_out', $out));
    }

    case 'grant': {
        $g = arsp_mcp_find('grants', isset($a['grant']) ? $a['grant'] : '', 'Grant');
        if (!$g) throw new Exception('Zadajte id alebo názov grantu.');
        $tx = array_filter(arsp_mcp_list('transactions'), function ($x) use ($g) { return (isset($x['grantId']) ? $x['grantId'] : '') === $g['id']; });
        $masked = false; foreach ($tx as $x) if (!empty($x['_masked'])) $masked = true;
        $lines = array_filter(arsp_mcp_list('budgetLines'), function ($l) use ($g) { return (isset($l['grantId']) ? $l['grantId'] : '') === $g['id']; });
        usort($lines, function ($x, $y) { return ((float) (isset($x['ord']) ? $x['ord'] : 1e9) <=> (float) (isset($y['ord']) ? $y['ord'] : 1e9)); });
        $LB = array();
        foreach ($lines as $l) {
            $paid = 0; $plan = 0;
            foreach ($tx as $x) {
                if ((isset($x['lineId']) ? $x['lineId'] : '') !== $l['id'] || (isset($x['type']) && $x['type'] === 'prijem')) continue;
                $am = (float) (isset($x['amount']) ? $x['amount'] : 0);
                if ((!isset($x['paid']) || $x['paid'] !== false) && !empty($x['date'])) $paid += $am; else $plan += $am;
            }
            $bud = (float) (!empty($l['fromGrant']) ? $l['fromGrant'] : (isset($l['total']) ? $l['total'] : 0));
            $LB[] = $masked ? arsp_mcp_clean(array('polozka' => isset($l['name']) ? $l['name'] : '')) : arsp_mcp_clean(array('polozka' => isset($l['name']) ? $l['name'] : '', 'rozpocet_z_grantu' => $bud ?: '', 'zaplatene' => round($paid, 2), 'planovane' => round($plan, 2), 'zostava' => $bud ? round($bud - $paid - $plan, 2) : ''));
        }
        $ev = array(); foreach (arsp_mcp_list('events') as $e) if (in_array($g['id'], (array) (isset($e['grantIds']) ? $e['grantIds'] : array()), true)) $ev[] = arsp_mcp_event_out($e);
        $app = array(); foreach ((array) (isset($g['appSections']) ? $g['appSections'] : array()) as $s) if (is_array($s)) $app[] = arsp_mcp_clean(array('cast' => isset($s['title']) ? $s['title'] : '', 'znakov' => function_exists('mb_strlen') ? mb_strlen((string) (isset($s['body']) ? $s['body'] : '')) : strlen((string) (isset($s['body']) ? $s['body'] : '')), 'limit' => isset($s['limit']) ? $s['limit'] : ''));
        $tasks = array_filter(arsp_mcp_list('tasks'), function ($t) use ($g) { return (isset($t['grantId']) ? $t['grantId'] : '') === $g['id'] && !arsp_mcp_task_done($t); });
        return arsp_mcp_clean(array(
            'grant' => arsp_mcp_grant_out($g),
            'vyzva' => arsp_mcp_clean(array('cislo_vyzvy' => isset($g['callNo']) ? $g['callNo'] : '', 'min_dotacia' => isset($g['callMin']) ? $g['callMin'] : '', 'max_dotacia' => isset($g['callMax']) ? $g['callMax'] : '', 'spolufinancovanie' => isset($g['cofinPct']) ? $g['cofinPct'] : '', 'kto_moze_ziadat' => arsp_mcp_cut(isset($g['callApplicants']) ? $g['callApplicants'] : '', 1200), 'na_co' => arsp_mcp_cut(isset($g['callPurpose']) ? $g['callPurpose'] : '', 1500), 'prilohy_a_podmienky' => arsp_mcp_cut(isset($g['callAttach']) ? $g['callAttach'] : '', 1500), 'odkaz' => isset($g['callUrl']) ? $g['callUrl'] : '')),
            'cislo_zmluvy' => isset($g['contractNo']) ? $g['contractNo'] : '',
            'rozpoctove_polozky' => $LB, 'sumy' => $masked ? 'skryté (tento účet nemá prístup k sumám)' : '',
            'casti_ziadosti' => $app, 'podujatia' => $ev,
            'otvorene_ulohy' => array_map('arsp_mcp_task_out', array_values($tasks)),
            'poznamka' => arsp_mcp_cut(isset($g['note']) ? $g['note'] : '', 800),
        ));
    }

    case 'kontakty': {
        if (function_exists('arsp_acc_level') && arsp_acc_level('kontakty', arsp_acc_user()) < 1) throw new Exception('Tento účet nemá prístup ku kontaktom (Ars Preuge → Prístupy).');
        $q = isset($a['hladaj']) ? arsp_mcp_norm($a['hladaj']) : ''; $qd = preg_replace('/\D/', '', isset($a['hladaj']) ? (string) $a['hladaj'] : '');
        $rola = isset($a['rola']) ? arsp_mcp_norm($a['rola']) : ''; $typ = isset($a['typ']) ? (string) $a['typ'] : '';
        $lim = max(1, min(200, (int) (isset($a['limit']) ? $a['limit'] : 30)));
        $ev = isset($a['podujatie']) && $a['podujatie'] !== '' ? arsp_mcp_find('events', $a['podujatie'], 'Podujatie') : null;
        $inEv = array(); $sec = array();
        if ($ev) {   /* ľudia podujatia ako v záložke Spolupráce: prepojené kontakty, sekcie (roles) a spolupráce (partnerships) */
            $secs = isset($ev['teamSecs']) && is_array($ev['teamSecs']) ? $ev['teamSecs'] : array(array('tim', 'Tím'), array('partner', 'Partneri'), array('sponzor', 'Sponzori'), array('dobrovolnik', 'Dobrovoľníci'));
            $sl = array(); foreach ($secs as $x) if (is_array($x) && isset($x[0], $x[1])) $sl[(string) $x[0]] = (string) $x[1];
            foreach (arsp_mcp_list('contacts') as $c) if (in_array($ev['id'], (array) (isset($c['eventIds']) ? $c['eventIds'] : array()), true)) $inEv[$c['id']] = true;
            foreach ((array) (isset($ev['roles']) ? $ev['roles'] : array()) as $cid => $k) { $inEv[(string) $cid] = true; if (isset($sl[(string) $k])) $sec[(string) $cid] = $sl[(string) $k]; }
            foreach (arsp_mcp_list('partnerships') as $p) if ((isset($p['eventId']) ? $p['eventId'] : '') === $ev['id'] && !empty($p['contactId'])) $inEv[(string) $p['contactId']] = true;
        }
        $out = array();
        foreach (arsp_mcp_list('contacts') as $c) {
            if ($ev && !isset($inEv[$c['id']])) continue;
            if ($typ !== '' && (isset($c['ctype']) && $c['ctype'] !== '' ? $c['ctype'] : 'osoba') !== $typ) continue;
            $o = arsp_mcp_contact_out($c);
            if ($rola !== '') { $ok = false; foreach ((isset($o['roly']) ? $o['roly'] : array()) as $r) if (strpos(arsp_mcp_norm($r), $rola) !== false) $ok = true; if (!$ok) continue; }
            if ($q !== '') {
                $hay = arsp_mcp_norm(implode(' ', array(isset($o['meno']) ? $o['meno'] : '', isset($c['legalName']) ? $c['legalName'] : '', implode(' ', isset($o['organizacie']) ? $o['organizacie'] : array()), isset($o['funkcia']) ? $o['funkcia'] : '', isset($o['email']) ? $o['email'] : '')));
                $tel = preg_replace('/\D/', '', isset($o['telefon']) ? $o['telefon'] : '');
                if (strpos($hay, $q) === false && !(strlen($qd) >= 4 && strpos($tel, $qd) !== false)) continue;
            }
            if (isset($sec[$c['id']])) $o['sekcia_na_podujati'] = $sec[$c['id']];
            $out[] = $o;
        }
        usort($out, function ($x, $y) { return strcoll(arsp_mcp_norm(isset($x['meno']) ? $x['meno'] : ''), arsp_mcp_norm(isset($y['meno']) ? $y['meno'] : '')); });
        return array('pocet' => count($out), 'kontakty' => array_slice($out, 0, $lim));
    }
    }
    throw new Exception('Neznámy nástroj: ' . $name);
}

/* ------------------------------------------------------------------ protokol (JSON-RPC 2.0) */

function arsp_mcp_one($m) {
    if (!is_array($m) || !isset($m['method']) || !is_string($m['method'])) return array('jsonrpc' => '2.0', 'id' => null, 'error' => array('code' => -32600, 'message' => 'Invalid Request'));
    $note = !array_key_exists('id', $m); $id = $note ? null : $m['id']; $p = isset($m['params']) && is_array($m['params']) ? $m['params'] : array();
    $ok = function ($res) use ($id) { return array('jsonrpc' => '2.0', 'id' => $id, 'result' => $res); };
    $err = function ($c, $msg) use ($id) { return array('jsonrpc' => '2.0', 'id' => $id, 'error' => array('code' => $c, 'message' => $msg)); };
    if ($note) return null;   /* notifications/initialized a pod. – bez odpovede */
    switch ($m['method']) {
        case 'initialize':
            $want = isset($p['protocolVersion']) ? (string) $p['protocolVersion'] : '';
            $known = array('2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05');
            return $ok(array(
                'protocolVersion' => in_array($want, $known, true) ? $want : '2025-06-18',
                'capabilities' => array('tools' => array('listChanged' => false)),
                'serverInfo' => array('name' => 'ars-preuge', 'title' => 'Ars Preuge – pracovný priestor', 'version' => defined('ARSP_VER') ? ARSP_VER : ''),
                'instructions' => 'Pracovný priestor občianskeho združenia Ars Preuge (kultúra, Prievidza): projekty, granty, podujatia a úlohy tímu. '
                    . 'Odpovedaj po slovensky. Dátumy sú v tvare RRRR-MM-DD, sumy v eurách. '
                    . (arsp_mcp_personal() ? 'Pracuješ v mene prihláseného človeka z tímu a nástroje vracajú len to, čo smie vidieť on; kto to je a jeho otvorené úlohy povie nástroj prehlad (prihlaseny, moje_otvorene_ulohy), jeho úlohy vráti aj ulohy s moje=true. ' : 'Nástroje vracajú len to, čo smie vidieť účet agenta. ')
                    . 'Zapisovať vieš len novú úlohu (pridaj_ulohu) – urob to iba vtedy, keď o to človek výslovne požiada, a potvrď, čo si pridal. '
                    . 'E-maily a telefóny z nástroja kontakty používaj len pre potreby tímu a neposielaj ich nikomu mimo neho.',
            ));
        case 'ping': return $ok(new stdClass());
        case 'tools/list': return $ok(array('tools' => arsp_mcp_tools()));
        case 'tools/call':
            $name = isset($p['name']) ? (string) $p['name'] : '';
            $known = array(); foreach (arsp_mcp_tools() as $t) $known[] = $t['name'];
            if (!in_array($name, $known, true)) return $err(-32602, 'Unknown tool: ' . $name);
            try {
                $res = arsp_mcp_call($name, isset($p['arguments']) ? $p['arguments'] : array());
                return $ok(array('content' => array(array('type' => 'text', 'text' => wp_json_encode($res, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT))), 'isError' => false));
            } catch (Exception $e) {
                return $ok(array('content' => array(array('type' => 'text', 'text' => $e->getMessage())), 'isError' => true));
            }
        default: return $err(-32601, 'Method not found: ' . $m['method']);
    }
}

/** odpoveď na upozornenie (notification): 202 bez obsahu, ako žiada protokol */
if (!function_exists('arsp_mcp_accepted')) { function arsp_mcp_accepted() { status_header(202); header('Content-Length: 0'); exit; } }

add_action('rest_api_init', function () {
    register_rest_route('arsp/v1', '/mcp', array(
        array('methods' => 'POST', 'permission_callback' => 'arsp_mcp_auth', 'callback' => function (WP_REST_Request $r) {
            $body = json_decode((string) $r->get_body(), true);
            if (!is_array($body)) return new WP_REST_Response(array('jsonrpc' => '2.0', 'id' => null, 'error' => array('code' => -32700, 'message' => 'Parse error')), 400);
            if ($body && array_keys($body) === range(0, count($body) - 1)) {   /* dávka (staršie verzie protokolu) */
                $out = array(); foreach ($body as $m) { $x = arsp_mcp_one($m); if ($x !== null) $out[] = $x; }
                if (!$out) arsp_mcp_accepted();
                return new WP_REST_Response($out, 200);
            }
            $x = arsp_mcp_one($body);
            if ($x === null) arsp_mcp_accepted();
            return new WP_REST_Response($x, 200);
        }),
        array('methods' => 'GET, DELETE', 'permission_callback' => '__return_true', 'callback' => function () {
            $r = new WP_REST_Response(array('error' => 'Použite POST (MCP, odpovede JSON).'), 405); $r->header('Allow', 'POST'); return $r;
        }),
    ));
});

/* ------------------------------------------------------------------ administrácia (Ars Preuge → AI) */

function arsp_mcp_admin_section() {
    if (!current_user_can('manage_options')) return;
    $uid = (int) get_option('arsp_mcp_user', 0); $on = $uid && get_option('arsp_mcp_hash', '') !== '';
    $u = $uid ? get_userdata($uid) : null;
    echo '<h2 style="margin-top:0">Prepojenie pre AI agenta (napr. Hermes)</h2>';
    echo '<p>Agent cez toto prepojenie číta úlohy, termíny, podujatia a granty a vie <b>pridať úlohu</b>. Nič nemaže ani neprepisuje. Z kontaktov vidí len meno, roly, organizácie, e-mail a telefón (nie rodné číslo, OP, IBAN, adresu ani poznámky), z financií len súčty rozpočtov. Vidí to isté, čo účet, ku ktorému kľúč patrí.</p>';
    $show = get_transient('arsp_mcp_new_' . get_current_user_id());
    if ($show) {
        delete_transient('arsp_mcp_new_' . get_current_user_id());
        $url = rest_url('arsp/v1/mcp');
        echo '<div class="notice notice-success inline"><p><b>Kľúč je vytvorený.</b> Skopírujte ho teraz – po obnovení stránky sa už neukáže.</p></div>';
        echo '<p><input type="text" readonly value="' . esc_attr($show) . '" style="width:100%;max-width:560px;font-family:monospace" onclick="this.select()"></p>';
        echo '<p>Do Hermesa (súbor <code>~/.hermes/config.yaml</code> na serveri) vložte:</p>';
        echo '<textarea readonly rows="6" style="width:100%;max-width:560px;font-family:monospace" onclick="this.select()">' . esc_textarea("mcp_servers:\n  ars_preuge:\n    url: \"" . $url . "\"\n    headers:\n      X-Arsp-Token: \"" . $show . "\"\n") . '</textarea>';
        echo '<p>Potom v Hermesovi napíšte <code>/reload-mcp</code> (alebo ho reštartujte).</p>';
    }
    echo '<p>Stav: ' . ($on && $u ? 'prepojenie je <b>zapnuté</b> pre účet <b>' . esc_html($u->display_name) . '</b>' : '<b>prepojenie je vypnuté</b>') . '</p>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    wp_nonce_field('arsp_mcp');
    echo '<input type="hidden" name="action" value="arsp_mcp"><label>Účet agenta: <select name="arsp_mcp_user">';
    foreach (get_users(array('number' => 300, 'orderby' => 'display_name', 'capability' => ARSP_CAP)) as $x) echo '<option value="' . (int) $x->ID . '"' . selected($x->ID, $uid, false) . '>' . esc_html($x->display_name) . '</option>';
    echo '</select></label> <button class="button button-primary" name="arsp_do" value="new">' . ($on ? 'Vytvoriť nový kľúč (starý prestane platiť)' : 'Vytvoriť kľúč') . '</button>';
    if ($on) echo ' <button class="button" name="arsp_do" value="off" onclick="return confirm(\'Vypnúť prepojenie? Agent stratí prístup.\')">Vypnúť prepojenie</button>';
    echo '</form>';
    echo '<p class="description">Odporúčanie: pre agenta založte samostatný účet (Používatelia → Pridať, rola „Tím Ars Preuge“), aby bolo v histórii vidieť, čo pridal agent. Ak má agent pridávať úlohy k podujatiam, projektom a grantom, účet ich musí smieť upravovať (bez skupiny v Prístupoch to smie).</p>';
}

add_action('admin_post_arsp_mcp', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_mcp');
    $back = admin_url('admin.php?page=arsp-ai');
    $do = sanitize_key(isset($_POST['arsp_do']) ? $_POST['arsp_do'] : '');
    if ($do === 'off') { delete_option('arsp_mcp_hash'); wp_safe_redirect($back); exit; }
    if ($do === 'new') {
        $uid = (int) (isset($_POST['arsp_mcp_user']) ? $_POST['arsp_mcp_user'] : 0);
        if (!$uid || !user_can($uid, ARSP_CAP)) { wp_safe_redirect($back); exit; }
        $tok = 'arsp_' . wp_generate_password(40, false, false);
        update_option('arsp_mcp_user', $uid, false);
        update_option('arsp_mcp_hash', arsp_mcp_hash($tok), false);
        set_transient('arsp_mcp_new_' . get_current_user_id(), $tok, 600);
    }
    wp_safe_redirect($back); exit;
});
