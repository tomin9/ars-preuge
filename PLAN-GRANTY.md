# Plán: granty

Rozhovor s majiteľom o záložkách grantu (november 2026). Zapisuje sa, čo je **dohodnuté**, čo je **návrh** (čaká na odpoveď) a otvorené otázky. Až po dohode všetkých záložiek sa začne robiť.

## ⚠ Bezpečnosť existujúcich grantov (pevné pravidlo)

Majiteľ už má granty v aplikácii zadané a fungujú – **nič sa nesmie zmazať ani zmeniť**.

1. Nič sa nemaže ani nepremenúva; nové veci sú **nové polia vedľa existujúcich** (sumy, položky, platby a ich prepojenia ostávajú).
2. Žiadne automatické prepisovanie ani hromadné úpravy záznamov pri načítaní. Položky bez kategórie sa ukážu v skupine „Bez kategórie“; kategóriu priradí majiteľ.
3. Pôvodný rozpočet sa vytvorí len tlačidlom „Uložiť ako pôvodný rozpočet“ (odfotí aktuálny stav); dovtedy jeden rozpočet ako dnes.
4. Pred každým nasadením zmeny grantov **upozorniť majiteľa na zálohu**: WordPress → Ars Preuge → Import dát → „Stiahnuť zálohu dát (JSON)“ (bez nahraných súborov – tie sa nemenia).
5. Každú zmenu vyskúšať na testovacích údajoch napodobňujúcich granty (položky, platby, podujatia) a overiť, že sumy pred a po sedia; obrázky na schválenie.
6. Pri probléme vrátiť predchádzajúcu verziu aplikácie – dáta sa neprepisujú, takže ostanú ako predtým.

## Spoločné: napojenie na Claude (rozhodnuté – variant B)

- Plugin dostane v administrácii WordPressu nastavenie **API kľúč Anthropic** (uložený len na serveri, tím ho nevidí). Kľúč treba vytvoriť na console.anthropic.com; platí sa za použitie.
- WordPress súbor alebo stránku stiahne / prijme, pošle Claude a vráti výsledok aplikácii. **Vždy sa najprv ukáže prehľad na potvrdenie**, až potom sa ukladá.
- Stránky a PDF za prihlásením do grantového systému WordPress sám neotvorí → majiteľ ich stiahne ako PDF a nahrá.

## Záložka Výzva – ✅ „Načítať výzvu“ hotové vo verzii 1.73.0 (odkaz, nahraté PDF alebo už nahraný dokument → Claude → prehľad s výberom polí; existujúce hodnoty sa prepíšu len po zaškrtnutí). Treba vyskúšať na skutočných výzvach.

- Tlačidlo **„Načítať výzvu“**: odkaz na stránku výzvy alebo nahratie PDF → Claude vytiahne údaje (termíny, sumy, spolufinancovanie, kto môže žiadať, oprávnené výdavky, povinné prílohy…) → prehľad na potvrdenie → uloží sa; PDF sa uloží medzi dokumenty výzvy.
- Otvorené: ktoré údaje sú najdôležitejšie; odkazy na 2–3 skutočné výzvy na vyskúšanie.

## Záložka Žiadosť – ✅ editor po častiach hotový vo verzii 1.71.0 (časti sa zatiaľ pridávajú ručne; načítanie z PDF a „Navrhnúť text“ prídu s napojením na Claude)

