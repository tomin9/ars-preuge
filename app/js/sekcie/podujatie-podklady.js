/* ===== Podujatie – záložka Podklady: zadania výroby v sekciách Text · Grafika · Video (dajú sa pridať).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-podklady.js. Nie je to samostatný skript.
   Zadanie má tri časti: Zadanie (čo treba vyrobiť, stav, termín, kto) · Výstup (text alebo súbory a odkazy) · Prepojenie (výstupy v Marketingu, úlohy).
   Uložené v podujatí v poli podklady = {secs:[{id,title,kind}],items:[{id,s,t,st,brief,who,due,body,txid,docs,mk:[id položiek marketingu],tasks:[id úloh]}]}.
   Prepojenie s Marketingom drží len zadanie (pole mk) – položka marketingu si svoje podklady dohľadá. ===== */
const PK_DEF=[["text","Text","text"],["grafika","Grafika","file"],["video","Video","file"]];
const PK_IC={text:'<path d="M4 7h16M4 12h10M4 17h16"/>',grafika:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',_:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>'};
const PK_LINK='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
const PK_MKT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
const PK_IMG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';
const PK_X='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
function evPk(e){
  if(e.podklady&&Array.isArray(e.podklady.items))return{secs:Array.isArray(e.podklady.secs)?e.podklady.secs:[],items:e.podklady.items};
  return{secs:PK_DEF.map(([id,title,kind])=>({id,title,kind})),items:[]};
}
function pkSet(eid,fn){const e0=get("events",eid);if(!e0||!mkEd(e0))return Promise.resolve();const P=evPk(e0),N={secs:P.secs.map(a=>({...a})),items:P.items.map(i=>({...i}))};fn(N);return upd("events",eid,{podklady:N});}
const pkSt=it=>TXST.some(x=>x[0]===it.st)?it.st:"nezacate";
const pkStDef=it=>TXST.find(x=>x[0]===pkSt(it))||TXST[0];
const pkNew=(id,s,t,more)=>Object.assign({id,s,t,st:"nezacate",brief:"",who:"",due:"",body:"",txid:"",docs:[],mk:[],tasks:[]},more||{});
const pkMk=(e,it)=>{const M=evPlan(e).items;return(it.mk||[]).map(id=>M.find(x=>x.id===id)).filter(Boolean);};   /* položky marketingu, ktoré zadanie používajú */
const pkOfMk=(e,iid)=>evPk(e).items.filter(x=>(x.mk||[]).includes(iid));                                          /* zadania pripojené k položke marketingu */
const mkAllDocs=(e,it)=>[...(Array.isArray(it.docs)?it.docs:[]),...pkOfMk(e,it.id).flatMap(x=>x.docs||[])];
const pkHasText=it=>!!(String(it.body||"").trim()||it.txid);
const PK_TXT=`<span class="meta mki" title="Má text"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${PK_IC.text}</svg></span>`;
function pkRow(e,it){
  const k=`${esc(e.id)}|${esc(it.id)}`,ed=mkEd(e),st=pkSt(it),sd=pkStDef(it),M=pkMk(e,it);
  return`<li class="${st==="hotove"?"on":""}"><label class="gastdot" title="Stav: ${sd[1]}${ed?" – kliknutím zmeníte":""}"><i class="txdot" style="background:${sd[2]}"></i>${ed?`<select data-pkst="${k}" aria-label="Stav zadania">${TXST.map(([v,l])=>`<option value="${v}"${v===st?" selected":""}>${l}</option>`).join("")}</select>`:""}</label><button type="button" class="t" data-pkopen="${k}">${esc(it.t||"Bez názvu")}</button>${pkHasText(it)?PK_TXT:""}${clip(it)}${M.length?`<span class="meta mki" title="V marketingu: ${esc(M.map(x=>x.t).join(", "))}" style="gap:3px;align-items:center;font-size:12.5px">${PK_LINK}${M.length}</span>`:""}${it.who?`<span class="meta who">${who(it.who)}</span>`:""}<input type="date" value="${esc(it.due||"")}" data-pkdue="${k}" aria-label="Termín"${ed?"":" disabled"}></li>`;
}
function podkladyTab(e){
  const P=evPk(e),id=esc(e.id),ed=mkEd(e);S._pk=S._pk||{};
  const sel=P.secs.find(a=>a.id===S._pk[e.id])||P.secs[0];
  const list=P.secs.map(a=>{const L=P.items.filter(x=>x.s===a.id),on=sel&&a.id===sel.id;
    return`<button type="button" class="txi${on?" on":""}" data-pksel="${id}|${esc(a.id)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PK_IC[a.id]||PK_IC._}</svg><span class="txt"><b>${esc(a.title)}</b><small>${L.length?`${L.filter(x=>pkSt(x)==="hotove").length} z ${L.length} hotových`:"zatiaľ nič"}</small></span></button>`;}).join("");
  let main=`<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ žiadne sekcie.</div>`;
  if(sel){const L=P.items.filter(x=>x.s===sel.id),k=`${id}|${esc(sel.id)}`;
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Podklady / ${esc(e.name||"Podujatie")}</div><input type="text" class="txtitle" value="${esc(sel.title)}" data-pksec="${k}" aria-label="Názov sekcie" maxlength="60"${ed?"":" readonly"}></div>
      ${ed?`<div class="row" style="flex:none;gap:8px"><button type="button" class="tplus tdel" data-pksdel="${k}" title="Odstrániť sekciu" aria-label="Odstrániť sekciu">${TI.del}</button></div>`:""}</div>
      ${L.length?`<ul class="mkl">${L.map(it=>pkRow(e,it)).join("")}</ul>`:`<div class="empty" style="padding:26px">V tejto sekcii zatiaľ nie je žiadne zadanie.</div>`}
      ${ed?`<div class="mkadd"><input type="text" id="pk-add" data-pkadd="${k}" placeholder="+ Pridať zadanie a Enter" maxlength="120"></div>`:""}</div>`;}
  return`<div class="txm"><div class="txlist">${list}${ed?`<button type="button" class="txi txadd" data-pksadd="${id}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať sekciu</b></span></button>`:""}</div>${main}</div>`;
}
/* ---- súbory a odkazy v bočnom paneli (spoločné pre zadanie aj položku marketingu) ---- */
const sdHead=(title,ed)=>`<h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="lkh">${PK_IMG}${title}</span>${ed?`<span class="row" style="gap:6px"><label class="btn sm" style="cursor:pointer">Nahrať súbor<input type="file" multiple data-sdfile hidden></label><button type="button" class="btn sm ghost" data-sdlink>+ Odkaz</button></span>`:""}</h3>`;
const sdThumbs=(e0,docs,ed)=>docs.map((d,i)=>docThumb("events",e0,d,i,true).replace(/<\/div>$/,ed?`<button type="button" class="x" data-sdrm="${i}" aria-label="Odstrániť" title="Odstrániť">×</button></div>`:"</div>")).join("");
function sdBind(host,eid,save,redraw){   /* save(fn): fn dostane zoznam súborov a vráti nový */
  const fi=host.querySelector("[data-sdfile]");if(fi)fi.onchange=async()=>{const out=[];for(const f of[...(fi.files||[])]){const d=await uploadDoc(f,{en:"events",id:eid,kind:""});if(d)out.push(Object.assign(d,{at:Date.now()}));}fi.value="";if(out.length){await save(a=>[...a,...out]);redraw();}};
  const lk=host.querySelector("[data-sdlink]");if(lk)lk.onclick=()=>{const box=lk.closest(".docslot");if(box.querySelector(".dform"))return;
    const f=document.createElement("div");f.className="dform";f.style.marginTop="8px";f.innerHTML=`<input type="text" placeholder="Názov" style="width:100%;margin-bottom:6px"><div class="row" style="gap:6px"><input type="url" placeholder="https://…" style="flex:1"><button type="button" class="btn sm pri">Uložiť</button></div>`;box.appendChild(f);
    const[n,u]=f.querySelectorAll("input");n.focus();f.querySelector("button").onclick=async()=>{const v=u.value.trim();if(!v){toast("Vložte odkaz.");return;}await save(a=>[...a,{name:n.value.trim()||v,url:v,at:Date.now()}]);redraw();};};
  host.querySelectorAll("[data-sdrm]").forEach(b=>b.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(!await ask("Odstrániť súbor?","Odstrániť"))return;await save(a=>a.filter((_,j)=>j!==+b.dataset.sdrm));redraw();});
  renderPdfThumbs(host);
}
const pkCopy=async t=>{try{await navigator.clipboard.writeText(t||"");toast("Text skopírovaný.");}catch(_){toast("Kopírovanie sa nepodarilo.");}};
const txGo=(eid,tid)=>{closeDrawer();S._txsel=S._txsel||{};S._txsel[eid]=tid;S.evtab="texty";if(S.view==="podujatie"&&S.id===eid)render();else go("podujatie",eid);};
/* ---- bočný panel zadania ---- */
function pkOpen(eid,iid){const e0=get("events",eid);if(!e0||!evPk(e0).items.some(x=>x.id===iid))return;closeDrawer();S.pkD={eid,iid};pkDrawer(true);}
function pkDrawer(force){
  const host=$("#drawer"),D=S.pkD;if(!D)return;const e0=get("events",D.eid),P=e0&&evPk(e0),it=P&&P.items.find(x=>x.id===D.iid);
  if(!it){closeDrawer();return;}
  const ae=document.activeElement;if(!force&&ae&&host.contains(ae)&&ae.matches("input,select,textarea"))return;
  const ed=mkEd(e0),ro=ed?"":" disabled",fld=(l,inp)=>`<label>${l}</label><div class="pv">${inp}</div>`;
  const sec=P.secs.find(a=>a.id===it.s),st=pkSt(it),docs=Array.isArray(it.docs)?it.docs:[],T=evTexts(e0),tx=T.find(t=>t.id===it.txid);
  const hasTxt=!sec||sec.kind!=="file"||pkHasText(it);
  const MP=evPlan(e0),M=pkMk(e0,it),mAvail=MP.items.filter(x=>!(it.mk||[]).includes(x.id));
  const TK=(it.tasks||[]).map(id=>get("tasks",id)).filter(x=>x&&!x._stub),tAvail=S.d.tasks.filter(t=>t.eventId===e0.id&&!(it.tasks||[]).includes(t.id));
  const rm=(attr,id,l)=>ed?`<button type="button" class="tplus" ${attr}="${esc(id)}" title="${l}" aria-label="${l}" style="width:22px;height:22px;font-size:17px">×</button>`:"";
  const body=`<div id="dw-head"><input class="ttl" data-pkf="t" value="${esc(it.t||"")}" placeholder="Názov" aria-label="Názov"${ed?"":" readonly"}></div>
    <section class="dcard"><h3>${DI.list}Zadanie</h3>
      <textarea data-pkf="brief" placeholder="Čo treba vyrobiť – formát a rozmery, čo tam má byť, pre koho, kde sa použije…" style="display:block;width:100%;box-sizing:border-box;min-height:110px"${ed?"":" readonly"}>${esc(it.brief||"")}</textarea>
      <div class="props cprops" style="margin:10px 0 0">
        ${fld("Sekcia",`<select data-pkf="s"${ro}>${P.secs.map(a=>`<option value="${esc(a.id)}" ${a.id===it.s?"selected":""}>${esc(a.title)}</option>`).join("")}</select>`)}
        ${fld("Stav",`<select data-pkf="st"${ro}>${TXST.map(([v,l])=>`<option value="${v}" ${v===st?"selected":""}>${l}</option>`).join("")}</select>`)}
        ${fld("Termín",`<input type="date" data-pkf="due" value="${esc(it.due||"")}"${ro}>`)}
        ${fld("Kto",ed?`<div data-pkwho></div>`:(it.who?who(it.who):"—"))}
      </div></section>
    <section class="dcard lkc docslot">${sdHead("Výstup",ed)}
      ${hasTxt?`<textarea data-pkf="body" placeholder="Hotový text…" style="display:block;width:100%;box-sizing:border-box;min-height:130px;margin-top:6px"${ed?"":" readonly"}>${esc(it.body||"")}</textarea>
      <div class="row" style="justify-content:space-between;margin-top:4px"><span class="meta" id="pk-cnt">${String(it.body||"").length} znakov</span><button type="button" class="tplus" data-pkcopy title="Kopírovať text" aria-label="Kopírovať text">${TXI.copy}</button></div>
      <div class="props cprops" style="margin:6px 0 10px">${fld("Dlhý text",`<select data-pkf="txid"${ro}><option value="">— žiadny —</option>${T.map(t=>`<option value="${esc(t.id)}" ${t.id===it.txid?"selected":""}>${esc(t.title)}</option>`).join("")}</select>${tx?`<button type="button" data-pktx="${esc(tx.id)}" style="all:unset;cursor:pointer;display:block;margin-top:4px;font-size:13px;color:var(--muted);text-decoration:underline">Otvoriť „${esc(tx.title)}“ v Textoch →</button>`:""}`)}</div>`:""}
      ${docs.length?`<div class="dr2-t">${sdThumbs(e0,docs,ed)}</div>`:`<div class="meta" style="margin-top:4px;white-space:normal">${hasTxt?"K textu môžete priložiť aj súbor alebo odkaz.":"Sem patrí hotová vec – súbor alebo odkaz. Veľké videá vložte radšej odkazom (napr. z Disku)."}</div>`}</section>
    <section class="dcard"><h3>${DI.tag}Prepojenie</h3>
      <div class="dr2"><div class="dr2-h"><b>${PK_MKT}Marketing</b></div>
        ${M.length?`<ul class="items lk">${M.map(x=>{const a=MP.areas.find(y=>y.id===x.a);return`<li data-open="mkt:${esc(D.eid)}~${esc(x.id)}"><span class="t">${esc(x.t||"Bez názvu")}</span>${a?`<span class="tg sm" style="--tc:${mkCol(MP,x.a)}">${esc(a.title)}</span>`:""}${x.date?`<span class="meta">${dueHtml(x.date,x.d)}</span>`:""}${rm("data-pkmkrm",x.id,"Odpojiť")}</li>`;}).join("")}</ul>`:`<p class="meta" style="margin:0;white-space:normal">Zatiaľ sa nepoužíva v žiadnom výstupe.</p>`}
        ${ed&&mAvail.length?`<select class="linksel" data-pkmkadd><option value="">↗ Pripojiť k výstupu v Marketingu…</option>${MP.areas.map(a=>{const L=mAvail.filter(x=>x.a===a.id);return L.length?`<optgroup label="${esc(a.title)}">${L.map(x=>`<option value="${esc(x.id)}">${esc(x.t||"Bez názvu")}</option>`).join("")}</optgroup>`:"";}).join("")}</select>`:""}</div>
      <div class="dr2"><div class="dr2-h"><b>${ICON.ulohy}Úlohy</b>${ed&&accEdit("tasks")?`<button type="button" class="btn sm ghost" data-pktasknew>+ Nová úloha</button>`:""}</div>
        ${TK.length?`<ul class="items lk">${TK.map(x=>`<li data-open="tasks:${esc(x.id)}"><button class="check ${isDone(x)?"on":""}" data-done="${esc(x.id)}" aria-label="Hotové"></button><span class="t">${esc(x.title||"Bez názvu")}</span>${x.assignee?`<span class="meta">${who(x.assignee)}</span>`:""}<span class="meta">${dueHtml(x.due,isDone(x))}</span>${rm("data-pktaskrm",x.id,"Odpojiť")}</li>`).join("")}</ul>`:`<p class="meta" style="margin:0;white-space:normal">Bez úlohy. Úloha sa ukáže človeku v „Moje úlohy“ a v Kalendári.</p>`}
        ${ed&&tAvail.length?`<select class="linksel" data-pktaskadd><option value="">↗ Pripojiť existujúcu úlohu podujatia…</option>${tAvail.map(x=>`<option value="${esc(x.id)}">${esc(x.title||"Bez názvu")}</option>`).join("")}</select>`:""}</div>
    </section>`;
  const box=host.querySelector("aside[data-pkbox] .dbody");
  host.hidden=false;
  if(box)box.innerHTML=body;
  else host.innerHTML=`<div class="dscrim" data-dclose></div><aside class="drawer dw-narrow" data-pkbox role="dialog" aria-modal="true" aria-label="Zadanie podkladu">
    <div class="dtop dtop-ic">${ed?`<button class="icb danger" data-pkidel title="Zmazať" aria-label="Zmazať">${TI.del}</button>`:""}<button class="icb" data-dclose title="Zavrieť" aria-label="Zavrieť">${PK_X}</button></div><div class="dbody">${body}</div></aside>`;
  host.querySelectorAll("[data-dclose]").forEach(b=>b.onclick=closeDrawer);
  const item=N=>N.items.find(y=>y.id===D.iid),set=fn=>pkSet(D.eid,N=>{const x=item(N);if(x)fn(x);});
  const dl=host.querySelector("[data-pkidel]");if(dl)dl.onclick=async()=>{if(!await ask(`Zmazať zadanie „${it.t||"Bez názvu"}“${docs.length?" aj s jeho súbormi":""}?`,"Zmazať"))return;const d=S.pkD;closeDrawer();if(d)pkSet(d.eid,N=>{N.items=N.items.filter(x=>x.id!==d.iid);});};
  host.querySelectorAll("[data-pkf]").forEach(inp=>{const f=inp.dataset.pkf;
    inp.onchange=()=>{const v=String(inp.value).trim();if(f==="t"&&!v){inp.value=it.t||"";return;}
      set(x=>{x[f]=v;}).then(()=>{if(f==="s"||f==="st"||f==="txid")pkDrawer(true);});};
    if(inp.tagName==="INPUT")inp.onkeydown=ev=>{if(ev.key==="Enter")inp.blur();};});
  const bd=host.querySelector('[data-pkf="body"]'),cn=host.querySelector("#pk-cnt");if(bd&&cn)bd.oninput=()=>{cn.textContent=bd.value.length+" znakov";};
  const cp=host.querySelector("[data-pkcopy]");if(cp)cp.onclick=()=>pkCopy(bd.value);
  const tb=host.querySelector("[data-pktx]");if(tb)tb.onclick=()=>txGo(D.eid,tb.dataset.pktx);
  const wb=host.querySelector("[data-pkwho]");if(wb)picker(wb,it.who||"",v=>set(x=>{x.who=v||"";}));
  sdBind(host,D.eid,fn=>set(x=>{x.docs=fn(Array.isArray(x.docs)?x.docs:[]);}),()=>pkDrawer(true));
  const ma=host.querySelector("[data-pkmkadd]");if(ma)ma.onchange=()=>{const v=ma.value;if(v)set(x=>{x.mk=[...new Set([...(x.mk||[]),v])];}).then(()=>pkDrawer(true));};
  host.querySelectorAll("[data-pkmkrm]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();set(x=>{x.mk=(x.mk||[]).filter(i=>i!==b.dataset.pkmkrm);}).then(()=>pkDrawer(true));});
  const ta=host.querySelector("[data-pktaskadd]");if(ta)ta.onchange=()=>{const v=ta.value;if(v)set(x=>{x.tasks=[...new Set([...(x.tasks||[]),v])];}).then(()=>pkDrawer(true));};
  host.querySelectorAll("[data-pktaskrm]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();set(x=>{x.tasks=(x.tasks||[]).filter(i=>i!==b.dataset.pktaskrm);}).then(()=>pkDrawer(true));});
  const tn=host.querySelector("[data-pktasknew]");if(tn)tn.onclick=async()=>{const cur=get("events",D.eid),c=cur&&evPk(cur).items.find(x=>x.id===D.iid);if(!c)return;
    const d={title:(sec?sec.title+": ":"")+(c.t||"Podklad"),status:"inbox",priority:"normalne",org:"ars",eventId:cur.id};if(cur.projectId)d.projectId=cur.projectId;if(c.who)d.assignee=c.who;if(c.due)d.due=c.due;if(c.brief)d.note=c.brief;
    const tid=await add("tasks",d);if(!tid)return;await set(x=>{x.tasks=[...(x.tasks||[]),tid];});toast("Úloha vytvorená.");pkDrawer(true);};
}
/* ---- položka marketingu: karta Podklady (pripojené zadania + vlastné súbory) ---- */
function mkPkCard(e0,it,ed){
  const P=evPk(e0),LK=pkOfMk(e0,it.id),docs=Array.isArray(it.docs)?it.docs:[],avail=P.items.filter(x=>!(x.mk||[]).includes(it.id));
  const thumbs=LK.flatMap(x=>(x.docs||[]).map((d,i)=>docThumb("events",e0,d,i,true))).join("")+sdThumbs(e0,docs,ed);
  return`<section class="dcard lkc docslot">${sdHead("Podklady",ed)}
    ${LK.length?`<ul class="items lk">${LK.map(x=>{const sd=pkStDef(x),sc=P.secs.find(y=>y.id===x.s);return`<li data-open="pk:${esc(e0.id)}~${esc(x.id)}"><i class="txdot" style="background:${sd[2]}" title="${sd[1]}"></i><span class="t">${esc(x.t||"Bez názvu")}</span>${sc?`<span class="meta">${esc(sc.title)}</span>`:""}${String(x.body||"").trim()?`<button type="button" class="tplus" data-mkpkcopy="${esc(x.id)}" title="Kopírovať text podkladu" aria-label="Kopírovať text podkladu" style="width:22px;height:22px">${TXI.copy}</button>`:""}${ed?`<button type="button" class="tplus" data-mkpkrm="${esc(x.id)}" title="Odpojiť" aria-label="Odpojiť" style="width:22px;height:22px;font-size:17px">×</button>`:""}</li>`;}).join("")}</ul>`:""}
    ${thumbs?`<div class="dr2-t" style="margin-top:8px">${thumbs}</div>`:(LK.length?"":`<div class="meta" style="margin-top:4px;white-space:normal">Zadajte výrobu podkladu (text, grafika, video) alebo priložte hotový súbor či odkaz.</div>`)}
    ${ed?`<select class="linksel" data-mkpkadd><option value="">↗ Zadať alebo pripojiť podklad…</option><optgroup label="Nové zadanie">${P.secs.map(a=>`<option value="new:${esc(a.id)}">${esc(a.title)}</option>`).join("")}</optgroup>${avail.length?`<optgroup label="Pripojiť existujúce">${avail.map(x=>{const sc=P.secs.find(y=>y.id===x.s);return`<option value="${esc(x.id)}">${esc((sc?sc.title+" · ":"")+(x.t||"Bez názvu"))}</option>`;}).join("")}</optgroup>`:""}</select>`:""}</section>`;
}
function mkPkBind(host,D){
  sdBind(host,D.eid,fn=>mkSet(D.eid,N=>{const x=N.items.find(y=>y.id===D.iid);if(x)x.docs=fn(Array.isArray(x.docs)?x.docs:[]);}),()=>mkDrawer(true));
  const sel=host.querySelector("[data-mkpkadd]");if(sel)sel.onchange=async()=>{const v=sel.value;if(!v)return;
    if(v.startsWith("new:")){const e0=get("events",D.eid),it=e0&&evPlan(e0).items.find(x=>x.id===D.iid);if(!it)return;const nid=mkId();
      await pkSet(D.eid,N=>{N.items.push(pkNew(nid,v.slice(4),it.t||"",{mk:[D.iid]}));});pkOpen(D.eid,nid);}
    else{await pkSet(D.eid,N=>{const x=N.items.find(y=>y.id===v);if(x)x.mk=[...new Set([...(x.mk||[]),D.iid])];});mkDrawer(true);}};
  host.querySelectorAll("[data-mkpkrm]").forEach(b=>b.onclick=async ev=>{ev.stopPropagation();await pkSet(D.eid,N=>{const x=N.items.find(y=>y.id===b.dataset.mkpkrm);if(x)x.mk=(x.mk||[]).filter(i=>i!==D.iid);});mkDrawer(true);});
  host.querySelectorAll("[data-mkpkcopy]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();const e0=get("events",D.eid),x=e0&&evPk(e0).items.find(y=>y.id===b.dataset.mkpkcopy);if(x)pkCopy(x.body);});
}
/* ---- úloha: odkaz na zadanie, ku ktorému patrí ---- */
function pkTaskCard(t){
  const L=[];S.d.events.forEach(e=>{if(e.podklady&&Array.isArray(e.podklady.items))e.podklady.items.forEach(x=>{if((x.tasks||[]).includes(t.id))L.push([e,x]);});});
  if(!L.length)return"";
  return`<section class="dcard lkc"><h3 style="margin-bottom:6px"><span class="lkh">${PK_IMG}Podklad</span></h3><ul class="items lk">${L.map(([e,x])=>{const sd=pkStDef(x),sc=evPk(e).secs.find(y=>y.id===x.s);return`<li data-open="pk:${esc(e.id)}~${esc(x.id)}"><i class="txdot" style="background:${sd[2]}" title="${sd[1]}"></i><span class="t">${esc(x.t||"Bez názvu")}</span>${sc?`<span class="meta">${esc(sc.title)}</span>`:""}</li>`;}).join("")}</ul></section>`;
}
document.addEventListener("change",ev=>{const t=ev.target;if(!t||!t.dataset)return;const one=(k,fn)=>{const[eid,iid]=k.split("|");pkSet(eid,N=>{const x=N.items.find(y=>y.id===iid);if(x)fn(x);});};
  if(t.dataset.pkst){one(t.dataset.pkst,x=>{x.st=t.value;});return;}
  if(t.dataset.pkdue){one(t.dataset.pkdue,x=>{x.due=t.value;});return;}
  if(t.dataset.pksec){const[eid,sid]=t.dataset.pksec.split("|"),v=t.value.trim();if(!v){render();return;}pkSet(eid,N=>{const a=N.secs.find(y=>y.id===sid);if(a)a.title=v;});}});
document.addEventListener("keydown",ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.pkadd||ev.key!=="Enter")return;const v=t.value.trim();if(!v)return;
  const[eid,sid]=t.dataset.pkadd.split("|");t.value="";pkSet(eid,N=>{N.items.push(pkNew(mkId(),sid,v));});});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  if((x=q("[data-pksel]"))){const[eid,sid]=x.dataset.pksel.split("|");S._pk=S._pk||{};S._pk[eid]=sid;render();return;}
  if((x=q("[data-pkopen]"))){const[eid,iid]=x.dataset.pkopen.split("|");pkOpen(eid,iid);return;}
  if((x=q("[data-pksadd]"))){const eid=x.dataset.pksadd,nid=mkId();S._pk=S._pk||{};S._pk[eid]=nid;await pkSet(eid,N=>{N.secs.push({id:nid,title:"Nová sekcia",kind:""});});setTimeout(()=>{const i=document.querySelector(`[data-pksec$="|${nid}"]`);if(i){i.focus();i.select();}},60);return;}
  if((x=q("[data-pksdel]"))){const[eid,sid]=x.dataset.pksdel.split("|"),e0=get("events",eid);if(!e0)return;const P=evPk(e0),a=P.secs.find(y=>y.id===sid),n=P.items.filter(y=>y.s===sid).length;if(!a)return;
    if(n&&!await ask(`Odstrániť sekciu „${a.title}“ aj s ${n} ${n===1?"zadaním":"zadaniami"}?`,"Odstrániť"))return;
    S._pk=S._pk||{};S._pk[eid]="";pkSet(eid,N=>{N.secs=N.secs.filter(y=>y.id!==sid);N.items=N.items.filter(y=>y.s!==sid);});return;}
});
