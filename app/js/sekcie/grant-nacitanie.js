/* ===== Grant – „Načítať výzvu“ cez Claude: odkaz alebo PDF → server (inc/claude.php) → prehľad na potvrdenie → uloženie vybraných polí.
   Nič sa neuloží bez potvrdenia; prepísať existujúcu hodnotu treba zaškrtnúť zvlášť. Kľúč k Claude je len na serveri.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/grant-nacitanie.js. Nie je to samostatný skript. ===== */
const AIV_F=[["provider","Poskytovateľ","t"],["program","Program / výzva","t"],["callNo","Číslo výzvy","t"],["callOpen","Podávanie žiadostí od","d"],["submitTo","Uzávierka žiadosti","d"],
  ["callMin","Minimálna dotácia","n"],["callMax","Maximálna dotácia","n"],["cofinPct","Spolufinancovanie","t"],["spendFrom","Čerpanie od","d"],["realFrom","Realizácia od","d"],["realTo","Realizácia do","d"],
  ["settleDue","Termín vyúčtovania","d"],["callUrl","Odkaz na výzvu","t"],["callApplicants","Kto môže žiadať","l"],["callPurpose","Na čo možno dotáciu použiť","l"],["callAttach","Povinné prílohy a podmienky","l"],["callText","Poznámky k výzve","l"]];
