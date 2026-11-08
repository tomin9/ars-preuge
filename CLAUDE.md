# Pravidlá pre prácu v tomto repozitári

## Git: pracuj priamo vo vetve `main`

- Všetky zmeny commituj a pushuj **priamo do vetvy `main`** (východzia vetva tohto repozitára).
- **Nevytváraj** nové vetvy ani pull requesty a nepýtaj sa na ich schválenie.
- Pred pushom si stiahni najnovší stav (`git pull --rebase origin main`), aby nevznikli konflikty.
- Ak push do `main` zlyhá (napr. kvôli ochrane vetvy), zastav sa a vysvetli majiteľovi jednoducho, čo treba urobiť – nevytváraj PR ako náhradné riešenie.

Majiteľ repozitára nie je programátor – výsledky a problémy vysvetľuj po slovensky a bez odborného žargónu.

---

# Čo je táto aplikácia

**Ars Preuge – pracovný priestor** je interná tímová aplikácia občianskeho združenia Ars Preuge (Prievidza). Tím v nej drží na jednom mieste projekty, granty, podujatia, úlohy, peniaze a kontakty. Beží ako **doplnok (plugin) vo WordPresse** na adrese `/priestor/`; pustí dnu len prihlásených členov (administrátor, redaktor, rola „Tím Ars Preuge“).

## Z čoho sa skladá (súbory)

| Súbor | Na čo slúži |
|---|---|
| `app/css/*.css` | **Vzhľad aplikácie** – 7 súborov očíslovaných v poradí načítania (poradie je dôležité). `00-zaklad` = farby a základ, `10` menu a stránka, `20` prvky, `30` panely a okná, `40` kalendár a detaily, `50` zabezpečenie, `60` texty a menu. Plugin ich pri otvorení vloží do stránky. |
| `app/index.html` | **Správanie aplikácie** (programy) v jednom veľkom súbore (~2 400 riadkov); na začiatku odkazy na štýly. Zatiaľ sa rozdeľuje po krokoch (pozri návrh rozdelenia). |
| `app/shim.js` | Malý „prekladač“: dáva aplikácii spôsob, ako čítať a ukladať dáta do WordPressu a nahrávať súbory. Pravidelne (každých 8 s) sťahuje zmeny od kolegov. |
| `ars-preuge-priestor.php` | Samotný WordPress plugin: prístupové práva, adresa `/priestor/`, ukladanie dát do databázy, nahrávanie súborov, import/export dát v administrácii. |
| `index.php`, `app/index.php` | Prázdne zámky (aby sa priečinky nedali listovať). Nemeniť. |
| `README.md` | Krátky popis pre ľudí. |

**Dôležité:** plugin pri otvorení aplikácie načíta `app/index.html`, na miesto odkazov `css/…` vloží obsah štýlov a **tesne pred prvý `<script>`** vloží nastavenia a `shim.js`. Pri akomkoľvek rozdeľovaní súboru sa toto musí zachovať (pozri `ZOZNAM-UPRAV.md` a návrh rozdelenia).

Dáta **nie sú v repozitári** (priečinok `data/` a `*.zip` sú vylúčené). Žijú v databáze WordPressu (tabuľka `wp_arsp_docs`), súbory v `wp-content/uploads/arsp/`. Preto sa pri úpravách nikdy nesmie meniť tvar uložených záznamov bez dohody (pozri „Pravidlá pri úpravách“).

## Sekcie aplikácie

Ľavé menu (na mobile dolná lišta + menu):

1. **Prehľad** – úvodná stránka: stav banky a pokladne, moje otvorené úlohy, úlohy po termíne, najbližšie termíny, posledné zmeny v tíme.
2. **Kalendár** – mesačný pohľad. Zbiera termíny z úloh, podujatí, grantov (uzávierka, koniec realizácie, vyúčtovanie) a koncov projektov.
3. **Úlohy** – nástenka (Inbox → Tento týždeň → Rozpracované → Hotové) alebo zoznam; filtre podľa projektu, človeka, typu, organizácie.
4. **Projekty** – zoznam projektov a detail projektu so záložkami Podujatia · Úlohy · Granty · Financie · Ľudia. Projekt má svoju farbu.
5. **Granty** – galéria/tabuľka s kartami Plánované · Prebieha · Zrealizované · Nepodporené. Detail grantu: Výzva · Žiadosť · Zmluva · Rozpočet · Úlohy · Podujatia (vrátane generovania zmluvy o dielo a importu údajov z výzvy).
6. **Podujatia** – galéria/tabuľka (Plánované · Prebieha · Zrealizované · Zrušené). Detail podujatia (**vzorová stránka dizajnu**) so záložkami Texty · Rozpočet · Úlohy · Granty · Dramaturgia · Marketing · Spolupráce · Dokumenty · Fotky · Zabezpečenie.
   - **Zabezpečenie** je technický plán podujatia **NOX:art** po dielach (napájanie, technika, káble, ľudia s dňom a časom, dodávky). Zobrazuje sa len pri podujatí NOX:art a obsahuje aj súhrn za všetky diela.
