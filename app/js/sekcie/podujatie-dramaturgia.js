/* ===== Podujatie – záložka Dramaturgia (od 2.0.68 vyzerá ako Podklady): vľavo jeden zoznam – Koncept a pod ním časti programu ako sekcie pod sebou
   (kategórie diel a Sprievodný program, každá s tlačidlom + na pridanie), vpravo vybraný prvok – všetko na stránke, bez bočného panela.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-dramaturgia.js. Nie je to samostatný skript.
   Pod Konceptom je Mapa (od 2.0.70; pole dramMap podujatia: súbory, odkazy a poznámka).
   Dáta sa nemenia: koncept je pole dramaturgy podujatia, diela a sprievodný program sú záznamy programItems (ENT.prog, kind dielo / sprievodny).
   Polia vybraného prvku kreslí fInput a ukladá bindPart – tie isté ako v bočnom paneli. ===== */
const DR_SP="Sprievodný program";   /* časť programu, do ktorej patria body sprievodného programu (kind sprievodny) */
const DR_IC={koncept:'<path d="M4 7h16M4 12h10M4 17h16"/>',mapa:'<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z"/><path d="M9 4v13M15 6.5v13"/>',dielo:'<path d="m12 3.5 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.5l-5.2 2.9L8 13.6l-4.4-4 5.9-.7z"/>',sprievodny:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
const DR_DAY={piatok:"Piatok",sobota:"Sobota",oba:"Oba dni"};
const drEd=()=>accEdit("prog")&&!S.readOnly;
const drUi=eid=>{S._dr=S._dr||{};return S._dr[eid]=S._dr[eid]||{sel:""};};
const drKind=x=>x.kind==="sprievodny"?"sprievodny":"dielo";
const drItems=e=>S.d.prog.filter(x=>x.eventId===e.id).sort((a,b)=>(+a.ord||0)-(+b.ord||0)||(a.createdAt||0)-(b.createdAt||0));
/* časti programu pod sebou: kategórie diel (v poradí z OPT.psec, potom ostatné použité) a nakoniec Sprievodný program (podľa dňa a času) */
function drGroups(ALL,ed){
  const W=ALL.filter(x=>drKind(x)==="dielo"),P=ALL.filter(x=>drKind(x)==="sprievodny"),base=OPT.psec.map(o=>o[0]).filter(k=>k!==DR_SP),di={piatok:0,sobota:1,oba:2};
  const cats=[...base,...new Set(W.map(x=>x.section||"").filter(k=>!base.includes(k)))];
  return[...cats.map(k=>({k,l:k||"Bez kategórie",kind:"dielo",items:W.filter(x=>(x.section||"")===k)})),
    {k:DR_SP,l:DR_SP,kind:"sprievodny",items:P.slice().sort((a,b)=>(di[a.day||"oba"]-di[b.day||"oba"])||(a.time||"").localeCompare(b.time||""))}].filter(g=>g.items.length||(ed&&g.k!==""));
}
function dramaturgiaTab(e){
  const id=esc(e.id),ed=drEd(),ui=drUi(e.id),G=drGroups(drItems(e),ed),svg=(p,w)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const g0=G.find(g=>g.items.some(x=>x.id===ui.sel)),it=g0&&g0.items.find(x=>x.id===ui.sel);   /* nič vybrané = Koncept */
  const small=x=>drKind(x)==="sprievodny"?[DR_DAY[x.day||"oba"],x.time,x.place].filter(Boolean).join(" · "):[x.author,x.place].filter(Boolean).join(" · ");
  const kon=String(e.dramaturgy||"").trim().split("\n")[0];
  const mapa=!it&&ui.sel==="mapa",nMap=((e.dramMap||{}).docs||[]).length;
  const list=`<button type="button" class="txi${it||mapa?"":" on"}" data-drsel="${id}|koncept">${svg(DR_IC.koncept,22)}<span class="txt"><b>Koncept</b><small>${esc(kon?(kon.length>60?kon.slice(0,58)+"…":kon):"Téma a idea podujatia")}</small></span></button>`
    +`<button type="button" class="txi${mapa?" on":""}" data-drsel="${id}|mapa">${svg(DR_IC.mapa,22)}<span class="txt"><b>Mapa</b><small>${nMap?nMap+(nMap===1?" súbor":nMap<5?" súbory":" súborov"):"Rozmiestnenie diel"}</small></span></button>`
    +G.map(g=>`<div class="txlh"><span>${esc(g.l)}</span><span class="cnt">${g.items.length}</span>${ed?`<button type="button" class="addic" data-dradd="${id}|${esc(g.k)}" title="${g.kind==="sprievodny"?"Pridať bod programu":"Pridať dielo do tejto časti"}" aria-label="${g.kind==="sprievodny"?"Pridať bod programu":"Pridať dielo"}">+</button>`:""}</div>`
      +g.items.map(x=>`<button type="button" class="txi${it&&x.id===it.id?" on":""}" data-drsel="${id}|${esc(x.id)}">${svg(DR_IC[g.kind],22)}<span class="txt"><b>${esc(x.title||"Bez názvu")}</b><small>${esc(small(x))}</small></span><i class="txdot" style="background:${optC("pst",x.status||"nevybavene")}" title="${esc(optL("pst",x.status||"nevybavene"))}"></i></button>`).join("")).join("");
  const main=it?drMain(e,it,g0.kind,g0.l,ed):mapa?drMap(e):`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dramaturgia / ${esc(e.name||"Podujatie")}</div><div class="txtitle" style="font-size:28px;font-weight:600;margin-top:6px">Koncept</div></div></div>
      <div class="txw"><textarea class="txbody" id="ev-dram" data-keep placeholder="Téma, idea, dramaturgická línia podujatia…">${esc(e.dramaturgy||"")}</textarea></div><div class="txfoot" id="txstat">${txStat(e.dramaturgy)}</div></div>`;
  return`<div class="txm"><div class="txlist drlist">${list}</div>${main}</div>`;
}
/* Mapa podujatia (pole dramMap = {docs:[…],note}): obrázky sa ukážu veľké, ostatné súbory a odkazy ako dlaždice */
function drMap(e){
  const ed=mkEd(e),M=e.dramMap||{},docs=(Array.isArray(M.docs)?M.docs:[]).map((d,i)=>({d,i})),isImg=d=>!!d.asset&&/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(d.name||"");
  const imgs=docs.filter(x=>isImg(x.d)),rest=docs.filter(x=>!isImg(x.d));
  const rm=i=>ed?`<button type="button" class="tplus tdel" data-sdrm="${i}" title="Odstrániť" aria-label="Odstrániť">${TI.del}</button>`:"";
  return`<div class="panel txmain gdmain docslot" id="dr-map" data-drmap="${esc(e.id)}"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dramaturgia / ${esc(e.name||"Podujatie")}</div><div class="txtitle" style="font-size:28px;font-weight:600;margin-top:6px">Mapa</div></div>
      ${ed?`<div class="row" style="flex:none;gap:4px"><label class="tplus" title="Nahrať mapu (obrázok alebo PDF)" aria-label="Nahrať mapu">${GD_I.up}<input type="file" multiple data-sdfile hidden></label><button type="button" class="tplus" data-sdlink title="Pridať odkaz na mapu" aria-label="Pridať odkaz na mapu">${GD_I.link}</button></div>`:""}</div>
    ${imgs.map(({d,i})=>`<figure class="drmap"><a href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Mapa")}"><img src="${esc(docHref(d))}" alt="${esc(d.name||"Mapa")}" loading="lazy"></a><figcaption><span>${esc(d.name||"Mapa")}</span>${rm(i)}</figcaption></figure>`).join("")}
    ${rest.length?`<div class="gdbody"><div class="gdgrid">${rest.map(({d,i})=>`<div class="gdt"><a class="gdth" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Súbor")}">${gdThumb(d)}</a>${ed?`<button type="button" class="gdrm" data-sdrm="${i}" title="Odstrániť" aria-label="Odstrániť">${GD_I.del}</button>`:""}<a class="gdn" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Súbor")}">${esc(d.name||"Súbor")}</a></div>`).join("")}</div></div>`:""}
    ${docs.length?"":`<div class="gdbody"><div class="gdempty" style="padding:0">${ed?"Nahrajte mapu podujatia – obrázok alebo PDF s rozmiestnením diel – alebo pridajte odkaz (napr. na Google Mapy). Ikony sú vpravo hore.":"Zatiaľ bez mapy."}</div></div>`}
    <div class="pkb pkout" style="border-top:1px solid var(--line)"><div class="pkh">Poznámka k mape</div><textarea class="pkta" id="dr-mapnote" rows="2" data-keep data-drmapnote="${esc(e.id)}" placeholder="Legenda, trasa, čo kde bude…"${ed?"":" readonly"}>${esc(M.note||"")}</textarea></div></div>`;
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
  const mp=v.querySelector("#dr-map");
  if(mp){const eid=mp.dataset.drmap;mp.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));
    sdBind(mp,eid,fn=>{const e0=get("events",eid);if(!e0)return Promise.resolve();const M=e0.dramMap||{};return upd("events",eid,{dramMap:Object.assign({},M,{docs:fn(Array.isArray(M.docs)?M.docs:[])})});},()=>{});}
  const m=v.querySelector("#dr-main");if(!m)return;const r=get("prog",m.dataset.drmain);if(!r)return;
  bindPart(m,"prog",r);m.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));
}
/* otvorenie prvku odinakiaľ (hľadanie, odkazy): prejde na záložku Dramaturgia jeho podujatia a vyberie ho */
function drOpen(id){const r=get("prog",id),e0=r&&r.eventId&&get("events",r.eventId);if(!e0||e0._stub)return false;closeDrawer();drUi(e0.id).sel=id;S.evtab="dramaturgia";
  if(S.view==="podujatie"&&S.id===e0.id)render();else go("podujatie",e0.id);return true;}
