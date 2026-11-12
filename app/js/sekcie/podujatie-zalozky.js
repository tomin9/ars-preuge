/* ===== Podujatie – riadok záložiek a obsah menších záložiek (úlohy, granty, marketing, dokumenty).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-zalozky.js. Nie je to samostatný skript. ===== */
function eventTabs(e){
  const id=esc(e.id),T=S.d.tasks.filter(t=>t.eventId===e.id),P=S.d.partnerships.filter(x=>x.eventId===e.id);
  const ET=evTabsFor(e),tab=ET.find(t=>t[0]===S.evtab)?S.evtab:"texty";
  const cnt={ulohy:T.filter(t=>!isDone(t)).length,granty:related("events",e,"grants").length,dramaturgia:S.d.prog.filter(x=>x.eventId===e.id).length,
    marketing:(()=>{const m=evMkt(e);return Array.isArray(e.mkt)?`${m.filter(x=>x.d).length}/${m.length}`:"";})(),spoluprace:0,dokumenty:(e.docs||[]).length,zabezpecenie:S.d.zab.length};
  const tbar=`<div class="ptabs ntabs" role="tablist" style="margin-top:6px">${ET.map(([k,l])=>`<button role="tab" data-evtab="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(tab==="texty")body=textyTab(e);
  else if(tab==="rozpocet")body=eventBudget(e);
  else if(tab==="zabezpecenie")body=zbPanel();
  else if(tab==="ulohy")body=`<div class="panel">${linkBlock("events",e,"tasks")}</div>`;
  else if(tab==="fotky")body=fotkyTab(e);
  else if(tab==="granty"){const G=related("events",e,"grants");body=G.length?`<div class="gal">${G.map(grantCard).join("")}</div>`:`<div class="panel"><div class="empty">Podujatie zatiaľ nemá granty. Priradíte ich ceruzkou hore (pole Granty).</div></div>`;}
  else if(tab==="dramaturgia"){
    body=`<div class="panel"><h2>Koncept</h2><textarea id="ev-dram" placeholder="Téma, idea, dramaturgická línia podujatia…" style="width:100%;min-height:110px;margin-top:8px">${esc(e.dramaturgy||"")}</textarea></div>${progPanel(e)}`;
  }
  else if(tab==="marketing"){
    const m=evMkt(e);
    body=`<div class="grid2"><div class="panel"><div class="spread"><h2>Propagácia</h2><span class="meta">${m.filter(x=>x.d).length} / ${m.length}</span></div>
      <ul class="cl">${m.map((x,i)=>`<li class="${x.d?"on":""}"><button class="check ${x.d?"on":""}" data-mk="${i}" aria-label="Splnené"></button><span>${esc(x.t)}</span><button class="x" data-mkdel="${i}" aria-label="Odstrániť">×</button></li>`).join("")}</ul>
      <input type="text" id="ev-mk-add" placeholder="+ Pridať kanál alebo krok a Enter" style="width:100%;margin-top:6px"></div>
      <div class="panel"><h2>Texty a poznámky</h2><textarea id="ev-mkt" placeholder="Anotácia, texty na sociálne siete, hashtagy, kontakty na médiá…" style="width:100%;min-height:220px;margin-top:8px">${esc(e.marketing||"")}</textarea></div></div>`;
  }
  else if(tab==="spoluprace")body=teamTab(e);
  else if(tab==="dokumenty"){
    const D=e.docs||[];
    body=`<div class="panel"><div class="spread"><h2>Dokumenty</h2><div class="row"><label class="btn sm" style="cursor:pointer">Nahrať súbor<input type="file" id="ev-doc-file" hidden></label><button class="btn sm" id="ev-doc-link">+ Odkaz</button></div></div>
    ${D.length?`<ul class="items">${D.map((d,i)=>{const href=d.asset?ARSP_BLOB+d.asset:(/^https?:/.test(d.url||"")?d.url:"https://"+(d.url||""));return`<li><a class="t" href="${esc(href)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(d.name||"Dokument")}</a><span class="meta">${d.asset?"súbor":esc((d.url||"").replace(/^https?:\/\//,"").split("/")[0])}</span><button class="x" data-docdel="${i}" aria-label="Odstrániť">×</button></li>`;}).join("")}</ul>`
      :`<div class="empty">Zmluvy, technický rider, scenár, plagát v PDF… Nahrajte PDF či obrázok, alebo vložte odkaz na Google Drive.</div>`}
    <div id="ev-doc-form" hidden style="margin-top:10px"><div class="row"><input type="text" id="ev-doc-name" placeholder="Názov" style="flex:1"><input type="url" id="ev-doc-url" placeholder="https://…" style="flex:2"><button class="btn sm pri" id="ev-doc-save">Uložiť</button></div></div></div>`;
  }
  return tbar+body;
}

