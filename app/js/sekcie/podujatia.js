/* ===== Sekcia Podujatia: zoznam (galéria/tabuľka) a hlavná karta detailu podujatia.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatia.js. Nie je to samostatný skript. ===== */
/* ----- Podujatia ----- */
const ETABS=[["planovane","Plánované",["napad","priprava"]],["prebieha","Prebieha",["prebieha"]],["zrealizovane","Zrealizované",["zrealizovane"]],["zrusene","Zrušené",["zrusene"]]];
function eventCard(e){
  const u=coverUrl(e);
  const d=e.date?`${fdate(e.date)}${e.time?" "+esc(e.time):""}${e.dateTo&&e.dateTo!==e.date?" → "+fdate(e.dateTo):""}`:"";
  return`<div class="gcard" data-open="events:${esc(e.id)}" tabindex="0" role="link"><div class="gimg" style="background:${gradFor(e.id)}">${u?`<img src="${esc(u)}" alt="" loading="lazy" style="object-position:${esc(posOf(e))}">`:""}</div>
  <div class="gbody"><b>${esc(e.name||"Podujatie")}</b>${d?`<div class="gl">${d}</div>`:""}${e.place?`<div class="gl">${esc(e.place)}</div>`:""}</div></div>`;
}
VIEWS.podujatia=()=>{
  const A=S.d.events,tabs=ETABS.filter(t=>t[0]!=="zrusene"||A.some(e=>e.status==="zrusene"));
  const tab=tabs.find(t=>t[0]===S.ef.tab)||tabs[0];
  let list=A.filter(e=>tab[2].includes(e.status||"priprava"));
  list.sort(tab[0]==="zrealizovane"||tab[0]==="zrusene"?(a,b)=>(b.date||"").localeCompare(a.date||""):(a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
  const defs=esc(JSON.stringify({status:tab[2][tab[2].length-1]}));
  const head=`<div class="head"><h1>Podujatia</h1><div class="row"><button class="btn pri" data-create="events" data-defs='${defs}'>Nové podujatie</button></div></div>
  <div class="ptabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-etab="${k}" aria-selected="${tab[0]===k}">${l}</button>`).join("")}</div>`;
  if(S.ef.mode==="list")return head+`<div class="panel">${list.length?table([
    ["Dátum",e=>e.date?`<b>${fdateS(e.date)}</b>${e.dateTo&&e.dateTo!==e.date?` – ${fdateS(e.dateTo)}`:""}${e.time?`<div class="meta">${esc(e.time)}</div>`:""}`:'<span class="meta">bez dátumu</span>'],
    ["Podujatie",e=>`<span class="cut">${esc(e.name||"Podujatie")}</span>`,"t"],["Miesto",e=>esc(e.place||"")],["Stav",e=>chip("estat",e.status)],["Projekt",e=>pdot(e.projectId)],
    ["Granty",e=>{const n=(e.grantIds||[]).length;return n?`<span class="meta">${n}</span>`:"";}],["Návštevnosť",e=>e.visitors?String(e.visitors):"","num"]
  ],list,e=>"events:"+esc(e.id)):`<div class="empty">V tejto skupine nie sú žiadne podujatia.</div>`}</div>`;
  return head+`<div class="gal">${list.map(eventCard).join("")}<button class="gnew" data-create="events" data-defs='${defs}'>+ Nové podujatie</button></div>`;
};

VIEWS.podujatie=()=>{
  const e=get("events",S.id);if(!e)return`<div class="empty">Podujatie sa nenašlo.<br><button class="btn" data-go="podujatia">Späť na podujatia</button></div>`;
  const id=esc(e.id),p=get("projects",e.projectId),col=p?p.color||GRAY:PINK;
  const L=related("events",e,"ledger");const exp=sum(L.filter(x=>x.type!=="prijem"),x=>x.amount),inc=sum(L.filter(x=>x.type==="prijem"),x=>x.amount);
  const n=e.date?daysTo(e.date):null;
  const tm=String(e.time||"").trim(),tmE=esc(tm)+(/h\s*$/i.test(tm)?"":" h"),tmS=tm?` o ${tmE}`:"",when=e.date?`${fdate(e.date)}${tmS}${e.dateTo&&e.dateTo!==e.date?" → "+fdate(e.dateTo):""}`:(tm?tmE:"");
  const rel=e.status==="zrealizovane"||n==null?"":n>0?`o ${n} ${n===1?"deň":n<5?"dni":"dní"}`:n===0?"dnes":"";
  const url=e.url?(/^https?:/.test(e.url)?e.url:"https://"+e.url):"";
  const cov=coverUrl(e),PEN='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  return`  <section class="hero evc cov" style="--pc:${esc(col)}">${cov?`<div class="evimg"><img src="${esc(cov)}" alt="" style="object-position:${esc(posOf(e))}"></div>`:`<div class="evimg" style="background:${gradFor(e.id)}"></div>`}
  <div class="evinfo"><div class="spread" style="align-items:flex-start;flex-wrap:nowrap"><div style="min-width:0"><h1>${esc(e.name||"Podujatie")}</h1>${p?`<p class="sub">projekt <button class="btn ghost sm" data-go="projekt" data-id="${esc(p.id)}">${esc(p.name)}</button></p>`:""}</div>
    <div class="row" style="flex:none;flex-wrap:nowrap;gap:8px">${chip("estat",e.status)}${driveIco(folderId(e.driveFolder))}<button class="evedit" data-peek="events:${id}" title="Upraviť" aria-label="Upraviť podujatie">${PEN}</button></div></div>
    <div class="facts evf"><div><span>Dátum</span><b>${when||"—"}</b>${rel?`<span>${rel}</span>`:""}</div>
      <div class="evmiesto"><span>Miesto</span><b>${esc(e.place||"—")}</b></div></div>
    ${url?`<div class="row" style="margin-top:14px"><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener">Odkaz na podujatie</a></div>`:""}
    ${e.note?`<p class="desc">${esc(e.note)}</p>`:""}</div></section>
  ${eventTabs(e)}`;
};



