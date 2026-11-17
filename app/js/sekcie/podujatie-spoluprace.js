/* ===== Podujatie – zoznam záložiek, marketing a záložka Spolupráce (tím, partneri, sponzori, dobrovoľníci).
   Od 2.0.75 v rozložení ako Dramaturgia a Marketing: vľavo zoznam sekcií (počet ľudí, pod čiarou „Pridať sekciu“), vpravo vybraná sekcia –
   názov sa dá prepísať, vedľa ceruzka (úprava ľudí v sekcii) a kôš, pod tým zoznam ľudí; pridáva sa v prázdnom riadku za posledným
   (od 2.0.79 – písaním sa hľadá medzi kontaktmi a rolami). Dáta sa nezmenili.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-spoluprace.js. Nie je to samostatný skript. ===== */
const EVTABS=[["rozpocet","Rozpočet"],["ulohy","Úlohy"],["granty","Granty"],["dramaturgia","Dramaturgia"],["zabezpecenie","Zabezpečenie"],["marketing","Marketing"],["podklady","Podklady"],["spoluprace","Spolupráce"],["fotky","Archív"]];   /* Podklady od 2.0.54 nahrádzajú Texty a Dokumenty */
const evTabsFor=e=>EVTABS.filter(t=>(t[0]!=="zabezpecenie"||zbFor(e))&&(t[0]!=="rozpocet"||accRead("ledger"))&&(t[0]!=="ulohy"||accRead("tasks"))&&(t[0]!=="granty"||accRead("grants")));
const MKT_DEF=["Tlačová správa","Udalosť na Facebooku","Newsletter","Výlep plagátov"];   /* čo má v Marketingu nové podujatie (od 2.0.90 po jednej položke v oblastiach Médiá a PR, Social média, Web a online, Tlačené) */
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
/* čo je práve vybrané v záložke (sekcia alebo „Ostatné“) – pre každé podujatie / projekt zvlášť */
const teUi=eid=>{S._te=S._te||{};return S._te[eid]=S._te[eid]||{sel:""};};
const teEd=e=>!!e&&accEditRec(teKind(e.id),e)&&!S.readOnly;
const TE_IC={tim:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.4-3.2 2.8-5 6-5s5.6 1.8 6 5"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.9c2 .6 3.2 2.2 3.5 4.6"/>',partner:'<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',sponzor:'<circle cx="12" cy="12" r="9"/><path d="M15.2 8.8a4 4 0 1 0 0 6.4M7.5 11h5.5M7.5 13.4h5.5"/>',dobrovolnik:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',_:'<circle cx="12" cy="8.5" r="3.4"/><path d="M5 19.5c.5-3.4 3.2-5.3 7-5.3s6.5 1.9 7 5.3"/>',other:'<circle cx="12" cy="12" r="9" stroke-dasharray="3 3.2"/>'};
/* ľudia sekcie v poradí, v akom sa ukazujú: partneri a sponzori podľa stavu oslovenia, ostatní podľa ručného poradia (teamOrder), potom podľa mena */
function teamList(e,key,P){
  const L=(P||teamPeople(e)).filter(c=>teamRole(e,c)===key),nm=(a,b)=>(a.name||"").localeCompare(b.name||"","sk");
  if(key==="partner"||key==="sponzor"){const st=c=>{const pt=S.d.partnerships.find(p=>p.eventId===e.id&&p.contactId===c.id);return pt?(PORD[pt.state]??0):0;};return L.sort((a,b)=>st(a)-st(b)||nm(a,b));}
  const od=(e.teamOrder||{})[key]||[],ix=c=>{const i=od.indexOf(c.id);return i<0?1e6:i;};return L.sort((a,b)=>ix(a)-ix(b)||nm(a,b));
}
/* sekcia sa dá v zozname vľavo chytiť a presunúť na iné miesto */
(()=>{let drag=null;const T=ev=>ev.target.closest&&ev.target.closest(".txi[data-seckey]"),clr=()=>document.querySelectorAll(".txi.dropt,.txi.dragging").forEach(x=>x.classList.remove("dropt","dragging"));
  document.addEventListener("dragstart",ev=>{const g=ev.target.closest&&ev.target.closest("[data-secdrag]");if(!g)return;const[eid,key]=g.dataset.secdrag.split("|");drag={eid,key};try{ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain",key);}catch(_){}setTimeout(()=>g.classList.add("dragging"),0);});
  document.addEventListener("dragover",ev=>{if(!drag)return;const pn=T(ev);if(!pn||pn.dataset.seckey===drag.key)return;ev.preventDefault();document.querySelectorAll(".txi.dropt").forEach(x=>x!==pn&&x.classList.remove("dropt"));pn.classList.add("dropt");});
  document.addEventListener("dragleave",ev=>{const pn=T(ev);if(pn&&!pn.contains(ev.relatedTarget))pn.classList.remove("dropt");});
  document.addEventListener("drop",ev=>{if(!drag)return;const pn=T(ev);if(!pn)return;ev.preventDefault();const to=pn.dataset.seckey,{eid,key}=drag;drag=null;clr();
    const e0=teGet(eid);if(!e0||to===key)return;const a=teamSecs(e0).slice(),from=a.findIndex(x=>x[0]===key);if(from<0)return;const[m]=a.splice(from,1);const ti=a.findIndex(x=>x[0]===to);a.splice(ti<0?a.length:ti,0,m);teUpd(eid,{teamSecs:a});});
  document.addEventListener("dragend",()=>{drag=null;clr();});
})();
/* riadok (človek / organizácia) sa dá chytiť a presunúť: v zozname sekcie mení poradie, pustením na inú sekciu vľavo mení zaradenie */
(()=>{let rd=null;
  const clear=()=>document.querySelectorAll("li.rowdrop,li.dragging,[data-seckey].dropt").forEach(x=>x.classList.remove("rowdrop","dragging","dropt"));
  document.addEventListener("dragstart",ev=>{const g=ev.target.closest&&ev.target.closest("[data-trowdrag]");if(!g)return;const[eid,key,cid]=g.dataset.trowdrag.split("|");rd={eid,key,cid};try{ev.dataTransfer.effectAllowed="move";ev.dataTransfer.setData("text/plain",cid);}catch(_){}setTimeout(()=>g.classList.add("dragging"),0);ev.stopPropagation();});
  document.addEventListener("dragover",ev=>{if(!rd)return;const li=ev.target.closest&&ev.target.closest("li[data-rowkey]"),pn=ev.target.closest&&ev.target.closest("[data-seckey]");
    if(!pn&&!li){document.querySelectorAll("li.rowdrop,[data-seckey].dropt").forEach(x=>x.classList.remove("rowdrop","dropt"));return;}
    if(li&&li.dataset.rowcid===rd.cid)return;if(!li&&pn.dataset.seckey===rd.key)return;ev.preventDefault();clear();document.querySelector(`li[data-rowcid="${CSS.escape(rd.cid)}"][data-rowkey="${CSS.escape(rd.key)}"]`)?.classList.add("dragging");
    if(li)li.classList.add("rowdrop");else pn.classList.add("dropt");});
  document.addEventListener("drop",async ev=>{if(!rd)return;const li=ev.target.closest&&ev.target.closest("li[data-rowkey]"),pn=ev.target.closest&&ev.target.closest("[data-seckey]");if(!li&&!pn)return;ev.preventDefault();
    const{eid,key,cid}=rd;rd=null;const to=li?li.dataset.rowkey:pn.dataset.seckey,before=li?li.dataset.rowcid:null;
    const ul=li?li.closest("ul"):null,e0=teGet(eid);clear();
    if(!e0||(to===key&&(!before||before===cid)))return;
    const ids=ul?[...ul.querySelectorAll("li[data-rowcid]")].map(x=>x.dataset.rowcid):teamList(e0,to).map(c=>c.id);   /* cieľová sekcia nemusí byť na obrazovke – jej poradie sa berie z údajov */
    const a=ids.filter(x=>x!==cid),ti=before?a.indexOf(before):-1;a.splice(ti<0?a.length:ti,0,cid);
    const patch={teamOrder:Object.assign({},e0.teamOrder||{},{[to]:a})};
    if(to!==key){patch.roles=Object.assign({},e0.roles||{},{[cid]:to});
      const od=((e0.teamOrder||{})[key]||[]).filter(x=>x!==cid);patch.teamOrder[key]=od;}
    await teUpd(eid,patch);
    if(to!==key&&teKind(eid)==="events"&&(to==="partner"||to==="sponzor")&&!S.d.partnerships.some(p=>p.eventId===eid&&p.contactId===cid))await add("partnerships",{eventId:eid,contactId:cid,state:"oslovit"});
  });
  document.addEventListener("dragend",()=>{rd=null;clear();});
})();
const nrm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
document.addEventListener("click",async ev=>{const dd=ev.target.closest&&ev.target.closest("[data-dutydel]");if(dd){ev.stopPropagation();ev.preventDefault();const[eid,cid,ix]=dd.dataset.dutydel.split("|"),e0=teGet(eid);if(e0)teUpd(eid,{duties:Object.assign({},e0.duties||{},{[cid]:dutyArr(e0,cid).filter((_,i)=>i!==+ix)})});return;}
  const ts=ev.target.closest&&ev.target.closest("[data-tesel]");if(ts){const[eid,key]=ts.dataset.tesel.split("|");teUi(eid).sel=key;render();return;}
  const se=ev.target.closest&&ev.target.closest("[data-secedit]");if(se){S.tEdit=S.tEdit||{};const k=se.dataset.secedit;S.tEdit[k]=!S.tEdit[k];render();return;}
  const sa=ev.target.closest&&ev.target.closest("[data-secadd]");if(sa){const e0=teGet(sa.dataset.secadd);if(!e0)return;const k="s_"+Date.now().toString(36);teUi(e0.id).sel=k;await teUpd(e0.id,{teamSecs:[...teamSecs(e0),[k,"Nová sekcia"]]});setTimeout(()=>{const i=document.querySelector(`[data-secren$="|${k}"]`);if(i){i.focus();i.select();}},60);return;}
  const sd=ev.target.closest&&ev.target.closest("[data-secdel]");if(sd){ev.stopPropagation();const[eid,key]=sd.dataset.secdel.split("|"),e0=teGet(eid);if(!e0)return;const sec=teamSecs(e0).find(x=>x[0]===key);
    const n=teamPeople(e0).filter(c=>teamRole(e0,c)===key).length;
    if(!await ask(`Odstrániť sekciu „${sec?sec[1]:""}“?${n?` ${n} ${n===1?"kontakt sa presunie":"kontakty sa presunú"} do Ostatné.`:""}`,"Odstrániť"))return;
    teUi(eid).sel="";await teUpd(eid,{teamSecs:teamSecs(e0).filter(x=>x[0]!==key)});return;}
},true);
document.addEventListener("keydown",ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.tesel||(ev.key!=="Enter"&&ev.key!==" "))return;ev.preventDefault();t.click();});   /* riadok sekcie je ťahateľný blok, nie tlačidlo – klávesnica ho vyberie rovnako */
/* prázdny riadok za posledným človekom sekcie: písaním sa hľadá medzi kontaktmi a rolami; ovládanie sa pripojí pri prvom vstupe do poľa (pole sa pri každom prekreslení vyrobí nanovo) */
document.addEventListener("focusin",ev=>{const inp=ev.target;if(!inp||!inp.dataset||!inp.dataset.teamfind||inp._te)return;inp._te=true;
  const[eid,key]=inp.dataset.teamfind.split("|"),list=inp.parentNode.querySelector(".tnlist");if(!list)return;let hits=[],act=0;
  let rolesAll=[];try{const m=new Map();Object.keys(TAGDEF).forEach(t=>tagVocab(t).forEach(x=>{if(Array.isArray(x)&&x[0]&&!m.has(x[0]))m.set(x[0],x);}));rolesAll=[...m.values()];}catch(er){console.warn("roles",er);}
  const optHtml=(c,i)=>{try{return c.isRole?`<div class="tnopt${i===act?" on":""}" data-i="${i}"><span class="tg sm" style="--tc:${c.role[2]}">${esc(c.role[1])}</span><span>Pridať všetkých s touto rolou</span><small>${c.list.length}</small></div>`:`<div class="tnopt${i===act?" on":""}" data-i="${i}">${(()=>{try{return cIcon(c);}catch(_){return"";}})()}<span>${esc(c.name||"Bez mena")}</span>${c.ctype&&c.ctype!=="osoba"?`<small>${esc(optL("ctype",c.ctype))}</small>`:""}</div>`;}catch(er){console.warn("opt",er);return`<div class="tnopt" data-i="${i}"><span>${esc((c&&c.name)||"?")}</span></div>`;}};
  const hide=()=>{hits=[];list.hidden=true;list.innerHTML="";};
  const draw=()=>{try{const e0=teGet(eid),q=nrm(inp.value.trim());if(!e0||!q){hide();return;}const pool=teamPool(e0,key);let rh=[];
    try{rh=rolesAll.filter(r=>nrm(r[1]).includes(q)).map(r=>({isRole:true,role:r,list:pool.filter(c=>tagList(c).includes(r[0]))})).filter(x=>x.list.length);}catch(er){console.warn("role hits",er);}
    hits=[...rh,...pool.filter(c=>nrm(c.name).includes(q)).slice(0,8)];act=Math.min(act,Math.max(0,hits.length-1));
    list.innerHTML=hits.length?hits.map(optHtml).join(""):`<div class="tnopt" style="cursor:default;color:var(--muted)"><span>Taký kontakt sa nenašiel (alebo už v podujatí je).</span></div>`;list.hidden=false;if(list.scrollIntoView)list.scrollIntoView({block:"nearest"});   /* ponuka je pod posledným riadkom – nech ju vidno celú */
  }catch(er){console.error("team add",er);list.hidden=false;list.innerHTML=`<div class="tnopt"><span>Chyba pri hľadaní: ${esc(String(er&&er.message||er))}</span></div>`;}};
  const pick=c=>{if(!c)return;inp.value="";hide();if(c.isRole){(async()=>{for(const x of c.list)await teamAddContact(eid,key,x.id);toast(`Pridaných ${c.list.length} ${c.list.length===1?"kontakt":c.list.length<5?"kontakty":"kontaktov"} s rolou ${c.role[1]}.`);})();}else teamAddContact(eid,key,c.id);};
  inp.addEventListener("input",()=>{act=0;draw();});
  inp.addEventListener("keydown",k=>{if(k.key==="ArrowDown"){k.preventDefault();act=Math.min(hits.length-1,act+1);draw();}else if(k.key==="ArrowUp"){k.preventDefault();act=Math.max(0,act-1);draw();}else if(k.key==="Enter"){k.preventDefault();pick(hits[act]);}else if(k.key==="Escape"&&(inp.value||!list.hidden)){k.preventDefault();k.stopPropagation();inp.value="";hide();}});
  inp.addEventListener("blur",()=>setTimeout(hide,150));
  list.addEventListener("mousedown",m=>{const o=m.target.closest(".tnopt");if(!o)return;m.preventDefault();if(o.dataset.i!=null)pick(hits[+o.dataset.i]);});
  draw();});
function teamTab(e){
  const id=esc(e.id),isEv=teKind(e.id)==="events",ed=teEd(e),ui=teUi(e.id),P=teamPeople(e).sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk")),SECS=teamSecs(e);
  const other=P.filter(c=>!SECS.some(t=>t[0]===teamRole(e,c))),oth=other.length>0&&(ui.sel==="_other"||!SECS.length),sel=oth?null:(SECS.find(x=>x[0]===ui.sel)||SECS[0]||null);
  const svg=(p,w)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const kick=`<div class="kick">${isEv?"Spolupráce":"Ľudia"} / ${esc(e.name||(isEv?"Podujatie":"Projekt"))}</div>`;
  const rm=c=>`<button class="x" data-teamrm="${id}|${esc(c.id)}" aria-label="Odobrať" title="Odobrať">×</button>`;
  const stSel=(c)=>{const pt=S.d.partnerships.find(p=>p.eventId===e.id&&p.contactId===c.id),st=pt?pt.state:"",o=OPT.pstav.find(x=>x[0]===st)||OPT.pstav[0],attr=pt?`data-pstate="${esc(pt.id)}"`:`data-pnewstate="${id}|${esc(c.id)}"`;
    return`<label class="sem" title="${esc(st?o[1]:"Stav spolupráce")}" style="--sc:${o[2]}"><i></i><select ${attr} aria-label="Stav spolupráce">${pt?"":`<option value="">—</option>`}${OPT.pstav.map(x=>`<option value="${x[0]}" ${x[0]===st?"selected":""}>${x[1]}</option>`).join("")}</select></label>`;};
  /* pod názvom sekcie vľavo: koľko v nej je ľudí; pri partneroch a sponzoroch podujatia koľko je potvrdených */
  const cnt=(key,L)=>{const n=L.length;if(!n)return"zatiaľ nikto";
    if(isEv&&(key==="partner"||key==="sponzor")){const ok=L.filter(c=>S.d.partnerships.some(p=>p.eventId===e.id&&p.contactId===c.id&&p.state==="potvrdeny")).length;return`${ok} z ${n} potvrdených`;}
    return key==="tim"||key==="dobrovolnik"?n+(n===1?" človek":n<5?" ľudia":" ľudí"):n+(n===1?" kontakt":n<5?" kontakty":" kontaktov");};
  const row=([key,title])=>`<div class="txi${sel&&sel[0]===key?" on":""}" role="button" tabindex="0" id="te-s-${esc(key)}" data-tesel="${id}|${esc(key)}" data-seckey="${esc(key)}"${ed?` draggable="true" data-secdrag="${id}|${esc(key)}"`:""}>${svg(TE_IC[key]||TE_IC._,22)}<span class="txt"><b>${esc(title)}</b><small>${esc(cnt(key,P.filter(c=>teamRole(e,c)===key)))}</small></span></div>`;
  const list=SECS.map(row).join("")
    +(other.length?`<div class="txi${oth?" on":""}" role="button" tabindex="0" id="te-s-_other" data-tesel="${id}|_other">${svg(TE_IC.other,22)}<span class="txt"><b>Ostatné</b><small>${other.length+(other.length===1?" nezaradený":other.length<5?" nezaradení":" nezaradených")}</small></span></div>`:"")
    +(ed?`${SECS.length||other.length?`<div class="gdsep"></div>`:""}<button type="button" class="txi txadd" data-secadd="${id}">${svg('<path d="M12 5v14M5 12h14"/>',22)}<span class="txt"><b>Pridať sekciu</b></span></button>`:"");
  let main=`<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ žiadne sekcie.</div>`;
  if(oth)main=`<div class="panel txmain temain"><div class="txhead"><div style="min-width:0;flex:1">${kick}<div class="txtitle" style="font-size:28px;font-weight:600;line-height:1.2;margin-top:6px">Ostatné</div><p class="meta" style="margin:8px 0 0;white-space:normal">Kontakty, ktoré sú pri ${isEv?"podujatí":"projekte"}, ale nie sú v žiadnej sekcii.</p></div></div>
      <ul class="items lk telist">${other.map(c=>`<li data-open="contacts:${esc(c.id)}"><span class="t">${cIcon(c)}${esc(c.name||"Bez mena")}</span>${ed?`<select class="rolesel" data-teamset="${id}|${esc(c.id)}" aria-label="Zaradiť do sekcie" style="padding:3px 6px;font-size:13px"><option value="">— zaradiť —</option>${SECS.map(([k,t])=>`<option value="${esc(k)}">${esc(t)}</option>`).join("")}</select>${rm(c)}`:""}</li>`).join("")}</ul></div>`;
  else if(sel){const key=sel[0],k=`${id}|${esc(key)}`,L=teamList(e,key,P),edm=ed&&tEd(e.id,key);
    const li=c=>`<li data-open="contacts:${esc(c.id)}" data-rowcid="${esc(c.id)}" data-rowkey="${esc(key)}"${ed?` draggable="true" data-trowdrag="${k}|${esc(c.id)}" title="Potiahnutím zmeníte poradie alebo presuniete do inej sekcie vľavo"`:""}><span class="t">${cIcon(c)}${esc(c.name||"Bez mena")}</span>${key==="tim"?`<span class="dutychips">${dutyArr(e,c.id).map((d,i)=>`<span class="tg sm" style="--tc:${dutyCol(d)}">${esc(d)}${edm?`<button type="button" class="dutyx" data-dutydel="${id}|${esc(c.id)}|${i}" aria-label="Odobrať úlohu" title="Odobrať">×</button>`:""}</span>`).join("")}${edm?`<input type="text" class="tg add dutynew" list="duty-dl" data-dutynew="${id}|${esc(c.id)}" placeholder="+ pridať" aria-label="Pridať úlohu" maxlength="40">`:""}</span>`:(key==="partner"||key==="sponzor")&&isEv?stSel(c):""}${edm?rm(c):""}</li>`;
    main=`<div class="panel txmain temain"><div class="txhead"><div style="min-width:0;flex:1">${kick}<input type="text" class="txtitle" value="${esc(sel[1])}" data-secren="${k}" aria-label="Názov sekcie" maxlength="40"${ed?"":" readonly"}></div>
        ${ed?`<div class="row" style="flex:none;gap:4px"><button type="button" class="tplus${edm?" on":""}" data-secedit="${k}" title="${key==="tim"?"Upraviť ľudí a ich úlohy":"Upraviť zoznam (odobrať)"}" aria-label="Upraviť sekciu ${esc(sel[1])}" aria-pressed="${edm}">${TI.edit}</button><button type="button" class="tplus tdel" data-secdel="${k}" title="Odstrániť sekciu" aria-label="Odstrániť sekciu ${esc(sel[1])}">${TI.del}</button></div>`:""}</div>
      ${ed||L.length?`<ul class="items lk telist">${L.map(li).join("")}${ed?`<li class="teamnew tenew">${svg('<path d="M12 5v14M5 12h14"/>',18)}<input type="text" class="tnin" id="te-add" data-keep data-teamfind="${k}" placeholder="Meno alebo rola…" autocomplete="off" spellcheck="false" aria-label="Pridať kontakt do sekcie ${esc(sel[1])}"><div class="tnlist" hidden></div></li>`:""}</ul>`:`<div class="empty">V tejto sekcii zatiaľ nikto nie je.</div>`}${key==="tim"?`<datalist id="duty-dl">${dutyList().map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>`:""}</div>`;}
  return`<div class="txm"><div class="txlist">${list}</div>${main}</div>`;
}
/* ===== Texty podujatia ===== */
