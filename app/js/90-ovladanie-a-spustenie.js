/* ===== Ovládanie obrazoviek po vykreslení (bindView) a spustenie aplikácie (boot).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/90-ovladanie-a-spustenie.js. Nie je to samostatný skript. ===== */
function bindView(){
  const v=$("#view");zbBind(v);const on=(sel,ev,fn)=>{const el=v.querySelector(sel);if(el)el.addEventListener(ev,fn);};
  v.querySelectorAll("[data-etab]").forEach(b=>b.onclick=()=>{S.ef.tab=b.dataset.etab;render();});
  v.querySelectorAll("[data-emode]").forEach(b=>b.onclick=()=>{S.ef.mode=b.dataset.emode;render();});
  v.querySelectorAll("[data-gtab]").forEach(b=>b.onclick=()=>{S.gf.tab=b.dataset.gtab;render();});
  v.querySelectorAll("[data-ptab]").forEach(b=>b.onclick=()=>{S.ptab=b.dataset.ptab;render();});
  v.querySelectorAll("[data-pfyear]").forEach(b=>b.onclick=()=>{S.pf2.year=b.dataset.pfyear;render();});
  v.querySelectorAll("[data-pftab]").forEach(b=>b.onclick=()=>{S.pf2.tab=b.dataset.pftab;render();});
  v.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>{S.pm=b.dataset.pm;render();});
  v.querySelectorAll(".gcard").forEach(c=>c.onkeydown=ev=>{if(ev.key==="Enter")c.click();});
  v.querySelectorAll("[data-pf]").forEach(b=>b.onclick=()=>{S.pf=b.dataset.pf;render();});
  v.querySelectorAll("[data-tmode]").forEach(b=>b.onclick=()=>{S.tf.mode=b.dataset.tmode;render();});
  v.querySelectorAll("[data-gmode]").forEach(b=>b.onclick=()=>{S.gf.mode=b.dataset.gmode;render();});
  v.querySelectorAll("[data-grtab]").forEach(b=>b.onclick=()=>{S.grtab=b.dataset.grtab;render();});
  on("#g-text","change",e=>upd("grants",S.id,{text:e.target.value}));v.querySelectorAll("[data-gf]").forEach(t=>t.onchange=()=>upd("grants",S.id,{[t.dataset.gf]:t.value}));v.querySelectorAll("[data-callimp]").forEach(b=>b.onclick=()=>callImport(b.dataset.callimp));
  v.querySelectorAll("[data-evtab]").forEach(b=>b.onclick=()=>{S.evtab=b.dataset.evtab;render();});
  {const ev=S.view==="podujatie"&&get("events",S.id);if(ev){
    const setEv=d=>upd("events",ev.id,d);
    v.querySelectorAll("[data-evbmode]").forEach(x=>x.onclick=()=>{S.evb.mode=x.dataset.evbmode;render();});v.querySelectorAll("[data-unl]").forEach(x=>x.onclick=()=>{S.evb.unl=!S.evb.unl;render();});
    v.querySelectorAll("[data-evb]").forEach(x=>x.onclick=()=>{if(x._moved){x._moved=false;return;}const k=x.dataset.evb,now=Date.now(),lc=S._evbClick;S._evbClick={k,t:now};
      if(k&&k!=="__none"&&lc&&lc.k===k&&now-lc.t<450){S._evbClick=null;const b2=v.querySelector(`[data-evbdrag="${CSS.escape(k)}"]`);if(b2)evbEdit(b2,ev,k);return;}
      if(S.evb.mode==="sekcie")S.evb.sec=k;else S.evb.gr=k;render();});
    {const keys=()=>[...v.querySelectorAll("[data-evbdrag]")].map(x=>x.dataset.evbdrag);let D=null;
    const clear=()=>v.querySelectorAll(".dropl,.dropr,.dragging").forEach(y=>y.classList.remove("dropl","dropr","dragging"));
    const target=(x,y,ex)=>{const el=document.elementFromPoint(x,y);const t=el&&el.closest&&el.closest("[data-evbdrag]");return t&&t!==ex?t:null;};
    const start=()=>{D.on=true;D.el.classList.add("dragging");document.body.style.userSelect="none";};
    const move=ev2=>{if(!D)return;const dx=ev2.clientX-D.x,dy=ev2.clientY-D.y;
      if(!D.on){if(D.touch){if(Math.abs(dx)>8||Math.abs(dy)>8){clearTimeout(D.tm);D=null;}return;}if(Math.abs(dx)>6)start();else return;}
      ev2.preventDefault();v.querySelectorAll(".dropl,.dropr").forEach(y=>y.classList.remove("dropl","dropr"));
      const t=target(ev2.clientX,ev2.clientY,D.el);if(t){const r=t.getBoundingClientRect();t.classList.add(ev2.clientX>r.left+r.width/2?"dropr":"dropl");}};
    const up=ev2=>{if(!D)return;clearTimeout(D.tm);const d=D;D=null;document.body.style.userSelect="";
      window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);window.removeEventListener("touchmove",tmove);
      if(!d.on){return;}d.el._moved=true;const t=target(ev2.clientX,ev2.clientY,d.el);clear();if(!t)return;
      const r=t.getBoundingClientRect(),after=ev2.clientX>r.left+r.width/2;const k=d.el.dataset.evbdrag;
      const a=keys().filter(x=>x!==k);let i=a.indexOf(t.dataset.evbdrag);if(after)i++;a.splice(i,0,k);
      setEv(S.evb.mode==="sekcie"?{sections:a}:{provOrder:a});};
    const tmove=ev2=>{if(D&&D.on)ev2.preventDefault();};
    v.querySelectorAll("[data-evbdrag]").forEach(x=>x.addEventListener("pointerdown",ev2=>{if(ev2.button>0)return;
      D={el:x,x:ev2.clientX,y:ev2.clientY,on:false,touch:ev2.pointerType==="touch"};
      if(D.touch)D.tm=setTimeout(()=>{if(D&&!D.on){start();if(navigator.vibrate)try{navigator.vibrate(15);}catch(_){}}},350);
      window.addEventListener("pointermove",move,{passive:false});window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);window.addEventListener("touchmove",tmove,{passive:false});}));}
    on("#evb-newsec","keydown",e=>{if(e.key!=="Enter")return;const t=e.target.value.trim();if(!t)return;const a=[...(ev.sections||[])];if(!a.includes(t))a.push(t);S.evb.sec=t;if(!baseCats().includes(t))saveSettings({cats:[...baseCats(),t]});setEv({sections:a});});
    on("#ev-dram","change",e=>setEv({dramaturgy:e.target.value}));
    on("#ev-mkt","change",e=>setEv({marketing:e.target.value}));
    on("#ev-prog-add","click",()=>setEv({program:[...(ev.program||[]),{time:"",title:"",contactId:"",place:""}]}));
    v.querySelectorAll("[data-prog]").forEach(inp=>inp.onchange=()=>{const[i,k]=inp.dataset.prog.split(":");const a=(ev.program||[]).map(x=>({...x}));if(!a[+i])return;a[+i][k]=inp.value;setEv({program:a});});
    v.querySelectorAll("[data-progdel]").forEach(x=>x.onclick=()=>{const a=(ev.program||[]).filter((_,i)=>i!==+x.dataset.progdel);setEv({program:a});});
    v.querySelectorAll("[data-mk]").forEach(x=>x.onclick=ev2=>{ev2.stopPropagation();const a=evMkt(ev).map(y=>({...y}));a[+x.dataset.mk].d=!a[+x.dataset.mk].d;setEv({mkt:a});});
    v.querySelectorAll("[data-mkdel]").forEach(x=>x.onclick=()=>{setEv({mkt:evMkt(ev).filter((_,i)=>i!==+x.dataset.mkdel)});});
    on("#ev-mk-add","keydown",e=>{if(e.key!=="Enter"||!e.target.value.trim())return;const a=evMkt(ev).map(y=>({...y}));a.push({t:e.target.value.trim(),d:false});e.target.value="";setEv({mkt:a});});
    v.querySelectorAll("[data-docdel]").forEach(x=>x.onclick=async()=>{if(await ask("Odstrániť dokument zo zoznamu?","Odstrániť"))setEv({docs:(ev.docs||[]).filter((_,i)=>i!==+x.dataset.docdel)});});
    on("#ev-doc-link","click",()=>{const f=$("#ev-doc-form");f.hidden=!f.hidden;if(!f.hidden)$("#ev-doc-name").focus();});
    on("#ev-doc-save","click",()=>{const n=$("#ev-doc-name").value.trim(),u=$("#ev-doc-url").value.trim();if(!u){toast("Vložte odkaz.");return;}setEv({docs:[...(ev.docs||[]),{name:n||u,url:u,at:Date.now()}]});});
    on("#ev-doc-file","change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const d=await uploadDoc(f,{en:"events",id:ev.id,kind:""});e.target.value="";if(d)await setEv({docs:[...(ev.docs||[]),Object.assign(d,{at:Date.now()})]});});
  }}
  v.querySelectorAll("[data-fyear]").forEach(b=>b.onclick=()=>{S.ff.year=b.dataset.fyear;render();});v.querySelectorAll("[data-fftoggle]").forEach(b=>b.onclick=()=>{S.ffOpen=!S.ffOpen;render();});v.querySelectorAll("[data-ffclear]").forEach(b=>b.onclick=()=>{Object.assign(S.ff,{acct:"",type:"",project:"",grant:""});render();});
  v.querySelectorAll("[data-ftab]").forEach(b=>b.onclick=()=>{S.ff.tab=b.dataset.ftab;render();});
  ["project","who","type","org"].forEach(k=>on("#tf-"+k,"change",e=>{S.tf[k]=e.target.value;render();}));
  on("#tf-q","input",e=>{S.tf.q=e.target.value;render();});
  on("#tf-alldone","click",()=>{S.tf.allDone=!S.tf.allDone;render();});
  on("#qa","keydown",async e=>{if(e.key!=="Enter"||!e.target.value.trim())return;const t=e.target.value.trim();e.target.value="";
    const d={title:t,status:"inbox",priority:"normalne",org:"ars"};if(S.tf.project)d.projectId=S.tf.project;if(S.tf.who==="__me"&&meId())d.assignee=meId();await add("tasks",d);});
  ["year","acct","type","project","grant"].forEach(k=>on("#ff-"+k,"change",e=>{S.ff[k]=e.target.value;render();}));
  on("#ff-q","input",e=>{S.ff.q=e.target.value;render();});
  on("#cf-q","input",e=>{S.cf.q=e.target.value;render();});
  v.querySelectorAll("[data-cvol]").forEach(b=>b.onclick=()=>{S.cf.tag=S.cf.tag===b.dataset.cvol?"":b.dataset.cvol;render();});
  v.querySelectorAll("[data-ctab]").forEach(b=>b.onclick=()=>{S.cf.tab=b.dataset.ctab;S.cf.tag="";render();});
  v.querySelectorAll("[data-itab]").forEach(b=>b.onclick=()=>{S.inf.tab=b.dataset.itab;render();});
  v.querySelectorAll("[data-isec]").forEach(b=>b.onclick=()=>{S.inf.sec=b.dataset.isec;render();});
  v.querySelectorAll("[data-ittab]").forEach(b=>b.onclick=()=>{S.inf.ttab=b.dataset.ittab;render();});
  on("#if-q","input",e=>{S.inf.q=e.target.value;render();});
  ["item","pay"].forEach(k=>on("#if-"+k,"change",e=>{S.inf[k]=e.target.value;render();}));
  on("#cf-state","change",e=>{S.cf.state=e.target.value;render();});
  on("#cf-ev","change",e=>{S.cf.ev=e.target.value;render();});
  on("#cf-copy","click",async()=>{const m=(S._clist||[]).filter(c=>c.email).map(c=>c.email).join(", ");try{await navigator.clipboard.writeText(m);toast("E-maily skopírované.");}catch(_){toast("Kopírovanie nie je dostupné.");}});
  on("#ef-past","click",()=>{S.ef.past=!S.ef.past;render();});
  on("#pj-ledger","click",e=>{S.ff=Object.assign(S.ff,{tab:"dennik",project:e.target.dataset.pid,grant:"",year:String(new Date().getFullYear()),acct:"",type:"",q:""});go("financie");});
  on("#cal-prev","click",()=>{S.cal.m--;if(S.cal.m<0){S.cal.m=11;S.cal.y--;}render();});
  on("#cal-next","click",()=>{S.cal.m++;if(S.cal.m>11){S.cal.m=0;S.cal.y++;}render();});
  on("#cal-now","click",()=>{const n=new Date();S.cal={y:n.getFullYear(),m:n.getMonth()};render();});
  on("#g-ck-add","keydown",e=>{if(e.key!=="Enter"||!e.target.value.trim())return;const g=get("grants",S.id);const a=(g.checklist||[]).map(x=>({...x}));a.push({t:e.target.value.trim(),d:false});e.target.value="";upd("grants",g.id,{checklist:a});});
  on("#st-bank","change",e=>saveSettings({openBank:e.target.value===""?null:+e.target.value}));
  on("#st-cash","change",e=>saveSettings({openCash:e.target.value===""?null:+e.target.value}));
  on("#st-cats","change",e=>saveSettings({cats:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)}));
  on("#st-types","change",e=>saveSettings({ttypes:e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)}));
  bindDnD(v);
}
$("#sidescrim").onclick=closeSide;
document.addEventListener("keydown",e=>{if(e.altKey&&e.key==="ArrowLeft"){e.preventDefault();goBack();}});
boot();

