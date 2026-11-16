/* ===== Podujatie – riadok záložiek a obsah menších záložiek (úlohy, granty, dramaturgia).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-zalozky.js. Nie je to samostatný skript. ===== */
function eventTabs(e){
  const id=esc(e.id),T=S.d.tasks.filter(t=>t.eventId===e.id),P=S.d.partnerships.filter(x=>x.eventId===e.id);
  const ET=evTabsFor(e),tab=ET.find(t=>t[0]===S.evtab)?S.evtab:(ET[0]||["podklady"])[0];
  const cnt={ulohy:T.filter(t=>!isDone(t)).length,granty:related("events",e,"grants").length,dramaturgia:S.d.prog.filter(x=>x.eventId===e.id).length,
    marketing:(()=>{const m=evPlan(e).items;return e.mktPlan||Array.isArray(e.mkt)?`${m.filter(x=>x.d).length}/${m.length}`:"";})(),spoluprace:0,dokumenty:(e.docs||[]).length,zabezpecenie:S.d.zab.length};
  const tbar=`<div class="ptabs ntabs" role="tablist" style="margin-top:6px">${ET.map(([k,l])=>`<button role="tab" data-evtab="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(tab==="podklady")body=podkladyTab(e);   /* od 2.0.54 obsahuje aj doterajšie Texty a Dokumenty */
  else if(tab==="rozpocet")body=eventBudget(e);
  else if(tab==="zabezpecenie")body=zbPanel();
  else if(tab==="ulohy")body=`<div class="panel">${linkBlock("events",e,"tasks")}</div>`;
  else if(tab==="fotky")body=fotkyTab(e);
  else if(tab==="granty"){const G=related("events",e,"grants");body=G.length?`<div class="gal">${G.map(grantCard).join("")}</div>`:`<div class="panel"><div class="empty">Podujatie zatiaľ nemá granty. Priradíte ich ceruzkou hore (pole Granty).</div></div>`;}
  else if(tab==="dramaturgia")body=dramaturgiaTab(e);   /* od 2.0.68 v podobe Podkladov: ikony, zoznam, vybraný prvok */
  else if(tab==="marketing")body=marketingTab(e);
  else if(tab==="spoluprace")body=teamTab(e);
  return tbar+body;
}

