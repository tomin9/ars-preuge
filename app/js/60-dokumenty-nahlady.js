/* ===== Dokumenty – náhľady: odkaz na súbor, náhľad (obrázok, PDF, Disk), logo kontaktu, riadok dokladov platby.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/60-dokumenty-nahlady.js. Nie je to samostatný skript. ===== */
function docHref(d){return d.asset?ARSP_BLOB+d.asset:(/^https?:/.test(d.url||"")?d.url:"https://"+(d.url||""));}
function docThumb(e,r,d,i){
  const nm=d.name||"Dokument",ext=((nm.split(".").pop()||"").toLowerCase()),href=docHref(d);
  const m=String(d.driveId||"").trim()||((/drive\.google\.com\/file\/d\/([\w-]{10,})/.exec(d.url||"")||[])[1]||"");
  const isImg=/^(png|jpe?g|gif|webp|avif|svg)$/.test(ext),isPdf=ext==="pdf";
  const FI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>';
  const fb=`<div class="dfi">${FI}<span>${esc(ext&&ext.length<=4&&d.asset?ext.toUpperCase():"ODKAZ")}</span></div>`;
  let inner=fb;
  if(d.asset&&isImg)inner=`${fb}<img src="${esc(href)}" alt="" loading="lazy" onerror="this.remove()" style="position:absolute;inset:0">`;
  else if(d.asset&&isPdf)inner=`${fb}<canvas data-pdfthumb="${esc(href)}" hidden></canvas>`;
  else if(m)inner=`${fb}<img src="https://drive.google.com/thumbnail?id=${esc(m)}&sz=w300" alt="" loading="lazy" onerror="this.remove()" style="position:absolute;inset:0">`;
  return`<div class="dth"><a href="${esc(href)}" target="_blank" rel="noopener" title="${esc(nm)}" aria-label="${esc(nm)}">${inner}</a><button type="button" class="x" data-docrm="${e}:${esc(r.id)}:${i}" aria-label="Odstrániť" title="Odstrániť">×</button></div>`;
}
const DOCICO={
  zmluva:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',
  faktura:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  banka:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>'};
function logoCard(r,ed){
  const D=(r.docs||[]).map((d,i)=>({d,i})).filter(x=>x.d.kind==="logo");if(!ed&&!D.length)return"";
  const key=`contacts:${esc(r.id)}:logo`;
  return`<section class="dcard lkc docslot${ed?"":" logoro"}"><h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="lkh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>Logo</span>${ed?`<span class="row" style="gap:6px"><label class="btn sm" style="cursor:pointer">Nahrať súbor<input type="file" multiple data-dfile="${key}" hidden></label><button class="btn sm ghost" data-dlink="${key}">+ Odkaz</button></span>`:""}</h3>${D.length?`<div class="dr2-t">${D.map(({d,i})=>docThumb("contacts",r,d,i)).join("")}</div>`:`<div class="meta" style="margin-top:4px">Nahrajte logo (PNG, SVG, PDF…)</div>`}</section>`;
}
function docRow(e,r,kind,label){
  const D=(r.docs||[]).map((d,i)=>({d,i})).filter(x=>(x.d.kind||"")===kind),key=`${e}:${esc(r.id)}:${kind}`;
  return`<div class="docslot dr2"><div class="dr2-h"><b>${DOCICO[kind]||""}${esc(label)}</b>${kind==="zmluva"?`<button class="btn sm pri" data-mkcontract="${esc(r.id)}">Vytvoriť zmluvu</button>`:""}<label class="btn sm" style="cursor:pointer">Nahrať súbor<input type="file" data-dfile="${key}" hidden></label><button class="btn sm ghost" data-dlink="${key}">+ Odkaz</button></div><div class="dr2-t">${D.map(({d,i})=>docThumb(e,r,d,i)).join("")}</div></div>`;
}
function renderPdfThumbs(root){
  root.querySelectorAll("canvas[data-pdfthumb]").forEach(async cv=>{
    const href=cv.dataset.pdfthumb;cv.removeAttribute("data-pdfthumb");
    try{const lib=await loadPdfJs();const buf=await (await fetch(href)).arrayBuffer();const pdf=await lib.getDocument({data:buf}).promise;const pg=await pdf.getPage(1);
      const v0=pg.getViewport({scale:1}),sc=220/v0.width,vp=pg.getViewport({scale:sc});cv.width=vp.width;cv.height=vp.height;
      await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;cv.hidden=false;const f=cv.parentNode.querySelector(".dfi");if(f)f.remove();}catch(_){}
  });
}
