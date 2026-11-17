/* ===== Texty – spoločné pomôcky (stavy, ikony, počítadlo slov). Záložka Texty v podujatí je od 2.0.54 súčasťou záložky Podklady (podujatie-podklady.js).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-texty.js. Nie je to samostatný skript. ===== */
const TXI={copy:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
 ic:['<path d="M4 7h16M4 12h10M4 17h16"/>','<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>','<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>']};
const TXST=[["nezacate","Nezačaté",GRAY],["rozpracovane","Rozpracované",ORANGE],["hotove","Hotové",GREEN]];
const txSt=t=>t.st||(String(t.body||"").trim()?"rozpracovane":"nezacate");
const txStat=b=>{const w=String(b||"").trim().split(/\s+/).filter(Boolean).length;return`${w} slov&nbsp;&nbsp;&nbsp;&nbsp;${String(b||"").length} znakov`;};
document.addEventListener("input",ev=>{const t=ev.target;if(t&&t.classList&&t.classList.contains("txbody")){const st=document.getElementById("txstat");if(st)st.innerHTML=txStat(t.value);}});
/* ===== Fotky: album zo Google Fotiek ===== */
