/* ===== Podujatie – záložka Podklady: všetko, čo sa k podujatiu píše, vyrába a odkladá. Vyzerá ako niekdajšie Texty:
   vľavo hore štyri ikony (Text · Grafika · Video · Dokumenty), pod nimi zoznam podkladov vybraného druhu, vpravo vybraný podklad – všetko na stránke, bez bočného panela.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-podklady.js. Nie je to samostatný skript.
   Od 2.0.54 nahrádza záložky Texty a Dokumenty: doterajšie texty (pole texts) a dokumenty (pole docs) sa stanú podkladmi – skladá ich evPk, kým sa podklady prvý raz neuložia (v:2); staré polia ostávajú nedotknuté.
   Podklad je v podstate úloha: v hlavičke má stav (bodka pred názvom: Zadané · Rozpracované · Hotové), termín a človeka (ikony), pod tým Zadanie · Výstup (text alebo súbory a odkazy).
   Prepojenia (od 2.0.58) sú úzky pás pod podkladom: štítky výstupov v Marketingu (pole mk) a úloh (pole tasks), pridávajú sa jedným tlačidlom „+ Prepojiť“; úloha má kartu „Podklad“. Termíny podkladov sú v Kalendári.
   Uložené v podujatí v poli podklady = {v:2,secs:[{id,title,kind}],items:[{id,s,t,st,brief,who,due,body,docs,mk:[id položiek marketingu],tasks:[id úloh]}]}.
   Prepojenie s Marketingom drží len podklad (pole mk) – položka marketingu si svoje podklady dohľadá. ===== */
