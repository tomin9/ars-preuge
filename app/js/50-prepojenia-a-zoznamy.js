/* ===== Prepojenia medzi záznamami (related, link), roly a štítky kontaktov, spolupráce, doplnky bočného panela (dExtra), výber osoby, spoločné riadky zoznamov a tabuľka.
   Časť spoločného programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/50-prepojenia-a-zoznamy.js. Nie je to samostatný skript. ===== */
/* ===== universal relations: every part links to every other part ===== */
const MAIN=["projects","grants","events","tasks","ledger","contacts"];
const LKI={ledger:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  tasks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  events:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  grants:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/></svg>',
  projects:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2.5h7.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>',
  contacts:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>'};
const lkCard=(e,r,t)=>`<section class="dcard lkc">${linkBlock(e,r,t)}</section>`;
const TAGDEF={osoba:[["dobrovolnik","Dobrovoľník",GREEN],["partner","Partner",ORANGE]],firma:[["sponzor","Sponzor",PURPLE],["partner","Partner",ORANGE]],organizacia:[["partner","Partner",ORANGE],["sponzor","Sponzor",PURPLE]],media:[["mediapartner","Mediálny partner",OCHRE]]};
const TAGPAL=[TEAL,PINK,BLUE,RED,OCHRE,PURPLE];
const tagCustom=t=>((S.settings.roleTags||{})[t]||[]);
const tagVocab=t=>{const d=TAGDEF[t||"osoba"]||[],c=tagCustom(t||"osoba"),seen=new Set(d.map(x=>x[0]));return[...d,...c.filter(x=>!seen.has(x[0]))];};
const tagInfo=k=>{for(const t of Object.keys(TAGDEF)){const x=tagVocab(t).find(y=>y[0]===k);if(x)return x;}return[k,k,"#8A8F98"];};
const tagTab={osoby:"osoba",firmy:"firma",organizacie:"organizacia",media:"media"};
const tagList=c=>Array.isArray(c&&c.tags)?c.tags:((c&&(c.volunteer===true||(c.volunteer==null&&c.role==="dobrovolnik")))?["dobrovolnik"]:[]);
const ctypeCol=t=>((OPT.ctype.find(o=>o[0]===(t||"osoba"))||[])[2])||"#888";
const orgFn=(c,oid)=>((c&&c.orgFn)||{})[oid]||"";
const fnList=()=>[...new Set(S.d.contacts.flatMap(c=>Object.values(c.orgFn||{})).map(x=>String(x||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"sk"));
const fnDl=()=>`<datalist id="fn-dl">${fnList().map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>`;
const orgList=c=>Array.isArray(c&&c.orgIds)?c.orgIds:((c&&c.orgId)?[c.orgId]:[]);
const ROLES_BY_TYPE={osoba:["tim","umelec","dobrovolnik","externy"],firma:["sponzor","partner"],organizacia:["partner","institucia","sponzor"],media:["medium","mediapartner"]};
const roleOpts=c=>(ROLES_BY_TYPE[(c&&c.ctype)||"osoba"]||[]).map(k=>[k,optL("crole",k)]);
const evRole=(ev,cid)=>((ev&&ev.roles)||{})[cid]||"";
const LINK_L={projects:"Projekty",grants:"Granty",events:"Podujatia",tasks:"Úlohy",ledger:"Platby",contacts:"Ľudia a kontakty"};
function linkFields(s,t){return(ENT[s].fields||[]).filter(f=>(f.t==="rel"||f.t==="mrel")&&f.e===t);}
function refIds(x,s,t){const o=[];linkFields(s,t).forEach(f=>{const v=x[f.k];if(Array.isArray(v))o.push(...v);else if(v)o.push(v);});return o;}
function related(e,r,t){const ids=new Set(refIds(r,e,t));S.d[t].forEach(x=>{if(refIds(x,t,e).includes(r.id))ids.add(x.id);});ids.delete(r.id);return[...ids].map(id=>get(t,id)).filter(Boolean);}
function setRef(x,f,id,on){
  if(f.t==="mrel"){const a=Array.isArray(x[f.k])?[...x[f.k]]:[];const i=a.indexOf(id);if(on&&i<0)a.push(id);if(!on&&i>=0)a.splice(i,1);return{[f.k]:a};}
  return{[f.k]:on?id:(x[f.k]===id?"":(x[f.k]||""))};
}
async function link(e,id,t,tid,on){
  const r=get(e,id),x=get(t,tid),own=linkFields(e,t),oth=linkFields(t,e);
  const ownM=own.find(f=>f.t==="mrel"),othM=oth.find(f=>f.t==="mrel");
  if(on){
    if(othM&&x)return upd(t,tid,setRef(x,othM,id,true));
    if(ownM&&r)return upd(e,id,setRef(r,ownM,tid,true));
    if(oth[0]&&x){const p=setRef(x,oth[0],id,true);if(t!=="projects"&&e==="grants"&&r&&r.projectId&&!x.projectId&&linkFields(t,"projects").some(f=>f.k==="projectId"))p.projectId=r.projectId;return upd(t,tid,p);}
    if(own[0]&&r)return upd(e,id,setRef(r,own[0],tid,true));
  }else{
    if(r&&refIds(r,e,t).includes(tid))await upd(e,id,Object.assign({},...own.map(f=>setRef(r,f,tid,false))));
    if(x&&refIds(x,t,e).includes(id))await upd(t,tid,Object.assign({},...oth.map(f=>setRef(x,f,id,false))));
  }
}
async function linkNew(e,id,t){
  const r=get(e,id);if(!r)return;const d={};
  const oth=linkFields(t,e).find(f=>f.t==="mrel")||linkFields(t,e)[0];
  if(oth)d[oth.k]=oth.t==="mrel"?[id]:id;
  ["projectId","grantId","eventId"].forEach(k=>{if(r[k]&&!(k in d)&&(ENT[t].fields||[]).some(f=>f.k===k))d[k]=r[k];});
  if(t==="contacts"&&r.projectId&&!d.projectIds)d.projectIds=[r.projectId];
  const nid=await create(t,d);
  if(nid&&!oth)link(e,id,t,nid,true);
}

const PICOL=["#3B5BD9","#2B8A5F","#C08A12","#C2372E","#8A3B9E","#D2691E","#0F8A80","#C2457A","#4A5568"];
const CSVG={osoba:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="10" r="3.2"/><path d="M6.3 18.4c1.2-2.3 3.2-3.5 5.7-3.5s4.5 1.2 5.7 3.5"/></svg>',
  firma:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.8c0-.7.6-1.3 1.3-1.3h3.4c.7 0 1.3.6 1.3 1.3v1.7M3.5 12.5h17"/></svg>',
  organizacia:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 9.5 12 4l9 5.5M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20.5h18"/></svg>',
  media:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v13H6.5A2.5 2.5 0 0 1 4 16.5V6A1.5 1.5 0 0 1 5.5 4.5"/><path d="M17.5 9H20v8.5a2 2 0 0 1-2.5 2M8 8.5h6M8 12h6M8 15.5h3.5"/></svg>'};
function cIcon(c,big){if(!c)return"";const cls=big?"cico big":"cico";
  if(c.icon&&typeof c.icon==="string")return`<img class="${cls} img" src="${esc(c.icon.startsWith("data:")?c.icon:(typeof ARSP_BLOB!=="undefined"?ARSP_BLOB:"")+c.icon)}" alt="">`;
  const t=CSVG[c.ctype]?c.ctype:(c.ctype?"organizacia":"osoba");return`<span class="${cls} t-${t}" aria-hidden="true">${CSVG[t]}</span>`;}
function provC(g){return g&&g.providerId?get("contacts",g.providerId):null;}
function provName(g){const c=provC(g);return c?(c.name||""):((g&&g.provider)||"").trim();}
function provIcon(g,big){const c=provC(g);if(c)return cIcon(c,big);const prov=((g&&g.provider)||"").trim();if(!prov)return"";
  let h=0;for(const ch of prov)h=(h*31+ch.charCodeAt(0))>>>0;const ini=prov.replace(/[^\p{L}\p{N} ]/gu,"").split(/\s+/).filter(Boolean).map(w=>w[0]).join("").slice(0,3).toUpperCase()||prov.slice(0,2).toUpperCase();
  return`<span class="${big?"pico big":"pico"} ini" style="background:${PICOL[h%PICOL.length]}" title="${esc(prov)}">${esc(ini)}</span>`;}
function gName(g){return g?provIcon(g)+esc(g.name||"Grant"):"";}
function linkLi(e,r,t,x){
  let m,cls="";
  if(t==="tasks")m=`<button class="check ${isDone(x)?"on":""}" data-done="${esc(x.id)}" aria-label="Hotové"></button><span class="t">${esc(x.title||"Bez názvu")}</span>${x.assignee?`<span class="meta">${who(x.assignee)}</span>`:""}<span class="meta">${dueHtml(x.due,isDone(x))}</span>`;
  else if(t==="ledger"&&e==="contacts"){cls=" clg";m=`<span class="meta">${fdateS(x.date)||"plánované"}</span><span class="t">${esc(x.desc||"Platba")}</span><span class="num ${x.type==="prijem"?"pos":"neg"}">${x.type==="prijem"?"+":"−"}${eur(x.amount)}</span>`;}
  else if(t==="ledger")m=`<span class="t">${esc(x.desc||"Platba")}</span><span class="meta">${fdateS(x.date)||"plánované"}</span><span class="num ${x.type==="prijem"?"pos":"neg"}">${x.type==="prijem"?"+":"−"}${eur(x.amount)}</span>`;
  else if(t==="contacts"&&e==="events"){const cur=evRole(r,x.id);m=`<span class="t">${cIcon(x)}${esc(x.name||"Bez mena")}</span><select class="rolesel" data-evrole="${esc(r.id)}|${esc(x.id)}" aria-label="Rola na podujatí" style="padding:3px 6px;font-size:13px;max-width:46%"><option value="">— rola —</option>${roleOpts(x).map(([k,l])=>`<option value="${k}" ${cur===k?"selected":""}>${esc(l)}</option>`).join("")}${cur&&!roleOpts(x).some(o=>o[0]===cur)?`<option value="${esc(cur)}" selected>${esc(optL("crole",cur))}</option>`:""}</select>`;}
  else if(t==="events"&&e==="contacts")m=`<span class="meta" style="min-width:52px">${fdateS(x.date)}</span><span class="t">${esc(x.name||"Podujatie")}</span>${evRole(x,r.id)?chip("crole",evRole(x,r.id)):""}`;
  else if(t==="events")m=`<span class="meta" style="min-width:52px">${fdateS(x.date)}</span><span class="t">${esc(x.name||"Podujatie")}</span>${chip("estat",x.status)}`;
  else if(t==="grants")m=`<span class="t">${gName(x)}</span>${x.approved?`<span class="meta">${eur0(x.approved)}</span>`:""}${chip("gstat",x.status)}`;
  else if(t==="projects")m=`<i class="dot" style="background:${esc(x.color||GRAY)}"></i><span class="t">${esc(x.name||"Projekt")}</span>`;
  else m=`<span class="t">${cIcon(x)}${esc(x.name||"Bez mena")}</span>${x.org?`<span class="meta">${esc(x.org)}</span>`:""}`;
  return`<li class="${cls.trim()}" data-open="${t}:${esc(x.id)}">${m}<button class="x" data-unlink="${e}:${esc(r.id)}|${t}:${esc(x.id)}" aria-label="Zrušiť prepojenie" title="Zrušiť prepojenie">×</button></li>`;
}
function linkBlock(e,r,t){
  let L=related(e,r,t);
  if(t==="ledger")L.sort((a,b)=>e==="contacts"&&(!a.date!==!b.date)?(a.date?1:-1):(b.date||"").localeCompare(a.date||""));else if(t==="tasks")L.sort((a,b)=>isDone(a)-isDone(b)||byDue(a,b));else if(t==="events")L.sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  const extra=t==="ledger"&&L.length&&e!=="contacts"?` <span class="meta">výdavky ${eur(sum(L.filter(x=>x.type!=="prijem"),x=>x.amount))}</span>`:"";
  const ids=new Set(L.map(x=>x.id));
  const avail=S.d[t].filter(x=>x.id!==r.id&&!ids.has(x.id)&&!(e==="contacts"&&t==="contacts"&&x.ctype&&x.ctype!=="osoba")).sort((a,b)=>t==="ledger"?(b.date||"").localeCompare(a.date||""):ttl(t,a).localeCompare(ttl(t,b),"sk")).slice(0,300);
  return`<h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="lkh">${LKI[t]||""}${LINK_L[t]}${extra}</span><span class="row" style="gap:6px"><span class="meta">${e==="contacts"&&t==="ledger"?"":(L.length||"")}</span>${e==="contacts"&&t==="ledger"?"":`<button class="btn ghost sm" data-linknew="${e}:${esc(r.id)}|${t}">+ Nový</button>`}</span></h3>
  ${L.length?`<ul class="items lk">${L.map(x=>linkLi(e,r,t,x)).join("")}</ul>`:""}
  ${avail.length&&e!=="contacts"?`<select data-linkadd="${e}:${esc(r.id)}|${t}" aria-label="Prepojiť existujúci záznam" style="width:100%;margin-top:6px;color:var(--muted)"><option value="">Prepojiť existujúce…</option>${avail.map(x=>`<option value="${esc(x.id)}">${esc(ttl(t,x))}${t==="ledger"?` · ${fdateS(x.date)||"plánované"} · ${eur(x.amount)}`:""}</option>`).join("")}</select>`:""}`;
}
function linksHtml(e,r){
  return MAIN.filter(t=>t!==e&&!linkFields(e,t).some(f=>f.t==="rel")).map(t=>`<div class="sec">${linkBlock(e,r,t)}</div>`).join("");
}
document.addEventListener("click",e=>{const tr=e.target.closest&&e.target.closest("[data-teamrm]");if(tr){e.stopPropagation();e.preventDefault();const[eid,cid]=tr.dataset.teamrm.split("|"),e0=get("events",eid);if(e0)(async()=>{await link("events",eid,"contacts",cid,false);for(const pt of S.d.partnerships.filter(x=>x.eventId===eid&&x.contactId===cid))await del("partnerships",pt.id);const e1=get("events",eid)||e0,rl=Object.assign({},e1.roles||{});delete rl[cid];await upd("events",eid,{roles:rl});})();return;}},true);
document.addEventListener("click",e=>{const lg=e.target.closest&&e.target.closest("[data-orglegacy]");if(lg&&DW&&DW.e==="contacts"){e.preventDefault();upd("contacts",DW.id,{org:""});return;}
  const tt=e.target.closest&&e.target.closest("[data-tagtoggle]");if(tt&&DW&&DW.e==="contacts"){const r=get("contacts",DW.id);if(r){const k=tt.dataset.tagtoggle,a=tagList(r),n=a.includes(k)?a.filter(x=>x!==k):[...a,k];upd("contacts",r.id,{tags:n,volunteer:null});}return;}
  const b=e.target.closest&&e.target.closest("[data-orgdel]");if(!b||!DW||DW.e!=="contacts")return;const r=get("contacts",DW.id);if(!r)return;e.preventDefault();{const m=Object.assign({},r.orgFn||{});delete m[b.dataset.orgdel];upd("contacts",r.id,{orgIds:orgList(r).filter(x=>x!==b.dataset.orgdel),orgId:"",orgFn:m});}});
document.addEventListener("change",ev=>{const sr=ev.target.closest&&ev.target.closest("[data-secren]");if(sr){const[eid,key]=sr.dataset.secren.split("|"),e0=get("events",eid),v=sr.value.trim();if(e0&&v)upd("events",eid,{teamSecs:teamSecs(e0).map(x=>x[0]===key?[x[0],v]:x)});else if(e0)sr.value=(teamSecs(e0).find(x=>x[0]===key)||[0,""])[1];return;}
  const dn=ev.target.closest&&ev.target.closest("[data-dutynew]");if(dn){const[eid,cid]=dn.dataset.dutynew.split("|"),e0=get("events",eid),v=dn.value.trim();dn.value="";if(e0&&v){const a=dutyArr(e0,cid);if(!a.some(x=>x.toLowerCase()===v.toLowerCase()))upd("events",eid,{duties:Object.assign({},e0.duties||{},{[cid]:[...a,v]})});}return;}
  const du=ev.target.closest&&ev.target.closest("[data-duty]");if(du){const[eid,cid]=du.dataset.duty.split("|"),e0=get("events",eid);if(e0){const m=Object.assign({},e0.duties||{}),v=du.value.trim();if(v)m[cid]=v;else delete m[cid];upd("events",eid,{duties:m});}return;}
  const pn=ev.target.closest&&ev.target.closest("[data-pnewstate]");if(pn&&pn.value){const[eid,cid]=pn.dataset.pnewstate.split("|");add("partnerships",{eventId:eid,contactId:cid,state:pn.value});return;}
  const ta=null;
  const ts=ev.target.closest&&ev.target.closest("[data-teamset]");if(ts&&ts.value){const[eid,cid]=ts.dataset.teamset.split("|"),e0=get("events",eid);if(e0)upd("events",eid,{roles:Object.assign({},e0.roles||{},{[cid]:ts.value})});return;}
  const tn=ev.target.closest&&ev.target.closest("[data-tagnew]");if(tn&&DW&&DW.e==="contacts"){const r=get("contacts",DW.id),lab=tn.value.trim();tn.value="";if(!r||!lab)return;(async()=>{const ty=r.ctype||"osoba",low=lab.toLowerCase();let hit=tagVocab(ty).find(x=>x[1].toLowerCase()===low);
    if(!hit){const k="t_"+low.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")+"_"+(Date.now()%100000),col=TAGPAL[tagCustom(ty).length%TAGPAL.length];hit=[k,lab,col];const rt=Object.assign({},S.settings.roleTags||{});rt[ty]=[...tagCustom(ty),hit];await saveSettings({roleTags:rt});}
    const a=tagList(r);if(!a.includes(hit[0]))await upd("contacts",r.id,{tags:[...a,hit[0]],volunteer:null});drawerRefresh(true);})();return;}
  const of=ev.target.closest&&ev.target.closest("[data-orgfn]");if(of){const oid=of.dataset.orgfn,pid=of.dataset.orgfnof||(DW&&DW.e==="contacts"?DW.id:""),pr=get("contacts",pid);if(pr){const m=Object.assign({},pr.orgFn||{});const v=of.value.trim();if(v)m[oid]=v;else delete m[oid];upd("contacts",pid,{orgFn:m});}return;}
  const oa=ev.target.closest&&ev.target.closest("[data-orgadd]");if(oa&&DW&&DW.e==="contacts"&&oa.value){const r=get("contacts",DW.id);if(r){oa.blur();Promise.resolve(upd("contacts",r.id,{orgIds:[...new Set([...orgList(r),oa.value])],orgId:""})).then(()=>drawerRefresh(true));}return;}
  const rs=ev.target.closest&&ev.target.closest("[data-evrole]");if(rs){const[eid,cid]=rs.dataset.evrole.split("|"),e0=get("events",eid);if(e0)upd("events",eid,{roles:Object.assign({},e0.roles||{},{[cid]:rs.value})});return;}
  const s=ev.target.closest&&ev.target.closest("[data-linkadd]");if(!s||!s.value)return;const[a,t1]=s.dataset.linkadd.split("|");const[e1,i1]=a.split(":");const v=s.value;s.value="";s.blur();link(e1,i1,t1,v,true);});
const PORD={oslovit:0,osloveny:1,potvrdeny:2,odmietnuty:3};
function pstateSel(p){return`<select data-pstate="${esc(p.id)}" aria-label="Stav spolupráce" style="padding:3px 6px;font-size:13px">${OPT.pstav.map(o=>`<option value="${o[0]}" ${p.state===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>`;}
function partnersBlock(ev){
  const P=S.d.partnerships.filter(p=>p.eventId===ev.id).map(p=>({p,c:get("contacts",p.contactId)})).filter(x=>x.c).sort((a,b)=>(PORD[a.p.state]??9)-(PORD[b.p.state]??9)||(a.c.name||"").localeCompare(b.c.name||"","sk"));
  const ids=new Set(P.map(x=>x.c.id));const cnt=OPT.pstav.map(o=>[o,P.filter(x=>x.p.state===o[0]).length]).filter(z=>z[1]);
  const avail=S.d.contacts.filter(c=>!ids.has(c.id)).sort((a,b)=>((a.ctype==="osoba")-(b.ctype==="osoba"))||(a.name||"").localeCompare(b.name||"","sk"));
  return`<h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span>Spolupráce</span><span class="row" style="gap:6px"><span class="meta">${P.length||""}</span><button class="btn ghost sm" data-pnew="${esc(ev.id)}">+ Nový partner</button></span></h3>
  ${cnt.length?`<div class="row" style="gap:6px;margin-bottom:6px">${cnt.map(([o,n])=>`<span class="chip"><i style="background:${o[2]}"></i>${o[1]} ${n}</span>`).join("")}</div>`:""}
  ${P.length?`<ul class="items lk">${P.map(({p,c})=>`<li data-peek="contacts:${esc(c.id)}"><span class="t">${cIcon(c)}${esc(c.name||"Bez mena")}</span>${pstateSel(p)}<button class="x" data-pdel="${esc(p.id)}" aria-label="Odobrať" title="Odobrať zo spolupráce">×</button></li>`).join("")}</ul>`:`<div class="empty">Zatiaľ nikto oslovený.</div>`}
  ${avail.length?`<select class="linksel" data-padd="ev:${esc(ev.id)}"><option value="">↗ Pridať existujúci kontakt…</option>${avail.map(c=>`<option value="${esc(c.id)}">${esc(c.name||"Bez mena")}</option>`).join("")}</select>`:""}`;
}
function contactPartnerships(c){
  const P=S.d.partnerships.filter(p=>p.contactId===c.id).map(p=>({p,ev:get("events",p.eventId)})).filter(x=>x.ev);
  const ids=new Set(P.map(x=>x.ev.id));const avail=S.d.events.filter(ev=>!ids.has(ev.id)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  return`<section class="dcard lkc"><h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="lkh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12l4-4 4 2 4-3 6 5-5 5-3-1-3 2-3-2z"/><path d="M3 12v4l3 2M21 13v3"/></svg>Spolupráce</span></h3>
  ${P.length?`<ul class="items lk">${P.map(({p,ev})=>`<li data-open="events:${esc(ev.id)}"><span class="t">${esc(ev.name)}</span>${pstateSel(p)}<button class="x" data-pdel="${esc(p.id)}" aria-label="Odobrať">×</button></li>`).join("")}</ul>`:""}
  ${avail.length?`<select class="linksel" data-padd="c:${esc(c.id)}"><option value="">↗ Osloviť pre podujatie…</option>${avail.map(ev=>`<option value="${esc(ev.id)}">${esc(ev.name)}</option>`).join("")}</select>`:""}</section>`;
}
document.addEventListener("change",ev=>{
  const t=ev.target;if(!t.closest)return;
  const ps=t.closest("[data-pstate]");if(ps){upd("partnerships",ps.dataset.pstate,{state:ps.value});return;}
  const pa=t.closest("[data-padd]");if(pa&&pa.value){const[k,id]=pa.dataset.padd.split(":");const v=pa.value;pa.value="";pa.blur();
    add("partnerships",k==="ev"?{eventId:id,contactId:v,state:"oslovit"}:{eventId:v,contactId:id,state:"oslovit"});}
});
function dExtra(e,r){
  let h="";
  if(e==="tasks")h+=checklistHtml(e,r,"Podúlohy",true);
  if(e==="contacts"){const ed=DW&&DW.edit;
    if(r.ctype&&r.ctype!=="osoba"){const P=S.d.contacts.filter(x=>x.id!==r.id&&orgList(x).includes(r.id)).sort((x,y)=>(x.name||"").localeCompare(y.name||"","sk"));
      h+=`<section class="dcard lkc"><h3 style="margin-bottom:6px"><span class="lkh">${LKI.contacts}Kontakty</span></h3>${P.length?`<ul class="items lk">${P.map(x=>`<li class="cpl" data-open="contacts:${esc(x.id)}"><span class="t">${esc(x.name||"Bez mena")}</span>${ed||orgFn(x,r.id)?`<input type="text" class="orgfn" list="fn-dl" data-orgfn="${esc(r.id)}" data-orgfnof="${esc(x.id)}" value="${esc(orgFn(x,r.id))}" placeholder="Funkcia" aria-label="Funkcia"${ed?"":" readonly tabindex=\"-1\""}>`:""}</li>`).join("")}</ul>`:""}${fnDl()}</section>`;}
    h+=accountCard(r,ed&&!S.readOnly);
    h+=lkCard(e,r,"ledger");
    if(r.ctype&&r.ctype!=="osoba")h+=logoCard(r,ed&&!S.readOnly);
    if(ed&&!S.readOnly)h+=mergeBlock(r);}
  if(e==="ledger")h+=`<section class="dcard"><div class="ldocs">${LDOCS.map(([k,l])=>docRow("ledger",r,k,l)).join("")}</div></section>
    <section class="dcard note"><textarea aria-label="Poznámka" id="f-note" data-f="note" placeholder="Napíšte poznámku…">${esc(r.note||"")}</textarea></section>`;
  if(e==="tasks")h+=MAIN.filter(t=>t!==e&&!linkFields(e,t).some(f=>f.t==="rel")).map(t=>lkCard(e,r,t)).join("");
  else if(MAIN.includes(e)&&e!=="contacts")h+=linksHtml(e,r);
  if(e==="lines"){const c=lineCalc(r),pd=x=>x.paid!==false&&!!x.date,pG=sum(c.L.filter(x=>!cofinG(x)&&pd(x)),x=>x.amount),plG=c.sg-pG;h+=`<div class="sec"><div class="facts" style="margin:0"><div><span>Zaplatené z dotácie</span><b>${eur(pG)}</b>${plG?`<span>+ plánované ${eur(plG)}</span>`:""}</div><div><span>Ostáva z dotácie</span><b class="${(+r.fromGrant||0)-c.sg<0?"neg":""}">${eur((+r.fromGrant||0)-c.sg)}</b>${plG?`<span>po zaplatení plánovaných</span>`:""}</div><div><span>Spolufinancovanie</span><b>${eur(c.sc)}</b></div></div></div>`;
    h+=miniList("Výdavky na položku","ledger",c.L,ledgerLi,{lineId:r.id,grantId:r.grantId||"",projectId:(get("grants",r.grantId)||{}).projectId||""});}
  if(e!=="comments"&&(e!=="contacts"||(DW&&DW.edit)||S.d.comments.some(c=>c.parent===e+":"+r.id)))h+=commentsHtml(e,r,e==="tasks");
  const meta=[r.createdAt?`Vytvorené ${rel(r.createdAt)}${r.createdBy?" · "+esc(personName(r.createdBy)):""}`:"",r.updatedAt&&r.updatedAt!==r.createdAt?`upravené ${rel(r.updatedAt)}${r.updatedBy?" · "+esc(personName(r.updatedBy)):""}`:""].filter(Boolean).join(", ");
  return h+(meta&&e!=="contacts"&&e!=="ledger"?`<p class="meta" style="margin-top:20px;white-space:normal">${meta}</p>`:"");
}

/* people picker: stores user id, or "~Name" for people outside the org */
function picker(box,initial,onSet){
  let val=initial||"";
  function draw(){
    if(val){
      box.innerHTML=`<div class="chosen">${avatar(val)}<span>${esc(personName(val))}</span><button type="button">Zmeniť</button></div>`;
      box.querySelector("button").onclick=()=>{val="";draw();const i=box.querySelector("input");i.focus();};
    }else{
      box.innerHTML=`<div class="picker"><input type="search" placeholder="${user?"Hľadať člena tímu alebo napísať meno":"Meno"}" autocomplete="off" aria-label="Osoba"><div class="menu" hidden></div></div>`;
      const inp=box.querySelector("input"),menu=box.querySelector(".menu");let hits=[];
      const show=async q=>{
        hits=user?await user.search(q):[];
        /* aj osoby z kontaktov; prepojený kontakt sa uloží ako jeho účet (funguje „Moje úlohy“), neprepojený ako kontakt */
        const hid=new Set(hits.map(h=>h.id)),nq=pnorm(q);
        const cts=nq?S.d.contacts.filter(c=>(c.ctype||"osoba")==="osoba"&&pnorm(c.name).includes(nq)&&!hid.has(ctUserId(c))).sort((a,b)=>pnorm(a.name).indexOf(nq)-pnorm(b.name).indexOf(nq)||(a.name||"").localeCompare(b.name||"","sk")).slice(0,8):[];
        const items=hits.map(h=>`<button type="button" data-id="${esc(h.id)}"><img class="av sm" alt="" src="${esc(h.avatarUrl)}">${esc(h.name)}</button>`)
          .concat(cts.map(c=>`<button type="button" data-cid="${esc(c.id)}">${cIcon(c)}${esc(c.name||"Bez mena")}<small class="meta" style="margin-left:auto">kontakt</small></button>`));
        if(q)items.push(`<button type="button" data-text="1">Použiť meno „${esc(q)}“</button>`);
        menu.innerHTML=items.join("");menu.hidden=!items.length;
        menu.querySelectorAll("button").forEach(b=>b.onmousedown=ev=>{ev.preventDefault();
          if(b.dataset.id){const h=hits.find(x=>x.id===b.dataset.id);S.people[h.id]=h;val=h.id;}else if(b.dataset.cid){const c=get("contacts",b.dataset.cid);val=(c&&ctUserId(c))||"c:"+b.dataset.cid;}else val="~"+inp.value.trim();
          onSet(val);draw();});
      };
      inp.onfocus=()=>show(inp.value.trim());inp.oninput=()=>show(inp.value.trim());
      inp.onblur=()=>setTimeout(()=>{menu.hidden=true;if(!val&&initial)onSet("");},160);
      inp.onkeydown=ev=>{if(ev.key==="Enter"&&inp.value.trim()){ev.preventDefault();val="~"+inp.value.trim();onSet(val);draw();}};
    }
  }
  draw();
}
/* ================= shared row renderers ================= */
function byDue(a,b){return(a.due||"9999").localeCompare(b.due||"9999");}
function taskLi(t){
  const p=get("projects",t.projectId);
  return`<li data-open="tasks:${esc(t.id)}"><button class="check ${isDone(t)?"on":""}" data-done="${esc(t.id)}" aria-label="Hotové"></button>
  ${p?`<i class="dot" style="background:${esc(p.color||GRAY)}" title="${esc(p.name)}"></i>`:""}<span class="t">${esc(t.title||"Bez názvu")}</span>
  ${t.priority==="urgentne"&&!isDone(t)?chip("prio","urgentne"):""}${t.assignee?`<span class="meta">${who(t.assignee)}</span>`:""}<span class="meta">${dueHtml(t.due,isDone(t))}</span></li>`;
}
function ledgerLi(x){
  return`<li data-open="ledger:${esc(x.id)}"><span class="t">${esc(x.desc||x.category||"Platba")}</span>${x.paid===false?`<span class="chip"><i style="background:${RED}"></i>nevyplatené</span>`:""}<span class="meta">${fdateS(x.date)||"plánované"}</span><span class="num ${x.type==="prijem"?"pos":"neg"}">${x.type==="prijem"?"+":"−"}${eur(x.amount)}</span></li>`;
}
function eventLi(e){
  return`<li data-open="events:${esc(e.id)}"><span class="meta" style="min-width:64px">${fdateS(e.date)||"bez dátumu"}</span><span class="t">${esc(e.name||"Podujatie")}</span>${chip("estat",e.status)}</li>`;
}
function emptyBox(text,e,label,defs){return`<div class="empty">${esc(text)}${e?`<div style="margin-top:8px"><button class="btn pri" data-create="${e}" ${defs?`data-defs='${esc(JSON.stringify(defs))}'`:""}>${esc(label)}</button></div>`:""}</div>`;}
const ctLink=id=>{const c=get("contacts",id);return c?`<span class="rlink" data-open="contacts:${esc(c.id)}" title="Otvoriť kontakt">${cIcon(c)}${esc(ttl("contacts",c))}</span>`:"";};
function table(cols,rows,open,foot){
  return`<div class="tw"><table><thead><tr>${cols.map(c=>`<th class="${c[2]||""}">${esc(c[0])}</th>`).join("")}</tr></thead><tbody>
  ${rows.map(r=>`<tr data-open="${open(r)}">${cols.map(c=>`<td class="${c[2]||""}">${c[1](r)}</td>`).join("")}</tr>`).join("")}</tbody>${foot?`<tfoot><tr>${foot}</tr></tfoot>`:""}</table></div>`;
}

/* ================= views ================= */
const VIEWS={};
