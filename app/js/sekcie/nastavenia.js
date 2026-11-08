/* ===== Sekcia Nastavenia: údaje združenia, počiatočné zostatky, kategórie, typy úloh.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/nastavenia.js. Nie je to samostatný skript. ===== */
/* ----- Nastavenia ----- */
VIEWS.nastavenia=()=>{
  const s=S.settings;
  return`<div class="head"><div><h1>Nastavenia</h1><p class="sub">Údaje združenia a spoločné nastavenia pre celý tím</p></div></div>
  <div class="grid2"><div class="panel"><h2 style="margin-bottom:10px">Združenie</h2>
    <div class="facts" style="margin:0"><div><span>Názov</span><b>${esc(ORG.name)}</b></div><div><span>IČO</span><b>${ORG.ico}</b></div><div><span>DIČ</span><b>${ORG.dic}</b></div>
    <div><span>Sídlo</span><b>${esc(ORG.seat)}</b></div><div><span>Právna forma</span><b>${esc(ORG.form)}</b></div><div><span>Vznik</span><b>${ORG.since}</b></div></div></div>
  <div class="panel"><h2 style="margin-bottom:10px">Počiatočné zostatky</h2><p class="small muted" style="margin:0 0 10px">Stav peňazí pred prvým záznamom v denníku. Z nich sa počíta priebežný zostatok.</p>
    <div class="row"><label class="small">Banka <input type="number" step="0.01" id="st-bank" value="${esc(s.openBank??"")}" style="width:140px"></label><label class="small">Pokladňa <input type="number" step="0.01" id="st-cash" value="${esc(s.openCash??"")}" style="width:140px"></label></div></div>
  <div class="panel"><h2 style="margin-bottom:6px">Kategórie výdavkov a príjmov</h2><p class="small muted" style="margin:0 0 8px">Jedna kategória na riadok.</p><textarea id="st-cats" rows="8">${esc(cats().join("\n"))}</textarea></div>
  <div class="panel"><h2 style="margin-bottom:6px">Typy úloh</h2><p class="small muted" style="margin:0 0 8px">Jeden typ na riadok.</p><textarea id="st-types" rows="8">${esc(ttypes().join("\n"))}</textarea></div></div>
  <div class="panel" style="margin-top:20px"><h2 style="margin-bottom:6px">Prístup tímu</h2><p class="small" style="margin:0">Aplikáciu zdieľate cez tlačidlo zdieľania. Kto má upravovať, potrebuje úroveň Prispievateľ alebo vyššiu; Divák má len čítanie. Upravovať môžu členovia vašej organizácie v claude.ai.</p></div>`;
};

