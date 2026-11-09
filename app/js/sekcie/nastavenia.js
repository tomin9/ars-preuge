/* ===== Sekcia Nastavenia: od 1.94.0 len odkaz do WordPressu (Ars Preuge → Nastavenia, inc/admin.php).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/nastavenia.js. Nie je to samostatný skript. ===== */
/* ----- Nastavenia ----- */
VIEWS.nastavenia=()=>{   /* nastavenia sa presunuli do WordPressu – tu ostal len odkaz (staré záložky v prehliadači) */
  const adm=window.ARSP&&ARSP.admin;
  return`<div class="head"><div><h1>Nastavenia</h1><p class="sub">Spoločné nastavenia pre celý tím</p></div></div>
  <div class="panel"><p style="margin:0 0 10px">Nastavenia (počiatočné zostatky, kategórie platieb, typy úloh, údaje združenia) sú teraz v administrácii WordPressu: <b>Ars Preuge → Nastavenia</b>. Upravuje ich administrátor.</p>
  ${adm?`<a class="btn pri" href="${esc(adm)}admin.php?page=arsp-nastavenia" target="_blank" rel="noopener">Otvoriť nastavenia vo WordPresse</a>`:`<p class="small muted" style="margin:0">Ak treba niečo zmeniť, obráťte sa na administrátora.</p>`}</div>`;
};