- Majiteľ chce: nahrať PDF z grantového systému (štruktúra je vždy iná), načítať ho a potom do toho dopisovať.
- ✅ (1.79.0, tlačidlo „Načítať žiadosť“) **„Načítať formulár žiadosti“** (PDF alebo odkaz) → Claude vytiahne časti/otázky, pokyny, limity znakov, prípadne už napísaný text → prehľad na potvrdenie; PDF sa uloží medzi dokumenty žiadosti. Pridávajú sa len nové časti, existujúce sa nemenia. Rozpočet zo žiadosti do Rozpočtu ešte nie.
- Písanie v rozložení ako **Texty podujatia**: vľavo časti s bodkou stavu, vpravo editor s pokynom z formulára, počítadlo znakov s limitom (červené pri prekročení), Kopírovať; súhrn „hotové X z Y“.
- Nová verzia PDF: zhodné časti si nechajú text, nové pribudnú, zrušené sa len označia (nič sa nezmaže).
- ✅ **Rozpočet zo žiadosti** sa načíta rovno do záložky Rozpočet ako rozpočtové položky (s prehľadom na potvrdenie).
- ✅ **„Navrhnúť text“** pri každej časti – Claude napíše návrh z údajov o projekte, podujatiach a výzve; majiteľ ho upraví.
- ✅ **Komentáre** pri každej časti (bez prideľovania „kto má časť na starosti“).
- ❌ Stiahnutie celej žiadosti ako Word/PDF netreba.
- ❓ Povinné prílohy: majiteľ nevie → zatiaľ ukázať zoznam príloh z výzvy ako nepovinný kontrolný zoznam (s možnosťou priložiť súbor); rozhodne sa, keď ho uvidí.

## Záložka Zmluva – ✅ zrušená vo verzii 1.70.0 (Postup a Ľudia a kontakty sú v záložke Úlohy)

- Majiteľ záložku nepotrebuje. Predtým mal pri grante **tri PDF: Žiadosť, Zmluva, Vyúčtovanie** a to mu vyhovovalo.
- Návrh: tri dokumenty ako malé náhľady **priamo v hlavnej karte grantu** (otvoriť / nahrať, ak chýba). Žiadosť sa použije aj v záložke Žiadosť na načítanie formulára. „Postup“ a „Ľudia a kontakty“ zo záložky Zmluva – rozhodnúť, či niekam presunúť alebo zrušiť.

## Záložka Rozpočet – ✅ hotové vo verzii 1.69.0
- 1.81.0: vzhľad ako Rozpočet podujatia (pohľad Granty) – tabuľka položiek so stĺpcami Rozpočet (z dotácie), Spolufin., Plánované (všetko priradené), Zaplatené, Zostáva, pruh a stav; kategórie ostali ako riadky s medzisúčtom a limitom presunu; pás súm hore ostal (v 1.81.1 na želanie odstránený – sumy sú v hlavnej karte). Pod tabuľkou jeden zoznam všetkých platieb grantu (aj príjem od poskytovateľa) s výberom rozpočtovej položky; nahradil „Platby bez položky“ a „Príjmy od poskytovateľa“. 1.82.0: platby v rámčeku bez pozadia, bez nadpisu a tlačidiel; nová platba sa píše do prázdneho posledného riadku (uloží sa po opustení riadku alebo Enter; „+“ pred sumou = príjem).

Majiteľ potrebuje: **plánovaný rozpočet** (zo žiadosti/zmluvy) → **kategórie** → **položky** s plánovanou sumou → **skutočné výdavky** (platby z denníka priradené k položke). Treba dodržať súčet každej kategórie aj celkovú sumu; snažia sa držať pôvodného plánu.

- Tabuľka po kategóriách: Plán · Zaplatené · Plánované (v denníku bez dátumu) · Zostáva · pruh · stav. Pri položke rozbaliteľný zoznam platieb, priradenie existujúcej / zápis novej platby priamo odtiaľ.
- Varovania: kategória nad plánom = červená; položka nad plánom v rámci kategórie = okrová; celková suma v súčte aj v hlavnej karte. Nezaradené platby osobitne.
- Zaplatené a plánované osobitne (opraví E7).
- Rozdelenie z dotácie / vlastné zdroje pri položke ostáva, súčty osobitne.
- Plán sa naplní zo žiadosti (dohodnuté pri Žiadosti), dá sa upraviť ručne.
- Rozpočet podujatia použije tie isté kategórie a položky grantu.
- Dáta: rozpočtová položka (`budgetLines`) dostane nové pole **kategória** (a poradie); existujúce položky bez kategórie pôjdu do „Bez kategórie“ – nič sa nepremenúva.
- ✅ **Limit presunu:** pri grante nové pole „Povolený presun medzi kategóriami (%)“; upozornenie pri priblížení a prekročení.
- ✅ **Pôvodný a aktuálny rozpočet:** tlačidlo „Uložiť ako pôvodný rozpočet“ (odfotí aktuálny stav do nových polí); tabuľka ukáže pôvodný plán, aktuálny plán a rozdiel.
- ✅ **Jedna platba = jedna položka** (ostáva ako dnes).
- ✅ **Kategórie sú pri každom grante vlastné** (zo žiadosti alebo ručne), žiadny stály zoznam.

