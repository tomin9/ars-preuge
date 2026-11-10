/* ===== Podujatie NOX:art – Zabezpečenie: technický plán po dielach, dodávky, ľudia, súhrn.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/zabezpecenie.js. Nie je to samostatný skript. ===== */
/* ================= view bindings ================= */
/* ================= Zabezpečenie: technický plán po dielach ================= */
const ZB_STAV=[["navrh","Neriešené"],["rozpracovane","Rozpracované"],["potvrdene","Potvrdené"]];
const ZB_KIND={vo:"VO",bud:"Budova",bat:"Batéria",gen:"Elektrocentrála",tbd:"TBD",none:"Bez napájania"};
S.zb={f:"all",open:{},mode:"diela",sums:{},ns:{kto:"",naz:"",ks:"",typ:"pozicane"},give:{}};
const zbNum=v=>{const n=parseFloat(String(v??"").replace(",","."));return isFinite(n)?n:0;};
const zbList=()=>[...S.d.zab].sort((a,b)=>(+a.ord||0)-(+b.ord||0)||(a.createdAt||0)-(b.createdAt||0));
const zbPhoto=x=>!x.photo?"":(String(x.photo).startsWith("data:")?x.photo:(typeof ARSP_BLOB!=="undefined"?ARSP_BLOB:"")+x.photo);
const zbWD=["Ne","Po","Ut","St","Št","Pi","So"];
function zbDay(den){const d=new Date(den+"T12:00:00");return isNaN(d)?esc(den):`${zbWD[d.getDay()]} ${d.getDate()}. ${d.getMonth()+1}.`;}
function zbShort(p){if(!p.den)return"nastaviť čas";const d=new Date(p.den+"T12:00:00");const ds=isNaN(d)?p.den:`${d.getDate()}.${d.getMonth()+1}.`;return`${ds} ${p.od||"?"}–${p.do||"?"}`;}
/* patch may be a function (current record → patch) so it is computed from the newest data when the save runs */
const zbKey=v=>String(v||"").trim().replace(/\s+/g," ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
/* most-used spelling of every value already entered in a field → suggestions */
function zbVals(key,fld){const m={};S.d.zab.forEach(x=>(x[key]||[]).forEach(r=>{const v=String(r[fld]||"").trim().replace(/\s+/g," ");if(!v)return;const k=v.toLowerCase();m[k]=m[k]||{};m[k][v]=(m[k][v]||0)+1;}));
  return Object.values(m).map(c=>Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]).sort((a,b)=>a.localeCompare(b,"sk"));}
function zbMerge(a,b){const m=new Map();[...a,...b].forEach(v=>{v=String(v||"").trim().replace(/\s+/g," ");if(v&&!m.has(zbKey(v)))m.set(zbKey(v),v);});return[...m.values()].sort((x,y)=>x.localeCompare(y,"sk"));}
function zbLists(){const dl=(id,a)=>`<datalist id="${id}">${a.map(v=>`<option value="${esc(v)}"></option>`).join("")}</datalist>`;
  return dl("zb-dl-tech",zbMerge(zbMerge(S.d.invTech.map(invLabel),zbVals("technika","nazov")),S.d.zabd.map(d=>d.nazov)))+dl("zb-dl-zdroj",zbMerge(zbMerge(zbVals("technika","zdroj"),S.d.zabd.map(d=>d.kto)),S.d.contacts.map(c=>c.name)))   /* ponuka: veci z Inventára (Technika) a mená z Kontaktov */+dl("zb-dl-rola",zbVals("personal","rola"))+dl("zb-dl-kto",zbVals("personal","kto"));}
const zbMin=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(t||"");return m?(+m[1])*60+(+m[2]):null;};
function zbOverlap(a,b){if(!a.den||a.den!==b.den)return false;const a1=zbMin(a.od),a2=zbMin(a.do),b1=zbMin(b.od),b2=zbMin(b.do);if(a1==null||b1==null)return false;
  const e1=a2==null?a1+1:(a2<=a1?a2+1440:a2),e2=b2==null?b1+1:(b2<=b1?b2+1440:b2);return a1<e2&&b1<e1;}
/* every assignment grouped by person name */
function zbPeople(){const P={};zbList().forEach(x=>(x.personal||[]).forEach((r,i)=>{const w=zbWho(r),k=zbKey(w);if(!k)return;(P[k]=P[k]||{name:w,items:[]}).items.push({x,r,i});}));
  Object.values(P).forEach(p=>{p.items.sort((a,b)=>(a.r.den||"9").localeCompare(b.r.den||"9")||(a.r.od||"").localeCompare(b.r.od||""));
    p.items.forEach(a=>{a.clash=p.items.filter(b=>b!==a&&zbOverlap(a.r,b.r));});p.clash=p.items.some(a=>a.clash.length);});
  return P;}
/* people come from Contacts: role = contact role, person = contact (older rows keep a typed name) */
const zbIsRole=k=>OPT.crole.some(o=>o[0]===k);
const zbWho=r=>{const c=r&&r.contactId&&get("contacts",r.contactId);return c?(c.name||""):String((r&&r.kto)||"").trim();};
const zbRola=r=>!r||!r.rola?"":zbIsRole(r.rola)?optL("crole",r.rola):String(r.rola);
function zbWhoSelect(id,i,r,cls,idAttr){
  const role=zbIsRole(r.rola)?r.rola:"",C=[...S.d.contacts].sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  const opt=c=>`<option value="c:${esc(c.id)}" ${r.contactId===c.id?"selected":""}>${esc(c.name||"Bez mena")}</option>`;
  let body;
  if(role){const L=C.filter(c=>c.role===role);body=L.map(opt).join("");if(r.contactId&&!L.some(c=>c.id===r.contactId)){const c=get("contacts",r.contactId);if(c)body+=opt(c);}}
  else body=OPT.crole.map(([k,l])=>{const L=C.filter(c=>c.role===k);return L.length?`<optgroup label="${esc(l)}">${L.map(opt).join("")}</optgroup>`:"";}).join("")+(()=>{const L=C.filter(c=>!zbIsRole(c.role));return L.length?`<optgroup label="Ostatné">${L.map(opt).join("")}</optgroup>`:"";})();
  const legacy=!r.contactId&&r.kto?`<option value="t" selected>${esc(r.kto)} (nie je v kontaktoch)</option>`:"";
  return`<select class="${cls}" id="${idAttr}" data-zbk="${id}|${i}" aria-label="Kto"><option value="" ${!r.contactId&&!r.kto?"selected":""}>${role?"vybrať – "+esc(optL("crole",role).toLowerCase()):"vybrať z kontaktov"}</option>${legacy}${body}<option value="new">＋ nový kontakt${role?" ("+esc(optL("crole",role).toLowerCase())+")":""}…</option></select>`;
}
const zbWhere=a=>`č. ${esc(a.x.ord||"")} ${esc(a.x.title||"")}`;
function zbSave(id,patch){return new Promise(r=>setTimeout(()=>{const x=get("zab",id);if(!x)return r(false);const p=typeof patch==="function"?patch(x):patch;r(p?upd("zab",id,p):false);},0));}

