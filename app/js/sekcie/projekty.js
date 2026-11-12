/* ===== Sekcia Projekty: zoznam a detail projektu (podujatia, úlohy, granty, financie, ľudia); výber „Prepojiť existujúce“ (linkSel).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/projekty.js. Nie je to samostatný skript. ===== */
/* ----- Projekty ----- */
VIEWS.projekty=()=>{
  let list=[...S.d.projects];
  list.sort((a,b)=>(a.end||"9999").localeCompare(b.end||"9999"));
  return`<div class="head"><div><h1>Projekty</h1><p class="sub">${S.d.projects.length} projektov združenia</p></div></div>
  ${list.length?projGallery(list):`<div class="panel">${list.length?table([
    ["Projekt",p=>`<span class="row" style="gap:9px;flex-wrap:nowrap"><i class="dot" style="background:${esc(p.color||GRAY)}"></i><span class="cut">${esc(p.name||"Bez názvu")}</span></span>`,"t"],
    
    ["Granty",p=>{const g=S.d.grants.filter(x=>x.projectId===p.id);return g.length?`<span class="meta">${g.length} · ${eur0(sum(g,x=>x.approved))}</span>`:"";}],
    ["Úlohy",p=>{const c=projCalc(p);return c.T.length?`<span class="meta">${c.done}/${c.T.length}</span>`:"";}],
    ["Príjmy",p=>{const c=projCalc(p);return c.inc?`<span class="pos">${eur0(c.inc)}</span>`:"";},"num"],["Výdavky",p=>{const c=projCalc(p);return c.exp?`<span class="neg">${eur0(c.exp)}</span>`:"";},"num"]
  ],list,p=>"projects:"+esc(p.id)):emptyBox(S.d.projects.length?"V tomto filtri nie sú žiadne projekty.":"Zatiaľ tu nie je žiadny projekt. Projekt spája granty, podujatia, úlohy, platby a ľudí.",S.d.projects.length?null:"projects","Nový projekt")}</div>`}`;
};
VIEWS.projekt=()=>{
  const p=get("projects",S.id);if(!p)return`<div class="empty">Projekt sa nenašiel.<br><button class="btn" data-go="projekty">Späť na projekty</button></div>`;
  const c=projCalc(p),pid=esc(p.id),col=p.color||GRAY;
  const G=related("projects",p,"grants"),E=related("projects",p,"events").sort((a,b)=>(b.date||"").localeCompare(a.date||"")),C=related("projects",p,"contacts").sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  const tab=S.ptab||"podujatia";
  const TABS=[["podujatia","Podujatia",E.length,["events","Nové podujatie"]],["ulohy","Úlohy",c.open,["tasks","Nová úloha"]],["granty","Granty",G.length,["grants","Nový grant"]],["financie","Financie",c.L.length,["ledger","Zapísať platbu"]],["ludia","Ľudia",C.length,["contacts","Nový kontakt"]]].filter(t=>accRead(t[3][0]));
  const cur=TABS.find(t=>t[0]===tab)||TABS[0];
  /* hlavička s obrázkom vždy – bez titulného obrázka plocha vo farbe projektu (ako na karte v galérii) */
  const head=`<div class="pcw">${coverUrl(p)?`<img class="pcover" src="${esc(coverUrl(p,1600))}" alt="" style="object-position:${esc(posOf(p))}">`:`<div class="pcover" style="background:${esc(p.color||GRAY)}"></div>`}<button class="evedit pcedit" data-peek="projects:${pid}" title="Upraviť" aria-label="Upraviť projekt"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></div><h1 class="ptitle">${esc(p.name||"Bez názvu")}</h1>`;
  const bar_=`<div class="ptabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" data-ptab="${k}" aria-selected="${cur[0]===k}">${l}</button>`).join("")}${cur[3]&&!["podujatia","granty","ludia"].includes(cur[0])?`<span class="ptabs-r"><button class="btn pri sm" data-linknew="projects:${pid}|${cur[3][0]}">${cur[3][1]}</button></span>`:""}</div>`;
  let body="";
  if(cur[0]==="obsah"){
    const row=(l,v)=>`<div class="pl">${l}</div><div class="pv2">${v||'<span class="muted">—</span>'}</div>`;
    body=`<div class="pprops">${row("Miesto",esc(p.place||""))}
      
      ${row("Príjmy / výdavky",c.L.length?`<span class="pos">${eur(c.inc)}</span> / <span class="neg">${eur(c.exp)}</span>`:"")}</div>
      ${p.desc?`<p class="desc" style="margin-top:22px">${esc(p.desc)}</p>`:`<p class="muted" style="margin-top:22px">Popis projektu doplníte cez Upraviť.</p>`}`;
  }
  if(cur[0]==="podujatia"){
    body=`<div class="gal">${E.map(e=>{const u=coverUrl(e,640);return`<div class="gcard" data-open="events:${esc(e.id)}" tabindex="0" role="link"><div class="gimg" style="background:linear-gradient(160deg,${esc(col)},${esc(col)}cc)">${u?`<img src="${esc(u)}" alt="" loading="lazy" style="object-position:${esc(posOf(e))}">`:""}</div>
      <div class="gbody"><b>${esc(e.name||"Podujatie")}</b>${e.date?`<div class="gl">${fdate(e.date)}${e.time?" "+esc(e.time):""}${e.dateTo&&e.dateTo!==e.date?" → "+fdate(e.dateTo):""}</div>`:""}${e.place?`<div class="gl">${esc(e.place)}</div>`:""}</div></div>`;}).join("")}
      <button class="gnew" data-linknew="projects:${pid}|events">+ Nové podujatie</button></div>`;
  }
  if(cur[0]==="ulohy"){
    body=`<div class="board">${OPT.tstat.map(([st,label,cc])=>{let L=c.T.filter(t=>(t.status||"inbox")===st);const n=L.length;
      L.sort((a,b)=>st==="hotove"?(b.doneAt||b.updatedAt||0)-(a.doneAt||a.updatedAt||0):(a.priority==="urgentne"?0:1)-(b.priority==="urgentne"?0:1)||byDue(a,b));if(st==="hotove")L=L.slice(0,8);
      return`<div class="col" data-drop="tasks:status:${st}"><h3><span class="row" style="gap:7px;color:var(--ink);font-weight:700"><i class="dot" style="background:${cc}"></i>${label}</span><span>${n}</span></h3>${L.map(taskCard).join("")}</div>`;}).join("")}</div>`;
  }
  if(cur[0]==="granty"){
    body=`<div class="gal">${G.map(grantCard).join("")}
      <button class="gnew" data-linknew="projects:${pid}|grants">+ Nový grant</button></div>`;
  }
  if(cur[0]==="financie"){
    const pf=S.pf2=S.pf2||{},yrs=[...new Set(c.L.map(x=>(x.date||"").slice(0,4)).filter(Boolean))].sort();
    const nPl=c.L.filter(x=>!x.date).length,opts=[...yrs,...(nPl?["plan"]:[])];
    if(pf.pid!==p.id){pf.pid=p.id;pf.year=yrs.length?yrs[yrs.length-1]:(nPl?"plan":"");pf.tab="dennik";}
    if(pf.year&&!opts.includes(pf.year))pf.year=opts[opts.length-1]||"";
    const Y=pf.year,YL=c.L.filter(x=>inYear(x,Y)),inc=sum(YL.filter(x=>x.type==="prijem"),x=>x.amount),exp=sum(YL.filter(x=>x.type!=="prijem"),x=>x.amount);
    const yl=Y==="plan"?"plánované":Y||"spolu";
    const ytabs=opts.length?`<div class="ptabs" role="tablist">${yrs.map(y=>`<button role="tab" data-pfyear="${y}" aria-selected="${Y===y}">${y}</button>`).join("")}${nPl?`<button role="tab" data-pfyear="plan" aria-selected="${Y==="plan"}">Plánované</button>`:""}</div>`:"";
    const hasCat=c.L.some(x=>x.category);
    const mtabs=`<div class="tools"><div class="tabs">${[["dennik","Denník"],["kategorie","Kategórie"],["partneri","Podľa partnerov"]].map(([k,l])=>`<button data-pftab="${k}" aria-pressed="${pf.tab===k}">${l}</button>`).join("")}</div></div>`;
    const strip=`${ytabs}<div class="strip"><div><b class="pos">${eur0(inc)}</b><span>príjmy ${yl}</span></div><div><b class="neg">${eur0(exp)}</b><span>výdavky ${yl}</span></div><div><b class="${inc-exp<0?"neg":""}">${eur0(inc-exp)}</b><span>výsledok ${yl}</span></div>${p.budget?`<div><b>${eur0(+p.budget-c.exp)}</b><span>zostáva z rozpočtu ${eur0(p.budget)}</span></div>`:""}</div>${mtabs}`;
    if(pf.tab==="kategorie"){
      const X=YL.filter(x=>x.type!=="prijem"),tot=sum(X,x=>x.amount),by={};X.forEach(x=>{const k=x.category||"Bez kategórie";by[k]=(by[k]||0)+(+x.amount||0);});
      const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]);
      body=strip+`<div class="panel"><h2 style="margin-bottom:8px">Výdavky podľa kategórií</h2>${rows.length?`<div class="tw"><table><tbody>${rows.map(([k,v])=>`<tr><td class="t">${esc(k)}</td><td style="width:45%">${bar(v,tot)}</td><td class="num">${pct(v,tot)} %</td><td class="num">${eur(v)}</td></tr>`).join("")}</tbody><tfoot><tr><td>Spolu</td><td></td><td></td><td class="num">${eur(tot)}</td></tr></tfoot></table></div>`:`<div class="empty">Žiadne výdavky.</div>`}</div>`;
    }else if(pf.tab==="partneri"){
      const by={};YL.forEach(x=>{const k=x.contactId||"";const r=by[k]=by[k]||{id:k,inc:0,exp:0,n:0};if(x.type==="prijem")r.inc+=+x.amount||0;else r.exp+=+x.amount||0;r.n++;});
      const rows=Object.values(by).sort((a,b)=>(b.inc+b.exp)-(a.inc+a.exp));
      body=strip+`<div class="panel">${rows.length?table([["Partner / osoba",r=>r.id?ctLink(r.id):'<span class="muted">Bez kontaktu</span>',"t"],["Platieb",r=>`<span class="meta">${r.n}</span>`,"num"],["Príjmy",r=>r.inc?`<span class="pos">${eur(r.inc)}</span>`:"","num"],["Výdavky",r=>r.exp?`<span class="neg">${eur(r.exp)}</span>`:"","num"]],rows,r=>r.id?"contacts:"+esc(r.id):"")
        :`<div class="empty">Žiadne platby.</div>`}</div>`;
    }else{
      const L=[...YL].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
      body=strip+`<div class="panel">${L.length?table([["Dátum",x=>`<span class="meta">${x.date?fdate(x.date):"plánované"}</span>`],["Popis",x=>`<span class="cut">${esc(x.desc||"—")}</span>`,"t"],...(hasCat?[["Kategória",x=>`<span class="meta">${esc(x.category||"")}</span>`]]:[]),["Komu / od koho",x=>ctLink(x.contactId)],
        ["Grant",x=>`<span class="meta">${gName(get("grants",x.grantId))}</span>`],["Doklad",x=>`<span class="meta">${esc(x.docNo||"")}</span>`],["Suma",x=>`<span class="${x.type==="prijem"?"pos":"neg"}">${x.type==="prijem"?"+":"−"}${eur(x.amount)}</span>`,"num"]],L,x=>"ledger:"+esc(x.id))
        :`<div class="empty">Zatiaľ žiadne platby.</div>`}</div>`;
    }
  }
  if(cur[0]==="ludia")body=teamTab(p);   /* ako Spolupráce pri podujatí: sekcie Tím, Partneri, Sponzori, Dobrovoľníci (od 2.0.18) */
  return`${head}${bar_}${body}`;
};
/* „Prepojiť existujúce“ v záložkách grantu, podujatia a projektu zrušené (2.0.13) – prepája sa v bočnom paneli záznamu (ceruzka: Projekt, Granty, Podujatia). */

