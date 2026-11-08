/* ===== Dokumenty – nahrávanie a odkazy (v stránkach aj v bočnom paneli), Google Disk (vypnutý), nahratie do WordPressu.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/64-dokumenty-nahravanie.js. Nie je to samostatný skript. ===== */
/* ===== document attachments (global, works in pages and drawer) ===== */
document.addEventListener("change",ev=>{const sl=ev.target.closest&&ev.target.closest("[data-lline]");if(!sl)return;upd("ledger",sl.dataset.lline,{lineId:sl.value});});
document.addEventListener("change",async ev=>{const inp=ev.target.closest&&ev.target.closest("[data-dfile]");if(!inp)return;const fs=[...(inp.files||[])];if(!fs.length)return;
  const[en,id,kind]=inp.dataset.dfile.split(":");if(!get(en,id))return;const out=[];for(const f of fs){const d=await uploadDoc(f,{en,id,kind});if(d)out.push(Object.assign(d,{kind,at:Date.now()}));}inp.value="";
  if(out.length){await upd(en,id,{docs:[...(get(en,id).docs||[]),...out]});if(DW&&DW.id===id)drawerRefresh(true);}});
document.addEventListener("click",async ev=>{
  const rm=ev.target.closest&&ev.target.closest("[data-docrm]");
  if(rm){ev.stopPropagation();ev.preventDefault();const[en,id,i]=rm.dataset.docrm.split(":");if(await ask("Odstrániť dokument?","Odstrániť")){await upd(en,id,{docs:(get(en,id).docs||[]).filter((_,j)=>j!==+i)});if(DW&&DW.id===id)drawerRefresh(true);}return;}
  const td=ev.target.closest&&ev.target.closest("[data-todrive]");
  if(td){ev.stopPropagation();ev.preventDefault();const[en,id,i]=td.dataset.todrive.split(":");const r=get(en,id);const d=r&&(r.docs||[])[+i];if(!d||!d.asset)return;
    td.disabled=true;td.textContent="Nahrávam…";
    try{const rs=await fetch(ARSP_BLOB+d.asset);if(!rs.ok)throw{code:"blob_"+rs.status,message:"Súbor sa nepodarilo načítať z aplikácie."};const blob=await rs.blob();const ext=(d.name.split(".").pop()||"").toLowerCase();const tp=blob.type||MIME[ext]||"application/octet-stream";
      const f=new File([blob],d.name,{type:tp});const up=await driveUpload(f,tp,((r.date?r.date+" ":"")+d.name).slice(0,180),d.kind||"",targetFolder(en,id));
      const docs=(get(en,id).docs||[]).map((x,j)=>j===+i?Object.assign({name:x.name,kind:x.kind,at:x.at},up,{prevAsset:x.asset}):x);await upd(en,id,{docs});toast("Presunuté na Google Disk.");if(DW&&DW.id===id)drawerRefresh(true);}
    catch(er){td.disabled=false;td.textContent="→ Disk";toast(driveErr(er),12000);}
    return;}
  const btn=ev.target.closest&&ev.target.closest("[data-dlink]");if(!btn)return;ev.stopPropagation();
  const[en,id,kind]=btn.dataset.dlink.split(":");const box=btn.closest(".docslot");if(box.querySelector(".dform"))return;
  const f=document.createElement("div");f.className="dform";f.style.marginTop="8px";f.innerHTML=`<input type="text" placeholder="Názov" style="width:100%;margin-bottom:6px"><div class="row" style="gap:6px"><input type="url" placeholder="https://…" style="flex:1"><button type="button" class="btn sm pri">Uložiť</button></div>`;box.appendChild(f);
  const[n,u]=f.querySelectorAll("input");n.focus();f.querySelector("button").onclick=async()=>{const url=u.value.trim();if(!url){toast("Vložte odkaz.");return;}await upd(en,id,{docs:[...(get(en,id).docs||[]),{name:n.value.trim()||url,url,kind,at:Date.now()}]});if(DW&&DW.id===id)drawerRefresh(true);};
},true);
const LDOCS=[["zmluva","Zmluva"],["faktura","Faktúra / doklad"],["banka","Potvrdenie z banky"]];
const clip=x=>{const n=(x.docs||[]).length;return n?`<span class="clip" title="${n} ${n===1?"príloha":n<5?"prílohy":"príloh"}">📎${n>1?n:""}</span>`:"";};
const DRIVE="Google Drive";
const DRIVE_DIRS={zmluva:"1X6GGFoKP-tRzYyf0NX_s6ldxR6iAo_W2",faktura:"1wRe0Ew-f5C4DUHSO9qFhgMe7KwqzOwUx",banka:"1-NP_JlUYzirhzWnbRRFAGHAVnYzW1w6u",vyuctovanie:"1Y4artJS2KkNYXmzi9hv-b7uz8OHL2wYL",ziadost:"1-Z2r64i2tG6MvMendQ_sMOpmQTk2oREd","":"1-Z2r64i2tG6MvMendQ_sMOpmQTk2oREd"};
const MIME={pdf:"application/pdf",txt:"text/plain",csv:"text/csv",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",heic:"image/heic",webp:"image/webp",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",odt:"application/vnd.oasis.opendocument.text",ods:"application/vnd.oasis.opendocument.spreadsheet",zip:"application/zip"};
let _fileArgs=null;
const folderId=u=>{const m=String(u||"").match(/folders\/([A-Za-z0-9_-]{10,})/)||String(u||"").match(/[?&]id=([A-Za-z0-9_-]{10,})/);return m?m[1]:(/^[A-Za-z0-9_-]{20,}$/.test(u||"")?u:"");};
function targetFolder(en,id){const r=en&&id?get(en,id):null;if(!r)return"";
  if(en==="grants"||en==="events")return folderId(r.driveFolder);
  const g=r.grantId&&get("grants",r.grantId);if(g&&folderId(g.driveFolder))return folderId(g.driveFolder);
  const ev=r.eventId&&get("events",r.eventId);if(ev&&folderId(ev.driveFolder))return folderId(ev.driveFolder);
  const pr=r.projectId&&get("projects",r.projectId);if(pr&&folderId(pr.driveFolder))return folderId(pr.driveFolder);return"";}
