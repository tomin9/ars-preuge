# Ars Preuge – pracovný priestor (WordPress plugin)

Tímová aplikácia OZ Ars Preuge: projekty, granty, podujatia, zabezpečenie, financie, kontakty, úlohy.

- Po aktivácii beží na adrese `/priestor/` (len pre prihlásených s prístupom).
- Prístup: administrátor, redaktor a rola **Tím Ars Preuge**.
- Dáta sú v databáze WordPressu (tabuľka `wp_arsp_docs`), súbory v `wp-content/uploads/arsp/` (chránené).

**Dáta nie sú súčasťou repozitára.** Importujú sa v administrácii: *Ars Preuge → Import dát* (balík `ars-preuge-data.zip`).

## Zabezpečenie

Sekcia **Zabezpečenie** je technický plán podujatia po dielach: napájanie, technika a káble, ľudia s dňom a časom, otvorené úlohy a poznámky, so súhrnom za všetky diela. Dáta sú v kolekcii `zabezpecenie`; diela s fotkami sa nahrajú importom balíka v administrácii (*Ars Preuge → Import dát*), alebo sa pridávajú priamo v aplikácii tlačidlom *Pridať dielo*.