function zbRows(x,key){
  const id=x.id,L=x[key]||[];
  if(key==="technika")return(L.length?`<div class="zb-row tech hd"><span></span><span>Položka</span><span>Ks</span><span>Druh</span><span>Od koho / kde</span><span></span></div>`:"")+
    L.map((r,i)=>`<div class="zb-row tech ${r.ok?"ok":""}" data-zbrow="${i}">
      <span class="zb-lead"><button type="button" class="zb-h" id="zb-${id}-ht${i}" data-zbdrag="${id}|technika|${i}" aria-label="Presunúť riadok (šípky hore/dole)" title="Potiahni a presuň">⠿</button><input type="checkbox" id="zb-${id}-t${i}-ok" data-zb="${id}|technika|${i}|ok" ${r.ok?"checked":""} aria-label="Zabezpečené"></span>
      <input type="text" id="zb-${id}-t${i}-n" data-zb="${id}|technika|${i}|nazov" list="zb-dl-tech" autocomplete="off" value="${esc(r.nazov)}" placeholder="napr. LED reflektor">
      <input type="number" id="zb-${id}-t${i}-k" data-zb="${id}|technika|${i}|ks" value="${esc(r.ks)}" min="0" placeholder="ks">
      <select class="typ t-${esc(zbTyp(r))}" id="zb-${id}-t${i}-y" data-zb="${id}|technika|${i}|typ" aria-label="Druh">${ZB_TYP.map(([k,l])=>`<option value="${k}" ${zbTyp(r)===k?"selected":""}>${l}</option>`).join("")}</select>
      <input type="text" class="zdroj" id="zb-${id}-t${i}-z" data-zb="${id}|technika|${i}|zdroj" list="zb-dl-zdroj" autocomplete="off" value="${esc(r.zdroj)}" placeholder="od koho / kde">
      <button type="button" class="zb-x" data-zbdel="${id}|technika|${i}" aria-label="Odstrániť položku">×</button></div>`).join("");
  if(key==="personal")return(L.length?`<div class="zb-row per hd"><span></span><span>Rola</span><span>Kto</span><span>Kedy</span><span>Poznámka</span><span></span></div>`:"")+
    L.map((r,i)=>{const open=S.zb.open[id+"-"+i];return`<div class="zb-row per ${r.ok?"ok":""}" data-zbrow="${i}">
      <span class="zb-lead"><button type="button" class="zb-h" id="zb-${id}-hp${i}" data-zbdrag="${id}|personal|${i}" aria-label="Presunúť riadok (šípky hore/dole)" title="Potiahni a presuň">⠿</button><input type="checkbox" id="zb-${id}-p${i}-ok" data-zb="${id}|personal|${i}|ok" ${r.ok?"checked":""} aria-label="Potvrdené"></span>
      <select class="zb-sel" id="zb-${id}-p${i}-r" data-zb="${id}|personal|${i}|rola" aria-label="Rola"><option value="">rola…</option>${OPT.crole.map(([k,l])=>`<option value="${k}" ${r.rola===k?"selected":""}>${esc(l)}</option>`).join("")}${r.rola&&!zbIsRole(r.rola)?`<option value="${esc(r.rola)}" selected>${esc(r.rola)}</option>`:""}</select>
      ${zbWhoSelect(id,i,r,"zb-sel","zb-"+id+"-p"+i+"-k")}
      <button type="button" class="zb-when ${open?"on":""}" data-zbwhen="${id}|${i}" aria-expanded="${!!open}">${esc(zbShort(r))}</button>
      <input type="text" id="zb-${id}-p${i}-t" data-zb="${id}|personal|${i}|kedy" value="${esc(r.kedy)}" placeholder="poznámka">
      <button type="button" class="zb-x" data-zbdel="${id}|personal|${i}" aria-label="Odstrániť človeka">×</button>
      ${open?`<div class="zb-whenedit">
        <label>Dátum <input type="date" id="zb-${id}-p${i}-d" data-zb="${id}|personal|${i}|den" value="${esc(r.den)}"></label>
        <label>Od <input type="time" id="zb-${id}-p${i}-o" data-zb="${id}|personal|${i}|od" value="${esc(r.od)}"></label>
        <label>Do <input type="time" id="zb-${id}-p${i}-p" data-zb="${id}|personal|${i}|do" value="${esc(r.do)}"></label>
        <button type="button" class="zb-add" data-zbwhen="${id}|${i}">Hotovo</button></div>`:""}</div>`;}).join("");
  if(key==="ulohy")return L.map((r,i)=>`<div class="zb-row ul ${r.hotovo?"done":""}" data-zbrow="${i}">
      <span class="zb-lead"><button type="button" class="zb-h" id="zb-${id}-hu${i}" data-zbdrag="${id}|ulohy|${i}" aria-label="Presunúť riadok (šípky hore/dole)" title="Potiahni a presuň">⠿</button><input type="checkbox" id="zb-${id}-u${i}-h" data-zb="${id}|ulohy|${i}|hotovo" ${r.hotovo?"checked":""} aria-label="Hotovo"></span>
      <input type="text" id="zb-${id}-u${i}-t" data-zb="${id}|ulohy|${i}|text" value="${esc(r.text)}" placeholder="čo treba vybaviť">
      <button type="button" class="zb-x" data-zbdel="${id}|ulohy|${i}" aria-label="Odstrániť úlohu">×</button></div>`).join("");
  return"";
}
function zbAlso(x,r,i){
  const p=zbWho(r)&&(S.zbP||{})[zbKey(zbWho(r))];if(!p)return"";
  const me=p.items.find(a=>a.x.id===x.id&&a.i===i);const other=p.items.filter(a=>a!==me);if(!other.length)return"";
  return`<div class="zb-also">${esc(p.name)} má aj: ${other.map(a=>`<a href="#zb-${esc(a.x.id)}" data-zbjump="${esc(a.x.id)}">${zbWhere(a)}${a.r.den?" · "+esc(zbShort(a.r)):""}</a>`).join(", ")}</div>`;
}
function zbCard(x){
  const id=x.id,st=x.stav||"navrh",ph=zbPhoto(x);
  return`<article class="zb-card st-${st}" id="zb-${id}">
  <div class="zb-head">
    <div class="zb-ph">${ph?`<img src="${esc(ph)}" alt="Fotografia lokality: ${esc(x.title||"")}" loading="lazy">`:"bez fotky"}</div>
    <div class="zb-info">
      <div class="zb-tr"><span class="zb-num">${esc(x.ord||"")}</span>
        <input class="zb-title" id="zb-${id}-title" data-zb="${id}|title" value="${esc(x.title||"")}" placeholder="Názov diela" aria-label="Názov diela">
        <select class="zb-stav s-${st}" id="zb-${id}-stav" data-zb="${id}|stav" aria-label="Stav">${ZB_STAV.map(([k,l])=>`<option value="${k}" ${st===k?"selected":""}>${l}</option>`).join("")}</select></div>
      <input class="zb-author" id="zb-${id}-author" data-zb="${id}|author" value="${esc(x.author||"")}" placeholder="Autor" aria-label="Autor">
      ${x.srcPower||x.srcNote?`<div class="zb-src">${x.srcKind?`<span class="zb-tag k-${esc(x.srcKind)}">${esc(ZB_KIND[x.srcKind]||x.srcKind)}</span>`:""}<b>Podľa podkladu:</b> ${esc(x.srcPower||"")}${x.srcNote?`<div class="pp">${esc(x.srcNote)}</div>`:""}</div>`:""}
    </div></div>
  <div class="zb-plan">
    <div><h4><label for="zb-${id}-nap">Napájanie (potvrdené)</label></h4><input type="text" id="zb-${id}-nap" data-zb="${id}|napajanie" value="${esc(x.napajanie||"")}" placeholder="odkiaľ a ako sa to reálne napojí"></div>
    <div><h4>Technika, káble a príslušenstvo</h4><div class="zb-rows">${zbRows(x,"technika")}<button type="button" class="zb-add" data-zbadd="${id}|technika">+ Pridať položku</button></div></div>
    <div><h4>Ľudia</h4><div class="zb-rows">${zbRows(x,"personal")}<button type="button" class="zb-add" data-zbadd="${id}|personal">+ Pridať človeka</button></div></div>
    <div><h4>Otvorené úlohy</h4><div class="zb-rows">${zbRows(x,"ulohy")}<button type="button" class="zb-add" data-zbadd="${id}|ulohy">+ Pridať úlohu</button></div></div>
    <div><h4><label for="zb-${id}-poz">Poznámky</label></h4><textarea id="zb-${id}-poz" data-zb="${id}|poznamka" placeholder="montáž, prevádzka, dohody…">${esc(x.poznamka||"")}</textarea></div>
    <div class="zb-foot"><button type="button" class="btn ghost sm danger" data-zbrm="${id}">Odstrániť dielo</button></div>
  </div></article>`;
}
/* custom order of summary rows, kept in settings so the whole team sees it */
function zbOrd(kind,items,keyOf){const o=((S.settings.zbOrder||{})[kind])||[];const pos=new Map(o.map((k,n)=>[zbKey(k),n]));
  return items.map((it,n)=>{const q=zbKey(keyOf(it));return{it,n,p:pos.has(q)?pos.get(q):1e6+n};}).sort((a,b)=>a.p-b.p).map(x=>x.it);}
