/* ===== Podujatie – rozpočet: presúvanie riadkov platieb ťahaním a uloženie poradia.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-poradie-platieb.js. Nie je to samostatný skript. ===== */
/* ===== drag to reorder rows (event budget) ===== */
(function(){let D=null;
  const rowOf=el=>el&&el.closest&&el.closest("tr");
  const clear=()=>document.querySelectorAll(".rdrop-t,.rdrop-b,.rdrag").forEach(x=>x.classList.remove("rdrop-t","rdrop-b","rdrag"));
  const target=(x,y)=>{const el=document.elementFromPoint(x,y);const tr=rowOf(el);return tr&&tr!==D.tr&&tr.parentNode===D.tr.parentNode&&tr.querySelector("[data-rowdrag]")?tr:null;};
  document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-rowdrag]")){e.stopPropagation();e.preventDefault();}},true);
  document.addEventListener("pointerdown",e=>{const h=e.target.closest&&e.target.closest("[data-rowdrag]");if(!h||e.button>0)return;e.preventDefault();
    D={h,tr:rowOf(h),y:e.clientY,on:false};
    const mv=ev=>{if(!D)return;if(!D.on){if(Math.abs(ev.clientY-D.y)<4)return;D.on=true;D.tr.classList.add("rdrag");document.body.style.userSelect="none";}
      ev.preventDefault();document.querySelectorAll(".rdrop-t,.rdrop-b").forEach(x=>x.classList.remove("rdrop-t","rdrop-b"));
      const t=target(ev.clientX,ev.clientY);if(t){const r=t.getBoundingClientRect();t.classList.add(ev.clientY>r.top+r.height/2?"rdrop-b":"rdrop-t");}};
    const up=async ev=>{window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);document.body.style.userSelect="";
      const d=D;D=null;if(!d||!d.on){clear();return;}const t=(()=>{D=d;const r=target(ev.clientX,ev.clientY);D=null;return r;})();
      if(!t){clear();return;}const after=ev.clientY>t.getBoundingClientRect().top+t.getBoundingClientRect().height/2;
      const ids=[...d.tr.parentNode.querySelectorAll("[data-rowdrag]")].map(x=>x.dataset.rowdrag);const mid=d.h.dataset.rowdrag,tid=t.querySelector("[data-rowdrag]").dataset.rowdrag;
      const order=ids.filter(x=>x!==mid);let i=order.indexOf(tid);if(after)i++;order.splice(i,0,mid);clear();
      await reorderLedger(order,mid);};
    window.addEventListener("pointermove",mv,{passive:false});window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);});
})();
async function reorderLedger(order,moved){
  const recs=order.map(id=>get("ledger",id)).filter(Boolean);
  const ok=recs.every((r,i)=>typeof r.ord==="number"&&(i===0||recs[i-1].ord<r.ord));
  const allHave=recs.every(r=>typeof r.ord==="number");
  if(allHave&&!ok){const i=order.indexOf(moved);const prev=recs[i-1],next=recs[i+1];
    let o=prev&&next?(prev.ord+next.ord)/2:prev?prev.ord+1000:next?next.ord-1000:0;
    if(prev&&next&&!(next.ord-prev.ord>1e-6)){o=null;}
    if(o!==null){await upd("ledger",moved,{ord:o});return;}}
  if(ok)return;
  toast("Ukladám poradie…");for(let i=0;i<recs.length;i++){const want=(i+1)*1000;if(recs[i].ord!==want)await upd("ledger",recs[i].id,{ord:want});}toast("Poradie uložené.");
}
