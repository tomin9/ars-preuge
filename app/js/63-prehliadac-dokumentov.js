/* ===== Prehliadač dokumentov uložených v aplikácii (PDF, obrázky) priamo na stránke.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/63-prehliadac-dokumentov.js. Nie je to samostatný skript. ===== */
/* ===== in-app document viewer for files stored in the app ===== */
let _pdfjs=null;
function loadPdfJs(){if(_pdfjs)return _pdfjs;_pdfjs=new Promise((res,rej)=>{const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  sc.onload=()=>{try{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";res(window.pdfjsLib);}catch(e){rej(e);}};sc.onerror=()=>{_pdfjs=null;rej(new Error("pdfjs"));};document.head.appendChild(sc);});return _pdfjs;}
async function viewDoc(href,name){
  const host=document.createElement("div");host.className="docview";host.setAttribute("role","dialog");host.setAttribute("aria-label",name||"Dokument");
  host.innerHTML=`<div class="dvh"><b></b><button class="btn sm" data-dvdl hidden>Stiahnuť</button><button class="btn sm" data-dvclose>Zavrieť</button></div><div class="dvb"><div class="dvmsg">Načítavam…</div></div>`;
  host.querySelector("b").textContent=name||"Dokument";document.body.appendChild(host);
  const close=()=>{host.remove();document.removeEventListener("keydown",esc,true);};const esc=e=>{if(e.key==="Escape"){e.stopPropagation();close();}};document.addEventListener("keydown",esc,true);
  host.querySelector("[data-dvclose]").onclick=close;host.addEventListener("click",e=>{if(e.target===host||e.target.classList.contains("dvb"))close();});
  const body=host.querySelector(".dvb");
  let blob;try{const r=await fetch(href);if(!r.ok)throw new Error(r.status);blob=await r.blob();}catch(e){body.innerHTML=`<div class="dvmsg">Súbor sa nepodarilo načítať.</div>`;return;}
  if(dl){const b=host.querySelector("[data-dvdl]");b.hidden=false;b.onclick=async()=>{try{await dl.save({filename:(name||"dokument").replace(/[\\/:*?"<>|]+/g,"_")+(/\.[a-z0-9]{2,4}$/i.test(name||"")?"":(blob.type==="application/pdf"?".pdf":"")),data:blob});}catch(e){if(e&&e.code!=="declined")toast("Stiahnutie sa nepodarilo.");}};}
  const type=blob.type||"";
  if(type.startsWith("image/")){const u=URL.createObjectURL(blob);body.innerHTML="";const im=new Image();im.src=u;im.alt=name||"";body.appendChild(im);return;}
  if(type==="application/pdf"||/\.pdf$/i.test(name||"")){
    try{const lib=await loadPdfJs();const pdf=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;body.innerHTML="";
      const w=Math.min(900,body.clientWidth-40);
      for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const v1=pg.getViewport({scale:1});const sc=(w/v1.width)*(window.devicePixelRatio||1);const vp=pg.getViewport({scale:sc});
        const c=document.createElement("canvas");c.width=vp.width;c.height=vp.height;c.style.width=w+"px";body.appendChild(c);await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;}
    }catch(e){console.warn("[pdf]",e);body.innerHTML=`<div class="dvmsg">PDF sa nedá zobraziť priamo tu. ${dl?"Použi Stiahnuť.":""}</div>`;}
    return;}
  body.innerHTML=`<div class="dvmsg">Tento typ súboru sa nedá zobraziť priamo tu.${dl?" Použi Stiahnuť.":""}</div>`;
}
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href*="arsp_blob="]');if(!a)return;e.preventDefault();e.stopPropagation();viewDoc(a.getAttribute("href"),a.textContent.trim()||a.getAttribute("title")||"");},true);