## Záložka Úlohy – dohodnuté

- Zoznam úloh grantu ostáva. Pribudne **„Navrhnúť úlohy z dokumentov“**: Claude prečíta zmluvu (prípadne výzvu či iný dokument grantu) a navrhne úlohy s termínmi (napr. vyúčtovanie, záverečná správa, publicita/logo, oznámenie zmien) → prehľad na potvrdenie, jednotlivé sa dajú odškrtnúť → vytvoria sa ako bežné úlohy priradené ku grantu (kalendár, Prehľad).

## Záložka Podujatia – dohodnuté

- Stačí zobraziť priradené podujatia (ako dnes). Bez ďalších výpočtov.

## Hlavná karta grantu – ✅ hotová vo verzii 1.70.0, upravená v 1.74.0: na výšku ako podujatie, obrázok 1/4, bez dokumentov a bez tlačidla Výzva. Od 1.74.3 sú všetky dokumenty grantu (Výzva, Žiadosť, Zmluva, Vyúčtovanie, Ostatné) v novej záložke **Dokumenty** (ako pri podujatí); záložka Výzva má len Údaje o výzve. (sumy: schválené/žiadané, zaplatené + plánované, zostáva, spolufinancovanie a prijaté len ak majú hodnotu; bez exportu CSV)

- Podoba ako karta podujatia (obrázok vľavo, názov, štítok stavu, ceruzka), tri dokumenty Žiadosť · Zmluva · Vyúčtovanie ako náhľady.
- Otvorené: ktoré sumy na prvý pohľad (ostatné do Rozpočtu); či ostáva export „Podklad k vyúčtovaniu (CSV)“.

## Navrhované poradie prác

1. **Bez Claude (dá sa hneď):** ✅ Rozpočet s kategóriami (1.69.0; limit presunu = % z plánu kategórie, porovnáva sa s celkovými nákladmi – majiteľ ešte potvrdí, či to tak ráta poskytovateľ) (zaplatené/plánované, limit presunu, pôvodný rozpočet) + opravy E7–E9 · zrušenie záložky Zmluva a tri dokumenty v hlavnej karte · hlavná karta v podobe podujatia · ✅ Žiadosť ako editor častí (1.71.0; doterajšie pole „Text žiadosti“ sa ukazuje ako prvá časť).
2. **S Claude (po získaní API kľúča):** ✅ nastavenie kľúča v plugine · ✅ Načítať výzvu (1.73.0) · ✅ Načítať formulár žiadosti (1.79.0; rozpočet do Rozpočtu ešte nie) · Navrhnúť text · Navrhnúť úlohy z dokumentov.

## Zistené chyby (zapísať aj do ZOZNAM-UPRAV.md)

- Záložka Zmluva: v karte „Ľudia a kontakty“ je obrovská ikona osoby (ikona nemá veľkosť mimo bočného panela).
- „Minuté / čerpané z dotácie“ rátajú aj plánované platby bez dátumu – rozhodnúť, či ukazovať zaplatené a plánované osobitne (ako rozpočet podujatia).
- Platbu možno priradiť len ku grantu v stave „Schválené“ (nie „Zrealizované“) – neskoré faktúry sa nedajú priradiť.
