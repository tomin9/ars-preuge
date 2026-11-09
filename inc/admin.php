<?php
/**
 * Administrácia pluginu vo WordPresse: menu „Ars Preuge“ s podstránkami Prehľad · Prístupy · AI · Záloha
 * a jednotný vzhľad (karty). Prehľad vidí každý člen tímu, ostatné podstránky len administrátor.
 */
if (!defined('ABSPATH')) exit;

add_action('admin_menu', function () {
    add_menu_page('Ars Preuge', 'Ars Preuge', ARSP_CAP, 'arsp', 'arsp_admin_page', 'dashicons-art', 3);
    add_submenu_page('arsp', 'Ars Preuge – prehľad', 'Prehľad', ARSP_CAP, 'arsp', 'arsp_admin_page');
    add_submenu_page('arsp', 'Ars Preuge – nastavenia', 'Nastavenia', 'manage_options', 'arsp-nastavenia', 'arsp_admin_page_nastavenia');
    add_submenu_page('arsp', 'Ars Preuge – prístupy', 'Prístupy', 'manage_options', 'arsp-pristupy', 'arsp_admin_page_pristupy');
    add_submenu_page('arsp', 'Ars Preuge – AI', 'AI', 'manage_options', 'arsp-ai', 'arsp_admin_page_ai');
    add_submenu_page('arsp', 'Ars Preuge – záloha', 'Záloha', 'manage_options', 'arsp-zaloha', 'arsp_admin_page_zaloha');
});