document.addEventListener("keydown",ev=>{const t=ev.target;if(t&&t.id==="dr-t"&&ev.key==="Enter")t.blur();});
document.addEventListener("change",ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.drmapnote)return;const e0=get("events",t.dataset.drmapnote);if(e0)upd("events",e0.id,{dramMap:Object.assign({},e0.dramMap||{},{note:String(t.value).trim()})});});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  if((x=q("[data-drsel]"))){const[eid,rid]=x.dataset.drsel.split("|");drUi(eid).sel=rid==="koncept"?"":rid;render();return;}
  if((x=q("[data-dradd]"))){const[eid,sec]=x.dataset.dradd.split("|");
    const d=sec===DR_SP?{eventId:eid,kind:"sprievodny",section:DR_SP,day:"piatok",status:"nevybavene",title:"Nový bod programu"}:{eventId:eid,kind:"dielo",section:sec,day:"oba",status:"nevybavene",title:"Nové dielo"};
    const nid=await add("prog",d);if(!nid)return;drUi(eid).sel=nid;render();setTimeout(()=>{const i=document.getElementById("dr-t");if(i){i.focus();i.select();}},80);return;}
  if((x=q("[data-drdel]"))){const r=get("prog",x.dataset.drdel);if(!r)return;if(!await ask(`Odstrániť „${r.title||"Bez názvu"}“? Toto sa nedá vrátiť.`,"Odstrániť"))return;await del("prog",r.id);return;}
});
