/* ===== Sekcia Granty: zoznam a detail grantu (výzva, žiadosť, zmluva, rozpočet, úlohy, podujatia), doplnenie údajov o výzve.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/granty.js. Nie je to samostatný skript. ===== */
/* ----- Granty ----- */
const GCOLS=[["Príprava",["napad","priprava","pozastavene"]],["Podané",["podane"]],["Schválené",["schvalene"]],["Zrealizované",["zrealizovane"]],["Uzavreté",["vyuctovane","nepodporene"]]];
function nextGrantDate(g){
  const c=[["Uzávierka",g.submitTo,["napad","priprava"]],["Koniec realizácie",g.realTo,["schvalene"]],["Vyúčtovanie",g.settleDue,["schvalene","zrealizovane"]]];
  for(const[l,d,st]of c)if(d&&st.includes(g.status))return[l,d];return null;
}
const GTABS=[["planovane","Plánované",["napad","priprava","pozastavene"]],["prebieha","Prebieha",["podane","schvalene"]],["zrealizovane","Zrealizované",["zrealizovane","vyuctovane"]],["nepodporene","Nepodporené",["nepodporene"]]];
const GRADS=["linear-gradient(180deg,#8fd0d2,#e0726a)","linear-gradient(135deg,#2f5fa8 10%,#c2412f)","#efc06a","#df605a","linear-gradient(135deg,#5a4fd8,#e06a8c)","linear-gradient(165deg,#a8c3a6,#e2562f)","linear-gradient(135deg,#c7a7d8,#f1d9c9 60%,#8fc2c4)"];
function gradFor(id){let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return GRADS[h%GRADS.length];}
function grantCard(g){
  const u=coverUrl(g),amt=+g.approved||+g.requested||0;
  return`<div class="gcard" data-open="grants:${esc(g.id)}" tabindex="0" role="link"><div class="gimg" style="background:${gradFor(g.id)}">${u?`<img src="${esc(u)}" alt="" loading="lazy" style="object-position:${esc(posOf(g))}">`:""}</div>
  <div class="gbody"><b>${esc(g.name||"Grant")}</b>${provName(g)?`<div class="gl">${provIcon(g)}${esc(provName(g))}</div>`:""}${amt?`<div class="gl" style="color:var(--ink)">${eur(amt)}</div>`:""}</div></div>`;
}
VIEWS.granty=()=>{
  const G=S.d.grants,tab=GTABS.find(t=>t[0]===S.gf.tab)||GTABS[1];
  const list=G.filter(g=>tab[2].includes(g.status||"napad")).sort((a,b)=>(b.realFrom||b.submitTo||"").localeCompare(a.realFrom||a.submitTo||"")||(b.createdAt||0)-(a.createdAt||0));
  const defs=esc(JSON.stringify({status:tab[2][0]}));
  const head=`<div class="head"><h1>Granty</h1><div class="row"><div class="tabs"><button data-gmode="gallery" aria-pressed="${S.gf.mode!=="list"}">Galéria</button><button data-gmode="list" aria-pressed="${S.gf.mode==="list"}">Tabuľka</button></div><button class="btn pri" data-create="grants" data-defs='${defs}'>Nový grant</button></div></div>
  <div class="ptabs" role="tablist">${GTABS.map(([k,l,sts])=>{const n=G.filter(g=>sts.includes(g.status||"napad")).length;return`<button role="tab" data-gtab="${k}" aria-selected="${tab[0]===k}">${l}${n?`<span>${n}</span>`:""}</button>`;}).join("")}</div>`;
  if(S.gf.mode==="list")return head+`<div class="panel">${list.length?table([
    ["Grant",g=>`<span class="cut">${esc(g.name||"Grant")}</span>`,"t"],["Poskytovateľ",g=>provIcon(g)+esc(provName(g))],["Stav",g=>chip("gstat",g.status)],["Projekt",g=>pdot(g.projectId)],
    ["Žiadané",g=>g.requested?eur0(g.requested):"","num"],["Schválené",g=>g.approved?eur0(g.approved):"","num"],["Zaplatené",g=>{const c=grantCalc(g);return c.paidG?eur0(c.paidG):"";},"num"],
    ["Najbližší termín",g=>{const n=nextGrantDate(g);return n?`<span class="meta">${n[0]} </span>${dueHtml(n[1])}`:"";}]
  ],list,g=>"grants:"+esc(g.id),`<td colspan="4">Spolu</td><td class="num">${eur0(sum(list,g=>g.requested))}</td><td class="num">${eur0(sum(list,g=>g.approved))}</td><td class="num">${eur0(sum(list,g=>grantCalc(g).paidG))}</td><td></td>`):`<div class="empty">V tejto skupine nie sú žiadne granty.</div>`}</div>`;
  return head+`<div class="gal">${list.map(grantCard).join("")}<button class="gnew" data-create="grants" data-defs='${defs}'>+ Nový grant</button></div>`;
};
VIEWS.grant=()=>{
  const g=get("grants",S.id);if(!g)return`<div class="empty">Grant sa nenašiel.<br><button class="btn" data-go="granty">Späť na granty</button></div>`;
  const c=grantCalc(g),p=get("projects",g.projectId),Ln=S.d.lines.filter(l=>l.grantId===g.id);
  const T=S.d.tasks.filter(t=>t.grantId===g.id),E=related("grants",g,"events");
  const def={grantId:g.id,projectId:g.projectId||""};const td=today();
  const step=(label,d,doneSt)=>{const done=doneSt.includes(g.status);const n=daysTo(d);const cls=done?"done":d&&n<0?"bad":d&&n<=30?"now":"";
    return`<div class="${cls}"><span>${label}</span><b>${d?fdate(d):"—"}</b>${d&&!done?`<span>${n<0?`<span class="late">pred ${-n} d</span>`:n===0?'<span class="late">dnes</span>':`o ${n} d`}</span>`:done?'<span>hotovo</span>':""}</div>`;};
  const lt=Ln.map(l=>({l,c:lineCalc(l)}));
  const unassigned=c.L.filter(x=>x.type!=="prijem"&&!x.lineId);
  const cofinOk=c.cofinReq?c.sc>=c.cofinReq:true;
  const cl=g.checklist||[];
  const gtab=GRTABS.find(t=>t[0]===S.grtab)?S.grtab:"vyzva";
  const gcnt={ulohy:T.filter(t=>!isDone(t)).length,rozpocet:Ln.length,podujatia:E.length};
  const tbar=`<div class="ptabs ntabs" role="tablist" style="margin-top:6px">${GRTABS.map(([k,l])=>`<button role="tab" data-grtab="${k}" aria-selected="${gtab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(gtab==="vyzva"){const TA=(f,l,ph,h)=>`<div class="panel"><h3 style="margin-bottom:6px">${l}</h3><textarea data-gf="${f}" placeholder="${ph}" style="width:100%;min-height:${h||120}px">${esc(g[f]||"")}</textarea></div>`;
    body=`<div class="docslots">${docSlot("grants",g,"vyzva","Výzva","text výzvy, podmienky, prílohy")}${GDOCS.map(([k,l,h])=>docSlot("grants",g,k,l,h)).join("")}${(g.docs||[]).some(d=>!["vyzva","ziadost","zmluva","vyuctovanie"].includes(d.kind||""))?docSlot("grants",g,"","Ostatné",""):""}</div>
    <div class="panel" style="margin-top:20px"><div class="spread"><h2>Údaje o výzve</h2><span class="row" style="gap:6px"><button class="btn sm" data-aivyzva="${esc(g.id)}" title="Claude prečíta výzvu (odkaz alebo PDF) a navrhne údaje">Načítať výzvu</button><button class="btn ghost sm" data-callimp="${esc(g.id)}" title="Vložiť údaje o výzve ručne (text od Claude)">Vložiť ručne</button><button class="btn sm" data-peek="grants:${esc(g.id)}">Upraviť</button></span></div>
      <div class="facts" style="margin-top:10px"><div><span>Poskytovateľ</span><b>${esc(provName(g)||"—")}</b></div><div><span>Program / výzva</span><b>${esc([g.callNo,g.program].filter(Boolean).join(" · ")||"—")}</b></div><div><span>Podávanie žiadostí</span><b>${g.callOpen?fdate(g.callOpen):"—"}${g.submitTo?" → "+fdate(g.submitTo):""}</b></div>
        <div><span>Výška dotácie</span><b>${g.callMin||g.callMax?`${g.callMin?eur(g.callMin):"—"} – ${g.callMax?eur(g.callMax):"—"}`:"—"}</b></div><div><span>Spolufinancovanie</span><b>${esc(g.cofinPct||"—")}</b></div><div><span>Čerpanie od</span><b>${g.spendFrom?fdate(g.spendFrom):"—"}</b></div></div>
      ${g.callUrl?`<div class="row" style="margin-top:12px"><a class="btn sm" href="${esc(/^https?:/.test(g.callUrl)?g.callUrl:"https://"+g.callUrl)}" target="_blank" rel="noopener">Otvoriť výzvu</a></div>`:""}</div>
    <div class="grid2" style="margin-top:20px">${TA("callApplicants","Kto môže žiadať","Oprávnení žiadatelia…")}${TA("callPurpose","Na čo možno dotáciu použiť","Oprávnené aktivity a výdavky…")}</div>
    <div class="grid2" style="margin-top:20px">${TA("callAttach","Povinné prílohy a podmienky","Prílohy, limity počtu žiadostí…")}${TA("callText","Poznámky k výzve","Kritériá hodnotenia, dôležité termíny…")}</div>`;}
  else if(gtab==="ziadost")body=grantAppTab(g);
  else if(gtab==="ulohy")body=`<div class="panel"><div class="spread"><h2>Úlohy</h2><button class="btn sm" data-create="tasks" data-defs='${esc(JSON.stringify(def))}'>+ Úloha</button></div>
        ${T.length?`<ul class="items">${T.sort((a,b)=>isDone(a)-isDone(b)||byDue(a,b)).map(taskLi).join("")}</ul>`:`<div class="empty">Ku grantu zatiaľ nie sú úlohy. Pridajte napríklad vyúčtovanie, záverečnú správu alebo zverejnenie loga poskytovateľa.</div>`}</div>
    <div class="grid2" style="margin-top:20px"><div class="panel"><div class="spread"><h2>Postup</h2><span class="meta">${cl.filter(x=>x.d).length} / ${cl.length}</span></div>
        <ul class="cl">${cl.map((x,i)=>`<li class="${x.d?"on":""}"><button class="check ${x.d?"on":""}" data-ck-toggle="grants:${esc(g.id)}" data-i="${i}" aria-label="Splnené"></button><span>${esc(x.t)}</span></li>`).join("")}</ul>
        <input type="text" id="g-ck-add" placeholder="+ Pridať krok a Enter" style="width:100%;margin-top:6px"></div><div class="panel">${linkBlock("grants",g,"contacts")}</div></div>`;
  else if(gtab==="rozpocet")body=grantBudgetTab(g);
  else body=`<div class="panel"><div class="spread"><h2>Podujatia</h2><button class="btn sm" data-create="events" data-defs='${esc(JSON.stringify(def))}'>+ Podujatie</button></div>
        ${E.length?`<ul class="items">${E.map(eventLi).join("")}</ul>`:`<div class="empty">Žiadne podujatia.</div>`}</div>`;
  const cov=coverUrl(g),PEN='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  return`  <section class="hero evc cov" style="--pc:${esc(p?p.color:OCHRE)}">${cov?`<div class="evimg"><img src="${esc(cov)}" alt="" style="object-position:${esc(posOf(g))}"></div>`:`<div class="evimg" style="background:${gradFor(g.id)}"></div>`}
  <div class="evinfo ginfo"><div class="spread" style="align-items:flex-start;flex-wrap:nowrap"><div style="min-width:0"><h1>${esc(g.name||"Grant")}</h1><p class="sub">${provIcon(g)}${[provName(g),g.program].filter(Boolean).map(esc).join(" · ")}${p?` · projekt <button class="btn ghost sm" data-go="projekt" data-id="${esc(p.id)}">${esc(p.name)}</button>`:""}</p></div>
    <div class="row" style="flex:none;flex-wrap:nowrap;gap:8px">${chip("gstat",g.status)}<button class="evedit" data-peek="grants:${esc(g.id)}" title="Upraviť" aria-label="Upraviť grant">${PEN}</button></div></div>
    <div class="facts">${g.approved?`<div><span>Schválené</span><b>${eur(g.approved)}</b>${g.requested&&+g.requested!==+g.approved?`<span>žiadané ${eur(g.requested)}</span>`:""}</div>`:`<div><span>Žiadané</span><b>${g.requested?eur(g.requested):"—"}</b></div>`}
      <div><span>Zaplatené z dotácie</span><b>${eur(c.paidG)}</b>${c.planG?`<span>+ plánované ${eur(c.planG)}</span>`:""}</div><div><span>Zostáva z dotácie</span><b class="${c.appr-c.paidG-c.planG<-0.005?"neg":""}">${g.approved?eur(c.appr-c.paidG-c.planG):"—"}</b>${g.approved&&c.planG?`<span>po zaplatení plánovaných</span>`:""}</div>
      ${c.cofinReq||c.sc?`<div><span>Spolufinancovanie</span><b class="${cofinOk?"":"warn"}">${eur(c.sc)}${c.cofinReq?` / ${eur(c.cofinReq)}`:""}</b></div>`:""}${c.rec?`<div><span title="Prijaté od poskytovateľa">Prijaté</span><b class="pos">${eur(c.rec)}</b></div>`:""}</div>
    ${g.approved?`<div class="barline" style="margin-top:14px">${bar(c.paidG,c.appr,p&&p.color,c.planG)}<span class="meta">zaplatené ${pct(c.paidG,c.appr)} %${c.planG?` · s plánovanými ${pct(c.paidG+c.planG,c.appr)} %`:""}</span></div>`:""}
    ${g.formUrl||folderId(g.driveFolder)?`<div class="row" style="margin-top:14px">${g.formUrl?`<a class="btn sm" href="${esc(/^https?:/.test(g.formUrl)?g.formUrl:"https://"+g.formUrl)}" target="_blank" rel="noopener">Žiadosť / systém</a>`:""}${folderId(g.driveFolder)?`<a class="btn sm" href="https://drive.google.com/drive/folders/${esc(folderId(g.driveFolder))}" target="_blank" rel="noopener">Priečinok na Disku</a>`:""}</div>`:""}
    ${g.note?`<p class="desc">${esc(g.note)}</p>`:""}
    <div class="tl">${step("Uzávierka žiadosti",g.submitTo,["podane","schvalene","zrealizovane","vyuctovane","nepodporene"])}${step("Začiatok realizácie",g.realFrom,["zrealizovane","vyuctovane"].concat(g.realFrom&&g.realFrom<=td?["schvalene"]:[]))}${step("Koniec realizácie",g.realTo,["zrealizovane","vyuctovane"])}${step("Vyúčtovanie",g.settleDue,["vyuctovane"])}</div></div></section>
  ${tbar}${body}`;
};

/* všeobecný import údajov o výzve: vložený JSON (napr. od Claude) vyplní polia výzvy */
const CALLF={callNo:"t",program:"t",callOpen:"d",submitTo:"d",callMin:"n",callMax:"n",cofinPct:"t",spendFrom:"d",callUrl:"t",callApplicants:"t",callPurpose:"t",callAttach:"t",callText:"t",realFrom:"d",realTo:"d",settleDue:"d",requested:"n",cofinReq:"n"};
const CALLEX='{\n  "callNo": "Výzva č. 1/2027",\n  "program": "názov programu",\n  "callOpen": "2026-10-19",\n  "submitTo": "2026-11-16",\n  "callMin": 1000,\n  "callMax": 60000,\n  "cofinPct": "10 % z rozpočtu projektu",\n  "spendFrom": "2027-01-01",\n  "callApplicants": "kto môže žiadať",\n  "callPurpose": "na čo možno použiť",\n  "callAttach": "povinné prílohy",\n  "callText": "poznámky, kritériá"\n}';
function callImport(id){
  const g=get("grants",id);if(!g)return;const L=$("#layer2");
  L.innerHTML=`<div class="scrim"><div class="modal" role="dialog" aria-modal="true" style="max-width:640px;width:92vw"><h3 style="margin:0 0 6px">Doplniť údaje o výzve</h3><p class="small" style="margin:0 0 8px">Pošlite Claude odkaz na výzvu alebo jej text a vložte sem údaje, ktoré vám vráti. Vyplnia sa len polia, ktoré sú v texte uvedené.</p><textarea id="ci-t" spellcheck="false" placeholder="${esc(CALLEX)}" style="width:100%;min-height:240px;font-family:ui-monospace,Menlo,monospace;font-size:13px"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-a="0">Zrušiť</button><button class="btn pri" data-a="1">Doplniť</button></div></div></div>`;
  const done=()=>{L.innerHTML="";};const t=$("#ci-t");t.focus();
  L.querySelector('[data-a="0"]').onclick=done;
  L.querySelector('[data-a="1"]').onclick=()=>{
    let o;try{o=JSON.parse(t.value.trim().replace(/^```(?:json)?\s*|\s*```$/g,""));}catch(_){toast("Text nie je platný — vložte údaje v tvare, aký vidíte v ukážke.");return;}
    if(!o||typeof o!=="object"||Array.isArray(o)){toast("Text nie je platný.");return;}
    const patch={};Object.keys(CALLF).forEach(k=>{let v=o[k];if(v===undefined||v===null||v==="")return;
      if(CALLF[k]==="n"){v=+String(v).replace(/\s/g,"").replace(",",".");if(!isFinite(v))return;}
      else if(CALLF[k]==="d"){v=String(v).trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return;}
      else v=String(v);
      patch[k]=v;});
    if(!Object.keys(patch).length){toast("V texte som nenašiel žiadne známe polia.");return;}
    done();upd("grants",id,patch);toast("Doplnených polí: "+Object.keys(patch).length+".");};
}
const GRTABS=[["vyzva","Výzva"],["ziadost","Žiadosť"],["rozpocet","Rozpočet"],["ulohy","Úlohy"],["podujatia","Podujatia"]];  /* záložka Zmluva zrušená (1.70.0): dokumenty sú v hlavnej karte, Postup a kontakty v Úlohách */
const GDOCS=[["ziadost","Žiadosť","podaná žiadosť, prílohy, rozpočet zo žiadosti"],["zmluva","Zmluva","zmluva o poskytnutí dotácie, dodatky"],["vyuctovanie","Vyúčtovanie","vyúčtovanie, záverečná správa, doklady"]];
