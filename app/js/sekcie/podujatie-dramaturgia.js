/* ===== Podujatie – záložka Dramaturgia (od 2.0.68 vyzerá ako Podklady): vľavo jeden zoznam rovnakých riadkov – Koncept, Mapa a časti programu
   (kategórie diel a Sprievodný program); po kliknutí na časť sú vpravo karty jej diel ako v Zabezpečení (od 2.0.73): fotka, číslo, názov, stav, autor
   a pod kartou sa rozbalia Údaje diela alebo Zabezpečenie (plán z kolekcie zabezpecenie, prepojený poľom progId). Bez bočného panela.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-dramaturgia.js. Nie je to samostatný skript.
   Pod Konceptom je Mapa (od 2.0.71 skutočná mapa so špendlíkmi diel podľa polí lat, lng prvku programu; pod ňou súbory, odkazy a poznámka z poľa dramMap podujatia).
   Dáta sa nemenia: koncept je pole dramaturgy podujatia, diela a sprievodný program sú záznamy programItems (ENT.prog, kind dielo / sprievodny).
   Polia vybraného prvku kreslí fInput a ukladá bindPart – tie isté ako v bočnom paneli. ===== */
const DR_SP="Sprievodný program";   /* časť programu, do ktorej patria body sprievodného programu (kind sprievodny) */
const DR_IC={koncept:'<path d="M4 7h16M4 12h10M4 17h16"/>',mapa:'<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z"/><path d="M9 4v13M15 6.5v13"/>',dielo:'<path d="m12 3.5 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.5l-5.2 2.9L8 13.6l-4.4-4 5.9-.7z"/>',sprievodny:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
const DR_DAY={piatok:"Piatok",sobota:"Sobota",oba:"Oba dni"};
const drEd=()=>accEdit("prog")&&!S.readOnly;
const drUi=eid=>{S._dr=S._dr||{};const u=S._dr[eid]=S._dr[eid]||{sel:"",item:{},place:""};u.item=u.item||{};return u;};   /* sel: "" = Koncept · "mapa" · "sec:<časť programu>"; item = vybraný prvok v každej časti */
const drKey=x=>x.kind==="sprievodny"?DR_SP:(x.section||"");
const drKind=x=>x.kind==="sprievodny"?"sprievodny":"dielo";
const drItems=e=>S.d.prog.filter(x=>x.eventId===e.id).sort((a,b)=>(+a.ord||0)-(+b.ord||0)||(a.createdAt||0)-(b.createdAt||0));
/* časti programu: kategórie diel (v poradí z OPT.psec, potom ostatné použité) a nakoniec Sprievodný program (podľa dňa a času) */
function drGroups(ALL){
  const W=ALL.filter(x=>drKind(x)==="dielo"),P=ALL.filter(x=>drKind(x)==="sprievodny"),base=OPT.psec.map(o=>o[0]).filter(k=>k!==DR_SP),di={piatok:0,sobota:1,oba:2};
  const cats=[...base,...new Set(W.map(x=>x.section||"").filter(k=>!base.includes(k)))];
  return[...cats.map(k=>({k,l:k||"Bez kategórie",kind:"dielo",items:W.filter(x=>(x.section||"")===k)})).filter(g=>g.items.length||base.includes(g.k)),
    {k:DR_SP,l:DR_SP,kind:"sprievodny",items:P.slice().sort((a,b)=>(di[a.day||"oba"]-di[b.day||"oba"])||(a.time||"").localeCompare(b.time||""))}];
}
/* ---- prepojenie diela so Zabezpečením (len pri podujatí NOX:art): záznam zabezpečenia má pole progId = id diela;
   kým ho nemá, páruje sa podľa rovnakého názvu. Názov, autor a stav sa z karty diela zapisujú do oboch záznamov. ---- */
const drZab=(r,e)=>!isNox(e)||drKind(r)!=="dielo"?null:(S.d.zab.find(z=>z.progId===r.id)||S.d.zab.find(z=>!z.progId&&!!zbKey(z.title)&&zbKey(z.title)===zbKey(r.title))||null);
const drOrph=(e,ALL)=>!isNox(e)?[]:zbList().filter(z=>z.progId?!get("prog",z.progId):!ALL.some(r=>drKind(r)==="dielo"&&zbKey(r.title)===zbKey(z.title)));   /* diela, ktoré sú len v Zabezpečení */
const drReady=(r,e)=>{const z=drZab(r,e);return z?z.stav==="potvrdene":r.status==="pripravene";};
const DR_PST={nevybavene:"navrh",riesi:"rozpracovane",pripravene:"potvrdene"};   /* stav diela bez zabezpečenia má rovnaké farby ako stav v Zabezpečení */
const DR_ZBI='<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>';
/* raz po otvorení: kde sa názov diela zhoduje práve s jedným nespárovaným zabezpečením, prepojenie sa zapíše (aby ho neskoršie premenovanie nerozpojilo) */
async function drAutoLink(e){const ui=drUi(e.id);if(ui.linked||S.loading||!isNox(e)||!drEd()||!accEdit("zab"))return;ui.linked=true;
  const W=drItems(e).filter(r=>drKind(r)==="dielo");
  for(const r of W){if(S.d.zab.some(z=>z.progId===r.id))continue;const k=zbKey(r.title);if(!k||W.filter(x=>zbKey(x.title)===k).length!==1)continue;
    const C=S.d.zab.filter(z=>!z.progId&&zbKey(z.title)===k);if(C.length===1)await upd("zab",C[0].id,{progId:r.id});}}
const drSrc=z=>z&&(z.srcPower||z.srcNote)?`<div class="zb-src">${z.srcKind?`<span class="zb-tag k-${esc(z.srcKind)}">${esc(ZB_KIND[z.srcKind]||z.srcKind)}</span>`:""}<b>Podľa podkladu:</b> ${esc(z.srcPower||"")}${z.srcNote?`<div class="pp">${esc(z.srcNote)}</div>`:""}</div>`:"";
/* karta diela alebo bodu programu – hlavička ako v Zabezpečení (fotka, číslo, názov, stav, autor), pod ňou sa rozbalia Údaje diela alebo Zabezpečenie (naraz je rozbalená jedna časť jednej karty) */
function drCard(e,r,g,ed){
  const id=esc(r.id),z=drZab(r,e),ui=drUi(e.id),op=ui.open&&ui.open.id===r.id?ui.open.part:"",nox=isNox(e)&&g.kind==="dielo",ro=ed?"":" readonly";
  const st=z?(z.stav||"navrh"):(r.status||"nevybavene"),cls=z?st:(DR_PST[st]||"navrh"),ph=z?zbPhoto(z):"";
  const cn=k=>{const c=r[k]&&get("contacts",r[k]);return c?(c.name||""):"";};
  const meta=[g.kind==="sprievodny"?[DR_DAY[r.day||"oba"],r.time].filter(Boolean).join(" "):"",r.place,cn("prepId")?"pripravuje "+cn("prepId"):"",
    g.kind!=="dielo"?"":r.noGuard?"netreba strážiť":[cn("guardFri")?"stráži pi "+cn("guardFri"):"",cn("guardSat")?(cn("guardFri")?"so ":"stráži so ")+cn("guardSat"):""].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  const tg=(part,l)=>`<button type="button" role="tab" data-drx="${esc(e.id)}|${id}|${part}" aria-selected="${op===part}">${l}</button>`;
  const body=op==="udaje"?`<div class="drxbody" id="dr-main" data-drmain="${id}" data-cmb="prog:${id}">${drFields(e,r,g.kind,ed)}</div>`:op==="zab"&&nox?(z?zbPlan(z,true):drNoZab(e,r,ed)):"";
  return`<article class="zb-card st-${cls}" id="dr-card-${id}">
  <div class="zb-head"${ph?"":' style="grid-template-columns:minmax(0,1fr)"'}>${ph?`<div class="zb-ph"><img src="${esc(ph)}" alt="Fotografia lokality: ${esc(r.title||"")}" loading="lazy"></div>`:""}
    <div class="zb-info">
      <div class="zb-tr">${z&&z.ord?`<span class="zb-num">${esc(z.ord)}</span>`:""}
        <input class="zb-title" id="dr-${id}-t" data-keep data-drh="${id}|title" value="${esc(r.title||"")}" placeholder="Názov" aria-label="Názov"${ro}>
        <select class="zb-stav s-${cls}" id="dr-${id}-st" data-drh="${id}|${z?"stav":"status"}" aria-label="Stav"${ed?"":" disabled"}>${(z?ZB_STAV:OPT.pst).map(([k,l])=>`<option value="${k}" ${st===k?"selected":""}>${l}</option>`).join("")}</select>
        ${ed?`<button type="button" class="tplus tdel" data-drdel="${id}" title="Odstrániť" aria-label="Odstrániť">${TI.del}</button>`:""}</div>
      <input class="zb-author" id="dr-${id}-a" data-keep data-drh="${id}|author" value="${esc(r.author||"")}" placeholder="Autor / účinkujúci" aria-label="Autor / účinkujúci"${ro}>
      ${meta?`<div class="meta" style="white-space:normal;padding-left:0">${esc(meta)}</div>`:""}${drSrc(z)}
    </div></div>
  <div class="ptabs evbtabs drx" role="tablist">${tg("udaje","Údaje diela")}${nox?tg("zab","Zabezpečenie"):""}</div>${body}</article>`;
}
function drNoZab(e,r,ed){
  const O=drOrph(e,drItems(e));
  return`<div class="zb-plan"><p class="meta" style="margin:0;white-space:normal">Toto dielo ešte nemá zabezpečenie – napájanie, techniku, ľudí a úlohy.</p>${ed&&accEdit("zab")?`<div class="row" style="gap:10px;flex-wrap:wrap"><button type="button" class="btn pri sm" data-drzabnew="${esc(r.id)}">+ Pridať zabezpečenie</button>${O.length?`<select class="linksel" data-drzablink="${esc(r.id)}" style="width:auto;max-width:100%;margin:0"><option value="">↗ Spárovať s dielom zo Zabezpečenia…</option>${O.map(z=>`<option value="${esc(z.id)}">${esc((z.ord?z.ord+" · ":"")+(z.title||"Bez názvu"))}</option>`).join("")}</select>`:""}</div>`:""}</div>`;
}
/* dielo, ktoré je zatiaľ len v Zabezpečení: upravuje sa ako tam a dá sa zaradiť do časti programu */
function drOrphCard(e,z,ed){
  const id=esc(z.id),st=z.stav||"navrh",ph=zbPhoto(z),ui=drUi(e.id),op=ui.open&&ui.open.id==="z:"+z.id?ui.open.part:"",secs=OPT.psec.map(o=>o[0]).filter(k=>k!==DR_SP);
  return`<article class="zb-card st-${st}" id="dr-card-z-${id}">
  <div class="zb-head"${ph?"":' style="grid-template-columns:minmax(0,1fr)"'}>${ph?`<div class="zb-ph"><img src="${esc(ph)}" alt="Fotografia lokality: ${esc(z.title||"")}" loading="lazy"></div>`:""}
    <div class="zb-info">
      <div class="zb-tr">${z.ord?`<span class="zb-num">${esc(z.ord)}</span>`:""}
        <input class="zb-title" id="zb-${id}-title" data-zb="${id}|title" value="${esc(z.title||"")}" placeholder="Názov diela" aria-label="Názov diela">
        <select class="zb-stav s-${st}" id="zb-${id}-stav" data-zb="${id}|stav" aria-label="Stav">${ZB_STAV.map(([k,l])=>`<option value="${k}" ${st===k?"selected":""}>${l}</option>`).join("")}</select></div>
      <input class="zb-author" id="zb-${id}-author" data-zb="${id}|author" value="${esc(z.author||"")}" placeholder="Autor" aria-label="Autor">${drSrc(z)}
      ${ed?`<div class="row"><select class="linksel" data-drassign="${esc(e.id)}|${id}" aria-label="Zaradiť do časti programu" style="width:auto;max-width:100%;margin:0"><option value="">Zaradiť do časti programu…</option>${secs.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join("")}</select></div>`:""}
    </div></div>
  <div class="ptabs evbtabs drx" role="tablist"><button type="button" role="tab" data-drx="${esc(e.id)}|z:${id}|zab" aria-selected="${op==="zab"}">Zabezpečenie</button></div>${op==="zab"?zbPlan(z,true):""}</article>`;
}
function dramaturgiaTab(e){
  const id=esc(e.id),ed=drEd(),ui=drUi(e.id),ALL=drItems(e),G=drGroups(ALL),nox=isNox(e),O=drOrph(e,ALL),svg=(p,w)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  if(nox&&!S.loading&&S.d.zab.length){S.zbP=zbPeople();setTimeout(()=>drAutoLink(e),0);if(ui.open&&ui.open.part==="zab"){setTimeout(zbSyncSupplies,0);setTimeout(zbMigratePeople,0);}}   /* plán diela pod kartou potrebuje to isté čo záložka Zabezpečenie */
  const orph=ui.sel==="orph"&&O.length>0,g0=!orph&&String(ui.sel).startsWith("sec:")?G.find(g=>"sec:"+g.k===ui.sel):null,mapa=!g0&&!orph&&ui.sel==="mapa",nPos=ALL.filter(drHasPos).length;
  const kon=String(e.dramaturgy||"").trim().split("\n")[0],ename=esc(e.name||"Podujatie");
  const row=(key,on,ic,t,sm)=>`<button type="button" class="txi${on?" on":""}" data-drsel="${id}|${esc(key)}">${svg(ic,22)}<span class="txt"><b>${esc(t)}</b><small>${esc(sm)}</small></span></button>`;
  /* vľavo jeden zoznam rovnakých riadkov: Koncept · Mapa · časti programu (· diela, ktoré sú len v Zabezpečení) */
  const list=row("koncept",!g0&&!mapa&&!orph,DR_IC.koncept,"Koncept",kon?(kon.length>60?kon.slice(0,58)+"…":kon):"Téma a idea podujatia")
    +row("mapa",mapa,DR_IC.mapa,"Mapa",ALL.length?`${nPos} z ${ALL.length} na mape`:"Rozmiestnenie diel")
    +G.map(g=>{const n=g.items.length,d=g.items.filter(x=>drReady(x,e)).length;return row("sec:"+g.k,g0===g,DR_IC[g.kind],g.l,n?`${d} z ${n} pripravených`:"zatiaľ nič");}).join("")
    +(O.length?`<div class="gdsep"></div>`+row("orph",orph,DR_ZBI,"Zo Zabezpečenia",O.length+(O.length===1?" nezaradené dielo":O.length<5?" nezaradené diela":" nezaradených diel")):"");
  const head=(t,sub,add)=>`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dramaturgia / ${ename}</div><div class="txtitle" style="font-size:28px;font-weight:600;line-height:1.2;margin-top:6px">${esc(t)}</div>${sub?`<p class="meta" style="margin:8px 0 0;white-space:normal">${sub}</p>`:""}</div></div>${add||""}</div>`;
  let main;
  if(g0){const co=g0.kind==="sprievodny"?"bod programu":"dielo";
    main=`<div class="pkcol">${nox?zbLists():""}${head(g0.l,"",ed?`<div class="mkadd" style="padding-top:16px"><input type="text" id="dr-add" data-dradd="${id}|${esc(g0.k)}" placeholder="+ Pridať ${co} a Enter" maxlength="140"></div>`:"")}
      ${g0.items.length?`<div class="zb-list">${g0.items.map(r=>drCard(e,r,g0,ed)).join("")}</div>`:`<div class="panel" style="margin-top:18px"><div class="empty">V tejto časti zatiaľ nič nie je.</div></div>`}</div>`;}
  else if(orph)main=`<div class="pkcol">${zbLists()}${head("Zo Zabezpečenia","Tieto diela sú zatiaľ len v záložke Zabezpečenie. Zaraďte ich do časti programu – objavia sa tam aj so svojím zabezpečením.")}<div class="zb-list">${O.map(z=>drOrphCard(e,z,ed&&accEdit("zab"))).join("")}</div></div>`;
  else if(mapa)main=drMap(e);
  else main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dramaturgia / ${ename}</div><div class="txtitle" style="font-size:28px;font-weight:600;margin-top:6px">Koncept</div></div></div>
      <div class="txw"><textarea class="txbody" id="ev-dram" data-keep placeholder="Téma, idea, dramaturgická línia podujatia…">${esc(e.dramaturgy||"")}</textarea></div><div class="txfoot" id="txstat">${txStat(e.dramaturgy)}</div></div>`;
  return`<div class="txm"><div class="txlist drlist">${list}</div>${main}</div>`;
}
/* ===== Mapa: skutočná mapa (Leaflet + podklad OpenStreetMap, knižnica sa stiahne až pri otvorení) so špendlíkmi diel.
   Umiestnenie je v prvku programu (polia lat, lng): vyznačí sa kliknutím do mapy, špendlík sa dá potiahnuť. Farba = časť programu (OPT.psec).
   Pod mapou ostali súbory, odkazy a poznámka z poľa dramMap podujatia. ===== */
const DR_LF=[["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js","https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"],["https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js","https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"]];   /* knižnica mapy: hlavný zdroj a náhradný */
const DR_CENTER=[48.7718,18.6268];   /* Prievidza – kým nie je vyznačené žiadne dielo */
let DRL=null,drLfP=null;   /* DRL = {eid,el,map,layer,fitted}: mapa prežije prekreslenie stránky, jej prvok sa len vráti na miesto */
const drHasPos=x=>x.lat!=null&&x.lat!==""&&x.lng!=null&&x.lng!==""&&isFinite(+x.lat)&&isFinite(+x.lng);
const drCol=x=>optC("psec",drKind(x)==="sprievodny"?DR_SP:(x.section||""));
const drPin=c=>`<svg viewBox="0 0 26 34" width="26" height="34" aria-hidden="true"><path d="M13 33S2.5 20.6 2.5 12.6a10.5 10.5 0 0 1 21 0C23.5 20.6 13 33 13 33z" fill="${c}" stroke="#fff" stroke-width="1.6"/><circle cx="13" cy="12.6" r="3.8" fill="#fff"/></svg>`;
function drLeaf(){if(window.L&&window.L.map)return Promise.resolve(window.L);if(drLfP)return drLfP;
  const one=i=>new Promise((res,rej)=>{if(i>=DR_LF.length){rej(new Error("leaflet"));return;}
    const c=document.createElement("link");c.rel="stylesheet";c.href=DR_LF[i][1];document.head.appendChild(c);
    const sc=document.createElement("script");sc.src=DR_LF[i][0];sc.onload=()=>window.L&&window.L.map?res(window.L):rej(new Error("leaflet"));
    sc.onerror=()=>{c.remove();sc.remove();one(i+1).then(res,rej);};document.head.appendChild(sc);});
  drLfP=one(0).catch(er=>{drLfP=null;throw er;});return drLfP;}
function drMap(e){
  const ed=mkEd(e),pe=drEd(),id=esc(e.id),ui=drUi(e.id),ALL=drItems(e),ON=ALL.filter(drHasPos),OFF=ALL.filter(x=>!drHasPos(x)),placing=ui.place&&get("prog",ui.place);
  const M=e.dramMap||{},docs=(Array.isArray(M.docs)?M.docs:[]).map((d,i)=>({d,i})),isImg=d=>!!d.asset&&/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(d.name||"");
  const imgs=docs.filter(x=>isImg(x.d)),rest=docs.filter(x=>!isImg(x.d));
  const rm=i=>ed?`<button type="button" class="tplus tdel" data-sdrm="${i}" title="Odstrániť" aria-label="Odstrániť">${TI.del}</button>`:"";
  const leg=[...new Map(ON.map(x=>[drKind(x)==="sprievodny"?DR_SP:(x.section||"Bez kategórie"),drCol(x)])).entries()].map(([l,c])=>`<span class="tg sm" style="--tc:${c}">${esc(l)}<span class="meta" style="margin-left:6px">${ON.filter(x=>(drKind(x)==="sprievodny"?DR_SP:(x.section||"Bez kategórie"))===l).length}</span></span>`).join("");
  return`<div class="panel txmain gdmain docslot" id="dr-map" data-drmap="${id}"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Dramaturgia / ${esc(e.name||"Podujatie")}</div><div class="txtitle" style="font-size:28px;font-weight:600;margin-top:6px">Mapa</div></div>
      ${ed?`<div class="row" style="flex:none;gap:4px"><label class="tplus" title="Priložiť súbor k mape (obrázok alebo PDF)" aria-label="Priložiť súbor k mape">${GD_I.up}<input type="file" multiple data-sdfile hidden></label><button type="button" class="tplus" data-sdlink title="Pridať odkaz k mape" aria-label="Pridať odkaz k mape">${GD_I.link}</button></div>`:""}</div>
    ${placing?`<div class="drplace"><span>Kliknite do mapy na miesto, kde bude <b>${esc(placing.title||"Bez názvu")}</b>.</span><button type="button" class="btn sm ghost" data-drplacex="${id}">Zrušiť</button></div>`:""}
    <div class="drleafw"><div id="dr-leaf" data-eid="${id}"><div class="gdempty" style="padding:26px">Načítavam mapu…</div></div></div>
    <div class="pkb drmapinfo">${leg?`<div class="pkchips">${leg}</div>`:`<div class="meta" style="white-space:normal">Na mape zatiaľ nie je žiadne dielo.${pe&&OFF.length?" Vyberte dielo nižšie a kliknite do mapy.":""}</div>`}
      ${OFF.length?`<div class="drunpl"><span class="pkh" style="margin:0;min-height:0">Bez umiestnenia · ${OFF.length}</span><div class="pkchips">${OFF.map(x=>pe?`<button type="button" class="tg sm${ui.place===x.id?" on":""}" style="--tc:${drCol(x)}" data-drplace="${id}|${esc(x.id)}" title="Vyznačiť na mape">${esc(x.title||"Bez názvu")}</button>`:`<span class="tg sm" style="--tc:${drCol(x)}">${esc(x.title||"Bez názvu")}</span>`).join("")}</div></div>`:""}</div>
    ${imgs.map(({d,i})=>`<figure class="drmap"><a href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Mapa")}"><img src="${esc(docHref(d))}" alt="${esc(d.name||"Mapa")}" loading="lazy"></a><figcaption><span>${esc(d.name||"Mapa")}</span>${rm(i)}</figcaption></figure>`).join("")}
    ${rest.length?`<div class="gdbody"><div class="gdgrid">${rest.map(({d,i})=>`<div class="gdt"><a class="gdth" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Súbor")}">${gdThumb(d)}</a>${ed?`<button type="button" class="gdrm" data-sdrm="${i}" title="Odstrániť" aria-label="Odstrániť">${GD_I.del}</button>`:""}<a class="gdn" href="${esc(docHref(d))}" target="_blank" rel="noopener" title="${esc(d.name||"Súbor")}">${esc(d.name||"Súbor")}</a></div>`).join("")}</div></div>`:""}
    <div class="pkb pkout" style="border-top:1px solid var(--line)"><div class="pkh">Poznámka k mape</div><textarea class="pkta" id="dr-mapnote" rows="2" data-keep data-drmapnote="${id}" placeholder="Legenda, trasa, čo kde bude…"${ed?"":" readonly"}>${esc(M.note||"")}</textarea></div></div>`;
}
/* vloženie mapy na miesto po vykreslení stránky a obnovenie špendlíkov */
function drMapSync(host){
  const eid=host.dataset.eid;
  drLeaf().then(L=>{
    const e0=get("events",eid);if(!e0||!host.isConnected)return;
    if(!DRL||DRL.eid!==eid){if(DRL)try{DRL.map.remove();}catch(_){}
      const el=document.createElement("div");el.className="drleaf";host.replaceChildren(el);
      const map=L.map(el,{scrollWheelZoom:false}).setView(DR_CENTER,15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
      map.on("focus",()=>map.scrollWheelZoom.enable());map.on("blur",()=>map.scrollWheelZoom.disable());   /* koliesko približuje až po kliknutí do mapy, inak posúva stránku */
      map.on("click",ev=>{const ui=drUi(eid),rid=ui.place;if(!rid)return;ui.place="";upd("prog",rid,{lat:+ev.latlng.lat.toFixed(6),lng:+ev.latlng.lng.toFixed(6)});});
      DRL={eid,el,map,layer:L.layerGroup().addTo(map),fitted:false};
    }else if(DRL.el.parentNode!==host)host.replaceChildren(DRL.el);
    const ed=drEd(),ui=drUi(eid),P=drItems(e0).filter(drHasPos),map=DRL.map;
    map.invalidateSize();DRL.layer.clearLayers();DRL.el.classList.toggle("placing",!!ui.place);
    P.forEach(x=>{const m=L.marker([+x.lat,+x.lng],{icon:L.divIcon({className:"drpin",html:drPin(drCol(x)),iconSize:[26,34],iconAnchor:[13,33],popupAnchor:[0,-30]}),draggable:ed,title:x.title||"",alt:x.title||"Dielo"});
      const meta=[x.author,x.place].filter(Boolean).join(" · ");
      m.bindPopup(`<b>${esc(x.title||"Bez názvu")}</b>${meta?`<div class="meta">${esc(meta)}</div>`:""}<div class="row" style="gap:6px;margin-top:8px"><button type="button" class="btn sm" data-a="open">Otvoriť</button>${ed?`<button type="button" class="btn sm ghost" data-a="unpin">Odstrániť z mapy</button>`:""}</div>`);
      m.on("popupopen",ev=>{const c=ev.popup.getElement();if(!c)return;const o=c.querySelector('[data-a="open"]'),u=c.querySelector('[data-a="unpin"]');if(o)o.onclick=()=>drOpen(x.id);if(u)u.onclick=()=>upd("prog",x.id,{lat:null,lng:null});});
      if(ed)m.on("dragend",()=>{const ll=m.getLatLng();upd("prog",x.id,{lat:+ll.lat.toFixed(6),lng:+ll.lng.toFixed(6)});});
      m.addTo(DRL.layer);});
    if(!DRL.fitted&&P.length){DRL.fitted=true;if(P.length===1)map.setView([+P[0].lat,+P[0].lng],17);else map.fitBounds(L.latLngBounds(P.map(x=>[+x.lat,+x.lng])).pad(0.25));}
  }).catch(()=>{if(host.isConnected)host.innerHTML=`<div class="gdempty" style="padding:26px">Mapu sa nepodarilo načítať. Skontrolujte pripojenie na internet a obnovte stránku.</div>`;});
}
/* Údaje diela alebo bodu programu – rozbalené pod kartou; polia kreslí fInput a ukladá bindPart (ako v bočnom paneli) */
function drFields(e,r,sec,ed){
  const F=k=>ENT.prog.fields.find(f=>f.k===k);
  const cell=(k,l)=>`<div class="drf"><label for="f-${k}">${esc(l||F(k).l)}</label>${fInput("prog",r,F(k))}</div>`;
  const area=(k,l,ph)=>`<div class="pkb pkout"><div class="pkh">${l}</div><textarea class="pkta" id="f-${k}" rows="2" data-keep data-f="${k}" placeholder="${ph}">${esc(r[k]||"")}</textarea></div>`;
  const pos=`<div class="drf"><label>Na mape</label><div class="row" style="gap:6px;min-height:36px;flex-wrap:wrap">${drHasPos(r)?`<span class="meta">vyznačené</span>`:""}${ed?`<button type="button" class="btn sm" data-drplace="${esc(e.id)}|${esc(r.id)}">${drHasPos(r)?"Zmeniť miesto":"Vyznačiť na mape"}</button>${drHasPos(r)?`<button type="button" class="btn sm ghost" data-drunpin="${esc(r.id)}">Zrušiť</button>`:""}`:(drHasPos(r)?"":`<span class="meta">nevyznačené</span>`)}</div></div>`;
  return`<div class="pkb"><div class="pkh">Údaje</div><div class="drgrid">${cell("contactId")}${sec==="sprievodny"?cell("day")+cell("time"):cell("section")}${cell("place")}${pos}${cell("prepId")}${cell("kind")}</div></div>
    ${sec==="sprievodny"?"":`<div class="pkb"><div class="pkh">Stráženie</div><div class="drgrid">${cell("noGuard")}${r.noGuard?"":cell("guardFri")+cell("guardSat")}</div></div>`}
    ${area("needOrg","Organizačne treba","Čo treba zariadiť…")}${area("needMat","Materiál a technika","Čo treba priniesť alebo požičať…")}${area("note","Poznámka","Poznámka…")}`;
}
/* ovládanie po každom vykreslení stránky (volá bindView): polia sa ukladajú rovnako ako v bočnom paneli */
function drBind(v){
  const mp=v.querySelector("#dr-map");
  if(mp){const eid=mp.dataset.drmap;mp.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));const lf=mp.querySelector("#dr-leaf");if(lf)drMapSync(lf);
    sdBind(mp,eid,fn=>{const e0=get("events",eid);if(!e0)return Promise.resolve();const M=e0.dramMap||{};return upd("events",eid,{dramMap:Object.assign({},M,{docs:fn(Array.isArray(M.docs)?M.docs:[])})});},()=>{});}
  const m=v.querySelector("#dr-main");if(!m)return;const r=get("prog",m.dataset.drmain);if(!r)return;
  bindPart(m,"prog",r);m.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));
}
/* otvorenie prvku odinakiaľ (hľadanie, odkazy): prejde na záložku Dramaturgia jeho podujatia a vyberie ho */
function drOpen(id){const r=get("prog",id),e0=r&&r.eventId&&get("events",r.eventId);if(!e0||e0._stub)return false;closeDrawer();{const ui=drUi(e0.id);ui.sel="sec:"+drKey(r);ui.open={id,part:"udaje"};ui.place="";}S.evtab="dramaturgia";
  if(S.view==="podujatie"&&S.id===e0.id)render();else go("podujatie",e0.id);
  setTimeout(()=>{const c=document.getElementById("dr-card-"+id);if(c&&c.scrollIntoView)c.scrollIntoView({block:"start"});},80);return true;}
document.addEventListener("keydown",async ev=>{const t=ev.target;if(!t||ev.key!=="Enter")return;
  if(t.id==="dr-t"){t.blur();return;}
  if(!t.dataset||!t.dataset.dradd)return;const v=t.value.trim();if(!v)return;const[eid,sec]=t.dataset.dradd.split("|");t.value="";
  const d=sec===DR_SP?{eventId:eid,kind:"sprievodny",section:DR_SP,day:"piatok",status:"nevybavene",title:v}:{eventId:eid,kind:"dielo",section:sec,day:"oba",status:"nevybavene",title:v};
  const nid=await add("prog",d);if(nid){render();setTimeout(()=>{const c=document.getElementById("dr-card-"+nid);if(c&&c.scrollIntoView)c.scrollIntoView({block:"nearest"});},80);}});
document.addEventListener("change",ev=>{const t=ev.target;if(!t||!t.dataset)return;
  if(t.dataset.drh){const[rid,f]=t.dataset.drh.split("|"),r=get("prog",rid);if(!r)return;const e0=get("events",r.eventId),z=e0&&drZab(r,e0),v=String(t.value).trim();   /* hlavička karty: názov a autor idú do diela aj do jeho zabezpečenia, stav do toho, čo sa ukazuje */
    if(f==="stav"){if(z)upd("zab",z.id,{stav:v,progId:rid});return;}
    if(f==="status"){upd("prog",rid,{status:v});return;}
    if((r[f]||"")===v)return;if(z)upd("zab",z.id,{[f]:v,progId:rid});upd("prog",rid,{[f]:v});return;}
  if(t.dataset.drzablink){const rid=t.dataset.drzablink;if(t.value&&get("prog",rid))upd("zab",t.value,{progId:rid});return;}
  if(t.dataset.drassign){const[eid,zid]=t.dataset.drassign.split("|"),z=get("zab",zid),sec=t.value;if(!z||!sec)return;
    (async()=>{const nid=await add("prog",{eventId:eid,kind:"dielo",section:sec,title:z.title||"",author:z.author||"",day:"oba",status:"nevybavene"});if(!nid)return;await upd("zab",zid,{progId:nid});const ui=drUi(eid);ui.sel="sec:"+sec;ui.open=null;render();})();return;}
  if(!t.dataset.drmapnote)return;const e0=get("events",t.dataset.drmapnote);if(e0)upd("events",e0.id,{dramMap:Object.assign({},e0.dramMap||{},{note:String(t.value).trim()})});});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  if((x=q("[data-drsel]"))){const[eid,key]=x.dataset.drsel.split("|"),ui=drUi(eid);ui.sel=key==="koncept"?"":key;ui.place="";render();return;}
  if((x=q("[data-drx]"))){const[eid,key,part]=x.dataset.drx.split("|"),ui=drUi(eid);ui.open=ui.open&&ui.open.id===key&&ui.open.part===part?null:{id:key,part};render();return;}
  if((x=q("[data-drzabnew]"))){const r=get("prog",x.dataset.drzabnew);if(!r)return;const ord=Math.max(0,...S.d.zab.map(y=>+y.ord||0))+1;
    await add("zab",{ord,title:r.title||"",author:r.author||"",stav:"navrh",napajanie:"",technika:[],personal:[],ulohy:[],poznamka:"",progId:r.id});drUi(r.eventId).open={id:r.id,part:"zab"};render();return;}
  if((x=q("[data-drplace]"))){const[eid,rid]=x.dataset.drplace.split("|"),ui=drUi(eid);ui.place=ui.place===rid&&ui.sel==="mapa"?"":rid;ui.sel="mapa";render();setTimeout(()=>{const m=document.getElementById("dr-map");if(m&&m.scrollIntoView)m.scrollIntoView({block:"nearest"});},60);return;}
  if((x=q("[data-drplacex]"))){drUi(x.dataset.drplacex).place="";render();return;}
  if((x=q("[data-drunpin]"))){upd("prog",x.dataset.drunpin,{lat:null,lng:null});return;}
  if((x=q("[data-drdel]"))){const r=get("prog",x.dataset.drdel);if(!r)return;const e0=get("events",r.eventId),z=e0&&drZab(r,e0);if(!await ask(`Odstrániť „${r.title||"Bez názvu"}“ z Dramaturgie? Toto sa nedá vrátiť.${z?" Jeho zabezpečenie ostane v záložke Zabezpečenie.":""}`,"Odstrániť"))return;await del("prog",r.id);return;}
});