const PK_DEF=[["text","Text","text"],["grafika","Grafika","file"],["video","Video","file"],["dok","Dokumenty","file"]];
const PK_IC={text:'<path d="M4 7h16M4 12h10M4 17h16"/>',grafika:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',dok:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',_:'<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2.5h7.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>'};
const PK_ADD={text:["Pridať text","Nový text"],grafika:["Pridať grafiku","Nová grafika"],video:["Pridať video","Nové video"],dok:["Pridať dokument","Nový dokument"],_:["Pridať podklad","Nový podklad"]};
const PK_MKT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
const PK_IMG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';
const PK_ST=TXST.map(x=>x[0]==="nezacate"?[x[0],"Zadané",x[2]]:x);   /* stavy podkladu: Zadané · Rozpracované · Hotové (kľúče ako pri textoch) */
const PK_CAL='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>';
const PK_USER='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.3 18.6a6.5 6.5 0 0 1 11.4 0"/></svg>';
const pkExt=n=>n.replace(/\.[a-z0-9]{2,4}$/i,"");
function evPk(e){
  const p=e.podklady;
  if(p&&p.v===2&&Array.isArray(p.items))return{secs:Array.isArray(p.secs)?p.secs:[],items:p.items};
  /* prvé zloženie zo starých polí – id sú stále rovnaké, kým sa neuloží: texty si nechajú svoje id, dokumenty majú d+poradie */
  const secs=PK_DEF.map(([id,title,kind])=>({id,title,kind})),items=[];
  (p&&Array.isArray(p.secs)?p.secs:[]).forEach(a=>{if(!secs.some(x=>x.id===a.id))secs.push({...a});});   /* vlastné sekcie zo skúšobnej verzie 2.0.53 */
  const M=evPlan(e).items;   /* „Dlhý text“ položky marketingu (txid) sa stane prepojením podkladu */
  evTexts(e).forEach(t=>items.push(pkNew(String(t.id),"text",t.title||"Text",{st:txSt(t),brief:t.desc||"",body:t.body||"",mk:M.filter(x=>x.txid&&x.txid===t.id).map(x=>x.id)})));
  (p&&Array.isArray(p.items)?p.items:[]).forEach(i=>items.push(Object.assign({},i,{s:secs.some(a=>a.id===i.s)?i.s:"dok"})));
  const G=gdSecs(e);   /* všetky doterajšie dokumenty idú do Dokumentov; názov vlastnej sekcie ostane v zadaní */
  (Array.isArray(e.docs)?e.docs:[]).forEach((d,i)=>{const g=G.find(x=>x.id===(d.kind||""));items.push(pkNew("d"+i,"dok",pkExt(String(d.name||"Dokument")),{st:"hotove",brief:g&&!g.base?g.label:"",docs:[d]}));});
  return{secs,items};
}
function pkSet(eid,fn){const e0=get("events",eid);if(!e0||!mkEd(e0))return Promise.resolve();const P=evPk(e0),N={v:2,secs:P.secs.map(a=>({...a})),items:P.items.map(i=>({...i}))};fn(N);return upd("events",eid,{podklady:N});}
const pkOne=(eid,iid,fn)=>pkSet(eid,N=>{const x=N.items.find(y=>y.id===iid);if(x)fn(x);});
const pkSt=it=>PK_ST.some(x=>x[0]===it.st)?it.st:(String(it.body||"").trim()||(it.docs||[]).length?"rozpracovane":"nezacate");   /* bez zvoleného stavu: s obsahom = rozpracované (ako pri Textoch) */
const pkStDef=it=>PK_ST.find(x=>x[0]===pkSt(it))||PK_ST[0];
const pkNew=(id,s,t,more)=>Object.assign({id,s,t,st:"",brief:"",who:"",due:"",body:"",docs:[],mk:[],tasks:[]},more||{});
const pkMk=(e,it)=>{const M=evPlan(e).items;return(it.mk||[]).map(id=>M.find(x=>x.id===id)).filter(Boolean);};   /* položky marketingu, ktoré podklad používajú */
const pkOfMk=(e,iid)=>evPk(e).items.filter(x=>(x.mk||[]).includes(iid));                                          /* podklady pripojené k položke marketingu */
const mkAllDocs=(e,it)=>[...(Array.isArray(it.docs)?it.docs:[]),...pkOfMk(e,it.id).flatMap(x=>x.docs||[])];
const pkHasText=it=>!!String(it.body||"").trim();
const pkUi=eid=>{S._pk=S._pk||{};const u=S._pk[eid];return u&&typeof u==="object"?u:(S._pk[eid]={sec:"",sel:{}});};
function pkDesc(x){   /* druhý riadok v zozname: začiatok zadania, inak čo je vo výstupe */
  const b=String(x.brief||"").trim().split("\n")[0];if(b)return b.length>60?b.slice(0,58)+"…":b;
  const n=(x.docs||[]).length;if(n>1)return n+(n<5?" súbory":" súborov");
  if(n===1){const d=x.docs[0],ext=((d.name||"").split(".").pop()||"").toLowerCase();return d.asset&&ext&&ext.length<=4?ext.toUpperCase():"odkaz";}
  return"";
}
const pkGrid=(docs,ed)=>`<div class="gdgrid">${docs.map((d,i)=>`<div class="gdt"><a class="gdth" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Súbor")}">${gdThumb(d)}</a>${ed?`<button type="button" class="gdrm" data-sdrm="${i}" title="Odstrániť súbor" aria-label="Odstrániť súbor">${GD_I.del}</button>`:""}<a class="gdn" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Súbor")}">${esc(d.name||"Súbor")}</a></div>`).join("")}</div>`;
function podkladyTab(e){
  const P=evPk(e),id=esc(e.id),ed=mkEd(e),ui=pkUi(e.id),sec=P.secs.find(a=>a.id===ui.sec)||P.secs[0];
  if(!sec)return`<div class="panel"><div class="empty">Žiadne podklady.</div></div>`;
  const L=P.items.filter(x=>x.s===sec.id),it=L.find(x=>x.id===ui.sel[sec.id])||L[0],svg=(p,w)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const seg=`<div class="tabs seg segi pkseg" role="group" aria-label="Druh podkladu">${P.secs.map(a=>{const n=P.items.filter(x=>x.s===a.id).length;
    return`<button type="button" data-pksec="${id}|${esc(a.id)}" aria-pressed="${a.id===sec.id}" title="${esc(a.title)}${n?` (${n})`:""}" aria-label="${esc(a.title)}">${svg(PK_IC[a.id]||PK_IC._,20)}</button>`;}).join("")}</div>`;
  const list=L.map((x,i)=>{const sd=pkStDef(x);
    return`<button type="button" class="txi${it&&x.id===it.id?" on":""}" data-pksel="${id}|${esc(sec.id)}|${esc(x.id)}">${svg(sec.id==="text"?TXI.ic[i%3]:(PK_IC[sec.id]||PK_IC._),22)}<span class="txt"><b>${esc(x.t||"Bez názvu")}</b><small>${esc(pkDesc(x))}</small></span><i class="txdot" style="background:${sd[2]}" title="${sd[1]}"></i></button>`;}).join("");
  const add=ed?`<button type="button" class="txi txadd" data-pkadd="${id}|${esc(sec.id)}">${svg('<path d="M12 5v14M5 12h14"/>',22)}<span class="txt"><b>${(PK_ADD[sec.id]||PK_ADD._)[0]}</b></span></button>${sec.kind==="text"?"":`<label class="txi txadd" style="margin-top:0" title="Každý súbor sa pridá ako samostatný podklad">${svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',22)}<span class="txt"><b>Nahrať súbory</b></span><input type="file" multiple data-pkup="${id}|${esc(sec.id)}" hidden></label>`}`:"";
  const main=it?`<div class="pkcol">${pkMain(e,P,sec,it,ed)}${pkRel(e,it,ed)}</div>`:`<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ nič. ${ed?"Pridajte prvý podklad vľavo.":""}</div>`;
  return`<div class="txm"><div class="txlist">${seg}${list}${add}</div>${main}</div>`;
}
/* vybraný podklad v strede stránky: hlavička (bodka stavu pred názvom – klik zmení stav; vpravo termín, človek a kôš ako ikony), potom Zadanie · Výstup; prepojenia sú v úzkom páse pod ním (pkRel) */
function pkMain(e,P,sec,it,ed){
  const k=`${esc(e.id)}|${esc(it.id)}`,f=n=>`data-pkf="${k}|${n}"`,ro=ed?"":" readonly";
  const st=pkSt(it),sd=pkStDef(it),docs=Array.isArray(it.docs)?it.docs:[],hasTxt=sec.kind!=="file"||pkHasText(it);
  const due=it.due?dueHtml(it.due,st==="hotove"):"",wn=it.who?personName(it.who):"";
  const act=ed?`<span class="gbndate"><button type="button" class="tplus pkv" data-gbndate title="Termín${it.due?": "+esc(fdateS(it.due)):""} – kliknutím vyberiete" aria-label="Termín">${PK_CAL}${due?`<span>${due}</span>`:""}</button><input type="date" id="pk-due" ${f("due")} value="${esc(it.due||"")}" tabindex="-1" aria-hidden="true"></span>
        <button type="button" class="tplus pkv" data-pkwhobtn="${k}" title="${wn?"Robí: "+esc(wn)+" – kliknutím zmeníte":"Prideliť človeka"}" aria-label="Prideliť človeka">${avatar(it.who||"")||PK_USER}${wn?`<span>${esc(wn)}</span>`:""}</button>
        <div class="pkpop" id="pk-whopop" hidden><div data-pkwho></div>${it.who?`<button type="button" class="btn sm ghost" data-pkwhoclr="${k}">Zrušiť pridelenie</button>`:""}</div>
        <button type="button" class="tplus tdel" data-pkdel="${k}" title="Odstrániť podklad" aria-label="Odstrániť podklad">${TI.del}</button>`
    :`${due?`<span class="meta row" style="gap:6px">${PK_CAL}${due}</span>`:""}${wn?`<span class="meta">${who(it.who)}</span>`:""}`;
  return`<div class="panel txmain gdmain" id="pk-main" data-pkmain="${k}"><div class="txhead pkhead"><div class="pkttl"><div class="kick">${esc(sec.title)} / ${esc(e.name||"Podujatie")}</div>
      <div class="pkt"><label class="gastdot" title="Stav: ${sd[1]}${ed?" – kliknutím zmeníte":""}"><i class="txdot" style="background:${sd[2]};width:12px;height:12px"></i>${ed?`<select id="pk-st" ${f("st")} aria-label="Stav podkladu">${PK_ST.map(([v,l])=>`<option value="${v}"${v===st?" selected":""}>${l}</option>`).join("")}</select>`:""}</label><input type="text" class="txtitle" id="pk-t" data-keep ${f("t")} value="${esc(it.t||"")}" aria-label="Názov podkladu" maxlength="120"${ro}></div></div>
      <div class="row pkact">${act}</div></div>
    <div class="pkb pkout"><div class="pkh">Zadanie</div><textarea class="pkta" id="pk-brief" rows="3" data-keep ${f("brief")} placeholder="Čo treba pripraviť – formát a rozmery, čo tam má byť, pre koho, kde sa použije…"${ro}>${esc(it.brief||"")}</textarea></div>
    <div class="pkb pkout docslot" id="pk-out"><div class="pkh">Výstup<span class="row" style="gap:2px;flex-wrap:nowrap">${ed?`<label class="tplus" title="Nahrať súbor" aria-label="Nahrať súbor">${GD_I.up}<input type="file" multiple data-sdfile hidden></label><button type="button" class="tplus" data-sdlink title="Pridať odkaz" aria-label="Pridať odkaz">${GD_I.link}</button>`:""}${hasTxt?`<button type="button" class="tplus" data-pkcopy title="Kopírovať text" aria-label="Kopírovať text">${TXI.copy}</button>`:""}</span></div>
      ${hasTxt?`<textarea class="pkta" id="pk-body" rows="3" data-keep ${f("body")} placeholder="Napíšte text…"${ro}>${esc(it.body||"")}</textarea><div class="txfoot" id="pk-cnt">${txStat(it.body)}</div>`:""}
      ${docs.length?`<div class="gdbody">${pkGrid(docs,ed)}</div>`:(hasTxt?"":`<div class="gdbody"><div class="gdempty" style="padding:0">${ed?"Sem patrí hotová vec – nahrajte súbor alebo pridajte odkaz. Veľké videá vložte radšej odkazom (napr. z Disku).":"Zatiaľ prázdne."}</div></div>`)}</div>
    </div>`;
}
/* prepojenia vybraného podkladu: úzky pás pod ním – štítky výstupov v Marketingu a úloh, všetko sa pridáva jedným tlačidlom „+ Prepojiť“ */
function pkRel(e,it,ed){
  const k=`${esc(e.id)}|${esc(it.id)}`,MP=evPlan(e),M=pkMk(e,it),mAvail=MP.items.filter(m=>!(it.mk||[]).includes(m.id));
  const TK=(it.tasks||[]).map(id=>get("tasks",id)).filter(t=>t&&!t._stub),tAvail=S.d.tasks.filter(t=>t.eventId===e.id&&!(it.tasks||[]).includes(t.id)).sort((a,b)=>isDone(a)-isDone(b)),canTask=accEdit("tasks");
  const rm=(attr,id)=>ed?`<button type="button" class="dutyx" ${attr}="${k}|${esc(id)}" aria-label="Odpojiť" title="Odpojiť">×</button>`:"";
  const tIc=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/>${d?'<path d="m8 12 3 3 5-6"/>':""}</svg>`;
  const chips=M.map(m=>{const a=MP.areas.find(y=>y.id===m.a);return`<span class="tg sm" style="--tc:${mkCol(MP,m.a)}" title="Marketing${a?" – "+esc(a.title):""}${m.date?", "+esc(fdateS(m.date)):""}"><span data-open="mkt:${esc(e.id)}~${esc(m.id)}">${PK_MKT}${esc(m.t||"Bez názvu")}</span>${rm("data-pkmkrm",m.id)}</span>`;}).join("")
    +TK.map(t=>`<span class="tg sm${isDone(t)?" done":""}" title="Úloha${isDone(t)?" – hotová":""}${t.due?", termín "+esc(fdateS(t.due)):""}"><span data-open="tasks:${esc(t.id)}">${tIc(isDone(t))}${esc(t.title||"Bez názvu")}</span>${rm("data-pktaskrm",t.id)}</span>`).join("");
  const add=ed?`<label class="tplus pkv" title="Prepojiť s výstupom v Marketingu alebo s úlohou">+ Prepojiť<select data-pklink="${k}" aria-label="Prepojiť"><option value="">Prepojiť s…</option>${MP.areas.map(a=>{const L=mAvail.filter(m=>m.a===a.id);return L.length?`<optgroup label="Marketing – ${esc(a.title)}">${L.map(m=>`<option value="mk:${esc(m.id)}">${esc(m.t||"Bez názvu")}</option>`).join("")}</optgroup>`:"";}).join("")}${tAvail.length||canTask?`<optgroup label="Úlohy">${canTask?`<option value="newtask">+ Nová úloha z tohto podkladu</option>`:""}${tAvail.map(t=>`<option value="task:${esc(t.id)}">${esc((isDone(t)?"✓ ":"")+(t.title||"Bez názvu"))}</option>`).join("")}</optgroup>`:""}</select></label>`:"";
  if(!ed&&!chips)return"";
  return`<div class="panel pkrel"><span class="pkh">Prepojenia</span>${chips||`<span class="meta">zatiaľ žiadne</span>`}${add}</div>`;
}
async function pkNewTask(eid,iid){const e0=get("events",eid),P=e0&&evPk(e0),c=P&&P.items.find(y=>y.id===iid);if(!c)return;const sec=P.secs.find(a=>a.id===c.s);
  const d={title:(sec?sec.title+": ":"")+(c.t||"Podklad"),status:"inbox",priority:"normalne",org:"ars",eventId:e0.id};if(e0.projectId)d.projectId=e0.projectId;if(c.who)d.assignee=c.who;if(c.due)d.due=c.due;if(c.brief)d.note=c.brief;
  const tid=await add("tasks",d);if(!tid)return;await pkOne(eid,iid,y=>{y.tasks=[...(y.tasks||[]),tid];});toast("Úloha vytvorená.");}
/* ovládanie, ktoré sa pripája po každom vykreslení stránky (volá bindView): súbory a odkazy vo Výstupe */
const pkGrow=(t,fresh)=>{if(!t)return;if(fresh)t.style.height="auto";if(t.scrollHeight>t.clientHeight+1)t.style.height=t.scrollHeight+"px";};   /* pole na text má 3 riadky a rastie s obsahom (dá sa aj potiahnuť) */
function pkBind(v){
  const m=v.querySelector("#pk-main"),out=m&&m.querySelector("#pk-out");if(!out)return;
  m.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));
  const[eid,iid]=m.dataset.pkmain.split("|");sdBind(out,eid,fn=>pkOne(eid,iid,x=>{x.docs=fn(Array.isArray(x.docs)?x.docs:[]);}),()=>{});
}
/* otvorenie podkladu odinakiaľ (položka marketingu, úloha): prejde na záložku Podklady a vyberie ho */
function pkOpen(eid,iid){const e0=get("events",eid),it=e0&&evPk(e0).items.find(x=>x.id===iid);if(!it)return;closeDrawer();const ui=pkUi(eid);ui.sec=it.s;ui.sel[it.s]=iid;S.evtab="podklady";
  if(S.view==="podujatie"&&S.id===eid)render();else go("podujatie",eid);
  setTimeout(()=>{const m=document.getElementById("pk-main");if(m&&m.scrollIntoView)m.scrollIntoView({block:"nearest"});},60);}
/* ---- súbory a odkazy (spoločné pre podklad aj položku marketingu) ---- */
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
/* ---- položka marketingu (bočný panel): karta Podklady – pripojené podklady + vlastné súbory ---- */
function mkPkCard(e0,it,ed){
  const P=evPk(e0),LK=pkOfMk(e0,it.id),docs=Array.isArray(it.docs)?it.docs:[],avail=P.items.filter(x=>!(x.mk||[]).includes(it.id));
  const thumbs=LK.flatMap(x=>(x.docs||[]).map((d,i)=>docThumb("events",e0,d,i,true))).join("")+sdThumbs(e0,docs,ed);
  return`<section class="dcard lkc docslot">${sdHead("Podklady",ed)}
    ${LK.length?`<ul class="items lk">${LK.map(x=>{const sd=pkStDef(x),sc=P.secs.find(y=>y.id===x.s);return`<li data-open="pk:${esc(e0.id)}~${esc(x.id)}"><i class="txdot" style="background:${sd[2]}" title="${sd[1]}"></i><span class="t">${esc(x.t||"Bez názvu")}</span>${sc?`<span class="meta">${esc(sc.title)}</span>`:""}${pkHasText(x)?`<button type="button" class="tplus" data-mkpkcopy="${esc(x.id)}" title="Kopírovať text podkladu" aria-label="Kopírovať text podkladu" style="width:22px;height:22px">${TXI.copy}</button>`:""}${ed?`<button type="button" class="tplus" data-mkpkrm="${esc(x.id)}" title="Odpojiť" aria-label="Odpojiť" style="width:22px;height:22px;font-size:17px">×</button>`:""}</li>`;}).join("")}</ul>`:""}
    ${thumbs?`<div class="dr2-t" style="margin-top:8px">${thumbs}</div>`:(LK.length?"":`<div class="meta" style="margin-top:4px;white-space:normal">Pripojte podklad (text, grafika, video, dokument) alebo priložte súbor či odkaz priamo.</div>`)}
    ${ed?`<select class="linksel" data-mkpkadd><option value="">↗ Pripojiť alebo zadať podklad…</option>${avail.length?P.secs.map(a=>{const L=avail.filter(x=>x.s===a.id);return L.length?`<optgroup label="${esc(a.title)}">${L.map(x=>`<option value="${esc(x.id)}">${esc(x.t||"Bez názvu")}</option>`).join("")}</optgroup>`:"";}).join(""):""}<optgroup label="Zadať nový">${P.secs.map(a=>`<option value="new:${esc(a.id)}">${esc((PK_ADD[a.id]||PK_ADD._)[1])}</option>`).join("")}</optgroup></select>`:""}</section>`;
}
function mkPkBind(host,D){
  sdBind(host,D.eid,fn=>mkSet(D.eid,N=>{const x=N.items.find(y=>y.id===D.iid);if(x)x.docs=fn(Array.isArray(x.docs)?x.docs:[]);}),()=>mkDrawer(true));
  const sel=host.querySelector("[data-mkpkadd]");if(sel)sel.onchange=async()=>{const v=sel.value;if(!v)return;
    if(v.startsWith("new:")){const e0=get("events",D.eid),it=e0&&evPlan(e0).items.find(x=>x.id===D.iid);if(!it)return;const nid=mkId();
      await pkSet(D.eid,N=>{N.items.push(pkNew(nid,v.slice(4),it.t||"",{mk:[D.iid]}));});pkOpen(D.eid,nid);}
    else{await pkOne(D.eid,v,x=>{x.mk=[...new Set([...(x.mk||[]),D.iid])];});mkDrawer(true);}};
  host.querySelectorAll("[data-mkpkrm]").forEach(b=>b.onclick=async ev=>{ev.stopPropagation();await pkOne(D.eid,b.dataset.mkpkrm,x=>{x.mk=(x.mk||[]).filter(i=>i!==D.iid);});mkDrawer(true);});
  host.querySelectorAll("[data-mkpkcopy]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();const e0=get("events",D.eid),x=e0&&evPk(e0).items.find(y=>y.id===b.dataset.mkpkcopy);if(x)pkCopy(x.body);});
}
/* ---- úloha (bočný panel): odkaz na podklad, ku ktorému patrí ---- */
function pkTaskCard(t){
  const L=[];S.d.events.forEach(e=>{if(e.podklady&&Array.isArray(e.podklady.items))e.podklady.items.forEach(x=>{if((x.tasks||[]).includes(t.id))L.push([e,x]);});});
  if(!L.length)return"";
  return`<section class="dcard lkc"><h3 style="margin-bottom:6px"><span class="lkh">${PK_IMG}Podklad</span></h3><ul class="items lk">${L.map(([e,x])=>{const sd=pkStDef(x),sc=evPk(e).secs.find(y=>y.id===x.s);return`<li data-open="pk:${esc(e.id)}~${esc(x.id)}"><i class="txdot" style="background:${sd[2]}" title="${sd[1]}"></i><span class="t">${esc(x.t||"Bez názvu")}</span>${sc?`<span class="meta">${esc(sc.title)}</span>`:""}</li>`;}).join("")}</ul></section>`;
}
document.addEventListener("change",ev=>{const t=ev.target;if(!t||!t.dataset)return;
  if(t.dataset.pkf){const[eid,iid,f]=t.dataset.pkf.split("|"),v=String(t.value).trim();if(f==="t"&&!v){render();return;}pkOne(eid,iid,x=>{x[f]=v;});return;}
  if(t.dataset.pklink){const[eid,iid]=t.dataset.pklink.split("|"),v=t.value;t.value="";if(!v)return;
    if(v.startsWith("mk:"))pkOne(eid,iid,x=>{x.mk=[...new Set([...(x.mk||[]),v.slice(3)])];});
    else if(v.startsWith("task:"))pkOne(eid,iid,x=>{x.tasks=[...new Set([...(x.tasks||[]),v.slice(5)])];});
    else if(v==="newtask")pkNewTask(eid,iid);
    return;}
  if(t.dataset.pkup){const[eid,sid]=t.dataset.pkup.split("|"),fs=[...(t.files||[])];if(!fs.length)return;
    (async()=>{const out=[];for(const f of fs){const d=await uploadDoc(f,{en:"events",id:eid,kind:""});if(d)out.push(pkNew(mkId(),sid,pkExt(String(f.name||"Súbor")),{st:"hotove",docs:[Object.assign(d,{at:Date.now()})]}));}t.value="";
      if(out.length){pkUi(eid).sel[sid]=out[out.length-1].id;pkSet(eid,N=>{N.items.push(...out);});}})();}});
document.addEventListener("keydown",ev=>{const t=ev.target;if(t&&t.id==="pk-t"&&ev.key==="Enter")t.blur();});
document.addEventListener("input",ev=>{const t=ev.target;if(!t||!t.classList||!t.classList.contains("pkta"))return;pkGrow(t);if(t.id==="pk-body"){const c=document.getElementById("pk-cnt");if(c)c.innerHTML=txStat(t.value);}});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  {const pop=document.getElementById("pk-whopop");if(pop&&!pop.hidden&&!q("#pk-whopop")&&!q("[data-pkwhobtn]"))pop.hidden=true;}   /* klik mimo zavrie výber človeka */
  if((x=q("[data-pkwhobtn]"))){const pop=document.getElementById("pk-whopop");if(!pop)return;if(!pop.hidden){pop.hidden=true;return;}
    const[eid,iid]=x.dataset.pkwhobtn.split("|"),box=pop.querySelector("[data-pkwho]");pop.hidden=false;picker(box,"",val=>{if(val)pkOne(eid,iid,y=>{y.who=val;});});const i=box.querySelector("input");if(i)i.focus();return;}
  if((x=q("[data-pkwhoclr]"))){const[eid,iid]=x.dataset.pkwhoclr.split("|");pkOne(eid,iid,y=>{y.who="";});return;}
  if((x=q("[data-pksec]"))){const[eid,sid]=x.dataset.pksec.split("|");pkUi(eid).sec=sid;render();return;}
  if((x=q("[data-pksel]"))){const[eid,sid,iid]=x.dataset.pksel.split("|");pkUi(eid).sel[sid]=iid;render();return;}
  if((x=q("[data-pkadd]"))){const[eid,sid]=x.dataset.pkadd.split("|"),nid=mkId();pkUi(eid).sel[sid]=nid;await pkSet(eid,N=>{N.items.push(pkNew(nid,sid,(PK_ADD[sid]||PK_ADD._)[1]));});setTimeout(()=>{const i=document.getElementById("pk-t");if(i){i.focus();i.select();}},60);return;}
  if((x=q("[data-pkdel]"))){const[eid,iid]=x.dataset.pkdel.split("|"),e0=get("events",eid),it=e0&&evPk(e0).items.find(y=>y.id===iid);if(!it)return;
    if((pkHasText(it)||String(it.brief||"").trim()||(it.docs||[]).length)&&!await ask(`Odstrániť podklad „${it.t||"Bez názvu"}“${(it.docs||[]).length?" aj s jeho súbormi":""}?`,"Odstrániť"))return;
    pkSet(eid,N=>{N.items=N.items.filter(y=>y.id!==iid);});return;}
  if((x=q("[data-pkcopy]"))){const b=document.getElementById("pk-body");if(b)pkCopy(b.value);return;}
  if((x=q("[data-pkmkrm]"))){const[eid,iid,mid]=x.dataset.pkmkrm.split("|");pkOne(eid,iid,y=>{y.mk=(y.mk||[]).filter(i=>i!==mid);});return;}
  if((x=q("[data-pktaskrm]"))){const[eid,iid,tid]=x.dataset.pktaskrm.split("|");pkOne(eid,iid,y=>{y.tasks=(y.tasks||[]).filter(i=>i!==tid);});return;}
});
