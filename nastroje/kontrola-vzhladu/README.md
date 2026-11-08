# Kontrola vzhľadu

Nástroj na overenie, že úprava (napr. presun štýlov) nezmenila vzhľad aplikácie. Pustí aplikáciu s testovacími údajmi (`seed.json`) bez WordPressu, preklikne 136 obrazoviek a stavov (svetlý/tmavý režim, počítač/mobil) a zapíše vzhľad každého prvku. Dva zápisy sa potom porovnajú.

Postup (potrebný Python 3, Node.js a Playwright s prehliadačom Chromium):

```bash
python3 nastroje/kontrola-vzhladu/build.py app/css /tmp/pred.html     # pred úpravou
node nastroje/kontrola-vzhladu/test.js /tmp/pred.html /tmp/pred.json
# … úprava …
python3 nastroje/kontrola-vzhladu/build.py app/css /tmp/po.html
node nastroje/kontrola-vzhladu/test.js /tmp/po.html /tmp/po.json
python3 nastroje/kontrola-vzhladu/compare.py /tmp/pred.json /tmp/po.json   # „rozdiely vo vlastnostiach: 0“ = vzhľad sa nezmenil
```

Pri zámernej zmene dizajnu porovnanie ukáže, ktoré prvky a vlastnosti sa zmenili – tak sa dá skontrolovať, že sa nezmenilo nič navyše. Test zároveň hlási chyby aplikácie a kroky, ktoré sa nepodarilo vykonať. `build.py` skladá stránku rovnako ako plugin; ak sa zmení skladanie v `ars-preuge-priestor.php`, treba ho upraviť aj tu.

Obrázok obrazovky s testovacími údajmi (napr. na ukážku pred schválením zmeny):

```bash
node nastroje/kontrola-vzhladu/obrazok.js /tmp/po.html /tmp/obrazok.png tmavý go:podujatia 'click:.gcard[data-open="events:e1"]'
```