const asciiName=(n,tp)=>{let ext=(n.split(".").pop()||"").toLowerCase();if(!ext||ext===n.toLowerCase())ext=(Object.keys(MIME).find(k=>MIME[k]===tp)||"bin");
  const base=n.replace(/\.[^.]+$/,"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9._-]+/g,"_").replace(/_+/g,"_").replace(/^_|_$/g,"").slice(0,80)||"dokument";return base+"."+ext;};
const toB64=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]||"");r.onerror=()=>rej({code:"read_error",message:"Súbor sa nedal načítať."});r.readAsDataURL(f);});
async function driveUpload(f,tp,title,kind,parent){
  if(!mcp)throw{code:"no_mcp",message:"Google Disk nie je pre túto stránku dostupný."};
  if(_fileArgs===null){try{const lt=await mcp.listTools();_fileArgs=!!(lt&&lt.fileArgs);}catch(er){console.warn("[drive] listTools",er);_fileArgs=false;}}
  const dirs=Object.assign({},DRIVE_DIRS,S.settings.driveDirs||{});const parentId=parent||dirs[kind]||dirs[""];
  {const ext=Object.keys(MIME).find(k=>MIME[k]===tp);if(ext&&!new RegExp("\\."+ext+"$","i").test(title))title+="."+ext;}
  const args=c=>({title,parentId,contentMimeType:tp,base64Content:c,disableConversionToGoogleType:true});
  let res;
  const inline=async()=>{if(f.size>700*1024)throw{code:"too_big_inline",message:"Súbor je väčší ako 700 KB a tento prehliadač ho nevie poslať na Disk."};return mcp.callTool(DRIVE,"create_file",args(await toB64(f)),{cache:false});};
  if(_fileArgs){
    try{res=await mcp.callTool(DRIVE,"create_file",args({$file:{data:f,name:asciiName(f.name,tp),type:tp}}),{cache:false});}
    catch(er){console.warn("[drive] file arg",er);if(er&&["bad_request","capability_disabled","transform_error"].includes(er.code)){_fileArgs=false;res=await inline();}else throw er;}
  }else res=await inline();
  console.log("[drive] result",res);
  let p=res&&res.payload;if(typeof p==="string"){try{p=JSON.parse(p);}catch(_){p={};}}p=p||{};
  const id=p.id||(p.file&&p.file.id)||"";const url=p.viewUrl||p.webViewLink||p.alternateLink||(id?`https://drive.google.com/file/d/${id}/view`:"");
  if(!url)throw{code:"no_url",message:"Disk nevrátil odkaz na súbor."};return{url,driveId:id,drive:true};
}
const driveErr=er=>{const c=er&&er.code;console.warn("[drive] error",er);if(c==="no_mcp")return"Google Disk nie je v tomto zobrazení dostupný. Otvor aplikáciu v claude.ai prihlásený a povoľ jej Google Drive (menu Povolenia pri artefakte).";
  const M={server_not_connected:"Google Drive nie je pripojený v claude.ai (Nastavenia → Konektory).",needs_reauth:"Google Drive treba znova prihlásiť v claude.ai (Nastavenia → Konektory).",not_in_manifest:"Prístup k Google Disku pre túto stránku nie je povolený (menu Povolenia pri artefakte).",approval_required:"Nahratie na Disk čaká na tvoje povolenie – skús znova a potvrď.",not_granted:"Táto stránka nemá povolený Google Disk.",capability_disabled:"Google Disk sa v tomto zobrazení nedá použiť.",server_unavailable:"Google Disk teraz neodpovedá – skús o chvíľu.",selection_required:"V claude.ai máš viac Google Drive konektorov – vyber jeden.",blocked_by_policy:"Nahrávanie na Disk blokuje nastavenie organizácie."};
  return (M[c]||"Na Google Disk sa nepodarilo nahrať.")+(c&&!M[c]?` [${c}${er.message?": "+String(er.message).slice(0,140):""}]`:"");};
