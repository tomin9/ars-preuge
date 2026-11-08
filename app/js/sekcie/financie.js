/* ===== Sekcia Financie: peňažný denník, roky, pohľady Denník / Projekty / Kategórie, filtre.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/financie.js. Nie je to samostatný skript. ===== */
/* ----- Financie ----- */
const inYear=(x,y)=>!y||(y==="plan"?!x.date:(x.date||"").startsWith(y));
function ledgerFiltered(){
  const f=S.ff;return S.d.ledger.filter(x=>inYear(x,f.year)&&(!f.acct||(x.account||"banka")===f.acct)&&(!f.type||x.type===f.type)
    &&(!f.project||(f.project==="__none"?!x.projectId:x.projectId===f.project))&&(!f.grant||x.grantId===f.grant)
    &&(!f.q||[x.desc,x.docNo,x.note,ttl("contacts",get("contacts",x.contactId))].join(" ").toLowerCase().includes(f.q.toLowerCase())));
}
VIEWS.financie=()=>{
  const f=S.ff,lc=ledgerCalc();
  const years=[...new Set(S.d.ledger.map(x=>(x.date||"").slice(0,4)).filter(Boolean))].sort().reverse();
  const tabs=`<div class="tabs">${[["dennik","Denník"],["projekty","Projekty"],["kategorie","Kategórie"]].map(([k,l])=>`<button data-ftab="${k}" aria-pressed="${f.tab===k}">${l}</button>`).join("")}</div>`;
  if(!f.year)f.year=String(new Date().getFullYear());if(f.tab==="nevyplatene")f.tab="dennik";const Y=f.year;let bb=lc.bank,bc=lc.cash,balLbl="";
  if(Y&&Y!=="plan"){const last=lc.list.filter(x=>x.date&&x.date.slice(0,4)<=Y).pop();if(last){bb=lc.map[last.id].bank;bc=lc.map[last.id].cash;}else{bb=+S.settings.openBank||0;bc=+S.settings.openCash||0;}if(Y!==String(new Date().getFullYear()))balLbl=` k 31. 12. ${Y}`;}
  const nPlan=S.d.ledger.filter(x=>!x.date).length;
  const ytabs=`<div class="ptabs" role="tablist">${[...years].reverse().map(y=>`<button role="tab" data-fyear="${y}" aria-selected="${Y===y}">${y}</button>`).join("")}${nPlan?`<button role="tab" data-fyear="plan" aria-selected="${Y==="plan"}">Plánované</button>`:""}</div>`;
  const head=`<div class="head"><div><h1>Financie</h1><p class="sub">Peňažný denník Ars Preuge</p></div>
    <div class="row">${dl?`<button class="btn" data-export="ledger">Export CSV</button>`:""}<button class="btn pri" data-create="ledger">Zapísať platbu</button></div></div>
  ${ytabs}<div class="strip"><div><b class="${bb<0?"neg":""}">${eur(bb)}</b><span>zostatok banka${balLbl}</span></div><div><b class="${bc<0?"neg":""}">${eur(bc)}</b><span>zostatok pokladňa${balLbl}</span></div>`;
  const yr=Y&&Y!=="plan"?Y:(Y==="plan"?"plánované":"spolu");const YL=S.d.ledger.filter(x=>inYear(x,Y));
  const strip=head+`<div><b class="pos">${eur0(sum(YL.filter(x=>x.type==="prijem"),x=>x.amount))}</b><span>príjmy ${yr}</span></div><div><b>${eur0(sum(YL.filter(x=>x.type!=="prijem"),x=>x.amount))}</b><span>výdavky ${yr}</span></div></div>`;
  const nAct=[f.acct,f.type,f.project,f.grant].filter(Boolean).length;
  const filt=`<div class="tools">${tabs}${f.tab==="dennik"?`<button class="btn ghost fbtn${S.ffOpen?" on":""}" data-fftoggle aria-expanded="${!!S.ffOpen}" title="Filter" aria-label="Filter"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>${nAct?`<span class="fcount">${nAct}</span>`:""}</button><input type="search" id="ff-q" class="fsearch" placeholder="Hľadať popis, doklad, meno" value="${esc(f.q)}">`:""}</div>
    ${f.tab==="dennik"&&S.ffOpen?`<div class="tools frow">    <select id="ff-acct" aria-label="Účet"><option value="">Banka aj pokladňa</option>${OPT.acct.map(o=>`<option value="${o[0]}" ${f.acct===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>
    <select id="ff-type" aria-label="Typ"><option value="">Príjmy aj výdavky</option>${OPT.ltype.map(o=>`<option value="${o[0]}" ${f.type===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>
    <select id="ff-project" aria-label="Projekt"><option value="">Všetky projekty</option><option value="__none" ${f.project==="__none"?"selected":""}>Bez projektu (réžia)</option>${S.d.projects.map(p=>`<option value="${esc(p.id)}" ${f.project===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select>
    <select id="ff-grant" aria-label="Grant"><option value="">Všetky granty</option>${S.d.grants.map(g=>`<option value="${esc(g.id)}" ${f.grant===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</select>${nAct?`<button class="btn ghost sm" data-ffclear>Zrušiť filter</button>`:""}</div>`:""}`;
  if(!S.d.ledger.length)return strip+`<div class="panel">${emptyBox("Peňažný denník je prázdny. Ak ste už mali zostatky pred začatím, zadajte ich v Nastaveniach.","ledger","Zapísať platbu")}</div>`;
  if(f.tab==="projekty"){
    const L=S.d.ledger.filter(x=>inYear(x,f.year));
    const rows=[...S.d.projects.map(p=>({p,L:L.filter(x=>x.projectId===p.id)})),{p:null,L:L.filter(x=>!x.projectId)}].filter(r=>r.L.length||r.p&&r.p.budget);
    return strip+filt+`<div class="panel">${table([["Projekt",r=>r.p?pdot(r.p.id):'<span class="muted">Réžia združenia</span>',"t"],["Príjmy",r=>`<span class="pos">${eur(sum(r.L.filter(x=>x.type==="prijem"),x=>x.amount))}</span>`,"num"],
      ["Výdavky",r=>`<span class="neg">${eur(sum(r.L.filter(x=>x.type!=="prijem"),x=>x.amount))}</span>`,"num"],["Výsledok",r=>{const v=sum(r.L,x=>(x.type==="prijem"?1:-1)*x.amount);return`<span class="${v<0?"neg":""}">${eur(v)}</span>`;},"num"],
      ],
      rows,r=>r.p?"projects:"+esc(r.p.id):"")}</div>`;
  }
  if(f.tab==="kategorie"){
    const L=S.d.ledger.filter(x=>x.type!=="prijem"&&inYear(x,f.year));const tot=sum(L,x=>x.amount);
    const by={};L.forEach(x=>{const k=x.category||"Bez kategórie";by[k]=(by[k]||0)+(+x.amount||0);});
    const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]);
    return strip+filt+`<div class="panel"><h2 style="margin-bottom:8px">Výdavky podľa kategórií</h2>${rows.length?`<div class="tw"><table><tbody>${rows.map(([k,v])=>`<tr><td class="t">${esc(k)}</td><td style="width:45%">${bar(v,tot)}</td><td class="num">${pct(v,tot)} %</td><td class="num">${eur(v)}</td></tr>`).join("")}</tbody><tfoot><tr><td>Spolu</td><td></td><td></td><td class="num">${eur(tot)}</td></tr></tfoot></table></div>`:`<div class="empty">Žiadne výdavky.</div>`}</div>`;
  }
  let list=f.tab==="nevyplatene"?S.d.ledger.filter(x=>x.paid===false||!x.date||x.state==="nevybavene"):ledgerFiltered();
  list=[...list].sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||0)-(a.createdAt||0));
  const inc=sum(list.filter(x=>x.type==="prijem"),x=>x.amount),exp=sum(list.filter(x=>x.type!=="prijem"),x=>x.amount);
  return strip+filt+`<div class="panel ldg">${list.length?table([
    ["P. č.",x=>`<span class="meta">${(lc.map[x.id]||{}).seq||""}</span>`],["Dátum",x=>`<span class="meta" style="white-space:nowrap">${x.date?(([y,m,d])=>`${+d}. ${+m}.`)(x.date.split("-")):"plánované"}</span>`],
    ["Popis",x=>`<span class="drow"><span class="cut" title="${esc(x.desc||"")}">${esc(x.desc||"—")}</span>${clip(x)}${x.paid===false?`<span class="chip" title="nevyplatené"><i style="background:${RED}"></i>nevypl.</span>`:""}</span>`,"t ldsc"],
    ["Komu / od koho",x=>ctLink(x.contactId),"lct"],
    ["Grant",x=>{const g=x.grantId&&get("grants",x.grantId);return g?`<span class="rlink" data-open="grants:${esc(g.id)}" title="${esc(provName(g))}">${gName(g)}</span>`:"";},"lgr"],
    ["Účet",x=>`<span class="meta">${x.account==="hotovost"?"Pokladňa":"Banka"}</span>`],
    ["Príjem",x=>x.type==="prijem"?`<span class="pos">${eur(x.amount)}</span>`:"","num"],["Výdavok",x=>x.type!=="prijem"?`<span class="neg">${eur(x.amount)}</span>`:"","num"],
    ["Zost. banka",x=>`<span class="meta">${eur((lc.map[x.id]||{}).bank)}</span>`,"num"],["Zost. pokladňa",x=>`<span class="meta">${eur((lc.map[x.id]||{}).cash)}</span>`,"num"]
  ],list,x=>"ledger:"+esc(x.id),`<td colspan="6">${list.length} záznamov</td><td class="num pos">${eur(inc)}</td><td class="num neg">${eur(exp)}</td><td colspan="2" class="num">${eur(inc-exp)}</td>`)
  :`<div class="empty">${f.tab==="nevyplatene"?"Všetko je vyplatené a vybavené.":"Žiadne platby v tomto filtri."}</div>`}</div>`;
};