/* spoločný vzhľad stránok pluginu (len na nich) */
add_action('admin_head', function () {
    $p = isset($_GET['page']) ? (string) $_GET['page'] : '';
    if ($p !== 'arsp' && strpos($p, 'arsp-') !== 0) return;
    echo '<style>
.arsp-wrap{max-width:1180px}
.arsp-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:18px 0 6px}
.arsp-top h1{font-size:26px;font-weight:700;margin:0;padding:0}
.arsp-sub{color:#646970;margin:2px 0 18px;font-size:14px}
.arsp-card{background:#fff;border:1px solid #dcdcde;border-radius:12px;padding:18px 20px;margin:0 0 16px;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.arsp-card h2{margin:0 0 10px;font-size:16px}
.arsp-card p:first-child{margin-top:0}.arsp-card p:last-child{margin-bottom:0}
.arsp-flush{padding:0;overflow:hidden}
.arsp-note{background:#f6f7f7}
.arsp-h2{font-size:18px;margin:26px 0 10px}
.arsp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0 0 16px}
.arsp-stat{background:#fff;border:1px solid #dcdcde;border-radius:12px;padding:14px 16px}
.arsp-stat b{display:block;font-size:26px;line-height:1.2}
.arsp-stat span{color:#646970}
.arsp-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.arsp-link{display:block;background:#fff;border:1px solid #dcdcde;border-radius:12px;padding:16px 18px;text-decoration:none;color:#1d2327}
.arsp-link:hover{border-color:#2271b1;color:#1d2327}
.arsp-link b{display:flex;align-items:center;gap:6px;font-size:15px;margin-bottom:4px}
.arsp-link span{color:#646970}
.arsp-pt{width:100%;border-collapse:collapse}
.arsp-pt th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#646970;font-weight:600;padding:12px 10px;border-bottom:1px solid #f0f0f1;background:#fafafa}
.arsp-legend{color:#646970;margin:-4px 0 10px}
.arsp-legend .arsp-tg{cursor:default;transform:scale(.92)}
.arsp-grp{padding:12px 16px 12px 20px;border-top:1px solid #f0f0f1}
.arsp-grp:first-child{border-top:0}
.arsp-gline{display:flex;align-items:center;gap:12px}
.arsp-gname{flex:0 0 170px;width:170px;font-size:14px;font-weight:600;border:1px solid transparent!important;background:transparent!important;box-shadow:none!important;padding:4px 8px!important;margin-left:-8px}
.arsp-gname:hover,.arsp-gname:focus{border-color:#dcdcde!important;background:#fff!important}
.arsp-new{background:#fbfbfc}.arsp-new .arsp-gname{font-weight:500}
.arsp-tgs{display:flex;flex-wrap:wrap;gap:6px;flex:1}
.arsp-tg{display:inline-flex;align-items:center;gap:4px;border:1px solid #dcdcde;background:#fff;border-radius:999px;padding:3px 6px 3px 11px;font-size:12.5px;cursor:pointer;color:#8c8f94;line-height:1.5;user-select:none}
.arsp-tg .dashicons{font-size:16px;width:16px;height:16px}
.arsp-tg-0{text-decoration:line-through;text-decoration-color:#c3c4c7}
.arsp-tg-1{background:#fffbea;border-color:#f0e2a8;color:#8a6100}
.arsp-tg-2{background:#effbf1;border-color:#b8e6c1;color:#007017;font-weight:600}
button.arsp-tg:hover{border-color:#2271b1}
.arsp-trash,.arsp-trash-sp{flex:0 0 32px}
.arsp-trash{border:0;background:none;color:#a7aaad;cursor:pointer;padding:6px;border-radius:8px;line-height:1}
.arsp-trash:hover{color:#b32d2e;background:#fcf0f1}
.arsp-sline{display:grid;grid-template-columns:170px 1fr 1fr 32px;gap:12px;align-items:start;margin-top:8px}
.arsp-sline::after{content:""}
@media(max-width:900px){.arsp-gline{flex-wrap:wrap}.arsp-sline{grid-template-columns:1fr}}
.arsp-slab{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8c8f94;padding-top:8px;cursor:help}
.arsp-mini{display:block;font-size:12px;color:#646970;margin:0 0 3px}
.arsp-hint{font-size:12px;color:#8c8f94;margin-top:6px}
.arsp-pick{position:relative;display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-height:30px;padding:2px 5px;border:1px solid #dcdcde;border-radius:10px;background:#fff;cursor:text}
.arsp-pick:focus-within{border-color:#2271b1;box-shadow:0 0 0 1px #2271b1}
.arsp-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 4px 3px 10px;border-radius:999px;background:#f0f6fc;color:#135e96;font-size:12.5px;font-weight:500}
.arsp-x{border:0;background:none;color:inherit;cursor:pointer;font-size:15px;line-height:1;padding:0 5px;border-radius:999px;opacity:.6}
.arsp-x:hover{opacity:1;background:rgba(0,0,0,.06)}
.arsp-pin{flex:1;min-width:110px;border:0!important;box-shadow:none!important;background:transparent!important;padding:2px 4px!important;min-height:26px!important;font-size:13px}
.arsp-drop{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:50;background:#fff;border:1px solid #dcdcde;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:240px;overflow:auto;padding:4px}
.arsp-drop button{display:block;width:100%;text-align:left;border:0;background:none;padding:7px 10px;border-radius:7px;cursor:pointer;font-size:13px;color:#1d2327}
.arsp-drop button:hover,.arsp-drop button.on{background:#f0f6fc;color:#135e96}
.arsp-drop .arsp-none{padding:7px 10px;color:#8c8f94}
.arsp-who{display:flex;gap:10px;align-items:center}
.arsp-who img{border-radius:50%}
.arsp-who b{display:block}.arsp-who span{color:#646970;font-size:12px}
.arsp-pt td{padding:12px 10px;vertical-align:middle;border-top:1px solid #f0f0f1}
.arsp-pt td:first-child,.arsp-pt th:first-child{padding-left:20px;width:1%;white-space:nowrap;padding-right:28px}
.arsp-pt td:nth-child(2),.arsp-pt th:nth-child(2){width:380px}
.arsp-pill{display:inline-block;margin:0 4px 4px 0;padding:2px 9px;border-radius:999px;background:#f0f0f1;font-size:12px;color:#50575e;white-space:nowrap}
.arsp-pill.arsp-l0{color:#a7aaad;text-decoration:line-through}.arsp-pill.arsp-l1{background:#fcf9e8;color:#996800}.arsp-pill.arsp-l2{background:#edfaef;color:#007017}
.arsp-pill.arsp-full{background:#edfaef;color:#007017}.arsp-pill.arsp-scp{background:#f0f6fc;color:#2271b1}
.arsp-save{position:sticky;bottom:0;background:#f0f0f1;padding:12px 0;margin:0}
.arsp-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.arsp-status{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.arsp-facts th{padding:6px 10px 6px 0;width:140px;font-weight:600}.arsp-facts td{padding:6px 0}
.arsp-dot{width:9px;height:9px;border-radius:50%;background:#a7aaad;display:inline-block}.arsp-dot.ok{background:#00a32a}
</style>';
});

/* výber so štítkami (rozsah, skupiny ľudí) a mazanie skupiny – len na stránke Prístupy */
add_action('admin_footer', function () {
    if ((isset($_GET['page']) ? $_GET['page'] : '') !== 'arsp-pristupy') return;
    ?><script>
(function(){
  var O=window.ARSP_OPTS||{};
  var norm=function(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');};
  function chip(box,id,name){var c=document.createElement('span');c.className='arsp-chip';
    var h=document.createElement('input');h.type='hidden';h.name=box.dataset.name;h.value=id;c.appendChild(h);
    c.appendChild(document.createTextNode(name));var x=document.createElement('button');x.type='button';x.className='arsp-x';x.setAttribute('aria-label','Odobrať');x.textContent='×';c.appendChild(x);
    box.insertBefore(c,box.querySelector('.arsp-pin'));}
  function chosen(box){return Array.prototype.map.call(box.querySelectorAll('input[type=hidden]'),function(i){return i.value;});}
  function show(box){var inp=box.querySelector('.arsp-pin'),dr=box.querySelector('.arsp-drop'),src=O[box.dataset.src]||{},q=norm(inp.value),have=chosen(box),list=[];
    Object.keys(src).forEach(function(id){if(have.indexOf(id)<0&&norm(src[id]).indexOf(q)>=0)list.push(id);});
    dr.innerHTML=list.length?'':'<div class="arsp-none">'+(Object.keys(src).length?'Nič ďalšie nezodpovedá':'Zatiaľ nie je z čoho vyberať')+'</div>';
    list.slice(0,60).forEach(function(id,i){var b=document.createElement('button');b.type='button';b.dataset.id=id;b.textContent=src[id];if(i===0)b.className='on';dr.appendChild(b);});
    dr.hidden=false;}
  function pick(box,id){chip(box,id,(O[box.dataset.src]||{})[id]||id);var inp=box.querySelector('.arsp-pin');inp.value='';show(box);inp.focus();}
  document.querySelectorAll('.arsp-pick').forEach(function(box){
    var inp=box.querySelector('.arsp-pin'),dr=box.querySelector('.arsp-drop');
    box.addEventListener('click',function(e){var x=e.target.closest('.arsp-x');if(x){x.parentNode.remove();if(!dr.hidden)show(box);return;}
      var b=e.target.closest('.arsp-drop button');if(b){pick(box,b.dataset.id);return;}inp.focus();});
    inp.addEventListener('focus',function(){show(box);});
    inp.addEventListener('input',function(){show(box);});
    inp.addEventListener('blur',function(){setTimeout(function(){if(!box.contains(document.activeElement))dr.hidden=true;},150);});
    inp.addEventListener('keydown',function(e){
      var it=dr.querySelectorAll('button'),cur=dr.querySelector('button.on'),i=Array.prototype.indexOf.call(it,cur);
      if(e.key==='Enter'){e.preventDefault();if(cur)pick(box,cur.dataset.id);}
      else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!it.length)return;if(cur)cur.className='';var n=it[(i+(e.key==='ArrowDown'?1:-1)+it.length)%it.length];n.className='on';n.scrollIntoView({block:'nearest'});}
      else if(e.key==='Backspace'&&!inp.value){var c=box.querySelectorAll('.arsp-chip');if(c.length)c[c.length-1].remove();}
      else if(e.key==='Escape'){dr.hidden=true;}
    });
  });
  var LV=[['hidden','bez prístupu'],['visibility','len čítať'],['edit','upravovať']];
  document.querySelectorAll('button.arsp-tg').forEach(function(b){b.addEventListener('click',function(){
    var h=b.querySelector('input'),v=(+h.value+1)%3;h.value=v;b.className='arsp-tg arsp-tg-'+v;
    b.querySelector('.dashicons').className='dashicons dashicons-'+LV[v][0];b.title=b.dataset.label+': '+LV[v][1]+' – kliknutím zmeníte';});});
  document.querySelectorAll('.arsp-trash').forEach(function(b){b.addEventListener('click',function(){
    if(!confirm('Zmazať skupinu „'+b.dataset.nm+'“? Ľuďom, ktorí ju majú, sa odoberie.'))return;
    var f=document.getElementById('arsp-acc-form'),h=document.createElement('input');h.type='hidden';h.name=b.dataset.del;h.value='1';f.appendChild(h);f.submit();});});
})();
</script><?php
});

function arsp_admin_top($title, $sub) {
    echo '<div class="wrap arsp-wrap"><div class="arsp-top"><h1>' . esc_html($title) . '</h1>'
        . '<a class="button button-primary button-hero" href="' . esc_url(arsp_app_url()) . '" target="_blank" rel="noopener">Otvoriť pracovný priestor ↗</a></div>'
        . '<p class="arsp-sub">' . $sub . '</p>';
}

/* ---------------------------------------------------------- Prehľad */
function arsp_admin_page() {
    global $wpdb; $t = arsp_table();
    $n = array();
    foreach ($wpdb->get_results("SELECT col, COUNT(*) n FROM $t WHERE deleted=0 GROUP BY col", ARRAY_A) as $r) $n[$r['col']] = (int) $r['n'];
    $url = arsp_app_url();
    arsp_admin_top('Ars Preuge – pracovný priestor', 'Tímová aplikácia: projekty, granty, podujatia, úlohy, financie a kontakty. Adresa pre tím: <code>' . esc_html($url) . '</code>');
    $tiles = array('projects' => 'projektov', 'events' => 'podujatí', 'grants' => 'grantov', 'tasks' => 'úloh', 'transactions' => 'platieb', 'contacts' => 'kontaktov');
    echo '<div class="arsp-grid">';
    foreach ($tiles as $c => $l) echo '<div class="arsp-stat"><b>' . (isset($n[$c]) ? $n[$c] : 0) . '</b><span>' . esc_html($l) . '</span></div>';
    echo '</div>';
    if (current_user_can('manage_options')) {
        $groups = count(arsp_acc_groups()); $key = arsp_claude_key() !== '';
        echo '<div class="arsp-links">'
            . '<a class="arsp-link" href="' . esc_url(admin_url('admin.php?page=arsp-nastavenia')) . '"><b><span class="dashicons dashicons-admin-generic"></span>Nastavenia</b><span>Kategórie platieb, typy úloh, údaje združenia</span></a>'
            . '<a class="arsp-link" href="' . esc_url(admin_url('admin.php?page=arsp-pristupy')) . '"><b><span class="dashicons dashicons-lock"></span>Prístupy</b><span>Kto čo vidí a smie meniť · skupín: ' . $groups . '</span></a>'
            . '<a class="arsp-link" href="' . esc_url(admin_url('admin.php?page=arsp-ai')) . '"><b><span class="dashicons dashicons-lightbulb"></span>AI</b><span>Napojenie na Claude · ' . ($key ? 'kľúč je nastavený' : 'kľúč nie je nastavený') . '</span></a>'
            . '<a class="arsp-link" href="' . esc_url(admin_url('admin.php?page=arsp-zaloha')) . '"><b><span class="dashicons dashicons-database"></span>Záloha</b><span>Stiahnuť zálohu dát, import</span></a>'
            . '</div>';
    }
    echo '<div class="arsp-card" style="margin-top:16px"><h2>Kto má prístup</h2><p>Administrátori, redaktori (Editor) a používatelia s rolou <b>Tím Ars Preuge</b>. Nového člena pridáte cez <a href="' . esc_url(admin_url('user-new.php')) . '">Používatelia → Pridať nového</a> a zvolíte rolu „Tím Ars Preuge“. Čo presne kto vidí, nastavíte v Prístupoch.</p></div>';
    echo '</div>';
}

/* ---------------------------------------------------------- Prístupy */
function arsp_admin_page_pristupy() {
    if (!current_user_can('manage_options')) return;
    arsp_admin_top('Prístupy', 'Skupiny s právami na jednotlivé oblasti a rozsah (vybrané projekty a podujatia); pridelenie ľuďom.');
    arsp_acc_admin_section();
    echo '</div>';
}

/* ---------------------------------------------------------- AI */
function arsp_admin_page_ai() {
    if (!current_user_can('manage_options')) return;
    arsp_admin_top('AI – napojenie na Claude', 'Načítanie grantovej výzvy a formulára žiadosti cez Claude. Kľúč je uložený len na tomto serveri, tím ho nevidí.');
    echo '<div class="arsp-card">'; arsp_claude_admin_section(); echo '</div>';
    echo '</div>';
}

/* ---------------------------------------------------------- Záloha */
function arsp_admin_page_zaloha() {
    if (!current_user_can('manage_options')) return;
    /* zvyšky dočasných záloh starého nástroja na prenos (odstránený v 1.89.0) */
    foreach (array_merge((array) glob(arsp_upload_dir() . '/zaloha-*.zip'), (array) glob(arsp_upload_dir() . '/import-*.zip')) as $x) { if (is_file($x)) @unlink($x); }
    arsp_admin_top('Záloha', 'Stiahnutie všetkých záznamov pracovného priestoru a ich import.');
    if (isset($_GET['arsp_msg'])) {
        $m = sanitize_key($_GET['arsp_msg']);
        if ($m === 'ok') echo '<div class="notice notice-success is-dismissible"><p>Import hotový – načítaných záznamov: ' . (int) $_GET['arsp_n'] . '.</p></div>';
        elseif ($m === 'big') echo '<div class="notice notice-error"><p>Súbor je väčší, ako server dovolí nahrať (' . esc_html(size_format(wp_max_upload_size())) . '). Požiadajte hosting o zvýšenie limitu <code>upload_max_filesize</code> a <code>post_max_size</code>.</p></div>';
        else echo '<div class="notice notice-error"><p>Import sa nepodaril – skontrolujte, či ste nahrali správny súbor.</p></div>';
    }
    $exp = wp_nonce_url(admin_url('admin-post.php?action=arsp_export'), 'arsp_export');
    echo '<div class="arsp-card"><h2>Stiahnuť zálohu</h2><p>Všetky záznamy (projekty, granty, podujatia, úlohy, platby, kontakty, komentáre, nastavenia) v jednom súbore JSON. Nahrané súbory (zmluvy, faktúry, obrázky) zostávajú na serveri v <code>wp-content/uploads/arsp/</code> – zálohuje ich hosting.</p>'
        . '<p><a class="button button-primary" href="' . esc_url($exp) . '"><span class="dashicons dashicons-download" style="vertical-align:text-bottom"></span> Stiahnuť zálohu dát (JSON)</a></p></div>';
    echo '<div class="arsp-card"><h2>Import dát</h2><p>Nahrajte zálohu <code>.json</code> alebo balík <code>.zip</code> (seed.json s dokumentmi). Záznamy s rovnakým ID sa prepíšu, ostatné zostanú.</p>';
    echo '<form method="post" enctype="multipart/form-data" action="' . esc_url(admin_url('admin-post.php')) . '" class="arsp-row">';
    wp_nonce_field('arsp_import');
    echo '<input type="hidden" name="action" value="arsp_import"><input type="file" name="arsp_file" accept=".zip,.json" required>';
    echo '<button class="button" onclick="return confirm(\'Importovať? Záznamy s rovnakým ID sa prepíšu.\')">Importovať</button> <span class="description">max. ' . esc_html(size_format(wp_max_upload_size())) . '</span></form></div>';
    echo '</div>';
}

/* ---------------------------------------------------------- Nastavenia (spoločné nastavenia aplikácie: záznam settings/main) */
function arsp_settings_get() {
    global $wpdb; $t = arsp_table();
    $row = $wpdb->get_row($wpdb->prepare("SELECT data,updated,deleted FROM $t WHERE col=%s AND id=%s", 'settings', 'main'), ARRAY_A);
    $d = $row && !$row['deleted'] ? json_decode($row['data'], true) : array();
    return array(is_array($d) ? $d : array(), $row ? (int) $row['updated'] : 0);
}
/* zápis ako cez aplikáciu: zlúči zmenené polia (ostatné, napr. poradie v Zabezpečení, ostanú) a posunie čas zmeny – tím ju dostane do 8 sekúnd */
function arsp_settings_save($patch) {
    global $wpdb; $t = arsp_table();
    list($d, $u) = arsp_settings_get();
    foreach ($patch as $k => $v) { if ($v === null) unset($d[$k]); else $d[$k] = $v; }
    $upd = arsp_now_ms(); if ($u >= $upd) $upd = $u + 1;
    $wpdb->replace($t, array('col' => 'settings', 'id' => 'main', 'data' => wp_json_encode((object) $d, JSON_UNESCAPED_UNICODE), 'updated' => $upd, 'deleted' => 0), array('%s', '%s', '%s', '%d', '%d'));
}
function arsp_def_cats() { return array('Honoráre', 'Materiál', 'Služby', 'Technika', 'Propagácia', 'Tlač', 'Cestovné', 'Prenájom', 'Ubytovanie', 'Občerstvenie', 'Bankové poplatky', 'Dotácia', 'Dar / sponzoring', 'Vstupné', 'Členské', 'Iné'); }
function arsp_def_ttypes() { return array('Plagát', 'Podklady', 'Grafika', 'Web/Social', 'Fotenie', 'Tlač', 'Produkcia', 'Administratíva', 'Iné'); }

function arsp_admin_page_nastavenia() {
    if (!current_user_can('manage_options')) return;
    list($s) = arsp_settings_get();
    arsp_admin_top('Nastavenia', 'Spoločné nastavenia pracovného priestoru pre celý tím. Zmeny sa tímu prejavia do niekoľkých sekúnd.');
    if (isset($_GET['arsp_st'])) echo '<div class="notice notice-success is-dismissible"><p>Nastavenia sú uložené.</p></div>';
    $cats = !empty($s['cats']) && is_array($s['cats']) ? $s['cats'] : arsp_def_cats();
    $tt = !empty($s['ttypes']) && is_array($s['ttypes']) ? $s['ttypes'] : arsp_def_ttypes();
    echo '<div class="arsp-card"><h2>Združenie</h2><table class="form-table arsp-facts" role="presentation"><tbody>'
        . '<tr><th>Názov</th><td>Ars Preuge, o. z.</td></tr><tr><th>IČO</th><td>42147018</td></tr><tr><th>DIČ</th><td>2023110408</td></tr>'
        . '<tr><th>Sídlo</th><td>Veľkolehotská cesta 2994/6, 971 01 Prievidza</td></tr><tr><th>Právna forma</th><td>Združenie (zväz, spolok)</td></tr><tr><th>Vznik</th><td>25. 11. 2009</td></tr>'
        . '</tbody></table><p class="description">Tieto údaje sa používajú v zmluvách. Ak sa zmenia, dajte vedieť – upravia sa v programe.</p></div>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    wp_nonce_field('arsp_settings');
    echo '<input type="hidden" name="action" value="arsp_settings">';
    echo '<div class="arsp-gbody" style="padding:0;gap:16px"><div class="arsp-card" style="margin:0"><h2>Kategórie výdavkov a príjmov</h2><p class="description">Jedna kategória na riadok. Kategórie, ktoré tím použije pri platbách alebo ako časti programu podujatí, sa v aplikácii ponúknu aj tak.</p>'
        . '<textarea name="cats" rows="14" style="width:100%;margin-top:8px">' . esc_textarea(implode("\n", $cats)) . '</textarea></div>'
        . '<div class="arsp-card" style="margin:0"><h2>Typy úloh</h2><p class="description">Jeden typ na riadok.</p>'
        . '<textarea name="ttypes" rows="14" style="width:100%;margin-top:8px">' . esc_textarea(implode("\n", $tt)) . '</textarea></div></div>';
    echo '<p class="arsp-save"><button class="button button-primary button-large">Uložiť nastavenia</button></p></form></div>';
}

add_action('admin_post_arsp_settings', function () {
    if (!current_user_can('manage_options')) wp_die('Forbidden');
    check_admin_referer('arsp_settings');
    $lines = function ($k) {
        $o = array();
        foreach (preg_split('/\r\n|\r|\n/', (string) wp_unslash(isset($_POST[$k]) ? $_POST[$k] : '')) as $l) { $l = sanitize_text_field($l); if ($l !== '' && !in_array($l, $o, true)) $o[] = $l; }
        return $o;
    };
    $cats = $lines('cats'); $tt = $lines('ttypes');
    arsp_settings_save(array(
        'cats' => $cats && $cats !== arsp_def_cats() ? $cats : null,       /* zhodné s predvolenými = neukladať (aplikácia ich doplní sama) */
        'ttypes' => $tt && $tt !== arsp_def_ttypes() ? $tt : null,
    ));
    wp_safe_redirect(add_query_arg('arsp_st', '1', admin_url('admin.php?page=arsp-nastavenia'))); exit;
});
