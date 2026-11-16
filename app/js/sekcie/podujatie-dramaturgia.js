/* ===== Podujatie – záložka Dramaturgia (od 2.0.68 vyzerá ako Podklady): vľavo hore tri ikony (Koncept · Diela · Sprievodný program),
   pod nimi zoznam (diela po kategóriách, program po dňoch), vpravo vybraný prvok – všetko na stránke, bez bočného panela.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-dramaturgia.js. Nie je to samostatný skript.
   Dáta sa nemenia: koncept je pole dramaturgy podujatia, diela a sprievodný program sú záznamy programItems (ENT.prog, kind dielo / sprievodny).
   Polia vybraného prvku kreslí fInput a ukladá bindPart – tie isté ako v bočnom paneli. ===== */
const DR_SEC=[["koncept","Koncept"],["dielo","Diela"],["sprievodny","Sprievodný program"]];
const DR_IC={koncept:'<path d="M4 7h16M4 12h10M4 17h16"/>',dielo:'<path d="m12 3.5 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.5l-5.2 2.9L8 13.6l-4.4-4 5.9-.7z"/>',sprievodny:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
const DR_DAY=[["piatok","Piatok"],["sobota","Sobota"],["oba","Piatok aj sobota"]];
const drEd=()=>accEdit("prog")&&!S.readOnly;
const drUi=eid=>{S._dr=S._dr||{};return S._dr[eid]=S._dr[eid]||{sec:"",sel:{}};};
const drKind=x=>x.kind==="sprievodny"?"sprievodny":"dielo";
const drItems=e=>S.d.prog.filter(x=>x.eventId===e.id).sort((a,b)=>(+a.ord||0)-(+b.ord||0)||(a.createdAt||0)-(b.createdAt||0));
/* skupiny v zozname: diela po kategóriách (v poradí z OPT.psec, potom ostatné), program po dňoch a podľa času */
function drGroups(kind,L){
  if(kind==="sprievodny")return DR_DAY.map(([d,l])=>[l,L.filter(x=>(x.day||"oba")===d).sort((a,b)=>(a.time||"").localeCompare(b.time||""))]).filter(g=>g[1].length);
  const base=OPT.psec.map(o=>o[0]).filter(k=>k!=="Sprievodný program"),cats=[...base,...new Set(L.map(x=>x.section||"").filter(k=>!base.includes(k)))];
  return cats.map(k=>[k||"Bez kategórie",L.filter(x=>(x.section||"")===k)]).filter(g=>g[1].length);
}
function dramaturgiaTab(e){
  const id=esc(e.id),ed=drEd(),ui=drUi(e.id),ALL=drItems(e),svg=(p,w)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const sec=DR_SEC.some(s=>s[0]===ui.sec)?ui.sec:(ALL.length?"dielo":"koncept"),secL=DR_SEC.find(s=>s[0]===sec)[1];
  const seg=`<div class="tabs seg segi pkseg" role="group" aria-label="Časť dramaturgie">${DR_SEC.map(([k,l])=>{const n=k==="koncept"?0:ALL.filter(x=>drKind(x)===k).length;
    return`<button type="button" data-drsec="${id}|${k}" aria-pressed="${k===sec}" title="${l}${n?` (${n})`:""}" aria-label="${l}">${svg(DR_IC[k],20)}</button>`;}).join("")}</div>`;
  if(sec==="koncept")return`<div class="txm"><div class="txlist">${seg}</div><div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dramaturgia / ${esc(e.name||"Podujatie")}</div><div class="txtitle" style="font-size:28px;font-weight:600;margin-top:6px">Koncept</div></div></div>
      <div class="txw"><textarea class="txbody" id="ev-dram" data-keep placeholder="Téma, idea, dramaturgická línia podujatia…">${esc(e.dramaturgy||"")}</textarea></div><div class="txfoot" id="txstat">${txStat(e.dramaturgy)}</div></div></div>`;
  const L=ALL.filter(x=>drKind(x)===sec),G=drGroups(sec,L),flat=G.flatMap(g=>g[1]),it=flat.find(x=>x.id===ui.sel[sec])||flat[0];
  const small=x=>sec==="sprievodny"?[x.time,x.place].filter(Boolean).join(" · "):[x.author,x.place].filter(Boolean).join(" · ");
  const list=G.map(([g,items])=>`<div class="txlh">${esc(g)}<span class="cnt">${items.length}</span></div>`+items.map(x=>`<button type="button" class="txi${it&&x.id===it.id?" on":""}" data-drsel="${id}|${sec}|${esc(x.id)}">${svg(DR_IC[sec],22)}<span class="txt"><b>${esc(x.title||"Bez názvu")}</b><small>${esc(small(x))}</small></span><i class="txdot" style="background:${optC("pst",x.status||"nevybavene")}" title="${esc(optL("pst",x.status||"nevybavene"))}"></i></button>`).join("")).join("");
  const add=ed?`${L.length?`<div class="gdsep"></div>`:""}<button type="button" class="txi txadd" data-dradd="${id}|${sec}">${svg('<path d="M12 5v14M5 12h14"/>',22)}<span class="txt"><b>${sec==="sprievodny"?"Pridať bod programu":"Pridať dielo"}</b></span></button>`:"";
  const main=it?drMain(e,it,sec,secL,ed):`<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ nič. ${ed?"Pridajte prvý prvok vľavo.":""}</div>`;
  return`<div class="txm"><div class="txlist drlist">${seg}${list}${add}</div>${main}</div>`;
}
/* vybrané dielo alebo bod programu v strede stránky: hlavička ako pri Podkladoch (bodka stavu pred názvom, kôš vpravo hore), potom Údaje · Ľudia · potreby · poznámka */
function drMain(e,r,sec,secL,ed){
  const F=k=>ENT.prog.fields.find(f=>f.k===k),st=r.status||"nevybavene";
  const cell=(k,l)=>`<div class="drf"><label for="f-${k}">${esc(l||F(k).l)}</label>${fInput("prog",r,F(k))}</div>`;
  const area=(k,l,ph)=>`<div class="pkb pkout"><div class="pkh">${l}</div><textarea class="pkta" id="f-${k}" rows="2" data-keep data-f="${k}" placeholder="${ph}">${esc(r[k]||"")}</textarea></div>`;
  return`<div class="panel txmain drmain" id="dr-main" data-drmain="${esc(r.id)}" data-cmb="prog:${esc(r.id)}"><div class="txhead pkhead">
      <div class="pkrow1"><div class="kick">${esc(secL)} / ${esc(e.name||"Podujatie")}</div>${ed?`<button type="button" class="tplus tdel" data-drdel="${esc(r.id)}" title="Odstrániť" aria-label="Odstrániť">${TI.del}</button>`:""}</div>
      <div class="pkrow2"><div class="pkt"><label class="gastdot" title="Stav: ${esc(optL("pst",st))}${ed?" – kliknutím zmeníte":""}"><i class="txdot" style="background:${optC("pst",st)};width:12px;height:12px"></i>${ed?`<select data-f="status" aria-label="Stav">${OPT.pst.map(([v,l])=>`<option value="${v}"${v===st?" selected":""}>${l}</option>`).join("")}</select>`:""}</label><input type="text" class="txtitle" id="dr-t" data-keep data-f="title" value="${esc(r.title||"")}" aria-label="Názov" maxlength="140" placeholder="Názov"></div></div></div>
    <div class="pkb"><div class="pkh">Údaje</div><div class="drgrid">${cell("author")}${cell("contactId")}${sec==="sprievodny"?cell("day")+cell("time"):cell("section")}${cell("place")}${sec==="sprievodny"?cell("prepId"):""}${cell("kind")}</div></div>
    ${sec==="sprievodny"?"":`<div class="pkb"><div class="pkh">Ľudia</div><div class="drgrid">${cell("prepId")}${cell("noGuard")}${r.noGuard?"":cell("guardFri")+cell("guardSat")}</div></div>`}
    ${area("needOrg","Organizačne treba","Čo treba zariadiť…")}${area("needMat","Materiál a technika","Čo treba priniesť alebo požičať…")}${area("note","Poznámka","Poznámka…")}</div>`;
}
/* ovládanie po každom vykreslení stránky (volá bindView): polia sa ukladajú rovnako ako v bočnom paneli */
function drBind(v){
  const m=v.querySelector("#dr-main");if(!m)return;const r=get("prog",m.dataset.drmain);if(!r)return;
  bindPart(m,"prog",r);m.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));
}
/* otvorenie prvku odinakiaľ (hľadanie, odkazy): prejde na záložku Dramaturgia jeho podujatia a vyberie ho */
function drOpen(id){const r=get("prog",id),e0=r&&r.eventId&&get("events",r.eventId);if(!e0||e0._stub)return false;closeDrawer();const ui=drUi(e0.id),k=drKind(r);ui.sec=k;ui.sel[k]=id;S.evtab="dramaturgia";
  if(S.view==="podujatie"&&S.id===e0.id)render();else go("podujatie",e0.id);return true;}
