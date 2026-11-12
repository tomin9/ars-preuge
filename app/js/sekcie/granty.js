/* ===== Sekcia Granty: zoznam a detail grantu (výzva, žiadosť, zmluva, rozpočet, úlohy, podujatia), doplnenie údajov o výzve.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/granty.js. Nie je to samostatný skript. ===== */
/* ----- Granty ----- */
const GCOLS=[["Príprava",["napad","priprava","pozastavene"]],["Podané",["podane"]],["Schválené",["schvalene"]],["Zrealizované",["zrealizovane"]],["Uzavreté",["vyuctovane","nepodporene"]]];
function nextGrantDate(g){
  const c=[["Uzávierka",g.submitTo,["napad","priprava"]],["Koniec realizácie",g.realTo,["schvalene"]],["Vyúčtovanie",g.settleDue,["schvalene","zrealizovane"]]];
  for(const[l,d,st]of c)if(d&&st.includes(g.status))return[l,d];return null;
}
/* od 2.0.16: Plánované (aj podané – čaká sa na rozhodnutie) · Schválené · Zrealizované · Nepodporené; posledný stav = stav nového grantu v záložke */
const GTABS=[["planovane","Plánované",["priprava","podane","pozastavene","napad"]],["schvalene","Schválené",["schvalene"]],["zrealizovane","Zrealizované",["vyuctovane","zrealizovane"]],["nepodporene","Nepodporené",["nepodporene"]]];
const GRADS=["linear-gradient(180deg,#8fd0d2,#e0726a)","linear-gradient(135deg,#2f5fa8 10%,#c2412f)","#efc06a","#df605a","linear-gradient(135deg,#5a4fd8,#e06a8c)","linear-gradient(165deg,#a8c3a6,#e2562f)","linear-gradient(135deg,#c7a7d8,#f1d9c9 60%,#8fc2c4)"];
function gradFor(id){let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return GRADS[h%GRADS.length];}
function grantCard(g){
  const u=coverUrl(g,640),amt=+g.approved||+g.requested||0;
  return`<div class="gcard" data-open="grants:${esc(g.id)}" tabindex="0" role="link"><div class="gimg" style="background:${gradFor(g.id)}">${u?`<img src="${esc(u)}" alt="" loading="lazy" style="object-position:${esc(posOf(g))}">`:""}</div>
  <div class="gbody"><b>${esc(g.name||"Grant")}</b>${provName(g)?`<div class="gl">${provIcon(g)}${esc(provName(g))}</div>`:""}${g.program?`<div class="gl" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(g.program)}">${esc(g.program)}</div>`:""}${amt?`<div class="gl" style="color:var(--ink)">${eur(amt)}</div>`:""}</div></div>`;
}
VIEWS.granty=()=>{
  const G=S.d.grants,tab=GTABS.find(t=>t[0]===S.gf.tab)||GTABS[1];
  const list=G.filter(g=>tab[2].includes(g.status||"napad")).sort((a,b)=>(b.realFrom||b.submitTo||"").localeCompare(a.realFrom||a.submitTo||"")||(b.createdAt||0)-(a.createdAt||0));
  const defs=esc(JSON.stringify({status:tab[2][0]}));
  const head=`<div class="head"><h1>Granty</h1></div>
  <div class="ptabs" role="tablist">${GTABS.map(([k,l])=>`<button role="tab" data-gtab="${k}" aria-selected="${tab[0]===k}">${l}</button>`).join("")}</div>`;
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
  const GRT=GRTABS.filter(t=>(t[0]!=="ulohy"||accRead("tasks"))&&(t[0]!=="podujatia"||accRead("events")));
  const gtab=GRT.find(t=>t[0]===S.grtab)?S.grtab:"vyzva";
  const gcnt={ulohy:T.filter(t=>!isDone(t)).length,rozpocet:Ln.length,podujatia:E.length};
  const tbar=`<div class="ptabs ntabs" role="tablist" style="margin-top:6px">${GRT.map(([k,l])=>`<button role="tab" data-grtab="${k}" aria-selected="${gtab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(gtab==="vyzva")body=grantCallTab(g);  /* vzhľad ako Texty podujatia – grant-nacitanie.js */
  else if(gtab==="ziadost")body=grantAppTab(g);
  else if(gtab==="ulohy")body=`<div class="panel"><div class="spread"><h2>Úlohy</h2><button class="btn sm" data-create="tasks" data-defs='${esc(JSON.stringify(def))}'>+ Úloha</button></div>
        ${T.length?`<ul class="items">${T.sort((a,b)=>isDone(a)-isDone(b)||byDue(a,b)).map(taskLi).join("")}</ul>`:`<div class="empty">Ku grantu zatiaľ nie sú úlohy. Pridajte napríklad vyúčtovanie, záverečnú správu alebo zverejnenie loga poskytovateľa.</div>`}</div>
    <div class="grid2" style="margin-top:20px"><div class="panel"><div class="spread"><h2>Postup</h2><span class="meta">${cl.filter(x=>x.d).length} / ${cl.length}</span></div>
        <ul class="cl">${cl.map((x,i)=>`<li class="${x.d?"on":""}"><button class="check ${x.d?"on":""}" data-ck-toggle="grants:${esc(g.id)}" data-i="${i}" aria-label="Splnené"></button><span>${esc(x.t)}</span></li>`).join("")}</ul>
        <input type="text" id="g-ck-add" placeholder="+ Pridať krok a Enter" style="width:100%;margin-top:6px"></div><div class="panel">${linkBlock("grants",g,"contacts")}</div></div>`;
  else if(gtab==="rozpocet")body=grantBudgetTab(g);
  else if(gtab==="dokumenty")body=gDocsTab(g);
  else{const ed={grantIds:[g.id]};if(g.projectId)ed.projectId=g.projectId;  /* podujatia ako karty – rovnako ako granty v podujatí */
    body=`<div class="gal">${E.map(eventCard).join("")}<button class="gnew" data-create="events" data-defs='${esc(JSON.stringify(ed))}'>+ Nové podujatie</button></div>`;}
  const cov=coverUrl(g,640),PEN='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  return`  <section class="hero evc cov" style="--pc:${esc(p?p.color:OCHRE)}">${cov?`<div class="evimg"><img src="${esc(cov)}" alt="" style="object-position:${esc(posOf(g))}"></div>`:`<div class="evimg" style="background:${gradFor(g.id)}"></div>`}
  <div class="evinfo ginfo"><div class="spread" style="align-items:flex-start;flex-wrap:nowrap"><div style="min-width:0"><h1>${esc(g.name||"Grant")}</h1><p class="sub">${provIcon(g)}${[provName(g),g.program].filter(Boolean).map(esc).join(" · ")}${p?` · projekt <button class="btn ghost sm" data-go="projekt" data-id="${esc(p.id)}">${esc(p.name)}</button>`:""}</p></div>
    <div class="row" style="flex:none;flex-wrap:nowrap;gap:8px">${chip("gstat",g.status)}${driveIco(folderId(g.driveFolder))}<button class="evedit" data-peek="grants:${esc(g.id)}" title="Upraviť" aria-label="Upraviť grant">${PEN}</button></div></div>
    <div class="facts">${g.approved?`<div><span>Schválené</span><b>${eur(g.approved)}</b>${g.requested&&+g.requested!==+g.approved?`<span>žiadané ${eur(g.requested)}</span>`:""}</div>`:`<div><span>Žiadané</span><b>${g.requested?eur(g.requested):"—"}</b></div>`}
      <div><span>Zaplatené z dotácie</span><b>${eur(c.paidG)}</b>${c.planG?`<span>+ plánované ${eur(c.planG)}</span>`:""}</div><div><span>Zostáva z dotácie</span><b class="${c.appr-c.paidG-c.planG<-0.005?"neg":""}">${g.approved?eur(c.appr-c.paidG-c.planG):"—"}</b>${g.approved&&c.planG?`<span>po zaplatení plánovaných</span>`:""}</div>
      ${c.cofinReq||c.sc?`<div><span>Spolufinancovanie</span><b class="${cofinOk?"":"warn"}">${eur(c.sc)}${c.cofinReq?` / ${eur(c.cofinReq)}`:""}</b></div>`:""}${c.rec?`<div><span title="Prijaté od poskytovateľa">Prijaté</span><b class="pos">${eur(c.rec)}</b></div>`:""}</div>
    ${g.approved?`<div class="barline" style="margin-top:14px">${bar(c.paidG,c.appr,p&&p.color,c.planG)}<span class="meta">zaplatené ${pct(c.paidG,c.appr)} %${c.planG?` · s plánovanými ${pct(c.paidG+c.planG,c.appr)} %`:""}</span></div>`:""}
    ${g.formUrl?`<div class="row" style="margin-top:14px"><a class="btn sm" href="${esc(/^https?:/.test(g.formUrl)?g.formUrl:"https://"+g.formUrl)}" target="_blank" rel="noopener">Žiadosť / systém</a></div>`:""}
    <!-- poznámka grantu sa v karte neukazuje (je v bočnom paneli cez ceruzku) -->
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
const GRTABS=[["vyzva","Výzva"],["ziadost","Žiadosť"],["rozpocet","Rozpočet"],["ulohy","Úlohy"],["podujatia","Podujatia"],["dokumenty","Dokumenty"]];  /* záložka Zmluva zrušená (1.70.0): dokumenty sú v hlavnej karte, Postup a kontakty v Úlohách */
const GDOCS=[["ziadost","Žiadosť","podaná žiadosť, prílohy, rozpočet zo žiadosti"],["zmluva","Zmluva","zmluva o poskytnutí dotácie, dodatky"],["vyuctovanie","Vyúčtovanie","vyúčtovanie, záverečná správa, doklady"]];

/* ===== Grant – záložka Dokumenty (od 2.0.8): sekcie s náhľadmi dokumentov. Pevné sekcie Výzva · Žiadosť · Zmluva · Vyúčtovanie sa dajú
   premenovať (g.docNames {druh: názov}), vlastné sekcie sú v g.docSecs [{id,label}] (dokument má kind = id sekcie).
   Dokumenty bez známej sekcie sa ukážu v „Ostatné“. Nahrávanie a odkazy idú cez spoločné data-dfile / data-dlink (64-dokumenty-nahravanie.js). */
const GD_BASE=[["vyzva","Výzva"],["ziadost","Žiadosť"],["zmluva","Zmluva"],["vyuctovanie","Vyúčtovanie"]];
const GD_I={up:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5M7 10l5-5 5 5M5 20h14"/></svg>',
  link:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  del:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>'};
const gdSecs=g=>[...GD_BASE.filter(([k])=>!(g.docHidden||[]).includes(k)).map(([k,l])=>({id:k,label:(g.docNames||{})[k]||l,base:true})),   /* odstránené pevné sekcie sú v g.docHidden */...(Array.isArray(g.docSecs)?g.docSecs:[]).map(x=>({id:x.id,label:x.label||"Nová sekcia"}))];
function gdThumb(d){   /* náhľad: obrázok, prvá strana PDF, náhľad z Google Disku, inak ikona s príponou */
  const nm=d.name||"Dokument",ext=(nm.split(".").pop()||"").toLowerCase(),href=docHref(d);
  const m=String(d.driveId||"").trim()||((/drive\.google\.com\/file\/d\/([\w-]{10,})/.exec(d.url||"")||[])[1]||"");
  const FI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>';
  const lbl=d.asset&&ext&&ext.length<=4?ext.toUpperCase():/drive\.google|docs\.google/.test(d.url||"")?"DISK":"ODKAZ";
  const fb=`<div class="dfi">${FI}<span>${esc(lbl)}</span></div>`;
  if(d.asset&&/^(png|jpe?g|gif|webp|avif|svg)$/.test(ext))return`${fb}<img src="${esc(href)}" alt="" loading="lazy" onerror="this.remove()">`;
  if(d.asset&&ext==="pdf")return`${fb}<canvas data-pdfthumb="${esc(href)}" hidden></canvas>`;
  if(m)return`${fb}<img src="https://drive.google.com/thumbnail?id=${esc(m)}&sz=w300" alt="" loading="lazy" onerror="this.remove()">`;
  return fb;}
S._gdsel=S._gdsel||{};
function gDocsTab(g){   /* ako Výzva a Žiadosť: zoznam sekcií vľavo, vybraná sekcia s náhľadmi vpravo */
  const gid=esc(g.id),ed=accEditRec("grants",g)&&!S.readOnly,all=(g.docs||[]).map((d,i)=>({d,i})),S2=gdSecs(g),ids=new Set(S2.map(x=>x.id));
  const other=all.filter(x=>!ids.has(x.d.kind||""));if(other.length)S2.push({id:"__ine",label:"Ostatné",fixed:true});
  const docsOf=s=>s.id==="__ine"?other:all.filter(x=>(x.d.kind||"")===s.id);
  const sel=S2.find(s=>s.id===S._gdsel[g.id])||S2[0];
  const FOLDER='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2.5h7.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>';
  const list=S2.map(s=>`<button type="button" class="txi${s.id===sel.id?" on":""}" data-gdsel="${gid}|${esc(s.id)}">${FOLDER}<span class="txt"><b>${esc(s.label)}</b></span></button>`).join("")
    +(ed?`<div class="gdsep"></div><button type="button" class="txi txadd" data-gdadd="${gid}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať sekciu</b></span></button>`:"");
  const D=docsOf(sel),kind=sel.id==="__ine"?"ostatne":sel.id,key=`grants:${gid}:${esc(kind)}`;
  const main=`<div class="panel txmain docslot gdmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dokumenty / ${esc(g.name||"Grant")}</div>
      ${ed&&!sel.fixed?`<input type="text" class="txtitle" data-gdname="${gid}|${esc(sel.id)}" value="${esc(sel.label)}" aria-label="Názov sekcie" maxlength="80" placeholder="Názov sekcie">`:`<div class="txtitle" style="font-size:28px;font-weight:600">${esc(sel.label)}</div>`}</div>
      ${ed?`<div class="row" style="flex:none;gap:4px"><label class="tplus" title="Nahrať súbor" aria-label="Nahrať súbor">${GD_I.up}<input type="file" multiple data-dfile="${key}" hidden></label><button type="button" class="tplus" data-dlink="${key}" title="Pridať odkaz" aria-label="Pridať odkaz">${GD_I.link}</button>${sel.fixed?"":`<button type="button" class="tplus tdel" data-gddel="${gid}|${esc(sel.id)}" title="Odstrániť sekciu" aria-label="Odstrániť sekciu">${GD_I.del}</button>`}</div>`:""}</div>
    <div class="gdbody">${D.length?`<div class="gdgrid">${D.map(({d,i})=>`<div class="gdt"><a class="gdth" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Dokument")}">${gdThumb(d)}</a>${ed?`<button type="button" class="gdrm" data-docrm="grants:${gid}:${i}" title="Odstrániť dokument" aria-label="Odstrániť dokument">${GD_I.del}</button>`:""}<a class="gdn" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Dokument")}">${esc(String(d.name||"Dokument").replace(/\.[a-z0-9]{2,4}$/i,""))}</a></div>`).join("")}</div>`
      :`<div class="gdempty">${ed?"Zatiaľ prázdne – nahrajte súbor alebo pridajte odkaz ikonami vpravo hore.":"Zatiaľ prázdne."}</div>`}</div></div>`;
  return`<div class="txm"><div class="txlist galist">${list}</div><div>${main}</div></div>`;
}
document.addEventListener("change",ev=>{const el=ev.target.closest&&ev.target.closest("[data-gdname]");if(!el)return;const[gid,sid]=el.dataset.gdname.split("|"),g=get("grants",gid);if(!g)return;
  const v=el.value.trim();if(!v){render();return;}
  if(GD_BASE.some(b=>b[0]===sid))upd("grants",gid,{docNames:Object.assign({},g.docNames||{},{[sid]:v})});
  else upd("grants",gid,{docSecs:(g.docSecs||[]).map(x=>x.id===sid?Object.assign({},x,{label:v}):x)});});
document.addEventListener("keydown",ev=>{const el=ev.target;if(el&&el.dataset&&el.dataset.gdname!==undefined&&ev.key==="Enter")el.blur();});
document.addEventListener("click",async ev=>{const t=ev.target;if(!t.closest)return;let el;
  if((el=t.closest("[data-gdsel]"))){const[gid,sid]=el.dataset.gdsel.split("|");S._gdsel[gid]=sid;render();return;}
  if((el=t.closest("[data-gdadd]"))){const g=get("grants",el.dataset.gdadd);if(!g)return;const id="s"+Date.now().toString(36);S._gdsel[g.id]=id;
    await upd("grants",g.id,{docSecs:[...(g.docSecs||[]),{id,label:"Nová sekcia"}]});
    setTimeout(()=>{const i=document.querySelector(`[data-gdname="${g.id}|${id}"]`);if(i){i.focus();i.select();}},80);return;}
  if((el=t.closest("[data-gddel]"))){const[gid,sid]=el.dataset.gddel.split("|"),g=get("grants",gid);if(!g)return;const x=gdSecs(g).find(y=>y.id===sid);if(!x)return;
    const n=(g.docs||[]).filter(d=>(d.kind||"")===sid).length;
    if(!await ask(`Odstrániť sekciu „${x.label||"Nová sekcia"}“?${n?` Jej dokumenty (${n}) sa nezmažú – presunú sa do sekcie „Ostatné“.`:""}`,"Odstrániť"))return;
    const p=x.base?{docHidden:[...(g.docHidden||[]),sid]}:{docSecs:(g.docSecs||[]).filter(y=>y.id!==sid)};delete S._gdsel[gid];if(n)p.docs=(g.docs||[]).map(d=>(d.kind||"")===sid?Object.assign({},d,{kind:"ostatne"}):d);upd("grants",gid,p);return;}
});
