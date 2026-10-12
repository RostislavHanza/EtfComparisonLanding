# Informační blok hlavní landing page

## Skutečné zadání (doslovné výňatky)

> Na hlavní landing page přidej jednu novou informační sekci vysvětlující, co návštěvník získá po výběru ETF a zadání e-mailu.

> Co získáte ve svém srovnání?

> Odhadovaný zisk
> Spočítejte si výsledek podle vlastní částky, horizontu a předpokládaného výnosu.

> Historický vývoj
> Porovnejte historickou výkonnost vybraných ETF v grafu.

> Detailní srovnání
> Prohlédněte si nákladovost, sledované indexy a další parametry fondů.

> Vlastní přehled na e-mail
> Získejte odkaz ke svému srovnání, ke kterému se můžete vracet.

> Do této sekce nepřidávej žádné CTA tlačítko.

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

## Změny

Čistý checkout design-exploration, AGENTS.md přečten. Sekce vložena mezi .opening a #comparator, pouze na veřejném vstupu (view compare bez autorizace); uložená kalkulačka se nemění. Použity přesné texty zadání, žádné ikony, další CTA nebo marketingové věty. Dvousloupcová mřížka čtyř položek, malé nadpisy a krátké popisy, běžné odsazení 16 px. Zachována existující jediná 3px čára na začátku výběru ETF, bez nové čáry na informačním bloku. Zdroj ads, API, databáze, matematika, e-maily a souhlasy nezměněny. README doplněn o pořadí nové sekce.

Existující browser kontrola mezery mezi úvodem a výběrem aktualizována pro nový blok: kontroluje oba jednotlivé rozestupy, umístění, přesné čtyři texty, 2 × 2 mřížku, žádné nové tlačítko a zachování jediné čáry. Nové unit testy pro samotný statický text se nepřidávají; rozsah ověřuje browser.

## Ověření

Prošly lint, typecheck, všech 73 unit/backend testů, build hlavní stránky i /add, NodeNext kontrola všech 10 API endpointů a sestavení/spuštění všech 10 artefaktů oficiálním Vercel builderem. Celá browser sada prošla (MVP, soukromí, admin, atribuce, investice i reklama). Nový blok otestován na 320/390/768/1100/1440 px, včetně přesných textů, umístění, běžných rozestupů, 2 × 2 mřížky a absence ovládacích prvků. Screenshoty bez překrývající cookie lišty byly vizuálně zkontrolovány na 320 a 1440 px. Žádná změna ads, API, databáze, kalkulačky ani runtime konfigurace. Žádné skutečné e-maily ani vzdálené databázové zápisy; backendové služby v browser sadě jsou izolované fixtures.
