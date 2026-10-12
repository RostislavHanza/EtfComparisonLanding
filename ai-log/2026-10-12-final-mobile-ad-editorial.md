# Kompaktní reklama a jediný Editorial design

## Skutečné zadání (doslovné výňatky)

> Cílem je, aby se celý reklamní obsah včetně výsledků, vysvětlení a tlačítka pro přechod na hlavní web vešel na jednu výšku mobilního displeje

> Zaokrouhlení se týká pouze zobrazení, nikoli vnitřního výpočtu.

> Historické referenční období.

> Na stránce `/add` úplně odstraň text: „ETF NYSE / Ukázka kalkulačky“

> Přidej přímo pod něj interaktivní posuvník

> Hypotetický model zahrnuje roční nákladovost ETF. Nezahrnuje měnové změny, daně ani poplatky brokera. Investování může vést ke ztrátě.

> Ponech pouze současný hlavní design „Editorial – původní“

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

## Implementace

Čistá větev a AGENTS.md ověřeny. Žádné změny historických snapshotů, fondů, finančních funkcí, API, Supabase nebo Gmail. Reklama má kratší mobilní mezery/fonty při zachování 44px dotykových vstupů a ovladačů. Bez horního označení. „výnosů“ zeleně/kurzivou #284c39 jako hlavní Editorial, na mobilu uprostřed. Reference má přesný krátký text; datum historických údajů zůstává v kompaktní atribuci se všemi dosavadními zdroji a CC BY 4.0. Nákladovost /rok nezalamuje odděleně. Rizikový odstavec spojen přesně podle zadání.

Nový range horizontu přímo pod dosavadním polem, 1–30 celých let, obousměrné propojení. Částky a sazby mají české textové pole s inputmode decimal, parser čárky/tečky a odlišný přesný modelový stav. Formát s max. 2 desetinnými místy pouze pro zobrazení; blur zachová přesnou hodnotu, průběžné psaní nic nepřepisuje. Historicky odvozená sazba se ve výpočtu nezaokrouhluje.

App zjednodušen na Editorial a stávající admin route. Odstraněny archivní EditorialDemo, data designů, round-two stylesheet a styly Compact/Steps/Terminal/Guide i přepínače. Ostatní Editorial styly zachovány. Observer přístupu používaný pouze k zapnutí designové lišty odstraněn; vlastní autorizace zůstává. src/etfData.ts zůstává kvůli existujícím testům legacy validátoru nákladů, není importovaný webem. ETF katalogová data nebyla měněna.

## Ověřování a opravy

První vyčištění CSS pomocí existujícího PostCSS zanechalo prázdné selektory (getter prázdného pole vracel prázdný selector). Build upozornění byla odstraněna korektním odstraněním prázdných pravidel; opakovaný build prošel bez těchto varování. Žádná nová závislost kvůli tomuto jednorázovému čištění.

Ověřena výchozí reklama 390×844, 393×852, 360×800, 390×740 bez scrollu. 320×568 potřebuje přibližně 772 px obsahu; scroll zachován, nic neskryto ani useknuto. Screenshot 390 px vizuálně prohlédnut. Testy rozšířeny o přesné texty, zobrazení vs přesný model, českou desetinnou editaci, slider horizontu, zelený a centrovaný nadpis, nákladový popisek a výšku. Staré variant URLs se testují před i po ověření přístupu. Finálně prošly lint, typecheck, všech 74 unit/backend testů, produkční build hlavní stránky i /add bez uvedených CSS varování, všechny 10 NodeNext endpointy a sestavení/spuštění všech 10 artefaktů oficiálním Vercel builderem (včetně regresní detekce chybného .ts importu). Celá browser sada prošla (MVP, soukromí, admin, atribuce, investice, reklama); dodatečně samostatný MVP test všech starých variant po ověření přístupu a reklamní test dotykové změny horizontu bez ztráty přesných ručních sazeb. Snímky reklamy byly prohlédnuty. Výšku uvádíme pro výchozí platné hodnoty; zvětšený text, klávesnice, chyba či velmi dlouhý výsledek mohou vyžadovat scroll, který je vždy umožněn. Vzdálený deployment netestován. Browser backend fixtures nejsou skutečné doručení nebo vzdálený import. Žádné skutečné e-maily ani zápisy na vzdálené služby.
