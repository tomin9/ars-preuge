/* ===== Kostra aplikácie: navigácia a adresa (go), vykreslenie stránky (render), ľavé menu, dolná lišta, spoločné kliknutia a klávesy, menu + Nové, ťahanie kariet.
   Časť spoločného programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/30-kostra.js. Nie je to samostatný skript. ===== */
/* ================= navigation ================= */
function go(view,id,isBack){
  id=id||null;
  if(!accView(view)){view="prehlad";id=null;}
  {const ce={projekt:"projects",grant:"grants",podujatie:"events"}[view],r=ce&&id?get(ce,id):null;if(r&&r._stub){toast("Tento záznam je mimo vášho prístupu – vidíte len jeho názov.");return;}}   /* oblasť bez prístupu – server dáta aj tak neposiela */
  if(!isBack&&(S.view!==view||S.id!==id)){S.hist=S.hist||[];S.hist.push({view:S.view,id:S.id});if(S.hist.length>50)S.hist.shift();try{history.pushState({n:S.hist.length},"");}catch(_){}}
  S.view=view;S.id=id;closeSide();
  try{const u=urlFor(ACT[view]||view);if(curUrl()!==u)history.replaceState(history.state,"",u);}catch(_){}
  if(view!=="projekt"&&view!=="grant"&&view!=="podujatie")closeDrawer();
  render();const m=$("#main");if(m)m.scrollTop=0;
}
function goBack(){
  if(DW){closeDrawer();return;}
  const h=(S.hist||[]).pop();if(h)go(h.view,h.id,true);else if(S.view!=="prehlad")go("prehlad",null,true);
}
const URLB=(window.ARSP&&window.ARSP.base)||"";
const urlFor=k=>URLB?URLB+"/"+k:"#/"+k;
const curUrl=()=>URLB?location.pathname.replace(/\/$/,""):location.hash;
const hashView=()=>{let k="";if(URLB){const r=location.pathname.slice(URLB.length).replace(/^\/+|\/+$/g,"").split("/")[0];k=r||(location.hash||"").replace(/^#\/?/,"").split("/")[0];}else k=(location.hash||"").replace(/^#\/?/,"").split("/")[0];return NAV.some(n=>n!=="-"&&n[0]===k)?k:"";};
window.addEventListener("popstate",()=>{
  const hv=hashView(),h=(S.hist||[]);const last=h[h.length-1],lastSec=last&&(ACT[last.view]||last.view);
  if(!DW&&hv&&hv!==(ACT[S.view]||S.view)&&hv!==lastSec){go(hv);return;}
  if(h.length||DW)goBack();});
function navBar(){
  const sec=ACT[S.view]||S.view,secL=(NAV.find(n=>n!=="-"&&n[0]===sec)||[0,""])[1];
  const ent={projekt:"projects",grant:"grants",podujatie:"events"}[S.view];const r=ent&&get(ent,S.id);
  const can=(S.hist||[]).length||S.view!=="prehlad";
  return`<div class="navbar"><button class="nb-back" data-back ${can?"":"disabled"} aria-label="Späť" title="Späť (Alt+←)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
  <nav class="nb-path" aria-label="Kde som">${r?`<button data-go="${sec}">${esc(secL)}</button><span>/</span><b>${esc(ttl(ent,r))}</b>`:`<b>${esc(secL||"Prehľad")}</b>`}</nav></div>`;
}
function openRec(e,id){
  {const r=get(e,id);if(r&&r._stub){toast("Tento záznam je mimo vášho prístupu – vidíte len jeho názov.");return;}}
  if(e==="zab")return zbOpenEvent();
  if(e==="projects")return go("projekt",id);
  if(e==="grants")return go("grant",id);
  if(e==="events")return go("podujatie",id);
  openDrawer(e,id);
}
async function create(e,defs,opts){
  const base={};
  if(e==="tasks")Object.assign(base,{status:"inbox",priority:"normalne",org:"ars"});
  if(e==="ledger")Object.assign(base,{type:"vydavok",account:"banka",date:today(),state:"kryte",paid:true});
  if(e==="projects")Object.assign(base,{status:"priprava",color:COLORS[S.d.projects.length%COLORS.length]});
  if(e==="grants")Object.assign(base,{status:"napad",checklist:GRANT_CL.map(t=>({t,d:false}))});
  if(e==="events")Object.assign(base,{status:"priprava"});
  if(e==="prog")Object.assign(base,{status:"nevybavene",kind:"dielo",day:"oba"});
  if(e==="contacts")Object.assign(base,{ctype:"osoba"});
  if(e==="invMoves"){Object.assign(base,{date:today(),qty:1,pay:"hotovost",handover:"odovzdane"});const it=defs&&defs.itemId?get("invItems",defs.itemId):null;if(it&&+it.price)base.amount=+it.price;}
  const data=Object.assign(base,defs||{});
  if(!(ENT[e].title in data))data[ENT[e].title]="";
  const id=await add(e,data);
  if(id)openDrawer(e,id,true);
  return id;
}

/* ================= shell render ================= */
const ICON={
  prehlad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  kalendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  ulohy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/></svg>',
  projekty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  granty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
  podujatia:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>',
  financie:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
  kontakty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c1.9.7 3.1 2.5 3.5 5.4"/></svg>',
  inventar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/></svg>',
  nastavenia:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  zabezpecenie:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};
const NAV=[["prehlad","Prehľad"],["kalendar","Kalendár"],["ulohy","Úlohy"],"-",["projekty","Projekty"],["granty","Granty"],["podujatia","Podujatia"],"-",["financie","Financie"],["kontakty","Kontakty"],["inventar","Inventár"]];   /* Nastavenia sú od 1.94.0 vo WordPresse (Ars Preuge → Nastavenia) */
const ACT={projekt:"projekty",grant:"granty",podujatie:"podujatia"};

function render(){
  renderSide();renderBottom();
  const v=$("#view");
  const ae=document.activeElement,fid=ae&&v.contains(ae)&&ae.id?ae.id:null,sel=fid&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  const fval=fid&&ae.dataset&&ae.dataset.zb!==undefined&&ae.type!=="checkbox"?ae.value:null;
  if(S.loading){v.innerHTML=`<div class="empty">Načítavam dáta tímu…</div>`;return;}
  const notice=!S.live?`<div class="notice">Aplikácia sa nespojila s databázou – zmeny sa neuložia. Obnovte stránku; ak to nepomôže, odhláste sa a znova prihláste do WordPressu.</div>`
    :(S.readOnly?`<div class="notice">Máte prístup len na čítanie. Ak potrebujete upravovať, požiadajte správcu webu o rolu „Tím Ars Preuge“.</div>`:"");
  if(!S.ctFix&&!S.readOnly&&S.live){S.ctFix=true;const miss=S.d.contacts.filter(c=>!c.ctype),vol=S.d.contacts.filter(c=>c.tags==null&&(c.volunteer===true||(c.volunteer==null&&c.role==="dobrovolnik"))),orgm=S.d.contacts.filter(c=>c.orgId&&c.orgIds==null),orgByName=(()=>{const k=v=>String(v||"").trim().replace(/\s+/g," ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),m={};S.d.contacts.filter(c=>c.ctype&&c.ctype!=="osoba").forEach(c=>{const a=k(c.name);if(a)(m[a]=m[a]||[]).push(c.id);});return S.d.contacts.filter(c=>c.org&&!orgList(c).length).map(c=>({c,ids:m[k(c.org)]||[]})).filter(x=>x.ids.length===1);})();if(miss.length||vol.length||orgm.length||orgByName.length)setTimeout(()=>{orgByName.forEach(({c,ids})=>upd("contacts",c.id,{orgIds:ids,org:""}));orgm.forEach(c=>upd("contacts",c.id,{orgIds:[c.orgId],orgId:""}));miss.forEach(c=>upd("contacts",c.id,{ctype:"osoba"}));vol.forEach(c=>upd("contacts",c.id,{tags:["dobrovolnik"],volunteer:null}));},0);}
  const f=VIEWS[S.view]||VIEWS.prehlad;
  v.innerHTML=navBar()+notice+f();
  if(fid){const el=document.getElementById(fid);if(el){if(fval!==null&&el.value!==fval)el.value=fval;el.focus();if(sel&&el.setSelectionRange)try{el.setSelectionRange(sel[0],sel[1]);}catch(_){}}}
  bindView();accSweep();accLockView();accBlur(document.getElementById("view"));accBlur(document.getElementById("side"));
  if(DW)drawerRefresh();
}
function colSide(){try{return localStorage.getItem("arsp_sidecol")==="1";}catch(_){return false;}}
function applySideCol(){const a=document.querySelector(".app");if(a)a.classList.toggle("sidecolp",colSide());}
function renderSide(){applySideCol();
  const act=ACT[S.view]||S.view;
  const myOpen=S.d.tasks.filter(t=>!isDone(t)&&isMine(t.assignee)).length;
  const projs=[...S.d.projects].sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  const me=S.me;
  $("#side").innerHTML=`
  <div class="brand"><span class="bmark"><img class="logo" src="data:image/png;base64,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" alt=""></span><div class="btxt"><b>Ars Preuge</b><span>Pracovný priestor</span></div></div>
  <div class="sidetools"><button class="btn pri" data-new title="Nové" aria-label="Nové">+<span class="nl">&nbsp;Nové</span></button><button class="btn srch" data-search title="Hľadať (Ctrl+K)" aria-label="Hľadať"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button></div>
  <div class="nav">${NAV.filter(n=>n==="-"||accView(n[0])).filter((n,i,a)=>n!=="-"||(i&&a[i-1]!=="-"&&a.slice(i+1).some(x=>x!=="-"))).map(n=>n==="-"?'<div class="sep"></div>':`<button data-go="${n[0]}" ${act===n[0]?'aria-current="page"':""}>${ICON[n[0]]}<span class="nl">${n[1]}</span>${n[0]==="ulohy"&&myOpen?`<span class="n">${myOpen}</span>`:""}</button>`).join("")}</div>
  <button type="button" class="sidecol" data-sidecol title="${colSide()?"Rozbaliť menu":"Zbaliť menu"}" aria-label="${colSide()?"Rozbaliť menu":"Zbaliť menu"}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${colSide()?"M9 6l6 6-6 6":"M15 6l-6 6 6 6"}"/></svg><span class="nl">Zbaliť menu</span></button>
  <div class="who">${me&&me.avatarUrl?`<img class="av" alt="" src="${esc(me.avatarUrl)}">`:""}<span>${esc((me&&me.name)||"Neprihlásený")}${S.readOnly?" (len čítanie)":""}</span></div>`;
}
function renderBottom(){
  const act=ACT[S.view]||S.view;
  $("#bottom").innerHTML=[["prehlad","Prehľad"],["ulohy","Úlohy"],["kalendar","Kalendár"],["financie","Financie"]].filter(([k])=>accView(k)).map(([k,l])=>`<button data-go="${k}" ${act===k?'aria-current="page"':""}>${ICON[k]}${l}</button>`).join("")+`<button data-menu>${ICON.menu}Menu</button>`;
}
function openSide(){$("#side").classList.add("open");$("#sidescrim").hidden=false;}
function closeSide(){const s=$("#side");if(s)s.classList.remove("open");const c=$("#sidescrim");if(c)c.hidden=true;}

/* ================= global events ================= */
document.addEventListener("click",e=>{
  const t=e.target;
  const q=s=>t.closest(s);
  let el;
  if((el=q("[data-ck-toggle]"))){e.stopPropagation();toggleCheck(el.dataset.ckToggle,+el.dataset.i);return;}
  if((el=q("[data-lpaid]"))){e.stopPropagation();const l=get("ledger",el.dataset.lpaid);if(l)upd("ledger",l.id,{paid:l.paid===false});return;}
  if((el=q("[data-done]"))){e.stopPropagation();const tk=get("tasks",el.dataset.done);if(tk)upd("tasks",tk.id,{status:isDone(tk)?"tyzden":"hotove",doneAt:isDone(tk)?null:Date.now()});return;}
  if(q("select"))return;
  if((el=q("[data-pdel]"))){e.stopPropagation();ask("Odobrať zo spolupráce?","Odobrať").then(ok=>{if(ok)del("partnerships",el.dataset.pdel);});return;}
  if((el=q("[data-pnew]"))){e.stopPropagation();const evId=el.dataset.pnew;(async()=>{const cid=await add("contacts",{name:"",ctype:"organizacia",role:"partner"});if(cid){await add("partnerships",{eventId:evId,contactId:cid,state:"oslovit"});openDrawer("contacts",cid,true);}})();return;}
  if((el=q("[data-unlink]"))){e.stopPropagation();const[a,b]=el.dataset.unlink.split("|");const[e1,i1]=a.split(":"),[t1,i2]=b.split(":");link(e1,i1,t1,i2,false);return;}
  if((el=q("[data-linknew]"))){e.stopPropagation();const[a,t1]=el.dataset.linknew.split("|");const[e1,i1]=a.split(":");linkNew(e1,i1,t1);return;}
  if(q("[data-back]")){goBack();return;}
  if((el=q("[data-go]"))){e.preventDefault();go(el.dataset.go,el.dataset.id);return;}
  if((el=q("[data-open]"))){if(q("a,select,input"))return;const[k,id]=el.dataset.open.split(":");openRec(k,id);return;}
  if((el=q("[data-peek]"))){const[k,id]=el.dataset.peek.split(":");openDrawer(k,id);return;}
  if((el=q("[data-create]"))){let defs={};try{defs=JSON.parse(el.dataset.defs||"{}");}catch(_){}closeNewMenu();create(el.dataset.create,defs);return;}
  if(q("[data-sidecol]")){try{localStorage.setItem("arsp_sidecol",colSide()?"0":"1");}catch(_){}renderSide();return;}
  if(q("[data-new]")){e.stopPropagation();newMenu(q("[data-new]"));return;}
  if(q("[data-search]")){closeSide();openSearch();return;}
  if(q("[data-menu]")){openSide();return;}
  if(q("[data-export]")){exportCsv(q("[data-export]").dataset.export,q("[data-export]").dataset.id);return;}
  if(!q(".newmenu"))closeNewMenu();
});
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch();}
  else if(e.key==="Escape"){if($("#layer2").innerHTML)return;if($("#layer").innerHTML){$("#layer").innerHTML="";return;}if(DW)closeDrawer();closeNewMenu();closeSide();}
});
function newMenu(anchor){
  if(ACC&&!["tasks","events","ledger","grants","projects","contacts"].some(accEdit))return;
  closeNewMenu();const r=anchor.getBoundingClientRect();
  const m=document.createElement("div");m.className="newmenu";m.id="newmenu";
  m.style.left=Math.min(r.left,innerWidth-220)+"px";m.style.top=(r.bottom+6)+"px";m.style.position="fixed";
  m.innerHTML=[["tasks","Úloha"],["events","Podujatie"],["ledger","Platba do denníka"],["grants","Grant"],["projects","Projekt"],["contacts","Kontakt"]].filter(([k])=>accEdit(k)).map(([k,l])=>`<button data-create="${k}">${l}</button>`).join("");
  document.body.appendChild(m);m.querySelector("button").focus();
}
function closeNewMenu(){const m=$("#newmenu");if(m)m.remove();}

/* drag & drop (boards) */
function bindDnD(root){
  root.querySelectorAll("[data-drag]").forEach(c=>c.ondragstart=ev=>{ev.dataTransfer.setData("text/plain",c.dataset.drag);});
  root.querySelectorAll("[data-drop]").forEach(col=>{
    col.ondragover=ev=>{ev.preventDefault();col.classList.add("drop");};
    col.ondragleave=()=>col.classList.remove("drop");
    col.ondrop=ev=>{ev.preventDefault();col.classList.remove("drop");
      const[k,id]=ev.dataTransfer.getData("text/plain").split(":");const[e2,f,v]=col.dataset.drop.split(":");
      if(k!==e2)return;const r=get(k,id);if(!r||r[f]===v)return;
      const patch={[f]:v};if(k==="tasks"&&v==="hotove")patch.doneAt=Date.now();upd(k,id,patch);};
  });
}
