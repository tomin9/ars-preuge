/* ===== Podujatie – záložka Fotky (album Google Fotiek, prezeranie).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-fotky.js. Nie je to samostatný skript. ===== */
S._ph=S._ph||{};
const phRow=id=>`https://lh3.googleusercontent.com/pw/${id}=w1400-h440`;   /* náhľad bez orezania – riadky ako v Google Fotkách */
S._phr=S._phr||{};   /* pomer strán fotiek (šírka/výška), zistený po načítaní náhľadu */
const phFull=id=>`https://lh3.googleusercontent.com/pw/${id}=w2000`;
/* albumy podujatia: nové pole albums [{id,url}]; doterajšie photosUrl = prvý album (ostáva vyplnené kvôli kompatibilite) */
const phAlbums=e=>Array.isArray(e.albums)&&e.albums.length?e.albums.filter(a=>a&&a.url):(e.photosUrl?[{id:"a0",url:e.photosUrl}]:[]);
S._phsel=S._phsel||{};S._phform=S._phform||null;
const phCur=e=>{const A=phAlbums(e);return A.find(a=>a.id===S._phsel[e.id])||A[0]||null;};
const phOkUrl=u=>/^https?:\/\/(photos\.app\.goo\.gl|photos\.google\.com|goo\.gl)\//i.test(u);
function fotkyTab(e){
  const A=phAlbums(e),cur=phCur(e),eid=esc(e.id),F=S._phform&&S._phform.eid===e.id?S._phform:null;
  const form=(mode,val)=>`<div class="panel phform"><h2 style="margin-bottom:6px">${mode==="edit"?"Zmeniť odkaz na album":"Pridať album"}</h2><p class="meta" style="white-space:normal;margin:0 0 10px">Vložte odkaz na zdieľaný album z Google Fotiek (napr. https://photos.app.goo.gl/…) a fotky sa zobrazia tu.${mode==="edit"?" Prázdny odkaz album z podujatia odoberie (v Google Fotkách ostane).":""}</p>
    <div class="row" style="gap:8px;flex-wrap:nowrap"><input type="url" id="ph-url" value="${esc(val||"")}" placeholder="https://photos.app.goo.gl/…" style="flex:1;min-width:0"><button class="btn pri" data-phsave="${eid}">Uložiť</button>${A.length?`<button class="btn ghost" data-phcancel>Zrušiť</button>`:""}</div></div>`;
  if(!A.length)return form("add","");
  A.forEach(a=>{if(!S._ph[a.url])phFetch(a.url,false).then(()=>{const t=document.querySelector(`[data-phtab="${CSS.escape(a.id)}"]`);if(t&&S.view==="podujatie"&&S.id===e.id)t.outerHTML=phTabBtn(e,a,A,cur);}).catch(()=>{});});
  setTimeout(()=>phLoad(e.id,false),0);
  return`<div class="phbar"><div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn ghost" href="${esc(cur.url)}" target="_blank" rel="noopener">Otvoriť v Google Fotkách</a><button class="btn ghost" data-phall="${eid}" title="Stiahne všetky fotky albumu v plnej veľkosti do jedného ZIP súboru">Stiahnuť všetky</button><button class="btn ghost" data-phrefresh="${eid}">Obnoviť</button><button class="btn ghost" data-phchange="${eid}">Zmeniť odkaz</button></div>
    <div class="ptabs phtabs" role="tablist">${A.length>1?A.map(a=>phTabBtn(e,a,A,cur)).join(""):""}<button type="button" class="phadd" data-phadd="${eid}">+ Pridať album</button></div></div>
    ${F?form(F.mode,F.mode==="edit"?cur.url:""):""}<div id="ph-box" class="phbox"><div class="empty">Načítavam fotky…</div></div>`;
}
function phTabBtn(e,a,A,cur){const d=S._ph[a.url],n=d&&d.photos?d.photos.length:0;
  return`<button role="tab" data-phtab="${esc(a.id)}" data-phev="${esc(e.id)}" aria-selected="${cur&&cur.id===a.id}">${esc((d&&d.title)||"Album "+(A.indexOf(a)+1))}${n?`<span>${n}</span>`:""}</button>`;}
async function phFetch(url,refresh){
  if(S._ph[url]&&!refresh)return S._ph[url];
  const r=await fetch(ARSP.rest+"photos?url="+encodeURIComponent(url)+(refresh?"&refresh=1":""),{headers:{"X-WP-Nonce":ARSP.nonce},credentials:"same-origin",cache:"no-store"});const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error((j&&j.message)||("HTTP "+r.status));return(S._ph[url]=j);}