const zbHandle=(attr,n)=>`<button type="button" class="zb-h" id="zb-s-${attr.replace(/[^a-z]/g,"")}-${n}" data-zbsdrag="${attr}|${n}" aria-label="Presunúť riadok (šípky hore/dole)" title="Potiahni a presuň">⠿</button>`;
function zbSumPeople(){
  const P=zbOrd("ludia",Object.values(S.zbP||zbPeople()).sort((a,b)=>a.name.localeCompare(b.name,"sk")),p=>zbKey(p.name));
  const free=[];zbList().forEach(x=>(x.personal||[]).forEach((r,i)=>{if(!zbKey(zbWho(r))&&(r.rola||r.den))free.push({x,r,i});}));
  free.sort((a,b)=>(a.r.den||"9").localeCompare(b.r.den||"9")||(a.r.od||"").localeCompare(b.r.od||"")||(+a.x.ord||0)-(+b.x.ord||0));
  const line=a=>`<div class="zb-pl ${a.r.ok?"ok":""}"><input type="checkbox" data-zbsok="per|${esc(a.x.id)}|${a.i}" ${a.r.ok?"checked":""} aria-label="Potvrdené">${a.r.den?`<span class="zb-pt">${esc(zbShort(a.r))}</span>`:'<span class="zb-pt miss">bez času</span>'}<a href="#zb-${esc(a.x.id)}" data-zbjump="${esc(a.x.id)}">${zbWhere(a)}</a>${zbRola(a.r)?` <span class="meta">· ${esc(zbRola(a.r))}</span>`:""}</div>`;
  const cnt=n=>`${n} ${n===1?"miesto":n<5?"miesta":"miest"}`;
  if(!P.length&&!free.length)return`<div class="empty">Zatiaľ nikto.</div>`;
  return`<div class="tw"><table class="zb-t"><tr><th style="width:24px"></th><th style="width:200px">Kto</th><th>Kde a kedy</th></tr>${P.map((p,n)=>`<tr data-zbsrow="${n}" data-key="${esc(zbKey(p.name))}"><td>${zbHandle("ludia",n)}</td><td><input class="zb-sname b" id="zb-sn-ludia-${n}" data-zbsname="ludia|${esc(zbKey(p.name))}" value="${esc(p.name)}" aria-label="Meno"><div class="meta">${cnt(p.items.length)}</div></td><td>${p.items.map(line).join("")}</td></tr>`).join("")}${free.length?`<tr><td></td><td><span class="miss">Neobsadené</span><div class="meta">${cnt(free.length)}</div></td><td>${free.map(line).join("")}</td></tr>`:""}</table></div>`;
}
/* technika grouped by who lends/supplies it (the Zdroj field) */
/* deliveries: who gave what and how many; each one is then split between works (rows linked by supplyId) */
function zbSumSources(){
  const D=S.d.zabd,works=zbList();
  const alloc={};works.forEach(x=>(x.technika||[]).forEach((r,i)=>{if(r.supplyId)(alloc[r.supplyId]=alloc[r.supplyId]||[]).push({x,r,i});}));
  const G={};const grp=(name)=>{const k=zbKey(name);return G[k]||(G[k]={k,name:String(name||"").trim().replace(/\s+/g," "),sup:[],loose:[]});};
  D.forEach(d=>grp(d.kto).sup.push(d));
  works.forEach(x=>(x.technika||[]).forEach((r,i)=>{if(r.nazov&&!r.supplyId&&zbKey(r.zdroj)&&zbLent(r))grp(r.zdroj).loose.push({x,r,i});}));
  const named=zbOrd("zdroj",Object.values(G).filter(g=>g.k).sort((a,b)=>a.name.localeCompare(b.name,"sk")),g=>g.k);
  const opts=works.map(x=>`<option value="${esc(x.id)}">${esc(x.ord||"")} ${esc(x.title||"")}</option>`).join("");
  const supRow=d=>{const A=alloc[d.id]||[],used=A.reduce((t,a)=>t+zbNum(a.r.ks||1),0),tot=zbNum(d.ks),rest=tot-used;
    const chips=A.map(a=>`<span class="zb-chip"><a href="#zb-${esc(a.x.id)}" data-zbjump="${esc(a.x.id)}" title="${esc(a.x.title||"")}">č. ${esc(a.x.ord||"")}</a> · ${esc(a.r.ks||1)} ks<button type="button" data-zbdun="${esc(a.x.id)}|${a.i}" aria-label="Zrušiť pridelenie">×</button></span>`).join("");
    return`<div class="zb-sup ${d.ok?"ok":""}">
      <div class="zb-supl"><input type="checkbox" data-zbsok="sup|${esc(d.id)}" ${d.ok?"checked":""} aria-label="Máme">
        <input class="zb-sname b" id="zb-dn-${esc(d.id)}" data-zbsname="dnaz|${esc(d.id)}" value="${esc(d.nazov||"")}" size="${Math.max(4,String(d.nazov||"").length)}" list="zb-dl-tech" autocomplete="off" placeholder="čo" aria-label="Položka">
        ${d.typ==="darovane"?'<span class="zb-tag">darované</span>':""}<span class="zb-chips">${chips}</span>
        <input type="number" class="zb-dks" id="zb-dk-${esc(d.id)}" data-zbsname="dks|${esc(d.id)}" value="${esc(d.ks??"")}" min="0" placeholder="ks" aria-label="Počet kusov"><span class="meta">ks</span>
        ${rest<0?`<button type="button" class="zb-rest bad" data-zbdopen="${esc(d.id)}">pridelené o ${-rest} ks viac</button>`:rest===0&&tot?`<span class="zb-rest done">pridelené</span>`:`<button type="button" class="zb-rest" data-zbdopen="${esc(d.id)}" aria-expanded="${!!S.zb.give[d.id]}">prideliť</button>`}
        <button type="button" class="zb-x" data-zbddel="${esc(d.id)}" aria-label="Odstrániť dodávku">×</button></div>
      ${S.zb.give[d.id]?`<div class="zb-alloc"><span class="zb-give"><select id="zb-dw-${esc(d.id)}" aria-label="Dielo"><option value="">prideliť k dielu…</option>${opts}</select><input type="number" id="zb-dq-${esc(d.id)}" min="1" value="${rest>0?rest:1}" aria-label="Kusov"><button type="button" class="btn sm pri" data-zbdgive="${esc(d.id)}">Prideliť</button></span></div>`:""}</div>`;};
  const looseRow=g=>g.loose.length?`<div class="zb-loose"><span class="meta">Zadané len pri dieloch:</span> ${g.loose.map(a=>`<span class="zb-chip">${esc(a.r.nazov)} · ${esc(a.r.ks||1)} ks · č. ${esc(a.x.ord||"")}<button type="button" class="lnk" data-zbdadopt="${esc(a.x.id)}|${a.i}" title="Zapísať ako dodávku">+ do dodávok</button></span>`).join("")}</div>`:"";
  const form=`<div class="zb-newsup"><input id="zb-ns-kto" value="${esc(S.zb.ns.kto)}" list="zb-dl-zdroj" autocomplete="off" placeholder="Kto (napr. Štefan Strašidelný)"><input id="zb-ns-naz" value="${esc(S.zb.ns.naz)}" list="zb-dl-tech" autocomplete="off" placeholder="Čo (napr. Kábel 20 m)"><input id="zb-ns-ks" value="${esc(S.zb.ns.ks)}" type="number" min="1" placeholder="ks"><select id="zb-ns-typ" aria-label="Druh"><option value="pozicane" ${S.zb.ns.typ!=="darovane"?"selected":""}>požičané</option><option value="darovane" ${S.zb.ns.typ==="darovane"?"selected":""}>darované</option></select><button type="button" class="btn pri sm" data-zbdnew>Pridať dodávku</button></div>`;
  return`${form}${named.length?`<div class="tw"><table class="zb-t zb-srct"><tr><th style="width:24px"></th><th style="width:220px">Kto</th><th>Čo dal a kam to ide</th></tr>${named.map((g,n)=>`<tr data-zbsrow="${n}" data-key="${esc(g.k)}"><td>${zbHandle("zdroj",n)}</td><td><input class="zb-sname b" id="zb-sn-zdroj-${n}" data-zbsname="zdroj|${esc(g.k)}" value="${esc(g.name)}" aria-label="Kto"><div class="meta">${g.sup.reduce((t,d)=>t+zbNum(d.ks),0)+g.loose.reduce((t,a)=>t+zbNum(a.r.ks||1),0)} ks</div><button type="button" class="lnk" data-zbdmore="${esc(g.name)}">+ ďalšia položka</button></td><td>${g.sup.map(supRow).join("")}${looseRow(g)}</td></tr>`).join("")}</table></div>`:`<div class="empty">Zatiaľ žiadne dodávky. Zapíšte, kto čo dal, a potom to pridelte k dielam.</div>`}`;
}
function zbSummary(L){
  const tech={},ul=[],days={};let tW=0,tM=0;
  L.forEach(x=>{
    (x.technika||[]).forEach(r=>{if(!r.nazov)return;const k=zbKey(r.nazov);const t=tech[k]||(tech[k]={k,n:r.nazov.trim(),ks:0,rows:0,okRows:0,w:0,m:0,d:new Set()});
      const ks=zbNum(r.ks||1);t.ks+=ks;t.rows++;if(r.ok)t.okRows++;t.w+=ks*zbNum(r.w);t.m+=ks*zbNum(r.m);tW+=ks*zbNum(r.w);tM+=ks*zbNum(r.m);t.d.add(x.ord);});
    (x.personal||[]).forEach(r=>{if(!(r.rola||zbWho(r)))return;if(r.den)(days[r.den]||(days[r.den]=[])).push({c:x.ord,...r});});
    (x.ulohy||[]).forEach((r,i)=>{if(r.text)ul.push({c:x.ord,id:x.id,i,t:r.text,done:!!r.hotovo});});
  });
  const T=zbOrd("tech",Object.values(tech),t=>t.k),U=zbOrd("ulohy",ul,u=>u.id+"|"+zbKey(u.t)),dk=Object.keys(days).sort();
  const open=U.filter(u=>!u.done).length;
  const box=(k,title,count,body)=>`<details class="panel zb-sum" data-zbsum="${k}" ${S.zb.sums[k]?"open":""}><summary><span>${title}${count?` <span class="meta">${count}</span>`:""}</span></summary><div class="zb-sbody">${body}</div></details>`;
  const np=Object.keys(S.zbP||{}).length;
  const tRow=(t,n)=>{const all=t.okRows===t.rows,some=t.okRows>0&&!all;
    return`<tr class="${all?"ok":""}" data-zbsrow="${n}" data-key="${esc(t.k)}"><td><span class="zb-lead">${zbHandle("tech",n)}<input type="checkbox" data-zbsok="tech|${esc(t.k)}" ${all?"checked":""} ${some?'data-ind="1"':""} aria-label="Máme"></span></td><td><input class="zb-sname" id="zb-sn-tech-${n}" data-zbsname="tech|${esc(t.k)}" value="${esc(t.n)}" aria-label="Názov položky">${some?`<span class="meta">máme pri ${t.okRows} z ${t.rows} diel</span>`:""}</td><td class="n">${t.ks}</td><td>${[...t.d].join(", ")}</td></tr>`;};
  return box("tech","Súhrn techniky, káblov a príslušenstva",T.length,`${T.length?`<div class="tw"><table class="zb-t"><tr><th style="width:46px"></th><th>Položka</th><th class="n">Ks</th><th>Diela</th></tr>${T.map(tRow).join("")}</table></div>`:`<div class="empty">Zatiaľ nič.</div>`}`)
   +box("zdroj","Kto čo požičal / dodal",new Set([...S.d.zabd.map(d=>zbKey(d.kto)),...L.flatMap(x=>(x.technika||[]).filter(r=>r.nazov&&!r.supplyId&&zbLent(r)).map(r=>zbKey(r.zdroj)))].filter(Boolean)).size,zbSumSources())
   +box("ludia","Súhrn ľudí",np,`${zbSumPeople()}<h3 style="margin-top:16px">Rozpis po dňoch</h3>${dk.length?dk.map(d=>`<h4>${zbDay(d)}</h4><div class="tw"><table class="zb-t">${days[d].sort((a,b)=>(a.od||"").localeCompare(b.od||"")).map(t=>`<tr><td class="n" style="width:110px">${esc(t.od||"?")}–${esc(t.do||"?")}</td><td style="width:200px">${esc(zbWho(t))||'<span class="miss">doplniť</span>'}</td><td>${esc(zbRola(t))}</td><td class="n" style="width:60px">${esc(t.c)}</td></tr>`).join("")}</table></div>`).join(""):`<div class="empty">Keď ľuďom nastavíte dni a časy, zobrazí sa tu rozpis po dňoch.</div>`}`)
   +box("ulohy","Súhrn úloh",open,`${U.length?`<div class="tw"><table class="zb-t">${U.map((u,n)=>`<tr class="${u.done?"done":""}" data-zbsrow="${n}" data-key="${esc(u.id+"|"+zbKey(u.t))}"><td style="width:46px"><span class="zb-lead">${zbHandle("ulohy",n)}<input type="checkbox" data-zbsok="ul|${esc(u.id)}|${u.i}" ${u.done?"checked":""} aria-label="Hotovo"></span></td><td class="n" style="width:36px"><a href="#zb-${esc(u.id)}" data-zbjump="${esc(u.id)}">${esc(u.c)}</a></td><td><input class="zb-sname" id="zb-sn-ul-${n}" data-zbsname="ul|${esc(u.id)}|${u.i}" value="${esc(u.t)}" aria-label="Úloha"></td></tr>`).join("")}</table></div>`:`<div class="empty">Žiadne úlohy.</div>`}`);
}
function zbPeopleView(){
  const P=Object.values(S.zbP||{}).sort((a,b)=>a.name.localeCompare(b.name,"sk"));
  const free=[];zbList().forEach(x=>(x.personal||[]).forEach((r,i)=>{if(!zbKey(zbWho(r))&&(r.rola||r.den))free.push({x,r,i});}));
  free.sort((a,b)=>(a.r.den||"9").localeCompare(b.r.den||"9")||(a.r.od||"").localeCompare(b.r.od||"")||(+a.x.ord||0)-(+b.x.ord||0));
  const row=a=>`<tr><td style="width:150px;white-space:nowrap">${a.r.den?esc(zbShort(a.r)):'<span class="miss">bez času</span>'}</td><td><a href="#zb-${esc(a.x.id)}" data-zbjump="${esc(a.x.id)}">${zbWhere(a)}</a></td><td>${esc(zbRola(a.r))}</td><td>${a.r.ok?"✓ potvrdené":""}</td></tr>`;
  return`${free.length?`<div class="panel" style="margin-bottom:18px"><h2 style="margin:0 0 8px">Neobsadené miesta <span class="meta">${free.length}</span></h2><div class="tw"><table class="zb-t"><tr><th>Kedy</th><th>Kde</th><th>Rola</th><th>Kto</th></tr>${free.map(a=>`<tr><td style="width:150px;white-space:nowrap">${a.r.den?esc(zbShort(a.r)):'<span class="miss">bez času</span>'}</td><td><a href="#zb-${esc(a.x.id)}" data-zbjump="${esc(a.x.id)}">${zbWhere(a)}</a></td><td>${esc(zbRola(a.r))}</td><td style="min-width:160px">${zbWhoSelect(esc(a.x.id),a.i,a.r,"zb-assign","zb-"+esc(a.x.id)+"-p"+a.i+"-k")}</td></tr>`).join("")}</table></div></div>`:""}
  ${P.length?`<div class="zb-people">${P.map(p=>`<div class="panel zb-person"><div class="spread"><h3>${esc(p.name)}</h3><span class="meta">${p.items.length} ${p.items.length===1?"miesto":p.items.length<5?"miesta":"miest"}</span></div><div class="tw"><table class="zb-t">${p.items.map(row).join("")}</table></div></div>`).join("")}</div>`
   :`<div class="panel"><div class="empty">Zatiaľ nikto nemá pridelené miesto. Ľudí pridáte pri dielach v časti Ľudia.</div></div>`}`;
}
/* one-time cleanup: watts and lengths used to have their own fields – move them into the item name */
/* items entered at a work with a Zdroj become deliveries automatically, so they show like deliveries entered in the summary.
   Same supplier + same item = one delivery; its id is derived from the names so two people syncing at once write the same record. */
