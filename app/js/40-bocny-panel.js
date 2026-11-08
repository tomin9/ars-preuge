/* ===== Bočný panel (vysúva sa sprava): hlavička, polia podľa ENT, ukladanie zmien, obrázky, podúlohy, komentáre, výber záznamu s našepkávaním.
   Časť spoločného programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/40-bocny-panel.js. Nie je to samostatný skript. ===== */
/* ================= drawer (record peek, Notion-like) ================= */
let DW=null;
function openDrawer(e,id,isNew){
  DW={e,id,isNew:!!isNew,edit:!!isNew};closeSide();
  const host=$("#drawer");
  host.innerHTML=`<div class="dscrim" data-dclose></div><aside class="drawer${e==="ledger"||e==="contacts"?" dw-narrow":""}" role="dialog" aria-modal="true" aria-label="${esc(ENT[e].one)}">
    <div class="dtop${e==="ledger"||e==="contacts"?" dtop-ic":""}">${e==="ledger"||e==="contacts"?"":`<span class="kind">${esc(ENT[e].one)}</span>`}
      ${e==="projects"||e==="grants"||e==="events"?`<button class="btn ghost sm" data-dpage>Otvoriť stránku</button>`:""}
      ${e==="contacts"?`<button class="icb${isNew?" on":""}" data-dedit title="Upraviť – zobraziť všetky polia" aria-label="Upraviť"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>`:""}
      ${e==="ledger"||e==="contacts"?`<button class="icb danger" data-ddel title="Zmazať" aria-label="Zmazať"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button><button class="icb" data-dclose title="Zavrieť" aria-label="Zavrieť"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`:`<button class="btn ghost sm danger" data-ddel>Zmazať</button><button class="btn ghost sm" data-dclose aria-label="Zavrieť">Zavrieť</button>`}</div>
    <div class="dbody"><div id="dw-head"></div><div id="dw-props"></div><div id="dw-extra"></div></div></aside>`;
  host.hidden=false;
  host.querySelectorAll("[data-dclose]").forEach(b=>b.onclick=closeDrawer);
  const ed=host.querySelector("[data-dedit]");if(ed)ed.onclick=()=>{DW.edit=!DW.edit;ed.classList.toggle("on",DW.edit);drawerRefresh(true);};
  const pg=host.querySelector("[data-dpage]");if(pg)pg.onclick=()=>{const d=DW;closeDrawer();openRec(d.e,d.id);};
  host.querySelector("[data-ddel]").onclick=async()=>{
    const r=get(DW.e,DW.id);if(!r)return;
    if(!await ask(`Zmazať ${ENT[DW.e].one.toLowerCase()} „${ttl(DW.e,r)}“? Toto sa nedá vrátiť.`,"Zmazať"))return;
    const d=DW;if(await del(d.e,d.id)){closeDrawer();toast("Zmazané.");if((S.view==="projekt"||S.view==="grant"||S.view==="podujatie")&&S.id===d.id)go(d.e==="projects"?"projekty":d.e==="grants"?"granty":"podujatia");}
  };
  drawerRefresh(true);
  if(isNew)setTimeout(()=>{const t=$("#dw-title");if(t)t.focus();},60);
}
function closeDrawer(){DW=null;const h=$("#drawer");if(h){h.innerHTML="";h.hidden=true;}}
function drawerRefresh(force){
  if(!DW)return;const r=get(DW.e,DW.id);
  if(!r){if(S.live&&!force){$("#dw-head").innerHTML=`<div class="empty">Záznam sa nenašiel – možno ho niekto zmazal.</div>`;$("#dw-props").innerHTML="";$("#dw-extra").innerHTML="";}return;}
  const ae=document.activeElement;
  [["dw-head",dHead],["dw-props",dProps],["dw-extra",dExtra]].forEach(([id,fn])=>{
    const el=document.getElementById(id);if(!el)return;
    if(!force&&ae&&el.contains(ae)&&ae.matches("input,textarea,select"))return;
    el.innerHTML=fn(DW.e,r);bindPart(el,DW.e,r);
  });
}
const ICO_MOVE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>';
const ICO_OK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 5 5 9-10"/></svg>';
const posOf=r=>(r&&r.coverPos)||"50% 50%";
function dHead(e,r){
  const k=ENT[e].title,imgF=ENT[e].fields.find(f=>f.t==="image");let top="";
  if(imgF){
    const u=coverUrl(r),can=assets||!S.live;
    const IMG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>';
    const DEL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
    top=u?`<div class="dcover"><img src="${esc(u)}" alt="" style="object-position:${esc(posOf(r))}">${can?`<div class="dcov-btns"><button type="button" class="icb" data-imgpos title="Posunúť obrázok" aria-label="Posunúť obrázok">${ICO_MOVE}</button><label class="icb" title="Zmeniť obrázok" aria-label="Zmeniť obrázok">${IMG}<input type="file" accept="image/*" data-img="${imgF.k}" hidden></label><button type="button" class="icb" data-imgdel="${imgF.k}" title="Odstrániť obrázok" aria-label="Odstrániť obrázok">${DEL}</button></div>`:""}</div>`
      :(can?`<label class="addcover">${IMG}Pridať obrázok<input type="file" accept="image/*" data-img="${imgF.k}" hidden></label>`:"");
  }
  const ttlIn=`<input id="dw-title" class="ttl" data-f="${k}" value="${esc(r[k])}" placeholder="${esc(e==="ledger"?"Popis platby":"Názov")}" aria-label="Názov">`;
  if(e==="contacts"){const can=assets||!S.live;
    const ph=can?`<label class="cicobtn" title="Zmeniť fotku">${cIcon(r,true)}<input type="file" accept="image/*" data-img="icon" hidden><span class="cicoedit">Zmeniť</span></label>`:cIcon(r,true);
    const isP=(r.ctype||"osoba")==="osoba";let nm;
    if(isP){const w=String(r.name||"").trim().split(/\s+/).filter(Boolean),last=w.length>1?w.pop():"",first=w.join(" ");
      nm=`<input id="dw-title" class="ttl np" data-np="1" value="${esc(first)}" placeholder="Meno" aria-label="Meno"><input class="ttl np" data-np="2" value="${esc(last)}" placeholder="Priezvisko" aria-label="Priezvisko">`;}
    else nm=`<textarea id="dw-title" class="ttl" rows="1" data-f="${k}" placeholder="Názov" aria-label="Názov" style="resize:none;height:auto">${esc(r[k])}</textarea>`;
    const orgN=orgList(r).map(i=>get("contacts",i)).filter(Boolean).map(o=>`<button type="button" class="orgl" data-open="contacts:${esc(o.id)}">${esc(o.name||"Bez mena")}</button>`).join(", "),line=orgN||(r.org?esc(r.org):"");
    const ICM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>',ICP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>';
    const ed=DW&&DW.edit,cin=(k,t,ph,href)=>(ed||r[k])?`<div class="cirow"><span class="cii" aria-hidden="true">${k==="email"?ICM:ICP}</span><input type="${t}" id="f-${k}" data-f="${k}" value="${esc(r[k])}" placeholder="${ph}" aria-label="${ph}">${r[k]?`<a class="cio" href="${esc(href)}" title="Otvoriť" aria-label="Otvoriť">↗</a>`:""}</div>`:"";
    const info=[line?`<div>${line}</div>`:"",cin("email","email","E-mail","mailto:"+(r.email||"")),cin("phone","tel","Telefón","tel:"+String(r.phone||"").replace(/\s/g,""))].filter(Boolean).join("");
    const ht=!ed&&tagList(r).length?`<div class="htags">${tagList(r).map(tagInfo).map(([k,l,c])=>`<span class="tg sm" style="--tc:${c}">${esc(l)}</span>`).join("")}</div>`:"";
    return`<div class="cthead2"><div class="cphoto">${ph}</div><div class="cmain">${nm}${ht}<div class="cinfo">${info}</div></div></div>${r.icon&&can?`<button class="btn ghost sm" data-icodel style="margin:-2px 0 8px">Obnoviť predvolenú ikonu</button>`:""}`;}
  return top+ttlIn;
}
const DI={
  main:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
  tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>',
  coins:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
  note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 0 1-11.7 7L3 21l2-5.5A8 8 0 1 1 21 12z"/></svg>'};
function ledgerForm(r){
  const F=k=>ENT.ledger.fields.find(f=>f.k===k);
  const fld=(k,cls)=>{const f=F(k);if(k==="amount")return`<div class="dfld${cls?" "+cls:""}"><label for="f-amount">${esc(f.l)}</label><input type="text" inputmode="decimal" id="f-amount" data-f="amount" data-num="1" data-money="1" value="${r.amount==null||r.amount===""?"":esc(eur(r.amount))}" placeholder="0,00 €"></div>`;return`<div class="dfld${cls?" "+cls:""}"><label for="f-${k}">${esc(f.l)}</label>${fInput("ledger",r,f)}</div>`;};
  const seg=(k,label,opts)=>`<div class="dfld"><div class="tabs seg" role="group" aria-label="${label}">${opts.map(([v,l])=>`<button type="button" data-seg="${k}|${v}" aria-pressed="${(r[k]||opts[0][0])===v}">${esc(l)}</button>`).join("")}</div></div>`;
  const row=k=>{const f=F(k);return`<label for="f-${k}">${esc(f.l)}</label><div class="pv">${fInput("ledger",r,f)}</div>`;};
  const card=(ico,t,body,cls)=>`<section class="dcard${cls?" "+cls:""}">${t?`<h3>${DI[ico]}${t}</h3>`:""}${body}</section>`;
  return card("main","",`<div class="dgrid g3">${seg("type","Typ",OPT.ltype)}${fld("amount")}${fld("state")}</div>
      <div class="dgrid g3" style="margin-top:12px">${seg("account","Účet",OPT.acct)}${fld("date")}${fld("docNo")}</div>`,"plain")
    +card("tag","Priradenie",`<div class="drows">${row("projectId")}${row("eventId")}${row("category")}${row("contactId")}</div>`)
    +card("coins","Financovanie",`<div class="drows">${row("grantId")}${row("cofinGrantId")}${row("lineId")}</div>`);
}
function dProps(e,r){
  if(e==="ledger")return ledgerForm(r);
  const filled=f=>{const v=r[f.k];return!(v==null||v===""||(Array.isArray(v)&&!v.length));};
  const hideEmpty=e==="contacts"&&DW&&!DW.edit;
  const lab=f=>e==="contacts"&&f.k==="address"?((r.ctype||"osoba")==="osoba"?"Bydlisko":"Sídlo"):f.l;
  const fl=ENT[e].fields.filter(f=>f.t!=="mrel"&&f.t!=="image"&&(!f.only||e!=="contacts"||(f.only==="!osoba"?(r.ctype||"osoba")!=="osoba":(r.ctype||"osoba")===f.only))&&(!hideEmpty||filled(f))&&!(e==="contacts"&&(f.k==="email"||f.k==="phone"||f.k==="note"||f.k==="position"||f.k==="source"||(["ico","dic","icdph"].includes(f.k)&&(r.ctype||"osoba")==="osoba")||(hideEmpty&&(f.k==="orgIds"||f.k==="position")))));
  let ct="";
  const TAGK=["tags","orgIds"];
  const mk=f=>{
    const full=f.t==="long";
    if(e==="contacts"&&f.k==="ctype"){ct=`<div class="pv full ctt">${fInput(e,r,f)}</div>`;return"";}
    if(e==="contacts"&&(f.k==="tags"||f.k==="orgIds")&&!(DW&&DW.edit))return`<div class="pv full">${fInput(e,r,f)}</div>`;
    return full?`<label class="full" for="f-${f.k}">${esc(lab(f))}</label><div class="pv full">${fInput(e,r,f)}</div>`
      :`<label for="f-${f.k}">${esc(lab(f))}</label><div class="pv">${fInput(e,r,f)}</div>`;};
  const rows=fl.map(mk).join("");
  if(e==="contacts"){
    const tg=fl.filter(f=>TAGK.includes(f.k)).map(mk).join(""),dt=fl.filter(f=>!TAGK.includes(f.k)).map(mk).join("");
    const card=(ico,t,h,cls)=>h?`<section class="dcard${cls?" "+cls:""}"><h3>${DI[ico]}${t}</h3><div class="props cprops" style="margin:0">${h}</div></section>`:"";
    return`${DW&&DW.edit?`<div class="props" style="margin-bottom:12px">${ct}</div>`:""}${card("tag","Štítky",DW&&DW.edit?tg:"","tagcard")}${card("main","Údaje",dt)}`;
  }
  return `<div class="props">${rows}</div>`;
}
function optsOf(f,r){return f.o?OPT[f.o].map(x=>[x[0],x[1]]):(f.src==="cats"?cats():ttypes()).map(x=>[x,x]);}
function relOpts(f,r){
  let list=S.d[f.e];
  if(f.e==="lines"&&r.grantId)list=list.filter(l=>l.grantId===r.grantId);
  if(f.e==="grants")list=list.filter(g=>g.status==="schvalene"||g.id===r[f.k]);
  return [...list].sort((a,b)=>ttl(f.e,a).localeCompare(ttl(f.e,b),"sk"));
}
document.addEventListener("copy",e=>{const t=e.target;if(t&&t.dataset&&t.dataset.iban){const sel=String(t.value).substring(t.selectionStart,t.selectionEnd);if(sel){e.clipboardData.setData("text/plain",sel.replace(/\s+/g,""));e.preventDefault();}}});
function fmtIban(v){return String(v||"").replace(/\s+/g,"").toUpperCase().replace(/(.{4})(?=.)/g,"$1 ");}
function fInput(e,r,f){
  const v=f.k==="cofinGrantId"?cofinG(r):r[f.k],id=`f-${f.k}`;
  switch(f.t){
    case"text":{const inp=`<input type="text" id="${id}" data-f="${f.k}" ${f.k==="iban"?'data-iban="1" ':""}value="${esc(f.k==="iban"?fmtIban(v):v)}" placeholder="${esc(f.ph||"—")}">`;
      return inp;}
    case"email":case"tel":case"url":{
      const href=v?(f.t==="email"?"mailto:"+v:f.t==="tel"?"tel:"+String(v).replace(/\s/g,""):(/^https?:\/\//.test(v)?v:"https://"+v)):"";
      return`<div class="urlrow"><input type="${f.t}" id="${id}" data-f="${f.k}" value="${esc(v)}" placeholder="—">${v?`<a class="btn ghost sm" href="${esc(href)}" target="_blank" rel="noopener">Otvoriť</a>`:""}</div>`;}
    case"long":return`<textarea id="${id}" data-f="${f.k}" placeholder="Napíšte…" style="border-color:var(--line)">${esc(v)}</textarea>`;
    case"money":case"num":return`<input type="number" step="${f.t==="money"?"0.01":"1"}" id="${id}" data-f="${f.k}" data-num="1" value="${v==null||v===""?"":esc(v)}" placeholder="—">`;
    case"date":return`<input type="date" id="${id}" data-f="${f.k}" value="${esc(v)}">`;
    case"check":return`<label class="row" style="padding:5px 10px;gap:8px;cursor:pointer"><input type="checkbox" id="${id}" data-f="${f.k}" data-bool="1" ${v===true||(v==null&&f.k==="paid"&&e==="ledger")?"checked":""}><span class="small muted"></span></label>`;
    case"sel":if(e==="contacts"&&f.k==="ctype")return`<div class="tabs seg segi" role="group" aria-label="Typ">${OPT.ctype.map(([k,l])=>`<button type="button" data-seg="ctype|${k}" aria-pressed="${(v||"osoba")===k}">${CSVG[k]||""}${esc(l)}</button>`).join("")}</div>`;
      return`<select id="${id}" data-f="${f.k}">${f.req?"":`<option value="">—</option>`}${optsOf(f,r).map(([k,l])=>`<option value="${esc(k)}" ${v===k?"selected":""}>${esc(l)}</option>`).join("")}${v&&!optsOf(f,r).some(o=>o[0]===v)?`<option selected>${esc(v)}</option>`:""}</select>`;
    case"rel":{const cur=v?get(f.e,v):null;return`<div class="combo"><input type="hidden" id="${id}" data-f="${f.k}" value="${esc(v||"")}"><input type="text" class="combo-in" data-combo="${f.k}" value="${esc(cur?ttl(f.e,cur):"")}" placeholder="— hľadať…" autocomplete="off" spellcheck="false"><div class="combo-list" hidden></div></div>`;}
    case"multi":{const a=Array.isArray(v)?v:[];return`<div class="mchips" id="${id}">${optsOf(f).map(([k,l])=>`<button type="button" data-multi="${f.k}" data-v="${esc(k)}" aria-pressed="${a.includes(k)}">${esc(l)}</button>`).join("")}</div>`;}
    case"tags":{const a=tagList(r),ed=DW&&DW.edit,v=tagVocab(r.ctype),all=ed?[...v,...a.filter(k=>!v.some(x=>x[0]===k)).map(tagInfo)]:a.map(tagInfo);return`<div class="tagrow">${all.map(([k,l,c])=>`<button type="button" class="tg" style="--tc:${c}${ed?"":";pointer-events:none"}" data-tagtoggle="${k}" aria-pressed="${a.includes(k)}"${ed?"":' tabindex="-1"'}>${esc(l)}</button>`).join("")}${ed?`<input type="text" class="tg add tgnew" data-tagnew="1" placeholder="+ pridať" aria-label="Pridať novú rolu" maxlength="30">`:""}</div>`;}
    case"orgs":{const a=orgList(r),opts=S.d.contacts.filter(c=>c.ctype&&c.ctype!=="osoba"&&c.id!==r.id&&!a.includes(c.id)).sort((x,y)=>(x.name||"").localeCompare(y.name||"","sk"));
      return`<div class="orgrows">${r.org&&!a.length?`<div class="orgrow"><span class="oc" style="--tc:#8A8F98" title="Starší textový údaj, nie je prepojený s kontaktom. Vyberte organizáciu nižšie alebo odstráňte.">${esc(r.org)}<button type="button" data-orglegacy="1" aria-label="Odstrániť" title="Odstrániť">×</button></span></div>`:""}${a.map(i=>{const o=get("contacts",i);return o?`<div class="orgrow"><span class="oc" style="--tc:${ctypeCol(o.ctype)}">${esc(o.name||"Bez mena")}${DW&&DW.edit?`<button type="button" data-orgdel="${esc(i)}" aria-label="Odobrať" title="Odobrať">×</button>`:""}</span>${DW&&DW.edit||orgFn(r,i)?`<input type="text" class="orgfn" list="fn-dl" data-orgfn="${esc(i)}" value="${esc(orgFn(r,i))}" placeholder="Funkcia" aria-label="Funkcia v ${esc(o.name||"organizácii")}"${DW&&DW.edit?"":" readonly tabindex=\"-1\""}>`:""}</div>`:"";}).join("")}${opts.length&&DW&&DW.edit?`<label class="oc add">${a.length?"+ pridať ďalšiu":"+ pridať"}<select data-orgadd="1" aria-label="Pridať organizáciu alebo firmu"><option value="">—</option>${opts.map(c=>`<option value="${esc(c.id)}">${esc(c.name||"Bez mena")} · ${esc(optL("ctype",c.ctype))}</option>`).join("")}</select></label>`:""}${fnDl()}</div>`;}
    case"mrel":{const a=Array.isArray(v)?v:[];return`<div class="mchips" id="${id}">${S.d[f.e].filter(x=>f.e!=="grants"||x.status==="schvalene"||a.includes(x.id)).map(x=>`<button type="button" data-multi="${f.k}" data-v="${esc(x.id)}" aria-pressed="${a.includes(x.id)}">${esc(ttl(f.e,x))}${f.e==="grants"&&provName(x)?`<small class="cprov">${esc(provName(x))}</small>`:""}</button>`).join("")||'<span class="meta">Zatiaľ žiadne projekty</span>'}</div>`;}
    case"color":return`<div class="row" style="padding:4px 6px">${COLORS.map(c=>`<button type="button" data-color="${c}" aria-label="Farba" style="all:unset;cursor:pointer;width:20px;height:20px;border-radius:5px;background:${c};outline:${v===c?"2px solid var(--ink)":"none"};outline-offset:2px"></button>`).join("")}</div>`;
    case"image":{const u=coverUrl(r);return`<div style="padding:4px 0">${u?`<img src="${esc(u)}" alt="" style="width:100%;max-height:190px;object-fit:cover;border-radius:8px;display:block;margin-bottom:6px">`:""}<div class="row">${assets||!S.live?`<label class="btn sm" style="cursor:pointer">${u?"Zmeniť obrázok":"Nahrať obrázok"}<input type="file" accept="image/*" data-img="${f.k}" hidden></label>`:'<span class="meta">Obrázky môžu nahrávať len upravovatelia.</span>'}${u?`<button type="button" class="btn ghost sm" data-imgdel="${f.k}">Odstrániť</button>`:""}</div></div>`;}
    case"person":return`<div data-person="${f.k}"></div>`;
  }
  return"";
}
function bindPart(root,e,r){
  root.querySelectorAll("[data-f]").forEach(inp=>{
    const k=inp.dataset.f;
    const ev=inp.tagName==="SELECT"||inp.type==="checkbox"||inp.type==="date"?"change":"change";
    inp.addEventListener(ev,()=>{
      let v=inp.type==="checkbox"?inp.checked:inp.value;
      if(inp.dataset.num){if(inp.dataset.money){const n=parseFloat(String(v).replace(/[^\d,.\-]/g,"").replace(",","."));v=isFinite(n)?Math.round(n*100)/100:null;inp.value=v==null?"":eur(v);}else v=v===""?null:Math.round(parseFloat(v)*100)/100;}
      if(typeof v==="string"&&inp.tagName!=="TEXTAREA")v=v.trim();
      if(inp.dataset.iban){v=fmtIban(v);inp.value=v;}
      const cur=get(e,r.id);if(!cur||cur[k]===v)return;
      const patch={[k]:v};
      if(k==="grantId"&&v&&!cur.projectId){const g=get("grants",v);if(g&&g.projectId)patch.projectId=g.projectId;}
      if(k==="lineId"&&v){const l=get("lines",v);if(l&&l.grantId&&!cur.grantId){patch.grantId=l.grantId;const g=get("grants",l.grantId);if(g&&g.projectId&&!cur.projectId)patch.projectId=g.projectId;}}
      if(k==="cofinGrantId")patch.cofin=false;
      if(k==="date"&&e==="ledger")patch.paid=!!v;
      if(k==="status"&&e==="tasks")patch.doneAt=v==="hotove"?Date.now():null;
      const pr=upd(e,r.id,patch);if(k==="ctype"&&e==="contacts")Promise.resolve(pr).then(()=>drawerRefresh(true));
    });
    if(inp.id==="dw-title")inp.addEventListener("keydown",ev=>{if(ev.key==="Enter")inp.blur();});
  });
  renderPdfThumbs(root);
  {const ta=root.querySelector("textarea#dw-title");if(ta){const fit=()=>{ta.style.height="auto";ta.style.height=ta.scrollHeight+"px";};fit();ta.addEventListener("input",fit);}}
  {const np=[...root.querySelectorAll("[data-np]")];if(np.length===2){const go=()=>{const nv=np.map(x=>x.value.trim()).filter(Boolean).join(" "),cur=get(e,r.id);if(!cur||(cur.name||"")===nv)return;upd(e,r.id,{name:nv});};np.forEach(x=>{x.addEventListener("change",go);x.addEventListener("keydown",ev=>{if(ev.key==="Enter")x.blur();});});}}
  root.querySelectorAll("[data-money]").forEach(inp=>{inp.addEventListener("focus",()=>{const n=parseFloat(String(inp.value).replace(/[^\d,.\-]/g,"").replace(",","."));inp.value=isFinite(n)?String(n).replace(".",","):"";inp.select();});inp.addEventListener("blur",()=>{const n=parseFloat(String(inp.value).replace(/[^\d,.\-]/g,"").replace(",","."));inp.value=isFinite(n)?eur(Math.round(n*100)/100):"";});});
  root.querySelectorAll("[data-seg]").forEach(b=>b.onclick=()=>{const[k,v]=b.dataset.seg.split("|"),cur=get(e,r.id);if(!cur||cur[k]===v)return;upd(e,r.id,{[k]:v});});
  root.querySelectorAll("[data-multi]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.multi,cur=get(e,r.id);const a=Array.isArray(cur[k])?[...cur[k]]:[];const v=b.dataset.v;
    const i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);upd(e,r.id,{[k]:a});
  });
  root.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>upd(e,r.id,{color:b.dataset.color}));
  root.querySelectorAll("[data-person]").forEach(box=>picker(box,get(e,r.id)[box.dataset.person],v=>upd(e,r.id,{[box.dataset.person]:v})));
  // checklist add
  root.querySelectorAll("[data-ck-add]").forEach(inp=>inp.addEventListener("keydown",ev=>{
    if(ev.key!=="Enter"||!inp.value.trim())return;const cur=get(e,r.id);const a=Array.isArray(cur.checklist)?cur.checklist.map(x=>({...x})):[];
    a.push({t:inp.value.trim(),d:false});inp.value="";upd(e,r.id,{checklist:a});}));
  root.querySelectorAll("[data-ck-del]").forEach(b=>b.onclick=()=>{const cur=get(e,r.id);const a=(cur.checklist||[]).map(x=>({...x}));a.splice(+b.dataset.i,1);upd(e,r.id,{checklist:a});});
  // comments
  const cb=root.querySelector("[data-cmt-send]");
  if(cb)cb.onclick=async()=>{const ta=root.querySelector("#cmt-text");const t=ta.value.trim();if(!t)return;
    const ok=await add("comments",{parent:e+":"+r.id,text:t,by:meId()||"",at:Date.now()});if(ok){ta.value="";ta.blur();drawerRefresh(true);}};
  root.querySelectorAll("[data-cmt-del]").forEach(b=>b.onclick=async()=>{if(await ask("Zmazať komentár?","Zmazať"))del("comments",b.dataset.cmtDel);});
  {const b=root.querySelector("[data-icodel]");if(b)b.onclick=async()=>{await upd(e,r.id,{icon:null});drawerRefresh(true);};}
  root.querySelectorAll("[data-img]").forEach(inp=>inp.onchange=async()=>{const file=inp.files&&inp.files[0];if(!file)return;toast("Nahrávam obrázok…");const v=await uploadImage(file,inp.dataset.img==="icon"?320:0);if(v){await upd(e,r.id,{[inp.dataset.img]:v});drawerRefresh(true);}});
  root.querySelectorAll("[data-imgpos]").forEach(b=>b.onclick=()=>{
    const box=root.querySelector(".dcover"),img=box&&box.querySelector("img");if(!img)return;
    if(box.classList.contains("repos")){box.classList.remove("repos");b.innerHTML=ICO_MOVE;b.title="Posunúť obrázok";img.onpointerdown=null;upd(e,r.id,{coverPos:img.style.objectPosition||"50% 50%"});toast("Pozícia obrázka uložená.");return;}
    box.classList.add("repos");b.innerHTML=ICO_OK;b.title="Uložiť pozíciu";
    let[x,y]=(img.style.objectPosition||"50% 50%").split(" ").map(parseFloat);
    img.onpointerdown=ev=>{ev.preventDefault();img.setPointerCapture(ev.pointerId);const sx=ev.clientX,sy=ev.clientY,x0=x,y0=y,w=img.clientWidth,h=img.clientHeight;
      img.onpointermove=m=>{x=Math.max(0,Math.min(100,x0-(m.clientX-sx)/w*150));y=Math.max(0,Math.min(100,y0-(m.clientY-sy)/h*150));img.style.objectPosition=`${x.toFixed(1)}% ${y.toFixed(1)}%`;};
      img.onpointerup=img.onpointercancel=()=>{img.onpointermove=null;};};
  });
  root.querySelectorAll("[data-imgdel]").forEach(b=>b.onclick=async()=>{await upd(e,r.id,{[b.dataset.imgdel]:""});drawerRefresh(true);});
  bindDnD(root);
}
function coverUrl(p){const c=p&&p.cover;if(!c)return"";return c.startsWith("data:")?c:ARSP_BLOB+c;}
async function shrink(file,max){
  const url=URL.createObjectURL(file);
  try{const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
    const sc=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement("canvas");c.width=Math.round(img.naturalWidth*sc);c.height=Math.round(img.naturalHeight*sc);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);return await new Promise(res=>c.toBlob(b=>res(b),"image/jpeg",0.85));}
  finally{URL.revokeObjectURL(url);}
}
async function uploadImage(file,max){
  if(!/^image\//.test(file.type)){toast("Vyberte obrázok (JPG, PNG alebo WebP).");return null;}
  let blob=file;try{const b=await shrink(file,max||1800);if(b)blob=b;}catch(_){}
  if(!assets){if(S.live){toast("Nahrávanie obrázkov tu nie je dostupné.");return null;}return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(blob);});}
  try{const res=await assets.upload(blob);toast("Obrázok nahraný.");return res.id;}
  catch(e){toast(e&&e.code==="too_large"?"Obrázok je príliš veľký.":"Obrázok sa nepodarilo nahrať. Skúste iný súbor.");return null;}
}
function projGallery(list){
  return`<div class="gal">${list.map(p=>{const u=coverUrl(p),c=projCalc(p);return`<div class="gcard" data-open="projects:${esc(p.id)}" tabindex="0" role="link"><div class="gimg" style="background:${esc(p.color||GRAY)}">${u?`<img src="${esc(u)}" alt="" loading="lazy" style="object-position:${esc(posOf(p))}">`:""}</div><div class="gbody"><b>${esc(p.name||"Bez názvu")}</b><div class="cm">${c.open?`<span class="meta">${c.open} otvorených úloh</span>`:""}</div></div></div>`;}).join("")}<button class="gnew" data-create="projects">+ Nový projekt</button></div>`;
}
function toggleCheck(key,i){
  const[e,id]=key.split(":");const cur=get(e,id);if(!cur)return;
  const a=(cur.checklist||[]).map(x=>({...x}));if(!a[i])return;a[i].d=!a[i].d;upd(e,id,{checklist:a});
}
function checklistHtml(e,r,title){
  const a=Array.isArray(r.checklist)?r.checklist:[];const n=a.filter(x=>x.d).length;
  return`<div class="sec"><h3>${esc(title||"Kontrolný zoznam")}<span class="meta">${a.length?`${n} / ${a.length}`:""}</span></h3>
  <ul class="cl">${a.map((x,i)=>`<li class="${x.d?"on":""}"><button class="check ${x.d?"on":""}" data-ck-toggle="${e}:${esc(r.id)}" data-i="${i}" aria-label="Splnené"></button><span>${esc(x.t)}</span><button class="x" data-ck-del data-i="${i}" aria-label="Odstrániť">×</button></li>`).join("")}</ul>
  <input type="text" id="ck-add" data-ck-add placeholder="+ Pridať bod a stlačiť Enter" style="width:100%;margin-top:6px"></div>`;
}
function commentsHtml(e,r){
  const list=S.d.comments.filter(c=>c.parent===e+":"+r.id).sort((a,b)=>(a.at||0)-(b.at||0));
  return`<div class="sec"><h3>Komentáre<span class="meta">${list.length||""}</span></h3>
  ${list.map(c=>`<div class="cmt"><div class="h">${avatar(c.by)}<b>${esc(personName(c.by)||"Niekto")}</b><span>${rel(c.at)}</span>${c.by&&c.by===meId()?`<button class="btn ghost sm" style="margin-left:auto" data-cmt-del="${esc(c.id)}">Zmazať</button>`:""}</div><p>${esc(c.text)}</p></div>`).join("")}
  <textarea id="cmt-text" placeholder="Napíšte komentár pre tím…" style="margin-top:8px;min-height:60px"></textarea>
  <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm pri" data-cmt-send>Pridať komentár</button></div></div>`;
}
function miniList(title,e,rows,fn,addDefs){
  return`<div class="sec"><h3>${esc(title)}<span class="row" style="gap:6px"><span class="meta">${rows.length||""}</span>${addDefs?`<button class="btn ghost sm" data-create="${e}" data-defs='${esc(JSON.stringify(addDefs))}'>+ Pridať</button>`:""}</span></h3>
  ${rows.length?`<ul class="items">${rows.map(fn).join("")}</ul>`:`<div class="empty">Zatiaľ nič.</div>`}</div>`;
}

