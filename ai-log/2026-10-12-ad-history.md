# Úpravy reklamní ukázky /add

## Skutečné zadání (doslovné výňatky)

> „Dva fondy. Váš předpoklad.“ nahraď přesně tímto nadpisem: „Kalkulačka výnosů“

> Proto použij **skutečné historické souhrnné hodnoty SPY a VOO z již dostupných a doložených projektových podkladů**, uložené lokálně v `ads/`.

> Náklady nesmí být z historické výkonnosti započítány dvakrát.

> Zachovej tlačítko „Obnovit podle historie“, které obnoví hodnoty podle právě zvoleného období.

> „Hypotetický model zahrnuje roční nákladovost ETF. Nezahrnuje měnové změny, daně ani poplatky brokera.“

> „Investování může vést ke ztrátě.“

Doplňující skutečná otázka během práce: „jak pokračuje prace na poslednim zadani : Úpravy interaktivní reklamní ukázky ?“ Stav byl pravdivě oznámen: prostředí se teprve spouštělo, žádné provedené změny ani kontroly nebyly předstírány.

## Podklady a implementace

Použitý existující checkout design-exploration, výchozí commit e22115c. Žádné nové prostředí, přístupy, tajné údaje ani služby. AGENTS.md zkontrolován. V data/review/performance-observations.json doloženy SPY 20,5/87,1/86,7 % a VOO 20,5/87,5/87,2 % (kumulativní 1/3/5 let, as_of 2026-10-09). API zdrojové URL, licence CC BY 4.0, skutečné původní retrievedAt a hashe přeneseny do lokálního ads/history.ts; žádná nová síťová návštěva vydávána za ověření. Metadata a přesné sazby SPY/VOO zachovány.

Předvyplnění používá stávající sdílené annualizedReturn a grossReturnFromNet; čisté historické tempo se inverzně převede na modelovaný výnos před náklady. Dosavadní scenarioProfit/profitScale ani hlavní aplikace se nemění. Přepínač 1/3/5 let obnoví obě sazby; změna částky/horizontu ponechá ručně zadané hodnoty. Tlačítko obnovuje aktuální období. Výchozí období 5 let. Bez historie/grafu z raw cen a bez API požadavků.

Přesný nový nadpis, krátký odstavec a samostatné krátké rizikové upozornění. Atribuce nyní obsahuje skutečné historické zdroje místo tvrzení o ilustračních výnosech. CSS doplňuje pouze požadované ovládací prvky s min. 44 px a klávesnicovým focusem. CTA, Vite/Vercel build/routing a hlavní aplikace se nemění.

## Kontroly

Prošly lint, typecheck, všech 73 unit/backend testů, produkční build (hlavní i reklamní HTML), NodeNext kontrola všech 10 endpointů a skutečné lokální sestavení/spuštění 10 artefaktů oficiálním Vercel Node builderem. Regresní test vadného .ts runtime importu prošel. Celá browser sada prošla: hlavní MVP, soukromí, preview admin, atribuce, investice a /add. /add byl také samostatně ověřen na 320/390/1440 px: přesné texty, skutečné per-fund souhrny 1/3/5, anualizace a náklady bez druhého odečtení, přepínač/reset, zachování ručních sazeb při změně částky/horizontu, záporné výsledky, společná stupnice, žádné API/externí requesty a CTA na hlavní veřejný výběr. Screenshot 320 px vizuálně zkontrolován. Diff, přítomnost tajných hodnot a lokální git autor RostislavHanza/noreply ověřeny. Vzdálené Preview nasazení zatím netestováno. Testy používají izolované backend/browser fixtures, ne skutečné e-maily nebo vzdálené databázové zápisy.
