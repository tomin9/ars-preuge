/* ===== Zlúčenie duplicitných kontaktov (v bočnom paneli kontaktu).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/62-zlucenie-kontaktov.js. Nie je to samostatný skript. ===== */
/* ===== Zlúčenie kontaktov ===== */
async function mergeContacts(keepId,dupId){
  const keep=get("contacts",keepId),dup=get("contacts",dupId);if(!keep||!dup||keepId===dupId)return false;
  const patch={};
  ENT.contacts.fields.forEach(f=>{const k=f.k;if(k==="name"||f.t==="image"||f.t==="tags")return;const a=keep[k],b=dup[k];
    if(f.t==="mrel"){const u=[...new Set([...(a||[]),...(b||[])])];if(u.length!==(a||[]).length)patch[k]=u;}
    else if(f.t==="long"){if(b&&b!==a)patch[k]=a?a+"\n\n"+b:b;}
    else if((a==null||a==="")&&b!=null&&b!=="")patch[k]=b;});
  if(dup.icon&&!keep.icon)patch.icon=dup.icon;
  if(dup.orgFn||keep.orgFn)patch.orgFn=Object.assign({},dup.orgFn||{},keep.orgFn||{});
  {const u=[...new Set([...tagList(keep),...tagList(dup)])];if(u.length&&u.length!==tagList(keep).length)patch.tags=u;}
  if((dup.docs||[]).length)patch.docs=[...(keep.docs||[]),...dup.docs];
  if(patch.orgIds||(keep.orgIds||[]).includes(dupId))patch.orgIds=(patch.orgIds||keep.orgIds||[]).filter(x=>x!==keepId&&x!==dupId);
  if(Object.keys(patch).length)await upd("contacts",keepId,patch);
  for(const e of Object.keys(ENT)){
    if(!Array.isArray(S.d[e]))continue;const fs=(ENT[e].fields||[]).filter(f=>f.e==="contacts");if(!fs.length)continue;
    for(const r of [...S.d[e]]){if(e==="contacts"&&r.id===dupId)continue;const pp={};
      fs.forEach(f=>{if(f.t==="rel"&&r[f.k]===dupId)pp[f.k]=keepId;
        else if(f.t==="mrel"&&(r[f.k]||[]).includes(dupId))pp[f.k]=[...new Set(r[f.k].map(x=>x===dupId?keepId:x))].filter(x=>!(e==="contacts"&&f.k==="orgIds"&&x===r.id));});
      if(Object.keys(pp).length)await upd(e,r.id,pp);}
  }
  for(const c of S.d.contacts.filter(x=>x.id!==dupId&&x.id!==keepId&&x.orgFn&&x.orgFn[dupId])){const m=Object.assign({},c.orgFn);if(!m[keepId])m[keepId]=m[dupId];delete m[dupId];await upd("contacts",c.id,{orgFn:m});}
  for(const pt of S.d.partnerships.filter(x=>x.contactId===dupId)){
    if(S.d.partnerships.some(x=>x.contactId===keepId&&x.eventId===pt.eventId))await del("partnerships",pt.id);else await upd("partnerships",pt.id,{contactId:keepId});}
  for(const c of S.d.comments.filter(x=>x.parent==="contacts:"+dupId))await upd("comments",c.id,{parent:"contacts:"+keepId});
  for(const z of S.d.zab.filter(x=>(x.personal||[]).some(r=>r.contactId===dupId)))
    await zbSave(z.id,y=>({personal:(y.personal||[]).map(r=>r.contactId===dupId?Object.assign({},r,{contactId:keepId}):r)}));
  for(const z of (S.d.zabd||[]).filter(x=>x.contactId===dupId))await upd("zabd",z.id,{contactId:keepId});
  return del("contacts",dupId);
}
function mergeBlock(r){
  const opts=S.d.contacts.filter(c=>c.id!==r.id).sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  return`<section class="dcard"><h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4v5a4 4 0 0 0 4 4h2a4 4 0 0 1 4 4v3M7 4 4 7m3-3 3 3M17 20l-3-3m3 3 3-3"/></svg>Zlúčiť s iným kontaktom</h3>
  <p class="meta" style="white-space:normal;margin:0 0 8px">Vyberte duplicitný kontakt. Jeho údaje, platby a všetky väzby sa prenesú sem (prázdne polia sa doplnia) a vybraný kontakt sa zmaže.</p>
  <div class="row" style="gap:8px;flex-wrap:nowrap"><select id="cm-sel" style="flex:1;min-width:0"><option value="">— vybrať kontakt —</option>${opts.map(c=>`<option value="${esc(c.id)}">${esc(c.name||"Bez mena")} · ${esc(optL("ctype",c.ctype||"osoba"))}</option>`).join("")}</select><button class="btn" id="cm-go" data-cmerge="${esc(r.id)}">Zlúčiť</button></div></section>`;
}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-cmerge]");if(!b)return;
  const sel=document.getElementById("cm-sel"),dupId=sel&&sel.value,keepId=b.dataset.cmerge;if(!dupId){toast("Vyberte kontakt, ktorý sa má zlúčiť.");return;}
  const keep=get("contacts",keepId),dup=get("contacts",dupId);if(!keep||!dup)return;
  if(!await ask(`Zlúčiť „${dup.name||"Bez mena"}“ do „${keep.name||"Bez mena"}“? Kontakt „${dup.name||"Bez mena"}“ sa zmaže a jeho platby, väzby a údaje sa prenesú. Toto sa nedá vrátiť.`,"Zlúčiť"))return;
  b.disabled=true;try{await mergeContacts(keepId,dupId);toast("Kontakty sú zlúčené.");}catch(er){console.warn(er);toast("Zlúčenie sa nepodarilo.");}
  if(DW)drawerRefresh(true);
});
function docSlot(e,r,kind,label,hint,mini){
  const D=(r.docs||[]).map((d,i)=>({d,i})).filter(x=>(x.d.kind||"")===kind);const key=`${e}:${esc(r.id)}:${kind}`;
  return`<div class="${mini?"docslot mini":"panel docslot"}"><div class="spread">${mini?`<b>${esc(label)}</b>`:`<h2>${esc(label)}</h2>`}<span class="meta">${D.length||""}</span></div>
  ${D.length?`<ul class="items">${D.map(({d,i})=>`<li><a class="t" href="${esc(docHref(d))}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(d.name||"Dokument")}</a><span class="meta">${d.asset?"súbor":d.drive||/drive\.google|docs\.google/.test(d.url||"")?"Google Disk":esc((d.url||"").replace(/^https?:\/\//,"").split("/")[0])}</span>${d.asset&&mcp?`<button class="btn ghost sm" data-todrive="${e}:${esc(r.id)}:${i}" title="Presunúť súbor na Google Disk">→ Disk</button>`:""}<button class="x" data-docrm="${e}:${esc(r.id)}:${i}" aria-label="Odstrániť">×</button></li>`).join("")}</ul>`:(mini?`<div class="meta" style="margin:4px 0 2px">—</div>`:"")}
  <div class="row" style="gap:6px;margin-top:8px"><label class="btn sm" style="cursor:pointer">Nahrať súbor<input type="file" data-dfile="${key}" hidden></label><button class="btn sm ghost" data-dlink="${key}">+ Odkaz</button></div></div>`;
}


