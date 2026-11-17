/* ===== Podujatie – riadok záložiek a obsah menších záložiek (úlohy, granty, dramaturgia).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-zalozky.js. Nie je to samostatný skript. ===== */
function eventTabs(e){
  const id=esc(e.id),T=S.d.tasks.filter(t=>t.eventId===e.id),P=S.d.partnerships.filter(x=>x.eventId===e.id);
  const ET=evTabsFor(e),tab=ET.find(t=>t[0]===S.evtab)?S.evtab:(ET[0]||["podklady"])[0];
  const cnt={ulohy:T.filter(t=>!isDone(t)).length,granty:related("events",e,"grants").length,dramaturgia:S.d.prog.filter(x=>x.eventId===e.id).length,
    marketing:(()=>{const m=evPlan(e).items;return e.mktPlan||Array.isArray(e.mkt)?`${m.filter(x=>x.d).length}/${m.length}`:"";})(),spoluprace:0,dokumenty:(e.docs||[]).length,zabezpecenie:zbOf(e.id).length};
  const tbar=`<div class="ptabs ntabs" role="tablist" style="margin-top:6px">${ET.map(([k,l])=>`<button role="tab" data-evtab="${k}" aria-selected="${tab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(tab==="podklady")body=podkladyTab(e);   /* od 2.0.54 obsahuje aj doterajšie Texty a Dokumenty */
  else if(tab==="rozpocet")body=eventBudget(e);
  else if(tab==="zabezpecenie")body=zbTab(e);   /* od 2.0.99 pri každom podujatí, zrkadlí Dramaturgiu */
  else if(tab==="ulohy")body=ulohyTab(e);   /* od 2.0.89 rozdelené podľa toho, odkiaľ úlohy sú */
  else if(tab==="fotky")body=fotkyTab(e);
  else if(tab==="granty"){const G=related("events",e,"grants");body=G.length?`<div class="gal">${G.map(grantCard).join("")}</div>`:`<div class="panel"><div class="empty">Podujatie zatiaľ nemá granty. Priradíte ich ceruzkou hore (pole Granty).</div></div>`;}
  else if(tab==="dramaturgia")body=dramaturgiaTab(e);   /* od 2.0.68 v podobe Podkladov: ikony, zoznam, vybraný prvok */
  else if(tab==="marketing")body=marketingTab(e);
  else if(tab==="spoluprace")body=teamTab(e);
  return tbar+body;
}


/* ===== Úlohy podujatia (od 2.0.89) v rozložení ako Marketing: vľavo sekcie podľa toho, odkiaľ úlohy sú, vpravo úlohy vybranej sekcie.
   Všeobecné = úlohy podujatia (kolekcia tasks), ktoré nevznikli z podkladu; pridávajú sa v prázdnom riadku za poslednou.
   Podklady = zadania zo záložky Podklady (každé je v podstate úloha – stav, termín, človek) a pod nimi úlohy, ktoré sú k nim pripojené.
   Zabezpečenie = úlohy pri bodoch programu a dielach v Zabezpečení podujatia (len keď podujatie nejaké zabezpečenie má); odškrtnutie sa zapíše tam.
   Nič sa neukladá inak ako doteraz – je to len iný pohľad na tie isté údaje. ===== */
