/* ===== Grant – „Načítať výzvu“ cez Claude: odkaz alebo PDF → server (inc/claude.php) → prehľad na potvrdenie → uloženie vybraných polí.
   Nič sa neuloží bez potvrdenia; prepísať existujúcu hodnotu treba zaškrtnúť zvlášť. Kľúč k Claude je len na serveri.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/grant-nacitanie.js. Nie je to samostatný skript. ===== */
const AIV_F=[["provider","Poskytovateľ","t"],["program","Program / výzva","t"],["callNo","Číslo výzvy","t"],["callOpen","Podávanie žiadostí od","d"],["submitTo","Uzávierka žiadosti","d"],
  ["callMin","Minimálna dotácia","n"],["callMax","Maximálna dotácia","n"],["cofinPct","Spolufinancovanie","t"],["spendFrom","Čerpanie od","d"],["realFrom","Realizácia od","d"],["realTo","Realizácia do","d"],
  ["settleDue","Termín vyúčtovania","d"],["callUrl","Odkaz na výzvu","t"],["callApplicants","Kto môže žiadať","l"],["callPurpose","Na čo možno dotáciu použiť","l"],["callAttach","Povinné prílohy a podmienky","l"],["callText","Poznámky k výzve","l"]];
const aivShow=(v,t)=>v==null||v===""?'<span class="muted">—</span>':t==="d"?esc(fdate(String(v))):t==="n"?esc(eur(v)):`<span class="aivtx">${esc(String(v))}</span>`;
function aivCur(g,k){if(k==="provider")return provName(g)||"";return g[k]??"";}
function aivOpen(gid){
  const g=get("grants",gid);if(!g)return;
  if(!(window.ARSP&&ARSP.ai)){toast("Napojenie na Claude ešte nie je nastavené – administrátor vloží API kľúč vo WordPresse (Ars Preuge).",7000);return;}
  const L=$("#layer2");const pdfs=(g.docs||[]).filter(d=>d.asset&&/\.pdf$/i.test(d.name||"")).map(d=>[d.asset,d.name]);
  L.innerHTML=`<div class="scrim"><div class="modal aivm" role="dialog" aria-modal="true" aria-label="Načítať výzvu"><h2 style="margin:0 0 6px">Načítať výzvu</h2>
    <p class="small muted" style="margin:0 0 14px">Claude prečíta výzvu a navrhne údaje (termíny, sumy, kto môže žiadať, prílohy…). Pred uložením ich skontrolujete. Trvá to zvyčajne do minúty.</p>
    <div class="dfld"><label for="aiv-url">Odkaz na stránku alebo PDF výzvy</label><input type="url" id="aiv-url" placeholder="https://…" value="${esc(g.callUrl&&/^https?:/.test(g.callUrl)?g.callUrl:"")}" style="width:100%"></div>
    <div class="dfld" style="margin-top:12px"><label for="aiv-file">alebo nahrajte PDF (napr. stiahnuté z grantového systému)</label><input type="file" id="aiv-file" accept="application/pdf,.pdf"></div>
    ${pdfs.length?`<div class="dfld" style="margin-top:12px"><label for="aiv-doc">alebo použite nahraný dokument výzvy</label><select id="aiv-doc" style="width:100%"><option value="">—</option>${pdfs.map(([a,n])=>`<option value="${esc(a)}">${esc(n)}</option>`).join("")}</select></div>`:""}
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="0">Zrušiť</button><button class="btn pri" data-a="go">Načítať</button></div></div></div>`;
  const close=()=>{L.innerHTML="";};
  L.querySelector('[data-a="0"]').onclick=close;
  L.querySelector('[data-a="go"]').onclick=async()=>{
    const url=$("#aiv-url").value.trim(),file=$("#aiv-file").files[0],doc=$("#aiv-doc")?$("#aiv-doc").value:"";
    if(!url&&!file&&!doc){toast("Vložte odkaz alebo vyberte PDF.");return;}
    let req={},src="";
    const box=L.querySelector(".aivm");
    const wait=t=>{box.innerHTML=`<h2 style="margin:0 0 10px">Načítať výzvu</h2><div class="aivwait"><span class="aivspin" aria-hidden="true"></span><span>${esc(t)}</span></div>`;};
    if(file){wait("Nahrávam PDF…");const d=await uploadDoc(file,{en:"grants",id:gid,kind:"vyzva"});if(!d||!d.asset){close();return;}
      const g1=get("grants",gid);await upd("grants",gid,{docs:[...((g1&&g1.docs)||[]),Object.assign(d,{kind:"vyzva",at:Date.now()})]});req={asset:d.asset};src=file.name;}
    else if(doc){req={asset:doc};src=(pdfs.find(x=>x[0]===doc)||[0,"dokument"])[1];}
    else{req={url};src=url;}
    wait("Claude číta výzvu… zvyčajne 20–60 sekúnd, okno nezatvárajte.");
    let j=null,err="";
    try{const r=await fetch(ARSP.rest+"ai/vyzva",{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":ARSP.nonce},credentials:"same-origin",body:JSON.stringify(req)});
      j=await r.json().catch(()=>null);if(!r.ok)err=(j&&j.message)||("Chyba "+r.status);}
    catch(e){err="Spojenie so serverom sa prerušilo. Ak to trvalo dlho, hosting môže mať nízky časový limit – skúste kratší dokument.";}
    if(err||!j||!j.fields){box.innerHTML=`<h2 style="margin:0 0 10px">Načítať výzvu</h2><p class="neg" style="white-space:normal">${esc(err||"Claude nevrátil žiadne údaje.")}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="x">Zavrieť</button></div>`;box.querySelector('[data-a="x"]').onclick=close;return;}
    aivReview(gid,j,src,url,box,close);
  };
}
function aivReview(gid,j,src,url,box,close){
  const g=get("grants",gid)||{},F=j.fields||{};
  if(url&&!F.callUrl&&!g.callUrl)F.callUrl=url;
  const rows=AIV_F.filter(([k])=>F[k]!=null&&F[k]!=="").map(([k,l,t])=>{const cur=aivCur(g,k),same=String(cur)===String(F[k]),empty=cur===""||cur==null;
    const note=k==="provider"&&g.providerId?"poskytovateľ je prepojený s kontaktom – nezmení sa":"";
    return{k,l,t,cur,nv:F[k],same,empty,note};});
  const u=j.usage||{},cost=((+u.input_tokens||0)*4+(+u.output_tokens||0)*20)/1e6;
  if(!rows.length){box.innerHTML=`<h2 style="margin:0 0 10px">Načítať výzvu</h2><p style="white-space:normal">Claude vo výzve nenašiel žiadne z hľadaných údajov.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="x">Zavrieť</button></div>`;box.querySelector('[data-a="x"]').onclick=close;return;}
  box.innerHTML=`<h2 style="margin:0 0 4px">Skontrolujte údaje z výzvy</h2><p class="small muted" style="margin:0 0 10px">Zdroj: ${esc(src)}. Zaškrtnuté polia sa uložia ku grantu. Prázdne polia sú zaškrtnuté vopred, prepísanie existujúcej hodnoty zaškrtnite sami.</p>
    <div class="aivlist">${rows.map((x,i)=>`<label class="aivrow${x.same?" same":""}"><input type="checkbox" data-i="${i}" ${x.empty&&!x.note?"checked":""} ${x.same||x.note?"disabled":""}><span class="aivl">${esc(x.l)}</span><span class="aivv">${aivShow(x.nv,x.t)}${x.same?'<small>rovnaké ako teraz</small>':x.note?`<small>${esc(x.note)}</small>`:!x.empty?`<small>teraz: ${x.t==="l"?esc(String(x.cur).slice(0,90))+(String(x.cur).length>90?"…":""):aivShow(x.cur,x.t)}</small>`:""}</span></label>`).join("")}</div>
    <p class="small muted" style="margin:10px 0 0">Spotreba: ${(+u.input_tokens||0).toLocaleString("sk-SK")} + ${(+u.output_tokens||0).toLocaleString("sk-SK")} tokenov (približne ${cost.toLocaleString("sk-SK",{maximumFractionDigits:2})} $).</p>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="x">Zrušiť</button><button class="btn pri" data-a="save">Uložiť vybrané</button></div>`;
  box.querySelector('[data-a="x"]').onclick=close;
  box.querySelector('[data-a="save"]').onclick=async()=>{
    const p={};box.querySelectorAll("input[data-i]:checked").forEach(c=>{const x=rows[+c.dataset.i];p[x.k]=x.nv;});
    if(!Object.keys(p).length){toast("Nič nie je vybrané.");return;}
    close();await upd("grants",gid,p);toast("Uložené údaje: "+Object.keys(p).length+".");};
}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-aivyzva]");if(b){ev.preventDefault();aivOpen(b.dataset.aivyzva);}});
