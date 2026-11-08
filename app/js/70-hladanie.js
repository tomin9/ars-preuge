/* ===== Hľadanie (lupa, Ctrl+K).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/70-hladanie.js. Nie je to samostatný skript. ===== */
/* ================= search palette ================= */
function openSearch(){
  const L=$("#layer");L.innerHTML=`<div class="scrim" id="pal-scrim"><div class="modal pal" role="dialog" aria-modal="true" aria-label="Hľadať"><input type="search" id="pal-q" placeholder="Hľadať úlohy, projekty, granty, podujatia, kontakty, platby…" autocomplete="off"><div class="res" id="pal-res"></div></div></div>`;
  const inp=$("#pal-q"),res=$("#pal-res");let hits=[],hl=0;
  const drawRes=()=>{const q=inp.value.trim().toLowerCase();hits=[];
    if(q){for(const k of ["projects","grants","events","tasks","contacts","ledger","lines"]){S.d[k].forEach(r=>{const t=ttl(k,r);const hay=(t+" "+(r.org||"")+" "+(k==="grants"?provName(r):"")+" "+(r.docNo||"")+" "+(r.email||"")).toLowerCase();if(hay.includes(q))hits.push({k,r,t,i:t.toLowerCase().indexOf(q)});});}
      hits.sort((a,b)=>(a.i<0?99:a.i)-(b.i<0?99:b.i));hits=hits.slice(0,30);}
    else hits=[...KEYS.filter(k=>k!=="comments"&&k!=="partnerships"&&k!=="zab"&&k!=="zabd").flatMap(k=>S.d[k].map(r=>({k,r,t:ttl(k,r),u:r.updatedAt||0})))].sort((a,b)=>b.u-a.u).slice(0,8);
    hl=Math.min(hl,Math.max(hits.length-1,0));
    res.innerHTML=hits.length?(q?"":'<div class="meta" style="padding:6px 12px">Naposledy upravené</div>')+hits.map((h,i)=>`<button class="${i===hl?"hl":""}" data-i="${i}">${h.k==="projects"?`<i class="dot" style="background:${esc(h.r.color||GRAY)}"></i>`:""}<span>${esc(h.t)}</span><span class="k">${esc(ENT[h.k].one)}</span></button>`).join(""):`<div class="empty" style="padding:12px 14px">Nič sa nenašlo.</div>`;
    res.querySelectorAll("button").forEach(b=>b.onclick=()=>pick(+b.dataset.i));};
  const pick=i=>{const h=hits[i];if(!h)return;L.innerHTML="";openRec(h.k,h.r.id);};
  inp.oninput=()=>{hl=0;drawRes();};
  inp.onkeydown=e=>{if(e.key==="ArrowDown"){e.preventDefault();hl=Math.min(hl+1,hits.length-1);drawRes();}else if(e.key==="ArrowUp"){e.preventDefault();hl=Math.max(hl-1,0);drawRes();}else if(e.key==="Enter"){e.preventDefault();pick(hl);}};
  $("#pal-scrim").addEventListener("mousedown",e=>{if(e.target.id==="pal-scrim")L.innerHTML="";});
  drawRes();inp.focus();
}

