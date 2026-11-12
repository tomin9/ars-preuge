/* ===== Podujatie – záložka Médiá (do 2.0.33 Fotky): zbierky (albums) – každá môže mať album Google Fotiek (url) a ďalšie odkazy (links:
   Spotify, YouTube, Vimeo… s náhľadom, ostatné ako odkaz). Kľúč záložky ostal „fotky“.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-fotky.js. Nie je to samostatný skript. ===== */
S._ph=S._ph||{};
const phRow=id=>`https://lh3.googleusercontent.com/pw/${id}=w1400-h440`;   /* náhľad bez orezania – riadky ako v Google Fotkách */
S._phr=S._phr||{};   /* pomer strán fotiek (šírka/výška), zistený po načítaní náhľadu */
const phFull=id=>`https://lh3.googleusercontent.com/pw/${id}=w2000`;
/* albumy podujatia: nové pole albums [{id,url}]; doterajšie photosUrl = prvý album (ostáva vyplnené kvôli kompatibilite) */
const phAlbums=e=>Array.isArray(e.albums)&&e.albums.length?e.albums.filter(a=>a&&(a.url||(Array.isArray(a.links)&&a.links.length))):(e.photosUrl?[{id:"a0",url:e.photosUrl}]:[]);
/* odkaz → náhľad na prehranie (Spotify, YouTube, Vimeo, SoundCloud); null = obyčajný odkaz */
function mdEmbed(u){u=String(u||"").trim();let m;
  if((m=/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(episode|show|track|album|playlist|artist)\/([A-Za-z0-9]+)/.exec(u)))return{kind:"Spotify",src:`https://open.spotify.com/embed/${m[1]}/${m[2]}`,h:m[1]==="episode"||m[1]==="track"?152:352};
  if((m=/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(u)))return{kind:"YouTube",src:`https://www.youtube-nocookie.com/embed/${m[1]}`,video:1};
  if((m=/vimeo\.com\/(?:video\/)?(\d+)/.exec(u)))return{kind:"Vimeo",src:`https://player.vimeo.com/video/${m[1]}`,video:1};
  if(/soundcloud\.com\//.test(u))return{kind:"SoundCloud",src:`https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&visual=false`,h:166};
  return null;}
const mdHost=u=>{try{return new URL(u).hostname.replace(/^www\./,"");}catch(_){return u;}};
const mdLabel=u=>{const x=mdEmbed(u);return x?x.kind:phOkUrl(u)?"Fotky":mdHost(u);};
S._phsel=S._phsel||{};
const phCur=e=>{const A=phAlbums(e);return A.find(a=>a.id===S._phsel[e.id])||A[0]||null;};
const phOkUrl=u=>/^https?:\/\/(photos\.app\.goo\.gl|photos\.google\.com|goo\.gl)\//i.test(u);
function fotkyTab(e){
  const A=phAlbums(e),cur=phCur(e),eid=esc(e.id);
  if(!A.length)return`<div class="phbar"><div class="ptabs phtabs"><button type="button" class="phadd" data-phadd="${eid}">+ Pridať</button></div></div><div class="empty">Pridajte album z Google Fotiek, video (YouTube, Vimeo) alebo podcast (Spotify) – vložte odkaz.</div>`;
  A.forEach(a=>{if(a.url&&!S._ph[a.url])phFetch(a.url,false).then(()=>{const t=document.querySelector(`[data-phtab="${CSS.escape(a.id)}"]`);if(t&&S.view==="podujatie"&&S.id===e.id)t.outerHTML=phTabBtn(e,a,A,cur);}).catch(()=>{});});
  if(cur.url)setTimeout(()=>phLoad(e.id,false),0);
  const IC={dl:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',rf:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',ed:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',gp:'<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M12 12V3.2A4.4 4.4 0 0 0 7.6 7.6V12z" fill="currentColor"/><path d="M12 12h8.8A4.4 4.4 0 0 0 16.4 7.6H12z" fill="currentColor" opacity=".75"/><path d="M12 12v8.8a4.4 4.4 0 0 0 4.4-4.4V12z" fill="currentColor"/><path d="M12 12H3.2a4.4 4.4 0 0 0 4.4 4.4H12z" fill="currentColor" opacity=".75"/></svg>'};
  return`<div class="phbar"><div class="ptabs phtabs" role="tablist">${A.map(a=>phTabBtn(e,a,A,cur)).join("")}<button type="button" class="phadd" data-phadd="${eid}">+ Pridať</button></div>
    <div class="row phic" style="gap:2px"><button class="tplus" data-phlink="${eid}" title="Pridať odkaz do tejto zbierky (video, podcast, ďalší album…)" aria-label="Pridať odkaz"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>${cur.url?`<a class="tplus" href="${esc(cur.url)}" target="_blank" rel="noopener" title="Otvoriť v Google Fotkách" aria-label="Otvoriť v Google Fotkách">${IC.gp}</a><button class="tplus" data-phall="${eid}" title="Stiahnuť všetky fotky albumu (ZIP)" aria-label="Stiahnuť všetky fotky">${IC.dl}</button><button class="tplus" data-phchange="${eid}" title="Zmeniť odkaz na album" aria-label="Zmeniť odkaz na album">${IC.ed}</button>`:""}<button class="tplus tdel" data-phdel="${eid}" title="Odobrať album z podujatia" aria-label="Odobrať album z podujatia">${TI.del}</button></div></div>
    ${mdLinks(e,cur)}${cur.url?`<div id="ph-box" class="phbox"><div class="empty">Načítavam fotky…</div></div>`:""}`;
}
/* odkazy zbierky: podcasty a videá s prehrávačom, ostatné ako karta s odkazom */
function mdLinks(e,a){const L=Array.isArray(a.links)?a.links:[];if(!L.length)return"";const eid=esc(e.id),ed=accEditRec("events",e)&&!S.readOnly;
  const DEL='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
  return`<div class="mdlist">${L.map(x=>{const m=mdEmbed(x.url),rm=ed?`<button type="button" class="gdrm mdrm" data-mdrm="${eid}|${esc(a.id)}|${esc(x.id)}" title="Odobrať odkaz" aria-label="Odobrať odkaz">${DEL}</button>`:"";
    return m?`<div class="mdi${m.video?" vid":""}">${rm}<iframe src="${esc(m.src)}" title="${esc(m.kind)}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen${m.h?` style="height:${m.h}px"`:""}></iframe></div>`
      :`<div class="mdi lnk">${rm}<a href="${esc(x.url)}" target="_blank" rel="noopener"><b>${esc(x.name||mdHost(x.url))}</b><span class="meta">${esc(x.url)}</span></a></div>`;}).join("")}</div>`;}
const phName=(a,A)=>{const d=a.url&&S._ph[a.url];return String(a.name||"").trim()||(d&&d.title)||(!a.url&&a.links&&a.links[0]?mdLabel(a.links[0].url):"")||"Album "+(A.indexOf(a)+1);};
function phTabBtn(e,a,A,cur){const on=cur&&cur.id===a.id;
  return`<button role="tab" data-phtab="${esc(a.id)}" data-phev="${esc(e.id)}" aria-selected="${on}"${on?' title="Kliknutím premenujete album"':""}>${esc(phName(a,A))}</button>`;}
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
  b.innerHTML=L.length?`<div class="phgrid">${L.map((id,i)=>`<button type="button" class="phi" data-phi="${i}" aria-label="Fotka ${i+1}"${S._phr[id]?` style="--r:${S._phr[id]}"`:""}><img src="${phRow(id)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-phid="${esc(id)}"></button>`).join("")}</div><p class="meta" style="margin-top:10px">${L.length} fotiek</p>`:`<div class="empty">V albume sa nenašli žiadne fotky, alebo ich Google nevrátil. Skúste Obnoviť alebo otvorte album v Google Fotkách.</div>`;
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
  if((el=T.closest("[data-phtab]"))){const eid=el.dataset.phev,aid=el.dataset.phtab;if(el.getAttribute("aria-selected")==="true"){phRename(el,eid,aid);return;}S._phsel[eid]=aid;render();return;}
  if((el=T.closest("[data-phadd]"))){phModal(el.dataset.phadd,"add");return;}
  if((el=T.closest("[data-phchange]"))){phModal(el.dataset.phchange,"edit");return;}
  if((el=T.closest("[data-phlink]"))){phModal(el.dataset.phlink,"link");return;}
  if((el=T.closest("[data-mdrm]"))){const[eid,aid,lid]=el.dataset.mdrm.split("|"),e=get("events",eid);if(!e)return;if(!await ask("Odobrať tento odkaz zo zbierky?","Odobrať"))return;
    const N=phAlbums(e).map(a=>a.id===aid?Object.assign({},a,{links:(a.links||[]).filter(x=>x.id!==lid)}):a).filter(a=>a.url||(a.links&&a.links.length));await upd("events",eid,{albums:N,photosUrl:(N.find(a=>a.url)||{}).url||""});return;}
  if((el=T.closest("[data-phdel]"))){const e=get("events",el.dataset.phdel),c=e&&phCur(e);if(!c)return;
    if(!await ask(`Odobrať album „${phName(c,phAlbums(e))}“ z podujatia? V Google Fotkách ostane.`,"Odobrať"))return;
    const N=phAlbums(e).filter(a=>a.id!==c.id);delete S._phsel[e.id];await upd("events",e.id,{albums:N,photosUrl:N.length?N[0].url:""});return;}
  if((el=T.closest("[data-phrefresh]"))){phLoad(el.dataset.phrefresh,true);return;}
});
/* premenovanie albumu priamo v štítku (prázdny názov = názov z Google Fotiek); ukladá sa do albums[].name */
function phRename(btn,eid,aid){const e=get("events",eid);if(!e)return;const A=phAlbums(e),a=A.find(x=>x.id===aid);if(!a)return;
  const inp=document.createElement("input");inp.type="text";inp.className="evb-ren";inp.value=phName(a,A);inp.maxLength=80;inp.style.width=Math.max(120,btn.offsetWidth+16)+"px";inp.setAttribute("aria-label","Názov albumu");
  btn.replaceWith(inp);inp.focus();inp.select();let done=false;
  const fin=async save=>{if(done)return;done=true;const nv=inp.value.trim(),e1=get("events",eid);if(!save||!e1){render();return;}
    const d=S._ph[a.url],auto=(d&&d.title)||"";const name=nv&&nv!==auto?nv:"";if(name===String(a.name||"")){render();return;}
    await upd("events",eid,{albums:phAlbums(e1).map(x=>x.id===aid?Object.assign({},x,{name}):x),photosUrl:(phAlbums(e1)[0]||{}).url||""});};
  inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();fin(true);}else if(ev.key==="Escape"){ev.stopPropagation();fin(false);}});
  inp.addEventListener("blur",()=>fin(true));}
/* okno v strede: pridať album / zmeniť odkaz (prázdny odkaz = odobrať album z podujatia) */
function phModal(eid,mode){const e=get("events",eid);if(!e)return;const cur=phCur(e),L=$("#layer2");
  L.innerHTML=`<div class="scrim mid"><div class="modal" role="dialog" aria-modal="true" aria-label="${mode==="edit"?"Zmeniť odkaz na album":"Pridať"}" style="max-width:520px"><h2 style="margin:0 0 6px">${mode==="edit"?"Zmeniť odkaz na album":mode==="link"?"Pridať odkaz do zbierky":"Pridať"}</h2>
    <p class="small muted" style="margin:0 0 12px">${mode==="edit"?"Vložte odkaz na zdieľaný album z Google Fotiek. Prázdny odkaz album z podujatia odoberie (v Google Fotkách ostane).":"Vložte odkaz – album z Google Fotiek, video (YouTube, Vimeo), podcast (Spotify, SoundCloud) alebo iný odkaz."}</p>
    <input type="url" id="ph-url" value="${esc(mode==="edit"&&cur?cur.url:"")}" placeholder="https://…" style="width:100%">
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="0">Zrušiť</button><button class="btn pri" data-a="ok">Uložiť</button></div></div></div>`;
  const close=()=>{L.innerHTML="";},inp=L.querySelector("#ph-url");
  const save=async()=>{const u=inp.value.trim(),e1=get("events",eid);if(!e1)return close();const A=phAlbums(e1).map(a=>Object.assign({},a)),c=phCur(e1);
    if(u&&mode==="edit"&&!phOkUrl(u)){toast("Vložte odkaz na zdieľaný album z Google Fotiek.");inp.focus();return;}
    if(u&&!/^https?:\/\//i.test(u)){toast("Vložte celý odkaz začínajúci https://");inp.focus();return;}
    const lid="l"+Date.now().toString(36);let N;
    if(mode==="edit"&&c){if(!u){close();if(!await ask("Odobrať tento album z podujatia? V Google Fotkách ostane.","Odobrať"))return;N=A.filter(a=>a.id!==c.id);}else N=A.map(a=>a.id===c.id?Object.assign(a,{url:u}):a);}
    else if(mode==="link"&&c){if(!u){toast("Vložte odkaz.");inp.focus();return;}   /* do vybranej zbierky: album Google Fotiek, ak ešte nemá; inak ďalší odkaz */
      N=A.map(a=>a.id!==c.id?a:(!a.url&&phOkUrl(u)?Object.assign(a,{url:u}):Object.assign(a,{links:[...(a.links||[]),{id:lid,url:u}]})));}
    else{if(!u){toast("Vložte odkaz.");inp.focus();return;}if(A.some(a=>a.url===u)){toast("Tento album už je pridaný.");return;}
      const nid="a"+Date.now().toString(36);N=[...A,phOkUrl(u)?{id:nid,url:u}:{id:nid,url:"",links:[{id:lid,url:u}]}];S._phsel[eid]=nid;}
    close();await upd("events",eid,{albums:N,photosUrl:(N.find(a=>a.url)||{}).url||""});};
  L.querySelector('[data-a="0"]').onclick=close;L.querySelector('[data-a="ok"]').onclick=save;
  inp.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();save();}else if(ev.key==="Escape"){ev.stopPropagation();close();}});
  L.querySelector(".scrim").addEventListener("click",ev=>{if(ev.target===ev.currentTarget)close();});
  setTimeout(()=>{inp.focus();inp.select();},30);}
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
  const lbl=btn.innerHTML;btn.disabled=true;btn.classList.add('busy');const out=new Array(L.length);let done=0,bad=0,i=0;
  const ext=t=>/png/.test(t)?"png":/heic|heif/.test(t)?"heic":/gif/.test(t)?"gif":/webp/.test(t)?"webp":/mp4/.test(t)?"mp4":/quicktime/.test(t)?"mov":"jpg";
  const base=String((d.title||e.name||"fotky")).replace(/[\\/:*?"<>|]+/g,"_").trim().slice(0,80)||"fotky";
  const work=async()=>{while(i<L.length){const k=i++;
    try{const r=await fetch(ARSP.rest+"photo?id="+encodeURIComponent(L[k]),{headers:{"X-WP-Nonce":ARSP.nonce},credentials:"same-origin"});if(!r.ok)throw 0;
      const t=r.headers.get("content-type")||"";out[k]={name:`${base}-${String(k+1).padStart(3,"0")}.${ext(t)}`,data:new Uint8Array(await r.arrayBuffer())};}
    catch(_){bad++;}
    done++;toast(`Sťahujem fotky ${done} / ${L.length}…`,60000);}};
  try{await Promise.all([work(),work(),work(),work()]);
    const files=out.filter(Boolean);if(!files.length){toast("Fotky sa nepodarilo stiahnuť.",6000);return;}
    const a=document.createElement("a");a.href=URL.createObjectURL(zipBlob(files));a.download=(base.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"fotky")+".zip";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);
    toast(bad?`Stiahnuté ${files.length} fotiek, ${bad} sa nepodarilo.`:`Stiahnutých ${files.length} fotiek.`,6000);}
  finally{btn.disabled=false;btn.classList.remove('busy');btn.innerHTML=lbl;}
}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-phall]");if(b){ev.preventDefault();if(!b.disabled)phDownloadAll(b.dataset.phall,b);}});
document.addEventListener("load",ev=>{const im=ev.target;if(!im||im.tagName!=="IMG"||!im.dataset||!im.dataset.phid||!im.naturalHeight)return;
  const r=Math.round(im.naturalWidth/im.naturalHeight*1000)/1000;S._phr[im.dataset.phid]=r;im.parentNode.style.setProperty("--r",r);},true);
