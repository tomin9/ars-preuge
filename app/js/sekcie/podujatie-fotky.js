/* ===== Podujatie – záložka Fotky (album Google Fotiek, prezeranie).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-fotky.js. Nie je to samostatný skript. ===== */
S._ph=S._ph||{};
const phThumb=(id,w)=>`https://lh3.googleusercontent.com/pw/${id}=w${w}-h${Math.round(w*0.75)}-c`;
const phFull=id=>`https://lh3.googleusercontent.com/pw/${id}=w2000`;
function fotkyTab(e){
  const url=e.photosUrl||"";
  if(!url)return`<div class="panel"><h2>Fotky</h2><p class="meta" style="white-space:normal;margin:6px 0 10px">Vložte odkaz na zdieľaný album z Google Fotiek (napr. https://photos.app.goo.gl/…) a fotky sa zobrazia tu.</p><div class="row" style="gap:8px;flex-wrap:nowrap"><input type="url" id="ph-url" placeholder="https://photos.app.goo.gl/…" style="flex:1;min-width:0"><button class="btn pri" data-phsave="${esc(e.id)}">Uložiť</button></div></div>`;
  setTimeout(()=>phLoad(e.id,false),0);
  return`<div class="phbar"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Otvoriť album v Google Fotkách ↗</a><button class="btn ghost" data-phrefresh="${esc(e.id)}">Obnoviť</button><button class="btn ghost" data-phchange="${esc(e.id)}">Zmeniť odkaz</button></div><div id="ph-box" class="phbox"><div class="empty">Načítavam fotky…</div></div>`;
}
async function phLoad(eid,refresh){
  const e=get("events",eid),box=document.getElementById("ph-box");if(!e||!box||!e.photosUrl)return;
  const url=e.photosUrl;let d=S._ph[url];
  if(!d||refresh){box.innerHTML=`<div class="empty">Načítavam fotky…</div>`;
    try{const r=await fetch(ARSP.rest+"photos?url="+encodeURIComponent(url)+(refresh?"&refresh=1":""),{headers:{"X-WP-Nonce":ARSP.nonce},credentials:"same-origin",cache:"no-store"});const j=await r.json().catch(()=>null);
      if(!r.ok)throw new Error((j&&j.message)||("HTTP "+r.status));d=S._ph[url]=j;}
    catch(er){const b2=document.getElementById("ph-box");if(b2)b2.innerHTML=`<div class="empty">Náhľady fotiek sa nepodarilo načítať${er&&er.message?` (${esc(er.message)})`:""}. Album môžete otvoriť v Google Fotkách.</div>`;return;}}
  const b=document.getElementById("ph-box");if(!b)return;
  const L=(d&&d.photos)||[];
  b.innerHTML=L.length?`<div class="phgrid">${L.map((id,i)=>`<button type="button" class="phi" data-phi="${i}" aria-label="Fotka ${i+1}"><img src="${phThumb(id,480)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join("")}</div><p class="meta" style="margin-top:10px">${L.length} fotiek${d.title?` · ${esc(d.title)}`:""}</p>`:`<div class="empty">V albume sa nenašli žiadne fotky, alebo ich Google nevrátil. Skúste Obnoviť alebo otvorte album v Google Fotkách.</div>`;
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
document.addEventListener("click",ev=>{
  const t=ev.target.closest&&ev.target.closest("[data-phi]");if(t){const e=S.view==="podujatie"&&get("events",S.id);if(e&&e.photosUrl)phOpen(e.photosUrl,+t.dataset.phi);return;}
  const sv=ev.target.closest&&ev.target.closest("[data-phsave]");if(sv){const v=(document.getElementById("ph-url")||{}).value||"";const u=v.trim();if(!/^https?:\/\/(photos\.app\.goo\.gl|photos\.google\.com|goo\.gl)\//i.test(u)){toast("Vložte odkaz na zdieľaný album z Google Fotiek.");return;}upd("events",sv.dataset.phsave,{photosUrl:u});return;}
  const rf=ev.target.closest&&ev.target.closest("[data-phrefresh]");if(rf){phLoad(rf.dataset.phrefresh,true);return;}
  const ch=ev.target.closest&&ev.target.closest("[data-phchange]");if(ch){const e=get("events",ch.dataset.phchange);if(e)upd("events",e.id,{photosUrl:""});return;}
});