const aivShow=(v,t)=>v==null||v===""?'<span class="muted">—</span>':t==="d"?esc(fdate(String(v))):t==="n"?esc(eur(v)):`<span class="aivtx">${esc(String(v))}</span>`;
function aivCur(g,k){if(k==="provider")return provName(g)||"";return g[k]??"";}
/* spoločné okno: odkaz / nahrané PDF / PDF z dokumentov grantu → server → done(j,src,url,box,close) */
function aiSource(gid,o){
  const g=get("grants",gid);if(!g)return;
  if(!(window.ARSP&&ARSP.ai)){toast("Napojenie na Claude ešte nie je nastavené – administrátor vloží API kľúč vo WordPresse (Ars Preuge).",7000);return;}
  const L=$("#layer2");const pdfs=(g.docs||[]).filter(d=>d.asset&&/\.pdf$/i.test(d.name||"")).sort((a,b)=>(b.kind===o.kind)-(a.kind===o.kind)).map(d=>[d.asset,d.name]);
  L.innerHTML=`<div class="scrim"><div class="modal aivm" role="dialog" aria-modal="true" aria-label="${o.title}"><h2 style="margin:0 0 6px">${o.title}</h2>
    <p class="small muted" style="margin:0 0 14px">${o.intro} Pred uložením ich skontrolujete. Trvá to zvyčajne do minúty.</p>
    <div class="dfld"><label for="aiv-url">${o.urlLabel}</label><input type="url" id="aiv-url" placeholder="https://…" value="${esc(o.url||"")}" style="width:100%"></div>
    <div class="dfld" style="margin-top:12px"><label for="aiv-file">alebo nahrajte PDF (napr. stiahnuté z grantového systému)</label><input type="file" id="aiv-file" accept="application/pdf,.pdf"></div>
    ${pdfs.length?`<div class="dfld" style="margin-top:12px"><label for="aiv-doc">alebo použite PDF z dokumentov grantu</label><select id="aiv-doc" style="width:100%"><option value="">—</option>${pdfs.map(([a,n])=>`<option value="${esc(a)}">${esc(n)}</option>`).join("")}</select></div>`:""}
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="0">Zrušiť</button><button class="btn pri" data-a="go">Načítať</button></div></div></div>`;
  const close=()=>{L.innerHTML="";};
  L.querySelector('[data-a="0"]').onclick=close;
  L.querySelector('[data-a="go"]').onclick=async()=>{
    const url=$("#aiv-url").value.trim(),file=$("#aiv-file").files[0],doc=$("#aiv-doc")?$("#aiv-doc").value:"";
    if(!url&&!file&&!doc){toast("Vložte odkaz alebo vyberte PDF.");return;}
    let req={},src="";
    const box=L.querySelector(".aivm");
    const wait=t=>{box.innerHTML=`<h2 style="margin:0 0 10px">${o.title}</h2><div class="aivwait"><span class="aivspin" aria-hidden="true"></span><span>${esc(t)}</span></div>`;};
    if(file){wait("Nahrávam PDF…");const d=await uploadDoc(file,{en:"grants",id:gid,kind:o.kind});if(!d||!d.asset){close();return;}
      const g1=get("grants",gid);await upd("grants",gid,{docs:[...((g1&&g1.docs)||[]),Object.assign(d,{kind:o.kind,at:Date.now()})]});req={asset:d.asset};src=file.name;}
    else if(doc){req={asset:doc};src=(pdfs.find(x=>x[0]===doc)||[0,"dokument"])[1];}
    else{req={url};src=url;}
    wait(o.wait+" … zvyčajne 20–60 sekúnd, okno nezatvárajte.");
    let j=null,err="";
    try{const r=await fetch(ARSP.rest+o.endpoint,{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":ARSP.nonce},credentials:"same-origin",body:JSON.stringify(req)});
      j=await r.json().catch(()=>null);if(!r.ok)err=(j&&j.message)||("Chyba "+r.status);}
    catch(e){err="Spojenie so serverom sa prerušilo. Ak to trvalo dlho, hosting môže mať nízky časový limit – skúste kratší dokument.";}
    if(err||!j||!o.ok(j)){box.innerHTML=`<h2 style="margin:0 0 10px">${o.title}</h2><p class="neg" style="white-space:normal">${esc(err||"Claude nevrátil žiadne údaje.")}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="x">Zavrieť</button></div>`;box.querySelector('[data-a="x"]').onclick=close;return;}
    o.done(j,src,url,box,close);
  };
}
const aiCost=u=>{u=u||{};const c=((+u.input_tokens||0)*4+(+u.output_tokens||0)*20)/1e6;return`Spotreba: ${(+u.input_tokens||0).toLocaleString("sk-SK")} + ${(+u.output_tokens||0).toLocaleString("sk-SK")} tokenov (približne ${c.toLocaleString("sk-SK",{maximumFractionDigits:2})} $).`;};
function aivOpen(gid){const g=get("grants",gid);if(!g)return;
  aiSource(gid,{title:"Načítať výzvu",intro:"Claude prečíta výzvu a navrhne údaje (termíny, sumy, kto môže žiadať, prílohy…).",urlLabel:"Odkaz na stránku alebo PDF výzvy",
    url:g.callUrl&&/^https?:/.test(g.callUrl)?g.callUrl:"",kind:"vyzva",endpoint:"ai/vyzva",wait:"Claude číta výzvu",ok:j=>!!j.fields,done:(j,src,url,box,close)=>aivReview(gid,j,src,url,box,close)});}
function aivReview(gid,j,src,url,box,close){
  const g=get("grants",gid)||{},F=j.fields||{};
  if(url&&!F.callUrl&&!g.callUrl)F.callUrl=url;
  const okVal=(k,t)=>{const v=F[k];if(v==null||String(v).trim()==="")return false;if(t==="d")return/^\d{4}-\d{2}-\d{2}$/.test(String(v).trim());if(t==="n")return isFinite(+v);return true;};
  const rows=AIV_F.filter(([k,,t])=>okVal(k,t)).map(([k,l,t])=>{const cur=aivCur(g,k),same=String(cur)===String(F[k]),empty=cur===""||cur==null;
    const note=k==="provider"&&g.providerId?"poskytovateľ je prepojený s kontaktom – nezmení sa":"";
    return{k,l,t,cur,nv:F[k],same,empty,note};});
  if(!rows.length){box.innerHTML=`<h2 style="margin:0 0 10px">Načítať výzvu</h2><p style="white-space:normal">Claude vo výzve nenašiel žiadne z hľadaných údajov.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="x">Zavrieť</button></div>`;box.querySelector('[data-a="x"]').onclick=close;return;}
  box.innerHTML=`<h2 style="margin:0 0 4px">Skontrolujte údaje z výzvy</h2><p class="small muted" style="margin:0 0 10px">Zdroj: ${esc(src)}. Zaškrtnuté polia sa uložia ku grantu. Prázdne polia sú zaškrtnuté vopred, prepísanie existujúcej hodnoty zaškrtnite sami.</p>
    <div class="aivlist">${rows.map((x,i)=>`<label class="aivrow${x.same?" same":""}"><input type="checkbox" data-i="${i}" ${x.empty&&!x.note?"checked":""} ${x.same||x.note?"disabled":""}><span class="aivl">${esc(x.l)}</span><span class="aivv">${aivShow(x.nv,x.t)}${x.same?'<small>rovnaké ako teraz</small>':x.note?`<small>${esc(x.note)}</small>`:!x.empty?`<small>teraz: ${x.t==="l"?esc(String(x.cur).slice(0,90))+(String(x.cur).length>90?"…":""):aivShow(x.cur,x.t)}</small>`:""}</span></label>`).join("")}</div>
    <p class="small muted" style="margin:10px 0 0">${aiCost(j.usage)}</p>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="x">Zrušiť</button><button class="btn pri" data-a="save">Uložiť vybrané</button></div>`;
  box.querySelector('[data-a="x"]').onclick=close;
  box.querySelector('[data-a="save"]').onclick=async()=>{
    const p={};box.querySelectorAll("input[data-i]:checked").forEach(c=>{const x=rows[+c.dataset.i];p[x.k]=x.nv;});
    if(!Object.keys(p).length){toast("Nič nie je vybrané.");return;}
    close();await upd("grants",gid,p);toast("Uložené údaje: "+Object.keys(p).length+".");};
}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-aivyzva]");if(b){ev.preventDefault();aivOpen(b.dataset.aivyzva);}});
/* ===== Záložka Výzva – vzhľad ako Texty podujatia: vľavo (¼) zoznam častí výzvy, vpravo (¾) vybraná časť.
   Texty sa ukladajú do tých istých polí ako doteraz (callApplicants, callPurpose, callAttach, callText); údaje o výzve sa upravujú ceruzkou v hlavnej karte. ===== */
const GV_SEC=[["callApplicants","Kto môže žiadať","Oprávnení žiadatelia…",1],["callPurpose","Na čo možno dotáciu použiť","Oprávnené aktivity a výdavky…",2],["callAttach","Povinné prílohy a podmienky","Prílohy, limity počtu žiadostí…",2],["callText","Poznámky k výzve","Kritériá hodnotenia, dôležité termíny…",0]];
const GV_IC='<path d="M9 5h10M9 12h10M9 19h10"/><circle cx="4.5" cy="5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="19" r="1"/>';
S._gvsel=S._gvsel||{};
function grantCallTab(g){
  const gid=esc(g.id),sel=S._gvsel[g.id]&&GV_SEC.some(([f])=>String(g[f]||"").trim())&&GV_SEC.some(x=>x[0]===S._gvsel[g.id])?S._gvsel[g.id]:"udaje";
  const url=g.callUrl?(/^https?:/.test(g.callUrl)?g.callUrl:"https://"+g.callUrl):"";
  const svg=p=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const dot=f=>`<i class="txdot" style="background:${f?GREEN:GRAY}" title="${f?"Vyplnené":"Prázdne"}"></i>`;
  const filled=[g.callOpen,g.submitTo,g.callMin,g.callMax,g.cofinPct,g.spendFrom].some(Boolean);
  const item=(k,ic,t,sub,f)=>`<button type="button" class="txi${sel===k?" on":""}" data-gvsel="${gid}|${k}">${svg(ic)}<span class="txt"><b>${t}</b><small>${sub}</small></span>${dot(f)}</button>`;
  const fresh=!GV_SEC.some(([f])=>String(g[f]||"").trim());  /* nový grant: len Údaje o výzve a Načítať výzvu, časti pribudnú po načítaní */
  const list=item("udaje",GV_IC,"Údaje o výzve","termíny, sumy, spolufinancovanie",filled)
    +(fresh?"":GV_SEC.map(([f,l,,i])=>{const n=String(g[f]||"").length;return item(f,TXI.ic[i],l,n?`${n.toLocaleString("sk-SK")} znakov`:"zatiaľ prázdne",n>0);}).join(""))
    +`<div class="gdsep"></div><button type="button" class="txi txadd" data-aivyzva="${gid}" title="Claude prečíta výzvu (odkaz alebo PDF) a navrhne údaje">${svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>')}<span class="txt"><b>Načítať výzvu</b></span></button>`
    +(fresh?"":`<button type="button" class="txi txadd" style="margin-top:0" data-callimp="${gid}" title="Vložiť údaje o výzve ručne (text od Claude)">${svg('<path d="M12 5v14M5 12h14"/>')}<span class="txt"><b>Vložiť ručne</b></span></button>`);
  const kick=`<div class="kick">Výzva / ${esc(g.name||"Grant")}</div>`;
  let main;
  if(sel==="udaje"){const it=(l,v)=>`<div class="gvi"><span>${l}</span><b>${v||'<span class="muted">—</span>'}</b></div>`;
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1">${kick}<div class="txtitle" style="font-size:28px;font-weight:600">Údaje o výzve</div></div>
      ${url?`<div class="row" style="flex:none;gap:8px"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Otvoriť výzvu ↗</a></div>`:""}</div>
      <div class="txbar"><span class="meta">Upravujú sa ceruzkou v hlavnej karte grantu alebo cez „Načítať výzvu“.</span></div>
      <div class="gvgrid">${it("Podávanie žiadostí",g.callOpen||g.submitTo?`${g.callOpen?fdate(g.callOpen):"—"} → ${g.submitTo?fdate(g.submitTo):"—"}`:"")}
      ${it("Výška dotácie",g.callMin||g.callMax?`${g.callMin?eur(g.callMin):"—"} – ${g.callMax?eur(g.callMax):"—"}`:"")}
      ${it("Spolufinancovanie",esc(g.cofinPct||""))}${it("Čerpanie od",g.spendFrom?fdate(g.spendFrom):"")}
      ${it("Realizácia",g.realFrom||g.realTo?`${g.realFrom?fdate(g.realFrom):"—"} → ${g.realTo?fdate(g.realTo):"—"}`:"")}${it("Vyúčtovanie do",g.settleDue?fdate(g.settleDue):"")}</div></div>`;}
  else{const[f,l,ph]=GV_SEC.find(x=>x[0]===sel);
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1">${kick}<div class="txtitle" style="font-size:28px;font-weight:600">${l}</div></div>
      </div>
      <div class="txbar">${dot(String(g[f]||"").trim())}<span style="margin-right:auto;margin-left:-4px">${String(g[f]||"").trim()?"Vyplnené":"Prázdne"}</span><span>Z výzvy – dopĺňa sa aj cez „Načítať výzvu“</span></div>
      <div class="txw"><textarea class="txbody" data-gf="${f}" placeholder="${ph}">${esc(g[f]||"")}</textarea><button type="button" class="tplus txcp" data-gvcopy="${f}" title="Kopírovať text" aria-label="Kopírovať text">${TXI.copy}</button></div>
      <div class="txfoot" id="txstat">${txStat(g[f])}</div></div>`;}
  return`<div class="txm"><div class="txlist">${list}</div>${main}</div>`;
}
document.addEventListener("click",async ev=>{const t=ev.target;if(!t.closest)return;let el;
  if((el=t.closest("[data-gvsel]"))){const[gid,k]=el.dataset.gvsel.split("|");S._gvsel[gid]=k;render();return;}
  if((el=t.closest("[data-gvcopy]"))){const ta=document.querySelector(`textarea[data-gf="${el.dataset.gvcopy}"]`);try{await navigator.clipboard.writeText(ta?ta.value:"");toast("Text skopírovaný.");}catch(_){toast("Kopírovanie sa nepodarilo.");}}
});