document.addEventListener("keydown",ev=>{const t=ev.target;if(t&&t.id==="dr-t"&&ev.key==="Enter")t.blur();});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  if((x=q("[data-drsec]"))){const[eid,k]=x.dataset.drsec.split("|");drUi(eid).sec=k;render();return;}
  if((x=q("[data-drsel]"))){const[eid,k,rid]=x.dataset.drsel.split("|");drUi(eid).sel[k]=rid;render();return;}
  if((x=q("[data-dradd]"))){const[eid,k]=x.dataset.dradd.split("|"),ui=drUi(eid),cur=get("prog",ui.sel[k]);
    const d=k==="sprievodny"?{eventId:eid,kind:"sprievodny",section:"Sprievodný program",day:(cur&&cur.day)||"piatok",status:"nevybavene",title:"Nový bod programu"}
      :{eventId:eid,kind:"dielo",section:(cur&&cur.section)||OPT.psec[0][0],day:"oba",status:"nevybavene",title:"Nové dielo"};
    const nid=await add("prog",d);if(!nid)return;ui.sec=k;ui.sel[k]=nid;render();setTimeout(()=>{const i=document.getElementById("dr-t");if(i){i.focus();i.select();}},80);return;}
  if((x=q("[data-drdel]"))){const r=get("prog",x.dataset.drdel);if(!r)return;if(!await ask(`Odstrániť „${r.title||"Bez názvu"}“? Toto sa nedá vrátiť.`,"Odstrániť"))return;await del("prog",r.id);return;}
});