/* ===== searchable relation picker ===== */
const cnorm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function comboCtx(inp){if(!DW)return null;const r=get(DW.e,DW.id);const f=r&&ENT[DW.e].fields.find(x=>x.k===inp.dataset.combo);return f?{r,f,box:inp.closest(".combo"),hid:inp.closest(".combo").querySelector("input[type=hidden]")}:null;}
function comboItems(c,q){
  let L=relOpts(c.f,c.r);const nq=cnorm(q.trim());
  if(c.f.k==="providerId"&&!nq){const used=new Set(S.d.grants.map(g=>g.providerId).filter(Boolean));L=[...L.filter(x=>used.has(x.id)),...L.filter(x=>!used.has(x.id))];}
  if(nq)L=L.filter(x=>cnorm(ttl(c.f.e,x)+(c.f.e==="grants"?" "+provName(x):"")).includes(nq)).sort((a,b)=>cnorm(ttl(c.f.e,a)).indexOf(nq)-cnorm(ttl(c.f.e,b)).indexOf(nq));
  return L.slice(0,60);
}
function comboOpen(inp,all){const c=comboCtx(inp);if(!c)return;const q=all?"":inp.value;const L=comboItems(c,q);const list=c.box.querySelector(".combo-list");
  const exact=L.some(x=>cnorm(ttl(c.f.e,x))===cnorm(q.trim()));
  let h=(c.hid.value?`<button type="button" data-cv="">— zrušiť výber</button>`:"")+L.map(x=>`<button type="button" data-cv="${esc(x.id)}" class="${x.id===c.hid.value?"sel":""}">${c.f.e==="contacts"?cIcon(x):c.f.e==="grants"?provIcon(x):""}<span>${esc(ttl(c.f.e,x))}${c.f.e==="grants"&&provName(x)?`<small class="cprov">${esc(provName(x))}</small>`:""}</span></button>`).join("");
  if(q.trim()&&!exact&&c.f.e==="contacts")h+=`<button type="button" data-cnew="${esc(q.trim())}" class="new">+ Vytvoriť kontakt „${esc(q.trim())}“</button>`;
  if(!h)h=`<div class="meta" style="padding:8px 10px">Nič sa nenašlo.</div>`;
  list.innerHTML=h;list.hidden=false;list._hl=-1;}