function zbSupId(kto,naz){let h=2166136261;const t=zbKey(kto)+"|"+zbKey(naz);for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return"a_"+(h>>>0).toString(36)+"_"+t.length;}
const ZB_TYP=[["","druh…"],["nase","naše"],["pozicane","požičané"],["darovane","darované"],["kupene","kúpené"],["objednane","objednané"]];
/* kind of a row; older rows had it written in the Zdroj field ("kúpené", "požičať z …") or none at all */
const zbTypGuess=r=>{const z=String(r.zdroj||"");if(/k[uú]p/i.test(z))return"kupene";if(/objedn/i.test(z))return"objednane";if(/po[zž]i[cč]/i.test(z)||/daro/i.test(z))return/daro/i.test(z)?"darovane":"pozicane";if(r.supplyId||zbKey(z))return"pozicane";return"";};
const zbTyp=r=>r.typ!==undefined?r.typ:zbTypGuess(r);
const zbLent=r=>{const t=zbTyp(r);return t==="pozicane"||t==="darovane";};
function zbSyncSupplies(){
  if(S.readOnly||S.loading||!db||S.zb.syncing)return;
  const byId=new Map(S.d.zabd.map(d=>[d.id,d])),byKey=new Map();
  S.d.zabd.forEach(d=>{const k=zbKey(d.kto)+"|"+zbKey(d.nazov);if(!byKey.has(k))byKey.set(k,d);});
  const want=r=>!!(r.nazov&&zbKey(r.zdroj)&&zbLent(r));
  const match=r=>{if(!want(r))return null;const d=r.supplyId&&byId.get(r.supplyId);
    if(d&&zbKey(d.kto)===zbKey(r.zdroj)&&zbKey(d.nazov)===zbKey(r.nazov))return null;   // correctly linked
    const k=zbKey(r.zdroj)+"|"+zbKey(r.nazov),ex=byKey.get(k);return{k,id:ex?ex.id:zbSupId(r.zdroj,r.nazov),ex};};
  const plan={},works=new Set(),used=new Set();
  S.d.zab.forEach(x=>(x.technika||[]).forEach(r=>{
    if(r.typ===undefined)works.add(x.id);                                   // store the kind once
    const m=match(r);
    if(m){works.add(x.id);used.add(m.id);const p=plan[m.id]||(plan[m.id]={m,kto:String(r.zdroj).trim(),nazov:String(r.nazov).trim(),ks:0,ok:true,typ:zbTyp(r)});p.ks+=zbNum(r.ks||1);if(!r.ok)p.ok=false;}
    else if(r.supplyId&&(!want(r)||!byId.has(r.supplyId)))works.add(x.id); // unlink
    else if(r.supplyId)used.add(r.supplyId);}));
  const orphans=S.d.zabd.filter(d=>String(d.id).startsWith("a_")&&!used.has(d.id));
  if(!works.size&&!orphans.length)return;
  S.zb.syncing=true;
  (async()=>{try{
    for(const id in plan){const p=plan[id];
      if(p.m.ex){const u=S.d.zab.reduce((t,x)=>t+(x.technika||[]).filter(r=>r.supplyId===id&&want(r)).reduce((v,r)=>v+zbNum(r.ks||1),0),0)+p.ks;
        if(u>zbNum(p.m.ex.ks))await upd("zabd",id,{ks:String(u)});}
      else await write(async()=>{const t=Date.now();await db.collection(ENT.zabd.col).doc(id).set(Object.assign({kto:p.kto,nazov:p.nazov,ks:String(p.ks),typ:p.typ,ok:p.ok,createdAt:t,updatedAt:t},meId()?{createdBy:meId(),updatedBy:meId()}:{}));});
    }
    for(const wid of works)await zbSave(wid,y=>{let ch=false;const a=(y.technika||[]).map(r=>{let c=r;
      if(r.typ===undefined){const t=zbTypGuess(r);c=Object.assign({},c,{typ:t});if(/^(k[uú]p(en[eé]|i[tť])|objedn(an[eé]|a[tť]))$/i.test(String(r.zdroj||"").trim()))c.zdroj="";ch=true;}
      const m=match(c);
      if(m){ch=true;return Object.assign({},c,{supplyId:m.id});}
      if(c.supplyId&&(!want(c)||(!byId.has(c.supplyId)&&!plan[c.supplyId]))){ch=true;c=Object.assign({},c);delete c.supplyId;}
      return c;});return ch?{technika:a}:null;});
    for(const d of orphans)await del("zabd",d.id);
  }finally{S.zb.syncing=false;}})();
}
/* older people rows had a typed role and name – turn them into a contact role and, where the name exists in Contacts, a contact link */
function zbMigratePeople(){
  if(S.readOnly||S.loading||!db||S.zb.migP)return;
  const byName=new Map();S.d.contacts.forEach(c=>{const k=zbKey(c.name);if(k&&!byName.has(k))byName.set(k,c);});
  const fix=r=>{let c=null;
    if(r.rola&&!zbIsRole(r.rola)){const old=String(r.rola).trim(),ko=zbKey(old),role=/dobrovol/.test(ko)?"dobrovolnik":/^(clen )?timu?$/.test(ko)?"tim":"";c=Object.assign({},r,{rola:role});
      if(!(role&&/^(dobrovolnik|clen timu|tim)$/.test(ko)))c.kedy=r.kedy?`${old} · ${r.kedy}`:old;}
    const b=c||r;
    if(!b.contactId&&b.kto){const k=zbKey(b.kto);
      if(/^dobrovolnik$/.test(k)){c=Object.assign({},b,{kto:""});if(!c.rola)c.rola="dobrovolnik";}
      else{const ct=byName.get(k);if(ct){c=Object.assign({},b,{contactId:ct.id,kto:ct.name||b.kto});if(!c.rola&&zbIsRole(ct.role))c.rola=ct.role;}}}
    return c;};
  const ids=S.d.zab.filter(x=>(x.personal||[]).some(r=>fix(r))).map(x=>x.id);
  if(!ids.length)return;
  S.zb.migP=true;
  (async()=>{try{for(const id of ids)await zbSave(id,y=>{let ch=false;const a=(y.personal||[]).map(r=>{const c=fix(r);if(c){ch=true;return c;}return r;});return ch?{personal:a}:null;});}
    finally{S.zb.migP=false;}})();
}
function zbMoveUnits(){
  if(S.readOnly||S.loading||!db)return;
  const has=(name,v,u)=>new RegExp("(^|\\D)"+String(v).replace(".","[.,]")+"\\s*"+u+"(\\b|$)","i").test(name||"");
  const fix=r=>{let n=String(r.nazov||"").trim();const w=String(r.w??"").trim(),m=String(r.m??"").trim();
    if(w&&!has(n,w,"W"))n+=` ${w} W`;if(m&&!has(n,m,"m"))n+=` ${m} m`;return Object.assign({},r,{nazov:n.trim(),w:"",m:""});};
  S.d.zab.forEach(x=>{if((x.technika||[]).some(r=>String(r.w??"").trim()||String(r.m??"").trim()))
    zbSave(x.id,y=>{if(!(y.technika||[]).some(r=>String(r.w??"").trim()||String(r.m??"").trim()))return null;return{technika:(y.technika||[]).map(r=>(String(r.w??"").trim()||String(r.m??"").trim())?fix(r):r)};});});
}
const isNox=e=>!!e&&/nox/i.test(e.name||"");
const noxEvent=()=>S.d.events.find(isNox);
function zbOpenEvent(){const e=noxEvent();if(e){S.evtab="zabezpecenie";go("podujatie",e.id);}else{go("podujatia");toast("Podujatie NOX:art sa nenašlo.");}}
VIEWS.zabezpecenie=()=>{const e=noxEvent();if(e){S.evtab="zabezpecenie";S.view="podujatie";S.id=e.id;return VIEWS.podujatie();}return`<div class="empty">Podujatie NOX:art sa nenašlo.<br><button class="btn" data-go="podujatia">Späť na podujatia</button></div>`;};
function zbPanel(){
  if(!S.zb.unitsMoved&&!S.loading&&S.d.zab.length){S.zb.unitsMoved=true;setTimeout(zbMoveUnits,0);}
  if(!S.loading&&S.d.zab.length){setTimeout(zbSyncSupplies,0);setTimeout(zbMigratePeople,0);}
  S.zbP=zbPeople();
  const all=zbList(),n=all.length;
  const ok=all.filter(x=>x.stav==="potvrdene").length,w=all.filter(x=>x.stav==="rozpracovane").length;
  const f=S.zb.f;
  const L=all.filter(x=>f==="all"||(f==="ulohy"?(x.ulohy||[]).some(u=>u.text&&!u.hotovo):(x.stav||"navrh")===f));
  const fb=(k,l)=>`<button data-zbf="${k}" aria-pressed="${f===k}">${l}</button>`;
  return`<div class="zb-top"><div class="head" style="margin:0"><div><h2>Zabezpečenie</h2><p class="sub">Technický plán po dielach – napájanie, technika, ľudia a úlohy</p></div></div>
    ${n?`<div class="zb-prog"><div class="lbl"><span>${ok} potvrdených · ${w} rozpracovaných</span><span>z ${n}</span></div><div class="zb-bar"><i style="width:${pct(ok,n)}%;background:var(--good)"></i><i style="width:${pct(w,n)}%;background:var(--ochre)"></i></div></div>`:""}</div>
  ${n?`${zbLists()}<div class="tools"><div class="tabs"><button data-zbmode="diela" aria-pressed="${S.zb.mode!=="ludia"}">Po dielach</button><button data-zbmode="ludia" aria-pressed="${S.zb.mode==="ludia"}">Podľa ľudí</button></div>
    ${S.zb.mode!=="ludia"?`<div class="tabs">${fb("all","Všetky")}${fb("navrh","Neriešené")}${fb("rozpracovane","Rozpracované")}${fb("potvrdene","Potvrdené")}${fb("ulohy","S otvorenými úlohami")}</div><span style="flex:1"></span><button class="btn" data-zbnew>+ Pridať dielo</button>`:""}</div>
  ${S.zb.mode==="ludia"?zbPeopleView():`${zbSummary(all)}
  <div class="zb-list">${L.length?L.map(zbCard).join(""):`<div class="empty">V tomto filtri nie sú žiadne diela.</div>`}</div>`}`
  :`<div class="panel"><div class="empty">Zatiaľ tu nie je žiadne dielo. Plán NOX:art nahrajte v administrácii WordPressu (Ars Preuge → Import dát), alebo začnite prázdnym dielom.<div style="margin-top:8px"><button class="btn pri" data-zbnew>+ Pridať dielo</button></div></div></div>`}`;
};
/* drag a row by its handle (mouse, touch) or move it with arrow keys; sel = attribute prefix shared by the handles of one list */
function zbDrag(h,from,sel,moveTo){
  h.onkeydown=e=>{if(e.key!=="ArrowUp"&&e.key!=="ArrowDown")return;e.preventDefault();const d=e.key==="ArrowUp"?from-1:from+1;if(d<0)return;moveTo(d);
    setTimeout(()=>{const nh=document.querySelector(`${sel}${d}"]`);if(nh)nh.focus();},80);};
  h.onpointerdown=e=>{
    if(e.button>0)return;e.preventDefault();
    const row=h.closest("[data-zbrow],[data-zbsrow]"),box=row.parentElement,rows=[...box.children].filter(r=>r.dataset&&(r.dataset.zbrow!==undefined||r.dataset.zbsrow!==undefined));
    const main=$("#main");let to=from,moved=false,sy=e.clientY,timer=null,lastY=e.clientY;
    try{h.setPointerCapture(e.pointerId);}catch(_){}
    const clear=()=>rows.forEach(r=>r.classList.remove("dropa","dropb"));
    const place=y=>{clear();let t=rows.length;for(let j=0;j<rows.length;j++){const b=rows[j].getBoundingClientRect();if(y<b.top+b.height/2){t=j;break;}}
      to=t;if(t<rows.length)rows[t].classList.add("dropb");else rows[rows.length-1].classList.add("dropa");};
    const scroll=()=>{if(!main)return;const r=main.getBoundingClientRect();const d=lastY<r.top+70?-14:lastY>r.bottom-70?14:0;if(d){main.scrollTop+=d;place(lastY);}};
    const move=ev=>{lastY=ev.clientY;if(!moved){if(Math.abs(ev.clientY-sy)<4)return;moved=true;row.classList.add("dragging");document.body.classList.add("zb-dragging");timer=setInterval(scroll,30);}place(ev.clientY);};
    const end=()=>{h.removeEventListener("pointermove",move);h.removeEventListener("pointerup",end);h.removeEventListener("pointercancel",end);clearInterval(timer);
      clear();row.classList.remove("dragging");document.body.classList.remove("zb-dragging");if(!moved)return;const d=to>from?to-1:to;if(d!==from)moveTo(d);};
    h.addEventListener("pointermove",move);h.addEventListener("pointerup",end);h.addEventListener("pointercancel",end);
  };
}
function zbBind(v){
  if(!(S.view==="podujatie"&&S.evtab==="zabezpecenie"&&isNox(get("events",S.id))))return;
  v.querySelectorAll("[data-zbsum]").forEach(d=>d.addEventListener("toggle",()=>{S.zb.sums[d.dataset.zbsum]=d.open;}));
  v.querySelectorAll("[data-zbf]").forEach(b=>b.onclick=()=>{S.zb.f=b.dataset.zbf;render();});
  v.querySelectorAll("[data-zbmode]").forEach(b=>b.onclick=()=>{S.zb.mode=b.dataset.zbmode;render();});
  v.querySelectorAll("[data-zbjump]").forEach(a=>a.onclick=e=>{e.preventDefault();S.zb.f="all";S.zb.mode="diela";render();const el=document.getElementById("zb-"+a.dataset.zbjump);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});});
  v.querySelectorAll("[data-zb]").forEach(el=>{
    const commit=()=>{
      const[id,k,i,fld]=el.dataset.zb.split("|");
      const val=el.type==="checkbox"?el.checked:el.value;
      zbSave(id,x=>{
        if(i===undefined)return(x[k]??"")===val?null:{[k]:val};
        const arr=(x[k]||[]).map(r=>Object.assign({},r));if(!arr[+i]||arr[+i][fld]===val)return null;
        arr[+i][fld]=val;
        if(k==="technika"){const r=arr[+i];   /* prepojenie s Inventárom: vec z nášho zoznamu = „naše“; doplnené „od koho“ = „požičané“ */
          if(fld==="nazov"&&!r.typ&&!zbKey(r.zdroj)&&invTechByName(val))r.typ="nase";
          if(fld==="zdroj"&&zbKey(val)&&!r.typ)r.typ="pozicane";
          if(r.typ==="nase")setTimeout(()=>invTechWarn(r.nazov),600);}
        return{[k]:arr};});
    };
    if(el.type==="checkbox"||el.tagName==="SELECT")el.onchange=commit;
    else{el.onchange=commit;el.onblur=commit;el.onkeydown=e=>{if(e.key==="Enter"&&el.tagName!=="TEXTAREA")el.blur();};}
  });
  v.querySelectorAll("[data-zbadd]").forEach(b=>b.onclick=()=>{
    const[id,k]=b.dataset.zbadd.split("|");let n=0;
    const row=k==="technika"?{nazov:"",ks:"",typ:"",zdroj:"",ok:false}:k==="personal"?{rola:"",kto:"",den:"2026-10-30",od:"17:00",do:"22:00",kedy:"",ok:false}:{text:"",hotovo:false};
    zbSave(id,x=>{const arr=[...(x[k]||[]),row];n=arr.length-1;const p={[k]:arr};if((x.stav||"navrh")==="navrh")p.stav="rozpracovane";return p;})
      .then(()=>{const pf={technika:"t",personal:"p",ulohy:"u"}[k],sf={technika:"n",personal:"r",ulohy:"t"}[k];const el=document.getElementById(`zb-${id}-${pf}${n}-${sf}`);if(el)el.focus();});
  });
  v.querySelectorAll("[data-zbdel]").forEach(b=>b.onclick=()=>{
    const[id,k,i]=b.dataset.zbdel.split("|");
    zbSave(id,x=>({[k]:(x[k]||[]).filter((_,j)=>j!==+i)}));
  });
  v.querySelectorAll("[data-zbdrag]").forEach(h=>{
    const[id,k,fi]=h.dataset.zbdrag.split("|");const from=+fi;
    zbDrag(h,from,`[data-zbdrag="${id}|${k}|`,dest=>{Object.keys(S.zb.open).forEach(q=>{if(q.startsWith(id+"-"))delete S.zb.open[q];});
      zbSave(id,x=>{const a=[...(x[k]||[])];if(dest>=a.length)dest=a.length-1;if(dest===from)return null;const[m]=a.splice(from,1);a.splice(dest,0,m);return{[k]:a};});});
  });
  v.querySelectorAll("[data-zbsdrag]").forEach(h=>{
    const[kind,fi]=h.dataset.zbsdrag.split("|");const from=+fi;
    zbDrag(h,from,`[data-zbsdrag="${kind}|`,dest=>{
      const keys=[...h.closest("table").querySelectorAll("tr[data-zbsrow]")].map(r=>r.dataset.key);
      if(dest>=keys.length)dest=keys.length-1;if(dest===from)return;const[m]=keys.splice(from,1);keys.splice(dest,0,m);
      saveSettings({zbOrder:Object.assign({},S.settings.zbOrder||{},{[kind]:keys})});});
  });
  v.querySelectorAll("[data-zbsname]").forEach(el=>{
    const commit=()=>{
      const p=el.dataset.zbsname.split("|"),nv=el.value.trim().replace(/\s+/g," ");
      if(p[0]==="dnaz"||p[0]==="dks"){const d=get("zabd",p[1]);if(!d)return;const fld=p[0]==="dnaz"?"nazov":"ks";if(fld==="nazov"&&!nv){el.value=el.defaultValue;return;}if(String(d[fld]??"")===nv)return;
        upd("zabd",d.id,{[fld]:nv});
        if(fld==="nazov")S.d.zab.forEach(x=>{if((x.technika||[]).some(r=>r.supplyId===d.id&&r.nazov!==nv))zbSave(x.id,y=>({technika:(y.technika||[]).map(r=>r.supplyId===d.id?Object.assign({},r,{nazov:nv}):r)}));});
        return;}
      if(p[0]==="ul"){zbSave(p[1],y=>{const a=(y.ulohy||[]).map(r=>Object.assign({},r));const r=a[+p[2]];if(!r||!nv||r.text===nv)return null;r.text=nv;return{ulohy:a};});return;}
      const oldK=p[1],newK=zbKey(nv),arr=p[0]==="ludia"?"personal":"technika",fld={tech:"nazov",zdroj:"zdroj",ludia:"kto"}[p[0]],kind=p[0];
      if(!nv){el.value=el.defaultValue;return;}
      if(el.value!==el.defaultValue||newK!==oldK){
        const exists=newK!==oldK&&(S.d.zab.some(x=>(x[arr]||[]).some(r=>zbKey(r[fld])===newK))||(kind==="zdroj"&&S.d.zabd.some(d=>zbKey(d.kto)===newK)));
        const hit=r=>{const k=zbKey(r[fld]);return k===oldK||k===newK;};
        S.d.zab.forEach(x=>{if((x[arr]||[]).some(r=>hit(r)&&r[fld]!==nv))
          zbSave(x.id,y=>({[arr]:(y[arr]||[]).map(r=>hit(r)?Object.assign({},r,{[fld]:nv}):r)}));});
        if(kind==="ludia"){const ids=new Set();S.d.zab.forEach(x=>(x.personal||[]).forEach(r=>{const c=r.contactId&&get("contacts",r.contactId);if(c&&zbKey(c.name)===oldK)ids.add(c.id);}));ids.forEach(cid=>upd("contacts",cid,{name:nv}));}
        if(kind==="zdroj")S.d.zabd.forEach(d=>{const k=zbKey(d.kto);if((k===oldK||k===newK)&&d.kto!==nv)upd("zabd",d.id,{kto:nv});});
        const o=((S.settings.zbOrder||{})[kind])||[];
        if(newK!==oldK&&o.includes(oldK))saveSettings({zbOrder:Object.assign({},S.settings.zbOrder,{[kind]:exists?o.filter(k=>k!==oldK):o.map(k=>k===oldK?newK:k)})});
        if(exists)toast(`Zlúčené s „${nv}“.`);
      }
    };
    el.onchange=commit;el.onkeydown=e=>{if(e.key==="Enter")el.blur();if(e.key==="Escape"){el.value=el.defaultValue;el.blur();}};
  });
  v.querySelectorAll("[data-zbsok]").forEach(c=>{
    if(c.dataset.ind)c.indeterminate=true;
    c.onchange=()=>{const val=c.checked,p=c.dataset.zbsok.split("|");
      if(p[0]==="tech"){S.d.zab.forEach(x=>{if((x.technika||[]).some(r=>zbKey(r.nazov)===p[1]&&!!r.ok!==val))
        zbSave(x.id,y=>({technika:(y.technika||[]).map(r=>zbKey(r.nazov)===p[1]?Object.assign({},r,{ok:val}):r)}));});}
      else if(p[0]==="sup"){upd("zabd",p[1],{ok:val});S.d.zab.forEach(x=>{if((x.technika||[]).some(r=>r.supplyId===p[1]&&!!r.ok!==val))
        zbSave(x.id,y=>({technika:(y.technika||[]).map(r=>r.supplyId===p[1]?Object.assign({},r,{ok:val}):r)}));});}
      else if(p[0]==="src"){const m=r=>zbKey(r.zdroj)===p[1]&&zbKey(r.nazov)===p[2];S.d.zab.forEach(x=>{if((x.technika||[]).some(r=>r.nazov&&m(r)&&!!r.ok!==val))
        zbSave(x.id,y=>({technika:(y.technika||[]).map(r=>r.nazov&&m(r)?Object.assign({},r,{ok:val}):r)}));});}
      else{const fld=p[0]==="ul"?["ulohy","hotovo"]:["personal","ok"];
        zbSave(p[1],y=>{const a=(y[fld[0]]||[]).map(r=>Object.assign({},r));if(!a[+p[2]])return null;a[+p[2]][fld[1]]=val;return{[fld[0]]:a};});}
    };
  });
  const nsAdd=async()=>{const kto=($("#zb-ns-kto").value||"").trim(),naz=($("#zb-ns-naz").value||"").trim(),ks=($("#zb-ns-ks").value||"").trim();
    if(!kto||!naz){toast("Vyplňte, kto to dal a čo.");return;}
    const typ=($("#zb-ns-typ")||{}).value||"pozicane";const id=await add("zabd",{kto,nazov:naz,ks,typ,ok:false});if(id){S.zb.ns={kto,naz:"",ks:"",typ};S.zb.sums.zdroj=true;render();const n=$("#zb-ns-naz");if(n)n.focus();}};
  v.querySelectorAll("[data-zbdnew]").forEach(b=>b.onclick=nsAdd);
  [["#zb-ns-kto","kto"],["#zb-ns-naz","naz"],["#zb-ns-ks","ks"],["#zb-ns-typ","typ"]].forEach(([q,f])=>{const el=v.querySelector(q);if(!el)return;el.oninput=el.onchange=()=>{S.zb.ns[f]=el.value;};el.onkeydown=e=>{if(e.key==="Enter")nsAdd();};});
  v.querySelectorAll("[data-zbdmore]").forEach(b=>b.onclick=()=>{const k=$("#zb-ns-kto");if(!k)return;k.value=S.zb.ns.kto=b.dataset.zbdmore;k.scrollIntoView({block:"center"});$("#zb-ns-naz").focus();});
  v.querySelectorAll("[data-zbdopen]").forEach(b=>b.onclick=()=>{const id=b.dataset.zbdopen;S.zb.give[id]=!S.zb.give[id];render();const sel=document.getElementById("zb-dw-"+id);if(sel)sel.focus();});
  v.querySelectorAll("[data-zbdgive]").forEach(b=>b.onclick=()=>{const d=get("zabd",b.dataset.zbdgive);if(!d)return;
    const w=$("#zb-dw-"+d.id).value,q=($("#zb-dq-"+d.id).value||"").trim()||"1";if(!w){toast("Vyberte dielo.");return;}
    const x=get("zab",w);zbSave(w,y=>{const p={technika:[...(y.technika||[]),{nazov:d.nazov||"",ks:q,typ:d.typ||"pozicane",zdroj:d.kto||"",ok:!!d.ok,supplyId:d.id}]};if((y.stav||"navrh")==="navrh")p.stav="rozpracovane";return p;});
    const used=S.d.zab.reduce((t,y)=>t+(y.technika||[]).filter(r=>r.supplyId===d.id).reduce((u,r)=>u+zbNum(r.ks||1),0),0)+zbNum(q);
    if(zbNum(d.ks)&&used>=zbNum(d.ks))delete S.zb.give[d.id];
    toast(`Pridelené k dielu č. ${x?x.ord:""}.`);});
  v.querySelectorAll("[data-zbdun]").forEach(b=>b.onclick=()=>{const[w,i]=b.dataset.zbdun.split("|");zbSave(w,y=>({technika:(y.technika||[]).filter((_,j)=>j!==+i)}));});
  v.querySelectorAll("[data-zbddel]").forEach(b=>b.onclick=()=>{const d=get("zabd",b.dataset.zbddel);if(!d)return;
    const n=S.d.zab.reduce((t,x)=>t+(x.technika||[]).filter(r=>r.supplyId===d.id).length,0);
    ask(`Odstrániť dodávku „${d.nazov||""}“ od ${d.kto||"—"}?${n?` Zruší sa aj pridelenie k ${n} ${n===1?"dielu":"dielam"}.`:""}`,"Odstrániť").then(ok=>{if(!ok)return;
      S.d.zab.forEach(x=>{if((x.technika||[]).some(r=>r.supplyId===d.id))zbSave(x.id,y=>({technika:(y.technika||[]).filter(r=>r.supplyId!==d.id)}));});del("zabd",d.id);});});
  v.querySelectorAll("[data-zbdadopt]").forEach(b=>b.onclick=async()=>{const[w,i]=b.dataset.zbdadopt.split("|");const x=get("zab",w),r=x&&(x.technika||[])[+i];if(!r)return;
    const id=await add("zabd",{kto:String(r.zdroj||"").trim(),nazov:r.nazov,ks:r.ks||"1",ok:!!r.ok});
    if(id)zbSave(w,y=>{const a=(y.technika||[]).map(z=>Object.assign({},z));if(!a[+i])return null;a[+i].supplyId=id;return{technika:a};});});
  v.querySelectorAll("[data-zbk]").forEach(sel=>sel.onchange=async()=>{
    const[id,i]=sel.dataset.zbk.split("|"),val=sel.value,x=get("zab",id),r=x&&(x.personal||[])[+i];if(!r)return;
    const set=patch=>zbSave(id,y=>{const a=(y.personal||[]).map(z=>Object.assign({},z));if(!a[+i])return null;Object.assign(a[+i],patch);if(!patch.contactId)delete a[+i].contactId;return{personal:a};});
    if(val==="new"){const role=zbIsRole(r.rola)?r.rola:"dobrovolnik";const cid=await add("contacts",{name:"",ctype:"osoba",role});
      if(cid){await set({contactId:cid,kto:""});openDrawer("contacts",cid,true);}else render();return;}
    if(val==="t")return;
    if(val.startsWith("c:")){const c=get("contacts",val.slice(2));set({contactId:val.slice(2),kto:c?c.name||"":""});return;}
    set({kto:""});
  });
  v.querySelectorAll("[data-zbwhen]").forEach(b=>b.onclick=()=>{const key=b.dataset.zbwhen.replace("|","-");S.zb.open[key]=!S.zb.open[key];render();
    if(S.zb.open[key]){const[id,i]=b.dataset.zbwhen.split("|");const el=document.getElementById(`zb-${id}-p${i}-d`);if(el)el.focus();}});
  v.querySelectorAll("[data-zbrm]").forEach(b=>b.onclick=()=>{const x=get("zab",b.dataset.zbrm);ask(`Odstrániť dielo „${(x&&x.title)||"bez názvu"}“ aj s celým plánom?`,"Odstrániť").then(ok=>{if(ok)del("zab",b.dataset.zbrm);});});
  v.querySelectorAll("[data-zbnew]").forEach(b=>b.onclick=async()=>{
    const ord=Math.max(0,...S.d.zab.map(x=>+x.ord||0))+1;S.zb.f="all";
    const id=await add("zab",{ord,title:"",author:"",stav:"navrh",napajanie:"",technika:[],personal:[],ulohy:[],poznamka:""});
    if(id)setTimeout(()=>{const el=document.getElementById(`zb-${id}-title`);if(el){el.scrollIntoView({block:"center"});el.focus();}},50);
  });
}

