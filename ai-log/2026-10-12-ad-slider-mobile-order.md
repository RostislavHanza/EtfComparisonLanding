# Reklamní spodní řádek, posuvník a mobilní pořadí landing page

## Skutečné zadání — doslovné výňatky

> Přesuň celou tuto část pod poslední ETF, tedy pod řádky SPY a VOO, jako jeden společný spodní řádek přímo ve srovnávací tabulce.

> Přímo pod pole přidej posuvník odpovídající stylem a chováním posuvníku v hlavní kalkulačce.

> Použij stejné minimální a maximální hodnoty, krok posuvníku i formátování částky jako v hlavní kalkulačce.

> Na mobilu jej přesuň před dvojici úvodních kroků

> Na desktopu zachovej současné pořadí.

> Nepřidávej duplicitní bloky do DOM, které by vytvářely opakovaný obsah pro čtečky obrazovky nebo analytiku.

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

## Provedení

Čistá větev design-exploration, AGENTS.md a současné komponenty zkontrolovány. Hlavní range má min 0, MAX_AMOUNT_CZK 10 000 000 a krok 1000; sdílený krok/React komponenta neexistuje. Reklama používá stejný rozsah/krok, sdílený MAX_AMOUNT_CZK a money. Bez nové závislosti, API volání nebo nové build konfigurace. Platné ruční částky aktualizují slider, slider číslo; nativní range zaokrouhluje polohu mimo krok, zatímco číselné pole a výpočet zachovávají ručně zadanou částku. Žádné zásahy do výnosové matematiky nebo historického snapshotu. Neplatný vstup neprodukuje falešný výsledek.

Historické ovládání a stejný dynamický referenční text přesunuty do tfoot/tr/td colspan=3. Jedna instance pod oběma ETF, nikoli nová karta. Nový posuvník je přímo pod stávajícím polem.

Jedna instance informační sekce je v opening mezi hero a kroky, takže DOM pořadí odpovídá mobilu. Desktopový CSS grid explicitně umisťuje kroky vedle hero a informační blok pod oba, se zachovaným 16px rozestupem. Mobilní oddělovač využívá existující 4px horní border kroků; žádná druhá čára nepřidána. Stávající 3px čára výběru ETF zůstává. Větší responzivní nadpis informačního bloku; všechny čtyři položky a ostatní texty zachovány.

## Kontroly

Browser testy rozšířeny o společný spodní řádek, konfiguraci a synchronizaci slideru, min/max, klávesnici a zachování ručně editovaných procent; hlavní stránka o mobilní/desktopové pořadí, jednu DOM instanci, čáru, rozestupy a jednořádkový nadpis. Prošly lint, typecheck, všech 73 unit/backend testů, produkční build (hlavní i reklamní HTML), NodeNext kontrola 10 endpointů a skutečné lokální sestavení/spuštění všech 10 artefaktů oficiálním Vercel builderem. Celá browser sada prošla: hlavní MVP, soukromí, admin, atribuce, investice a /add. Mobilní/desktopové pořadí, jediná instance bloku, rozestupy a jednořádkový nadpis ověřeny na 320/390/768/1100/1440 px. Reklama ověřena na 320/390/1440 px včetně min/max slideru, obou směrů synchronizace, klávesnice a skutečných dotykových událostí v mobilním Chromium contextu, nulových pruhů při nulové částce, historie/resetu a zachování ručních sazeb. Screenshoty mobilního pořadí a reklamní tabulky byly vizuálně prohlédnuty. Vzdálené nasazení neověřováno. Žádné vzdálené DB zápisy ani skutečné e-maily; backendové browser testy jsou fixtures.
