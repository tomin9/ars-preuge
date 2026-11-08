/* ===== Export do CSV: peňažný denník a podklad k vyúčtovaniu grantu.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/71-export.js. Nie je to samostatný skript. ===== */
/* ================= export ================= */
async function exportCsv(kind,id){
  if(!dl)return;const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;const n=v=>(Math.round((+v||0)*100)/100).toFixed(2).replace(".",",");
  const lc=ledgerCalc();let rows,name;
  if(kind==="grant"){
    const g=get("grants",id);if(!g)return;const c=grantCalc(g);
    rows=[[ORG.name+", IČO "+ORG.ico],["Podklad k vyúčtovaniu: "+(g.name||"")],["Poskytovateľ: "+provName(g)+(g.contractNo?", zmluva č. "+g.contractNo:"")],["Schválená suma: "+n(g.approved)+" €"],[],
      ["Rozpočtová položka","P. č.","Dátum","Doklad č.","Popis","Dodávateľ","Z dotácie","Spolufinancovanie","Vyplatené"]];
    const Ln=S.d.lines.filter(l=>l.grantId===g.id);
    const groups=[...Ln.map(l=>({name:l.name||"Položka",L:c.L.filter(x=>x.lineId===l.id&&x.type!=="prijem"),l})),{name:"Bez priradenej položky",L:c.L.filter(x=>!x.lineId&&x.type!=="prijem")}];
    groups.forEach(gr=>{if(!gr.L.length&&!gr.l)return;gr.L.sort((a,b)=>(a.date||"").localeCompare(b.date||"")).forEach(x=>rows.push([gr.name,(lc.map[x.id]||{}).seq,fdate(x.date),x.docNo,x.desc,ttl("contacts",get("contacts",x.contactId)),cofinG(x)?"":n(x.amount),cofinG(x)?n(x.amount):"",x.paid===false?"nie":"áno"]));
      rows.push([gr.name+" – spolu","","","","","",n(sum(gr.L.filter(x=>!cofinG(x)),x=>x.amount)),n(sum(gr.L.filter(x=>cofinG(x)),x=>x.amount)),gr.l&&gr.l.fromGrant?"rozpočet z dotácie "+n(gr.l.fromGrant):""]);});
    rows.push([],["SPOLU","","","","","",n(c.sg),n(c.sc),""]);
    name=`vyuctovanie-${(g.name||"grant").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").slice(0,40)}.csv`;
  }else{
    const list=[...ledgerFiltered()].sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.createdAt||0)-(b.createdAt||0));
    rows=[["P. č.","Dátum","Typ","Účet","Popis","Komu / od koho","Doklad č.","Projekt","Grant","Rozpočtová položka","Kategória","Príjem","Výdavok","Zost. banka","Zost. pokladňa","Vyplatené","Spolufinancovanie"]];
    list.forEach(x=>{const m=lc.map[x.id]||{};rows.push([m.seq,fdate(x.date),optL("ltype",x.type),optL("acct",x.account||"banka"),x.desc,ttl("contacts",get("contacts",x.contactId)),x.docNo,ttl("projects",get("projects",x.projectId)),ttl("grants",get("grants",x.grantId)),ttl("lines",get("lines",x.lineId)),x.category,x.type==="prijem"?n(x.amount):"",x.type!=="prijem"?n(x.amount):"",n(m.bank),n(m.cash),x.paid===false?"nie":"áno",ttl("grants",get("grants",cofinG(x)))]);});
    name=`penazny-dennik-${S.ff.year||"vsetko"}-${today()}.csv`;
  }
  const csv="\ufeff"+rows.map(r=>r.map(q).join(";")).join("\r\n");
  try{await dl.save({filename:name,data:csv});}catch(e){if(e&&e.code!=="declined")toast("Export sa nepodaril.");}
}