7. **Financie** – peňažný denník (príjmy a výdavky, banka/hotovosť), prehľad po projektoch a po kategóriách, filter podľa roku; rozpočtové položky grantov.
8. **Kontakty** – záložky Osoby · Firmy · Organizácie · Média; roly (tím, umelec, partner, sponzor…), IBAN, spolupráce na podujatiach, zlučovanie duplicít.
9. **Nastavenia** – údaje združenia, počiatočné zostatky, zoznam kategórií a typov úloh.

Okrem toho: **vyhľadávanie** (Ctrl+K), tlačidlo **+ Nové** (vytvorí záznam ľubovoľného druhu), **bočný panel** na rýchlu úpravu záznamu, export do CSV.

## Ako spolu súvisia (kto na koho ukazuje)

```
            PROJEKT  ◄──────────── má farbu, združuje všetko ostatné
           /  |   \  \
      GRANT  PODUJATIE  ÚLOHA   PLATBA (peňažný denník)
        │  \    │   \     │        │
        │   \   │    \    └────────┤ platba môže ukazovať na projekt,
   rozpočtové    │     \            │ grant, podujatie, rozpočtovú položku,
    položky      │      \           │ úlohu aj kontakt
        └────────┴───────┴──────► KONTAKT (osoba / firma / organizácia / médiá)
                                   ▲ poskytovateľ grantu, dodávateľ, partner, tím
   PODUJATIE ─► program (dramaturgia), spolupráce (kontakt + stav oslovenia),
                dokumenty, fotky, [NOX:art] zabezpečenie a dodávky
```

- **Projekt** je zastrešenie: má podujatia, granty, úlohy, platby a ľudí.
- **Grant** patrí k projektu, má poskytovateľa (kontakt), rozpočtové položky a termíny; môže financovať viac podujatí (a podujatie môže mať viac grantov).
- **Platba** v denníku sa viaže na grant a jeho rozpočtovú položku, tak sa počíta čerpanie dotácie a spolufinancovanie.
- **Úloha** môže patriť k projektu, grantu aj podujatiu súčasne; termíny z nej idú do kalendára a prehľadu.
- Väzby sa zobrazujú **z oboch strán** (podujatie ukáže svoje granty a grant svoje podujatia) – v kóde to rieši pomocník `related()`.
- Každý záznam má komentáre a zmeny sa ukazujú v „posledných zmenách“ na Prehľade.

## Ako je napísaný kód (stručne pre úpravy)

- Žiadny build ani knižnice – jeden súbor, čistý JavaScript. Po úprave stačí obnoviť stránku.
- Zoznam druhov záznamov a ich polí je na jednom mieste (`ENT`), zoznam stavov a farieb štítkov v `OPT`.
- Každá sekcia je jedna funkcia `VIEWS.<názov>` (napr. `VIEWS.podujatie`), ktorá vráti kus stránky.
- Dáta sa čítajú z `S.d.<druh>`, píšu sa cez `add`, `upd`, `del`.
- Texty v aplikácii sú **po slovensky**, názvy interných vecí v kóde sú slovensky bez diakritiky (`podujatie`, `ulohy`) alebo anglicky.

# Pravidlá pri úpravách

1. **Dizajn:** všetko nové sa robí podľa `DIZAJN.md` (vzor = stránka podujatia). Nevymýšľať nové druhy tlačidiel, záložiek či kariet.
2. **Zoznam úprav:** nájdené nedostatky a nápady na zlepšenie sa zapisujú do `ZOZNAM-UPRAV.md`; opravené sa tam odškrtnú.
3. **Dáta:** nemeniť názvy polí ani zoznamy stavov (`OPT`), kým sa nerieši aj prevod existujúcich záznamov – inak sa v živých dátach tímu „stratia“.
4. **Jedna vec naraz:** pri väčších zmenách (napr. rozdelenie súboru) najprv navrhnúť, počkať na súhlas majiteľa, až potom robiť.
5. **Overenie:** po zmene sa overí, že aplikácia sa otvorí a príslušná sekcia funguje (svetlý aj tmavý režim, mobil aj počítač).