const UL_IC={vse:'<path d="M10 6h10M10 12h10M10 18h10"/><path d="m3.5 6 1.2 1.2L7 4.9M3.5 12l1.2 1.2L7 10.9M3.5 18l1.2 1.2L7 16.9"/>',pk:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',zab:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>'};
const ulUi=eid=>{S._ul=S._ul||{};return S._ul[eid]=S._ul[eid]||{sel:"vse"};};
function ulohyTab(e){
  const id=esc(e.id),ui=ulUi(e.id),ZE=zbFor(e)?zbOf(e.id):[],hasZb=ZE.length>0,PK=evPk(e),pkT=new Set(PK.items.flatMap(x=>x.tasks||[]));
  const T=related("events",e,"tasks").filter(t=>!pkT.has(t.id)).sort((a,b)=>isDone(a)-isDone(b)||byDue(a,b));
  const pkDone=x=>pkSt(x)==="hotove",PI=PK.items.slice().sort((a,b)=>pkDone(a)-pkDone(b)||String(a.due||"9999").localeCompare(String(b.due||"9999")));
  const pkTasks=x=>(x.tasks||[]).map(t=>get("tasks",t)).filter(t=>t&&!t._stub);
  const ZB=ZE.map(z=>({z,L:(z.ulohy||[]).map((r,i)=>({r,i})).filter(a=>String(a.r.text||"").trim())})).filter(a=>a.L.length);
  const nOpen={vse:T.filter(t=>!isDone(t)).length,pk:PI.filter(x=>!pkDone(x)).length+PI.flatMap(pkTasks).filter(t=>!isDone(t)).length,zab:ZB.reduce((n,a)=>n+a.L.filter(u=>!u.r.hotovo).length,0)};
  const nAll={vse:T.length,pk:PI.length,zab:ZB.reduce((n,a)=>n+a.L.length,0)};
  const SEC=[["vse","Všeobecné"],["pk","Podklady"],...(hasZb?[["zab","Zabezpečenie"]]:[])],sel=(SEC.find(x=>x[0]===ui.sel)||SEC[0])[0];
  const svg=(p,w)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const cnt=k=>nOpen[k]?nOpen[k]+(nOpen[k]===1?" otvorená":nOpen[k]<5?" otvorené":" otvorených"):(nAll[k]?"všetko hotové":"zatiaľ nič");
  const list=SEC.map(([k,l])=>`<button type="button" class="txi${sel===k?" on":""}" data-ulsel="${id}|${k}">${svg(UL_IC[k],22)}<span class="txt"><b>${l}</b><small>${cnt(k)}</small></span></button>`).join("");
  const head=(t,sub)=>`<div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Úlohy / ${esc(e.name||"Podujatie")}</div><div class="txtitle" style="font-size:28px;font-weight:600;line-height:1.2;margin-top:6px">${t}</div>${sub?`<p class="meta" style="margin:8px 0 0;white-space:normal">${sub}</p>`:""}</div></div>`;
  const empty=t=>`<div class="empty">${t}</div>`;
  let body;
  if(sel==="pk"){
    body=head("Podklady","Zadania zo záložky Podklady a úlohy, ktoré sú k nim pripojené. Kliknutím zadanie otvoríte.")+(PI.length?`<ul class="items lk telist">${PI.map(x=>{const sd=pkStDef(x),sc=PK.secs.find(y=>y.id===x.s),dn=pkDone(x);
      return`<li class="${dn?"uldone":""}" data-open="pk:${id}~${esc(x.id)}"><i class="txdot uldot" style="background:${sd[2]}" title="${sd[1]}"></i><span class="t">${esc(x.t||"Bez názvu")}</span>${sc?`<span class="meta">${esc(sc.title)}</span>`:""}${x.who?`<span class="meta">${who(x.who)}</span>`:""}<span class="meta">${dueHtml(x.due,dn)}</span></li>`
        +pkTasks(x).map(t=>linkLi("events",e,"tasks",t).replace('<li class="','<li class="ulsub ')).join("");}).join("")}</ul>`:empty("Podujatie zatiaľ nemá žiadne podklady."));
  }else if(sel==="zab"){
    body=head("Zabezpečenie","Úlohy pri bodoch programu a dielach v Zabezpečení. Odškrtnutím sa úloha označí ako hotová aj tam.")+(ZB.length?`<ul class="items lk telist">${ZB.map(({z,L})=>`<li class="ulhead" data-open="zab:${esc(z.id)}" title="Otvoriť v Zabezpečení">${z.ord?`<b class="ulnum">${esc(z.ord)}</b>`:""}<span class="t">${esc(zbTitle(z)||"Bez názvu")}</span></li>`
      +L.map(({r,i})=>`<li class="ulsub${r.hotovo?" uldone":""}"><button type="button" class="check ${r.hotovo?"on":""}" data-ulzb="${esc(z.id)}|${i}" aria-label="Hotové" aria-pressed="${!!r.hotovo}"></button><span class="t">${esc(r.text)}</span></li>`).join("")).join("")}</ul>`:empty("V Zabezpečení zatiaľ nie sú žiadne úlohy."));
  }else{
    const ed=accEditA("podujatia")&&!S.readOnly,ids=new Set(related("events",e,"tasks").map(x=>x.id)),avail=ed?S.d.tasks.filter(x=>!ids.has(x.id)).sort((a,b)=>ttl("tasks",a).localeCompare(ttl("tasks",b),"sk")).slice(0,300):[];
    body=head("Všeobecné","")+(ed||T.length?`<ul class="items lk telist">${T.map(t=>linkLi("events",e,"tasks",t)).join("")}${ed?`<li class="teamnew tenew">${svg('<path d="M12 5v14M5 12h14"/>',18)}<input type="text" class="tnin" id="ul-add" data-keep data-uladd="${id}" placeholder="Nová úloha…" maxlength="160" autocomplete="off" aria-label="Pridať úlohu"></li>`:""}</ul>`:empty("Podujatie zatiaľ nemá žiadne úlohy."))
      +(avail.length?`<div class="ullink"><select class="linksel" data-linkadd="events:${id}|tasks" aria-label="Prepojiť existujúcu úlohu" style="margin:0"><option value="">Prepojiť existujúcu úlohu…</option>${avail.map(x=>`<option value="${esc(x.id)}">${esc(ttl("tasks",x))}</option>`).join("")}</select></div>`:"");
  }
  return`<div class="txm"><div class="txlist">${list}</div><div class="panel txmain ulmain">${body}</div></div>`;
}
document.addEventListener("click",ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  if((x=q("[data-ulsel]"))){const[eid,k]=x.dataset.ulsel.split("|");ulUi(eid).sel=k;render();return;}
  if((x=q("[data-ulzb]"))){ev.stopPropagation();const[zid,i]=x.dataset.ulzb.split("|");zbSave(zid,y=>{const a=(y.ulohy||[]).map(r=>Object.assign({},r));if(!a[+i])return null;a[+i].hotovo=!a[+i].hotovo;return{ulohy:a};});return;}});
document.addEventListener("keydown",async ev=>{const t=ev.target;if(!t||ev.key!=="Enter"||!t.dataset||!t.dataset.uladd)return;const v=t.value.replace(/\s+/g," ").trim();if(!v)return;const e0=get("events",t.dataset.uladd);if(!e0)return;t.value="";
  const d={title:v,status:"inbox",priority:"normalne",org:"ars",eventId:e0.id};if(e0.projectId)d.projectId=e0.projectId;await add("tasks",d);});