function comboSet(inp,id){const c=comboCtx(inp);if(!c)return;c.hid.value=id||"";const x=id?get(c.f.e,id):null;inp.value=x?ttl(c.f.e,x):"";c.box.querySelector(".combo-list").hidden=true;c.hid.dispatchEvent(new Event("change",{bubbles:true}));}
document.addEventListener("focusin",e=>{const t=e.target;if(t.classList&&t.classList.contains("combo-in")){t.select();comboOpen(t,true);}});
document.addEventListener("input",e=>{const t=e.target;if(t.classList&&t.classList.contains("combo-in"))comboOpen(t,false);});
document.addEventListener("focusout",e=>{const t=e.target;if(!(t.classList&&t.classList.contains("combo-in")))return;setTimeout(()=>{const c=comboCtx(t);if(!c)return;c.box.querySelector(".combo-list").hidden=true;const x=c.hid.value?get(c.f.e,c.hid.value):null;t.value=x?ttl(c.f.e,x):"";},150);});
document.addEventListener("mousedown",e=>{const b=e.target.closest&&e.target.closest(".combo-list button");if(!b)return;e.preventDefault();const inp=b.closest(".combo").querySelector(".combo-in");
  if(b.dataset.cnew!=null){const c=comboCtx(inp);const name=b.dataset.cnew;(async()=>{const id=await add("contacts",{name,ctype:c&&c.f.k==="providerId"?"organizacia":"osoba"});if(id)comboSet(inp,id);})();return;}
  comboSet(inp,b.dataset.cv);});
document.addEventListener("keydown",e=>{const t=e.target;if(!(t.classList&&t.classList.contains("combo-in")))return;const list=t.closest(".combo").querySelector(".combo-list");const bs=[...list.querySelectorAll("button")];
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(list.hidden)comboOpen(t,false);list._hl=Math.max(0,Math.min(bs.length-1,(list._hl??-1)+(e.key==="ArrowDown"?1:-1)));bs.forEach((b,i)=>b.classList.toggle("hl",i===list._hl));bs[list._hl]&&bs[list._hl].scrollIntoView({block:"nearest"});}
  else if(e.key==="Enter"){e.preventDefault();const b=bs[list._hl>=0?list._hl:(bs[0]&&bs[0].dataset.cv===""&&bs[1]?1:0)];if(b)b.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}));}
  else if(e.key==="Escape"){if(!list.hidden){e.stopPropagation();list.hidden=true;}}},true);