async function uploadDoc(f,meta){
  meta=meta||{};const ext=(f.name.split(".").pop()||"").toLowerCase();const tp=f.type||MIME[ext]||"application/octet-stream";
  const r=meta.en&&meta.id?get(meta.en,meta.id):null;const pre=r&&r.date?r.date+" ":"";const title=(pre+f.name).slice(0,180);
  if(mcp){toast("Nahrávam na Google Disk…");
    try{const d=await driveUpload(f,tp,title,meta.kind||"",targetFolder(meta.en,meta.id));toast("Uložené na Google Disk.");return Object.assign({name:f.name},d);}
    catch(er){toast(driveErr(er)+" Súbor uložím do aplikácie.",9000);}}
  if(!assets){toast("Nahrávanie súborov tu nie je dostupné. Vložte odkaz.");return null;}
  toast("Nahrávam súbor…");
  try{const res=await assets.upload(f,MIME[ext]||f.type?{type:MIME[ext]||f.type}:undefined);toast("Súbor nahraný.");return{name:f.name,asset:res.id};}
  catch(er){toast(er&&er.code==="unsupported_type"?"Tento typ súboru sa do aplikácie nedá nahrať. Použite PDF alebo obrázok, prípadne vložte odkaz.":er&&er.code==="too_large"?"Súbor je príliš veľký (max. 20 MB).":"Súbor sa nepodarilo nahrať.");return null;}
}
