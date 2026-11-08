/* ===== Sekcia Kalendár: mesačný pohľad s podujatiami, termínmi úloh a grantov.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/kalendar.js. Nie je to samostatný skript. ===== */
VIEWS.kalendar=()=>{
  const{y,m}=S.cal;const first=new Date(y,m,1),off=(first.getDay()+6)%7;const start=new Date(y,m,1-off);
  const items={};agenda().forEach(a=>{(items[a.d]=items[a.d]||[]).push(a);});
  const td=today();const cells=[];
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const s=iso(d);
    const its=(items[s]||[]);
    cells.push(`<div class="d ${d.getMonth()!==m?"o":""} ${s===td?"td":""}"><span class="dn">${d.getDate()}</span>${its.slice(0,4).map(a=>`<button class="ce ${a.done?"done":""}" style="--c:${a.c}" data-open="${a.open}" title="${esc(a.txt)}">${esc(a.txt)}</button>`).join("")}${its.length>4?`<span class="meta" style="font-size:11px">+${its.length-4} ďalšie</span>`:""}</div>`);
    if(i>=34&&d.getMonth()!==m&&(i+1)%7===0)break;
  }
  const mname=first.toLocaleDateString("sk-SK",{month:"long",year:"numeric"});
  return`<div class="head"><div><h1 style="text-transform:capitalize">${esc(mname)}</h1><p class="sub">Podujatia, termíny úloh a grantové uzávierky na jednom mieste</p></div>
    <div class="row"><button class="btn" id="cal-prev" aria-label="Predchádzajúci mesiac">‹</button><button class="btn" id="cal-now">Dnes</button><button class="btn" id="cal-next" aria-label="Nasledujúci mesiac">›</button><button class="btn pri" data-create="events">Nové podujatie</button></div></div>
  <div class="cal">${["Po","Ut","St","Št","Pi","So","Ne"].map(d=>`<div class="dh">${d}</div>`).join("")}${cells.join("")}</div>
  <div class="legend"><span><i style="background:${PINK}"></i>Podujatia</span><span><i style="background:var(--accent)"></i>Termíny úloh</span><span><i style="background:${OCHRE}"></i>Žiadosti a realizácia grantov</span><span><i style="background:${RED}"></i>Vyúčtovania</span><span><i style="background:${GREEN}"></i>Konce projektov</span></div>`;
};