async function phLoad(eid,refresh){
  const e=get("events",eid),box=document.getElementById("ph-box"),a=e&&phCur(e);if(!e||!box||!a)return;
  const url=a.url;let d=S._ph[url];
  if(!d||refresh){box.innerHTML=`<div class="empty">Načítavam fotky…</div>`;
    try{d=await phFetch(url,refresh);}
    catch(er){const b2=document.getElementById("ph-box");if(b2)b2.innerHTML=`<div class="empty">Náhľady fotiek sa nepodarilo načítať${er&&er.message?` (${esc(er.message)})`:""}. Album môžete otvoriť v Google Fotkách.</div>`;return;}}
  const b=document.getElementById("ph-box");if(!b)return;
  const L=(d&&d.photos)||[];
  b.innerHTML=L.length?`<div class="phgrid">${L.map((id,i)=>`<button type="button" class="phi" data-phi="${i}" aria-label="Fotka ${i+1}"${S._phr[id]?` style="--r:${S._phr[id]}"`:""}><img src="${phRow(id)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-phid="${esc(id)}"></button>`).join("")}</div><p class="meta" style="margin-top:10px">${L.length} fotiek${d.title?` · ${esc(d.title)}`:""}</p>`:`<div class="empty">V albume sa nenašli žiadne fotky, alebo ich Google nevrátil. Skúste Obnoviť alebo otvorte album v Google Fotkách.</div>`;
}
function phOpen(url,i){
  const d=S._ph[url];if(!d||!d.photos||!d.photos.length)return;let n=d.photos.length,cur=Math.max(0,Math.min(n-1,i));
  const host=document.createElement("div");host.className="phlb";host.setAttribute("role","dialog");host.setAttribute("aria-label","Fotka");
  host.innerHTML=`<button class="phx" data-lbclose aria-label="Zavrieť">×</button><button class="phn prev" data-lbprev aria-label="Predošlá">‹</button><img alt="" referrerpolicy="no-referrer"><button class="phn next" data-lbnext aria-label="Ďalšia">›</button><div class="phc"></div>`;
  document.body.appendChild(host);const im=host.querySelector("img"),c=host.querySelector(".phc");
  const show=()=>{im.src=phFull(d.photos[cur]);c.textContent=`${cur+1} / ${n}`;};
  const go=k=>{cur=(cur+k+n)%n;show();};
  const close=()=>{host.remove();document.removeEventListener("keydown",key,true);};
  const key=ev=>{if(ev.key==="Escape"){ev.stopPropagation();close();}else if(ev.key==="ArrowLeft"){go(-1);}else if(ev.key==="ArrowRight"){go(1);}};
  document.addEventListener("keydown",key,true);
  host.addEventListener("click",ev=>{if(ev.target.closest("[data-lbprev]"))go(-1);else if(ev.target.closest("[data-lbnext]"))go(1);else if(ev.target.closest("[data-lbclose]")||ev.target===host)close();});
  show();
}
document.addEventListener("click",async ev=>{const T=ev.target;if(!T.closest)return;let el;
  if((el=T.closest("[data-phi]"))){const e=S.view==="podujatie"&&get("events",S.id),a=e&&phCur(e);if(a)phOpen(a.url,+el.dataset.phi);return;}
  if((el=T.closest("[data-phtab]"))){S._phsel[el.dataset.phev]=el.dataset.phtab;S._phform=null;render();return;}
  if((el=T.closest("[data-phadd]"))){S._phform={eid:el.dataset.phadd,mode:"add"};render();setTimeout(()=>{const i=document.getElementById("ph-url");if(i)i.focus();},50);return;}
  if((el=T.closest("[data-phchange]"))){S._phform={eid:el.dataset.phchange,mode:"edit"};render();setTimeout(()=>{const i=document.getElementById("ph-url");if(i)i.select();},50);return;}
  if((el=T.closest("[data-phcancel]"))){S._phform=null;render();return;}
  if((el=T.closest("[data-phrefresh]"))){phLoad(el.dataset.phrefresh,true);return;}
  if((el=T.closest("[data-phsave]"))){const e=get("events",el.dataset.phsave);if(!e)return;const u=((document.getElementById("ph-url")||{}).value||"").trim();
    const A=phAlbums(e).map(a=>Object.assign({},a)),F=S._phform&&S._phform.eid===e.id?S._phform:{mode:"add"},cur=phCur(e);
    if(u&&!phOkUrl(u)){toast("Vložte odkaz na zdieľaný album z Google Fotiek.");return;}
    let L=A;
    if(F.mode==="edit"&&cur){if(!u){if(!await ask("Odobrať tento album z podujatia? V Google Fotkách ostane.","Odobrať"))return;L=A.filter(a=>a.id!==cur.id);}else L=A.map(a=>a.id===cur.id?Object.assign(a,{url:u}):a);}
    else{if(!u){toast("Vložte odkaz na album.");return;}if(A.some(a=>a.url===u)){toast("Tento album už je pridaný.");return;}
      const nid="a"+Date.now().toString(36);L=[...A,{id:nid,url:u}];S._phsel[e.id]=nid;}
    S._phform=null;await upd("events",e.id,{albums:L,photosUrl:L.length?L[0].url:""});return;}
});
/* ===== „Stiahnuť všetky“: fotky v plnej veľkosti cez server (arsp/v1/photo) → jeden ZIP poskladaný v prehliadači (bez kompresie, fotky sú už zbalené) ===== */
const ZCRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const zCrc=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=ZCRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};
function zipBlob(files){  /* files: [{name, data:Uint8Array}] → Blob (ZIP, metóda „uložené“) */
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;const now=new Date();
  const dt=((now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1))&0xFFFF,dd=(((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate())&0xFFFF;
  for(const f of files){const nm=enc.encode(f.name),crc=zCrc(f.data),sz=f.data.length;
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);h.setUint32(14,crc,true);h.setUint32(18,sz,true);h.setUint32(22,sz,true);h.setUint16(26,nm.length,true);h.setUint16(28,0,true);
    parts.push(h.buffer,nm,f.data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);c.setUint32(16,crc,true);c.setUint32(20,sz,true);c.setUint32(24,sz,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cen.push(c.buffer,nm);off+=30+nm.length+sz;}
  const cs=cen.reduce((a,b)=>a+b.byteLength,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,e.buffer],{type:"application/zip"});}
async function phDownloadAll(eid,btn){
  const e=get("events",eid),a=e&&phCur(e),d=a&&S._ph[a.url];const L=(d&&d.photos)||[];if(!L.length){toast("Najprv sa musia načítať fotky.");return;}
  if(!await ask(`Stiahnuť všetkých ${L.length} fotiek v plnej veľkosti do jedného ZIP súboru? Pri veľkom albume to môže trvať niekoľko minút – stránku nezatvárajte.`,"Stiahnuť"))return;
  const lbl=btn.textContent;btn.disabled=true;const out=new Array(L.length);let done=0,bad=0,i=0;
  const ext=t=>/png/.test(t)?"png":/heic|heif/.test(t)?"heic":/gif/.test(t)?"gif":/webp/.test(t)?"webp":/mp4/.test(t)?"mp4":/quicktime/.test(t)?"mov":"jpg";
  const base=String((d.title||e.name||"fotky")).replace(/[\\/:*?"<>|]+/g,"_").trim().slice(0,80)||"fotky";
  const work=async()=>{while(i<L.length){const k=i++;
    try{const r=await fetch(ARSP.rest+"photo?id="+encodeURIComponent(L[k]),{headers:{"X-WP-Nonce":ARSP.nonce},credentials:"same-origin"});if(!r.ok)throw 0;
      const t=r.headers.get("content-type")||"";out[k]={name:`${base}-${String(k+1).padStart(3,"0")}.${ext(t)}`,data:new Uint8Array(await r.arrayBuffer())};}
    catch(_){bad++;}
    done++;btn.textContent=`Sťahujem ${done} / ${L.length}…`;}};
  try{await Promise.all([work(),work(),work(),work()]);
    const files=out.filter(Boolean);if(!files.length){toast("Fotky sa nepodarilo stiahnuť.",6000);return;}
    const a=document.createElement("a");a.href=URL.createObjectURL(zipBlob(files));a.download=(base.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"fotky")+".zip";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
    toast(bad?`Stiahnuté ${files.length} fotiek, ${bad} sa nepodarilo.`:`Stiahnutých ${files.length} fotiek.`,6000);}
  finally{btn.disabled=false;btn.textContent=lbl;}
}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-phall]");if(b){ev.preventDefault();if(!b.disabled)phDownloadAll(b.dataset.phall,b);}});
document.addEventListener("load",ev=>{const im=ev.target;if(!im||im.tagName!=="IMG"||!im.dataset||!im.dataset.phid||!im.naturalHeight)return;
  const r=Math.round(im.naturalWidth/im.naturalHeight*1000)/1000;S._phr[im.dataset.phid]=r;im.parentNode.style.setProperty("--r",r);},true);
