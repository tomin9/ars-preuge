/* ===== Podujatie – zoznam záložiek, marketing a záložka Spolupráce (tím, partneri, sponzori, dobrovoľníci).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-spoluprace.js. Nie je to samostatný skript. ===== */
const EVTABS=[["texty","Texty"],["rozpocet","Rozpočet"],["ulohy","Úlohy"],["granty","Granty"],["dramaturgia","Dramaturgia"],["marketing","Marketing"],["spoluprace","Spolupráce"],["dokumenty","Dokumenty"],["fotky","Fotky"],["zabezpecenie","Zabezpečenie"]];
const evTabsFor=e=>EVTABS.filter(t=>(t[0]!=="zabezpecenie"||isNox(e))&&(t[0]!=="rozpocet"||accRead("ledger"))&&(t[0]!=="ulohy"||accRead("tasks"))&&(t[0]!=="granty"||accRead("grants")));
const MKT_DEF=["Vizuál / plagát","Udalosť na Facebooku","Instagram – príspevky a stories","Web a kalendáre podujatí","Tlačová správa","Newsletter","Rádio a médiá","Výlep plagátov","Foto a video dokumentácia"];
const evMkt=e=>Array.isArray(e.mkt)?e.mkt:MKT_DEF.map(t=>({t,d:false}));
const TEAM_SEC=[["tim","Tím","Člen tímu"],["partner","Partneri","Partner"],["sponzor","Sponzori","Sponzor"],["dobrovolnik","Dobrovoľníci","Dobrovoľník"]];
const teamSecs=e=>Array.isArray(e.teamSecs)?e.teamSecs:TEAM_SEC;
/* Spolupráce fungujú pre podujatie aj projekt (od 2.0.18 záložka Ľudia v projekte): záznam sa nájde podľa id, stav oslovenia partnerov (partnerships) len pri podujatí */
const teKind=id=>get("projects",id)&&!get("events",id)?"projects":"events";
const teGet=id=>get(teKind(id),id);
const teUpd=(id,p)=>upd(teKind(id),id,p);
function teamPeople(e){const m=new Map();related(teKind(e.id),e,"contacts").forEach(c=>m.set(c.id,c));S.d.partnerships.filter(p=>p.eventId===e.id).forEach(p=>{const c=get("contacts",p.contactId);if(c)m.set(c.id,c);});return[...m.values()];}
const teamRole=(e,c)=>evRole(e,c.id)||(S.d.partnerships.some(p=>p.eventId===e.id&&p.contactId===c.id)?"partner":"");
const TI={edit:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',add:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',del:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>'};
const tEd=(eid,key)=>!!(S.tEdit&&S.tEdit[eid+"|"+key]);
const dutyArr=(e,cid)=>{const v=(e.duties||{})[cid];return Array.isArray(v)?v:(v?[String(v)]:[]);};
const dutyCol=l=>{let h=0;for(const ch of String(l))h=(h*31+ch.charCodeAt(0))>>>0;return TAGPAL[h%TAGPAL.length];};
const dutyList=()=>[...new Set([...S.d.events,...S.d.projects].flatMap(ev=>Object.values(ev.duties||{}).flatMap(v=>Array.isArray(v)?v:[v])).map(x=>String(x||"").trim()).filter(Boolean))].sort((x,y)=>x.localeCompare(y,"sk"));
function teamPool(e,key){const have=new Set(teamPeople(e).map(c=>c.id));
  return S.d.contacts.filter(c=>!have.has(c.id)&&((key==="tim"||key==="dobrovolnik")?(c.ctype||"osoba")==="osoba":true))
    .sort((a,b)=>((tagList(b).includes(key)?1:0)-(tagList(a).includes(key)?1:0))||(a.name||"").localeCompare(b.name||"","sk"));}
async function teamAddContact(eid,key,cid){const e0=teGet(eid);if(!e0)return;
  await link(teKind(eid),eid,"contacts",cid,true);const e1=teGet(eid)||e0;
  await teUpd(eid,{roles:Object.assign({},e1.roles||{},{[cid]:key})});
  if(teKind(eid)==="events"&&(key==="partner"||key==="sponzor")&&!S.d.partnerships.some(p=>p.eventId===eid&&p.contactId===cid))await add("partnerships",{eventId:eid,contactId:cid,state:"oslovit"});}
(()=>{let drag=null;
  document.addEventListener("dragstart",ev=>{const g=ev.target.closest&&ev.target.closest("[data-secdrag]");if(!g)return;const[eid,key]=g.dataset.secdrag.split("|");drag={eid,key};const pn=g.closest(".tpanel");try{ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain",key);if(pn)ev.dataTransfer.setDragImage(pn,24,18);}catch(_){}if(pn)setTimeout(()=>pn.classList.add("dragging"),0);});
  document.addEventListener("dragover",ev=>{if(!drag)return;const pn=ev.target.closest&&ev.target.closest(".tpanel");if(!pn||pn.dataset.seckey===drag.key)return;ev.preventDefault();document.querySelectorAll(".tpanel.dropt").forEach(x=>x!==pn&&x.classList.remove("dropt"));pn.classList.add("dropt");});
  document.addEventListener("dragleave",ev=>{const pn=ev.target.closest&&ev.target.closest(".tpanel");if(pn&&!pn.contains(ev.relatedTarget))pn.classList.remove("dropt");});
  document.addEventListener("drop",ev=>{if(!drag)return;const pn=ev.target.closest&&ev.target.closest(".tpanel");if(!pn)return;ev.preventDefault();const to=pn.dataset.seckey,{eid,key}=drag;drag=null;document.querySelectorAll(".tpanel").forEach(x=>x.classList.remove("dropt","dragging"));
    const e0=teGet(eid);if(!e0||to===key)return;const a=teamSecs(e0).slice(),from=a.findIndex(x=>x[0]===key);if(from<0)return;const[m]=a.splice(from,1);const ti=a.findIndex(x=>x[0]===to);a.splice(ti<0?a.length:ti,0,m);teUpd(eid,{teamSecs:a});});
  document.addEventListener("dragend",()=>{drag=null;document.querySelectorAll(".tpanel").forEach(x=>x.classList.remove("dropt","dragging"));});
})();
(()=>{let rd=null;
  document.addEventListener("dragstart",ev=>{const g=ev.target.closest&&ev.target.closest("[data-trowdrag]");if(!g)return;const[eid,key,cid]=g.dataset.trowdrag.split("|");rd={eid,key,cid};const li=g.closest("li");try{ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain",cid);if(li)ev.dataTransfer.setDragImage(li,20,14);}catch(_){}if(li)setTimeout(()=>li.classList.add("dragging"),0);ev.stopPropagation();});
  document.addEventListener("dragover",ev=>{if(!rd)return;const li=ev.target.closest&&ev.target.closest("li[data-rowkey]");if(!li||li.dataset.rowkey!==rd.key||li.dataset.rowcid===rd.cid)return;ev.preventDefault();document.querySelectorAll("li.rowdrop").forEach(x=>x!==li&&x.classList.remove("rowdrop"));li.classList.add("rowdrop");});
  document.addEventListener("dragleave",ev=>{const li=ev.target.closest&&ev.target.closest("li.rowdrop");if(li&&!li.contains(ev.relatedTarget))li.classList.remove("rowdrop");});
  document.addEventListener("drop",ev=>{if(!rd)return;const li=ev.target.closest&&ev.target.closest("li[data-rowkey]");if(!li||li.dataset.rowkey!==rd.key)return;ev.preventDefault();const{eid,key,cid}=rd,to=li.dataset.rowcid;rd=null;
    const ul=li.closest("ul"),ids=[...ul.querySelectorAll("li[data-rowcid]")].map(x=>x.dataset.rowcid);document.querySelectorAll("li.rowdrop,li.dragging").forEach(x=>x.classList.remove("rowdrop","dragging"));
    if(to===cid)return;const a=ids.filter(x=>x!==cid),ti=a.indexOf(to);a.splice(ti<0?a.length:ti,0,cid);const e0=teGet(eid);if(!e0)return;teUpd(eid,{teamOrder:Object.assign({},e0.teamOrder||{},{[key]:a})});});
  document.addEventListener("dragend",()=>{rd=null;document.querySelectorAll("li.rowdrop,li.dragging").forEach(x=>x.classList.remove("rowdrop","dragging"));});
})();
const nrm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
document.addEventListener("click",async ev=>{const dd=ev.target.closest&&ev.target.closest("[data-dutydel]");if(dd){ev.stopPropagation();ev.preventDefault();const[eid,cid,ix]=dd.dataset.dutydel.split("|"),e0=teGet(eid);if(e0)teUpd(eid,{duties:Object.assign({},e0.duties||{},{[cid]:dutyArr(e0,cid).filter((_,i)=>i!==+ix)})});return;}
  const se=ev.target.closest&&ev.target.closest("[data-secedit]");if(se){S.tEdit=S.tEdit||{};const k=se.dataset.secedit;S.tEdit[k]=!S.tEdit[k];render();return;}
  const sa=ev.target.closest&&ev.target.closest("[data-secadd]");if(sa){const e0=teGet(sa.dataset.secadd);if(!e0)return;const k="s_"+Date.now().toString(36);await teUpd(e0.id,{teamSecs:[...teamSecs(e0),[k,"Nová sekcia"]]});setTimeout(()=>{const i=document.querySelector(`[data-secren$="|${k}"]`);if(i){i.focus();i.select();}},60);return;}
  const sd=ev.target.closest&&ev.target.closest("[data-secdel]");if(sd){ev.stopPropagation();const[eid,key]=sd.dataset.secdel.split("|"),e0=teGet(eid);if(!e0)return;const sec=teamSecs(e0).find(x=>x[0]===key);
    const n=teamPeople(e0).filter(c=>teamRole(e0,c)===key).length;
    if(!await ask(`Odstrániť sekciu „${sec?sec[1]:""}“?${n?` ${n} ${n===1?"kontakt sa presunie":"kontakty sa presunú"} do Ostatné.`:""}`,"Odstrániť"))return;
    await teUpd(eid,{teamSecs:teamSecs(e0).filter(x=>x[0]!==key)});return;}
  const b=ev.target.closest&&ev.target.closest("[data-teamplus]");if(!b)return;ev.stopPropagation();ev.preventDefault();
  const[eid,key]=b.dataset.teamplus.split("|"),e0=teGet(eid),panel=b.closest(".panel");if(!e0||!panel)return;
  const ex=panel.querySelector(".teamnew input");if(ex){ex.focus();return;}
  let ul=panel.querySelector("ul.items");if(!ul){ul=document.createElement("ul");ul.className="items lk";panel.querySelector("h3").after(ul);}
  const pool=teamPool(e0,key),li=document.createElement("li");li.className="teamnew";li.innerHTML=`<input type="text" class="tnin" placeholder="Meno alebo rola…" autocomplete="off" spellcheck="false" aria-label="Hľadať kontakt"><div class="tnlist" hidden></div>`;ul.appendChild(li);
  const inp=li.querySelector("input"),list=li.querySelector(".tnlist");let hits=[],act=0,done=false;
  let rolesAll=[];try{const m=new Map();Object.keys(TAGDEF).forEach(t=>tagVocab(t).forEach(x=>{if(Array.isArray(x)&&x[0]&&!m.has(x[0]))m.set(x[0],x);}));rolesAll=[...m.values()];}catch(er){console.warn("roles",er);}
  const optHtml=(c,i)=>{try{return c.isRole?`<div class="tnopt${i===act?" on":""}" data-i="${i}"><span class="tg sm" style="--tc:${c.role[2]}">${esc(c.role[1])}</span><span>Pridať všetkých s touto rolou</span><small>${c.list.length}</small></div>`:`<div class="tnopt${i===act?" on":""}" data-i="${i}">${(()=>{try{return cIcon(c);}catch(_){return"";}})()}<span>${esc(c.name||"Bez mena")}</span>${c.ctype&&c.ctype!=="osoba"?`<small>${esc(optL("ctype",c.ctype))}</small>`:""}</div>`;}catch(er){console.warn("opt",er);return`<div class="tnopt" data-i="${i}"><span>${esc((c&&c.name)||"?")}</span></div>`;}};
  const draw=()=>{try{const q=nrm(inp.value.trim());let rh=[];
    try{rh=q?rolesAll.filter(r=>nrm(r[1]).includes(q)).map(r=>({isRole:true,role:r,list:pool.filter(c=>tagList(c).includes(r[0]))})).filter(x=>x.list.length):[];}catch(er){console.warn("role hits",er);}
    hits=[...rh,...(q?pool.filter(c=>nrm(c.name).includes(q)).slice(0,8):[])];act=Math.min(act,Math.max(0,hits.length-1));
    list.innerHTML=hits.map(optHtml).join("");list.hidden=!hits.length;
  }catch(er){console.error("team add",er);list.hidden=false;list.innerHTML=`<div class="tnopt"><span>Chyba pri hľadaní: ${esc(String(er&&er.message||er))}</span></div>`;}};
  const close=()=>{done=true;li.remove();};
  const pick=c=>{if(done||!c)return;done=true;li.remove();if(c.isRole){(async()=>{for(const x of c.list)await teamAddContact(eid,key,x.id);toast(`Pridaných ${c.list.length} ${c.list.length===1?"kontakt":c.list.length<5?"kontakty":"kontaktov"} s rolou ${c.role[1]}.`);})();}else teamAddContact(eid,key,c.id);};
  inp.addEventListener("input",()=>{act=0;draw();});
  inp.addEventListener("keydown",k=>{if(k.key==="ArrowDown"){k.preventDefault();act=Math.min(hits.length-1,act+1);draw();}else if(k.key==="ArrowUp"){k.preventDefault();act=Math.max(0,act-1);draw();}else if(k.key==="Enter"){k.preventDefault();pick(hits[act]);}else if(k.key==="Escape"){k.preventDefault();k.stopPropagation();close();}});
  inp.addEventListener("blur",()=>setTimeout(()=>{if(!done)close();},150));
  list.addEventListener("mousedown",m=>{const o=m.target.closest(".tnopt");if(!o)return;m.preventDefault();pick(hits[+o.dataset.i]);});
  draw();inp.focus();},true);
const teamCols=()=>{const w=($("#view")||document.body).clientWidth;return w>=560?2:1;};
{let rt=null;window.addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{if(((S.view==="podujatie"&&S.evtab==="spoluprace")||(S.view==="projekt"&&S.ptab==="ludia"))&&S._tn&&S._tn!==teamCols())render();},150);});}
function teamTab(e){
  const P=teamPeople(e).sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk")),have=new Set(P.map(c=>c.id));
  const rm=c=>`<button class="x" data-teamrm="${esc(e.id)}|${esc(c.id)}" aria-label="Odobrať" title="Odobrať">×</button>`;
  const stSel=(c)=>{const pt=S.d.partnerships.find(p=>p.eventId===e.id&&p.contactId===c.id),st=pt?pt.state:"",o=OPT.pstav.find(x=>x[0]===st)||OPT.pstav[0],attr=pt?`data-pstate="${esc(pt.id)}"`:`data-pnewstate="${esc(e.id)}|${esc(c.id)}"`;
    return`<label class="sem" title="${esc(st?o[1]:"Stav spolupráce")}" style="--sc:${o[2]}"><i></i><select ${attr} aria-label="Stav spolupráce">${pt?"":`<option value="">—</option>`}${OPT.pstav.map(x=>`<option value="${x[0]}" ${x[0]===st?"selected":""}>${x[1]}</option>`).join("")}</select></label>`;};
  const li=(key,c)=>`<li data-open="contacts:${esc(c.id)}" data-rowcid="${esc(c.id)}" data-rowkey="${esc(key)}">${tEd(e.id,key)&&key!=="partner"&&key!=="sponzor"?`<span class="tgrip rowgrip" draggable="true" data-trowdrag="${esc(e.id)}|${esc(key)}|${esc(c.id)}" title="Presunúť riadok" aria-label="Presunúť riadok">⠿</span>`:""}<span class="t">${cIcon(c)}${esc(c.name||"Bez mena")}</span>${key==="tim"?`<span class="dutychips">${dutyArr(e,c.id).map((d,i)=>`<span class="tg sm" style="--tc:${dutyCol(d)}">${esc(d)}${tEd(e.id,key)?`<button type="button" class="dutyx" data-dutydel="${esc(e.id)}|${esc(c.id)}|${i}" aria-label="Odobrať úlohu" title="Odobrať">×</button>`:""}</span>`).join("")}${tEd(e.id,key)?`<input type="text" class="tg add dutynew" list="duty-dl" data-dutynew="${esc(e.id)}|${esc(c.id)}" placeholder="+ pridať" aria-label="Pridať úlohu" maxlength="40">`:""}</span>`:(key==="partner"||key==="sponzor")&&teKind(e.id)==="events"?stSel(c):""}${tEd(e.id,key)?rm(c):""}</li>`;
  const opts=key=>{const pool=S.d.contacts.filter(c=>!have.has(c.id)&&((key==="tim"||key==="dobrovolnik")?(c.ctype||"osoba")==="osoba":true));
    pool.sort((a,b)=>((tagList(b).includes(key)?1:0)-(tagList(a).includes(key)?1:0))||(a.name||"").localeCompare(b.name||"","sk"));return pool;};
  const SECS=teamSecs(e);
  const stIdx=c=>{const pt=S.d.partnerships.find(p=>p.eventId===e.id&&p.contactId===c.id);return pt?(PORD[pt.state]??0):0;};
  const card=([key,title])=>{let L=P.filter(c=>teamRole(e,c)===key);if(key==="partner"||key==="sponzor")L=L.sort((a,b)=>stIdx(a)-stIdx(b)||(a.name||"").localeCompare(b.name||"","sk"));else{const od=(e.teamOrder||{})[key]||[],ix=c=>{const i=od.indexOf(c.id);return i<0?1e6:i;};L=L.sort((a,b)=>ix(a)-ix(b)||(a.name||"").localeCompare(b.name||"","sk"));}
    const ed=tEd(e.id,key);
    return`<div class="panel tpanel" data-seckey="${esc(key)}"><h3 style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px">${ed?`<span class="tgrip" draggable="true" data-secdrag="${esc(e.id)}|${esc(key)}" title="Presunúť sekciu" aria-label="Presunúť sekciu">⠿</span>`:""}<input type="text" class="secname" value="${esc(title)}" data-secren="${esc(e.id)}|${esc(key)}" aria-label="Názov sekcie" maxlength="40"${ed?"":" readonly tabindex=\"-1\""}><span style="display:flex;gap:2px"><button type="button" class="tplus${ed?" on":""}" data-secedit="${esc(e.id)}|${esc(key)}" title="Upraviť" aria-label="Upraviť sekciu ${esc(title)}" aria-pressed="${ed}">${TI.edit}</button><button type="button" class="tplus" data-teamplus="${esc(e.id)}|${key}" title="Pridať" aria-label="Pridať do sekcie ${esc(title)}">${TI.add}</button><button type="button" class="tplus tdel" data-secdel="${esc(e.id)}|${esc(key)}" title="Odstrániť sekciu" aria-label="Odstrániť sekciu ${esc(title)}">${TI.del}</button></span></h3>${L.length?`<ul class="items lk">${L.map(c=>li(key,c)).join("")}</ul>`:""}${key==="tim"?`<datalist id="duty-dl">${dutyList().map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>`:""}</div>`;};
  const other=P.filter(c=>!SECS.some(t=>t[0]===teamRole(e,c)));
  const oth=other.length?`<div class="panel" style="margin-top:16px"><h3 style="margin-bottom:6px">Ostatné</h3><ul class="items lk">${other.map(c=>`<li data-open="contacts:${esc(c.id)}"><span class="t">${cIcon(c)}${esc(c.name||"Bez mena")}</span><select class="rolesel" data-teamset="${esc(e.id)}|${esc(c.id)}" aria-label="Zaradiť do sekcie" style="padding:3px 6px;font-size:13px"><option value="">— zaradiť —</option>${SECS.map(([k,t])=>`<option value="${esc(k)}">${esc(t)}</option>`).join("")}</select>${rm(c)}</li>`).join("")}</ul></div>`:"";
  const NC=teamCols();S._tn=NC;
  return`<div class="tcols" style="--nc:${NC}">${Array.from({length:NC},(_,n)=>`<div class="tcol">${SECS.filter((_,i)=>i%NC===n).map(card).join("")}</div>`).join("")}</div>${oth}<button class="gnew" data-secadd="${esc(e.id)}" style="display:grid;width:100%;box-sizing:border-box;min-height:64px;margin-top:20px">+ Pridať sekciu</button>`;
}
/* ===== Texty podujatia ===== */
