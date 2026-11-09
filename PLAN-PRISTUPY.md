# Plán: prístupy – kto čo vidí a čo smie meniť

Cieľ (podľa majiteľa, 9. 11. 2026): rôznym ľuďom dať rôzne výseky pracovného priestoru, napr.:
- prístup **len k vybraným projektom** a všetkému, čo do nich patrí (podujatia, granty, úlohy…); Úlohy a Kalendár mu ukazujú len to, k čomu má prístup,
- prístup **len ku konkrétnemu podujatiu** (jeho úlohy, program, texty…),
- prístup k podujatiu, **ale bez financií**,
- kontakty áno, ale **bez platieb** (pri kontakte sa platby nezobrazia, ak človek nemá právo na financie; a nikdy nevidí platby mimo svojho výseku).

## Zásady

1. **Obmedzuje server, nie vzhľad.** Človeku bez práva server dáta vôbec nepošle (`/sync`) a zápis odmietne (`/doc`). Skrytie v menu je len dôsledok.
2. **Administrátori a doterajší členovia tímu vidia všetko ako dnes.** Obmedzenia platia len pre ľudí, ktorým sa pridelí obmedzená skupina. Kto nemá žiadnu skupinu, správa sa ako doteraz (plný prístup) – nič sa nikomu nepokazí.
3. **Skupiny + výnimky.** V administrácii (*Ars Preuge → Prístupy*, len administrátor) sa vytvoria skupiny („Dobrovoľníci NOX“, „Účtovníčka“…), každá má pravidlá; používateľovi sa pridelí skupina a prípadne osobná výnimka. Nastavenia sú vo WordPresse (options), nie v synchronizovaných dátach – obmedzený človek nevidí, kto má aké práva.
4. **Tri úrovne na oblasť:** bez prístupu · len čítať · upravovať.

## Ako sa pravidlo skladá

Pravidlo skupiny = **rozsah** + **oblasti**.

- **Rozsah:** všetko · vybrané projekty · vybrané podujatia. Do rozsahu patrí záznam, ktorý je s projektom/podujatím prepojený (`projectId`, `eventId`, `grantIds`…, rovnaká logika ako `related()` – na serveri zjednodušene cez odkazové polia v JSON).
- **Oblasti** (každá: bez / čítať / upravovať):
  - **Projekty a podujatia** (projects, events, partnerships, programItems, comments k nim, zabezpecenie, zabdodavky),
  - **Úlohy** (tasks + ich komentáre),
  - **Granty** (grants, budgetLines – bez platieb),
  - **Financie** (transactions; bez tohto práva sa platby neposielajú vôbec → rozpočty ukazujú len plán, kontakt je bez platieb),
  - **Kontakty** (contacts),
  - **Nastavenia** (settings – len na čítanie posiela vždy, lebo ich aplikácia potrebuje; upravovať len s právom).
- Viac skupín/výnimiek sa **sčíta** (čo dovolí aspoň jedna, platí).
- **Súbory:** nahraný súbor vidí len ten, kto vidí záznam, pri ktorom je priložený (server si pri `?arsp_blob=` nájde, kde sa asset používa). Fotky (albumy) patria k podujatiu.
- **Používatelia:** zoznam členov tímu (`/users`) ostáva – treba ho na mená; e-maily sa posielajú len plnému prístupu.

## Čo obmedzený človek uvidí v aplikácii

- V menu len sekcie, na ktoré má aspoň čítanie; Prehľad a Kalendár vždy, ale len z jeho dát.
- Záznam mimo rozsahu: prepojenie sa ukáže len ako názov bez možnosti otvoriť (server pošle ku každému povolenému záznamu „menovky“ odkazovaných záznamov: id + názov).
- „Len čítať“: bez tlačidiel + Nové, bez ceruzky, polia sa nedajú meniť (v aplikácii už existuje základ `S.readOnly` – rozšíri sa po oblastiach).
- Pri zápise server kontroluje oblasť aj rozsah; aplikácia pri odmietnutí zrozumiteľne oznámi, že na to nemá právo.

## Postup (po častiach, každá sa dá nasadiť samostatne)

1. **Fáza 1 – oblasti:** stránka Prístupy (skupiny, úrovne podľa oblastí, pridelenie ľuďom) + filtrovanie `/sync`, kontrola `/doc`, menu a režim čítania v aplikácii. Rozsah zatiaľ „všetko“.
2. **Fáza 2 – rozsah:** vybrané projekty / podujatia; menovky odkazovaných záznamov; Úlohy a Kalendár len z rozsahu.
3. **Fáza 3 – súbory a detaily:** kontrola nahraných súborov a fotiek, platby pri kontaktoch, export/CSV len z povolených dát, test so skutočnými ľuďmi.

Pri každej fáze: overenie v `nastroje/kontrola-vzhladu/` (plný prístup = 0 rozdielov) + nové testy pre obmedzeného používateľa (server nepošle zakázané kolekcie, zápis odmietne, menu sa skryje).
