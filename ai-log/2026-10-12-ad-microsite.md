# Samostatná ukázka kalkulačky /add — 12. 10. 2026

## Skutečné zadání (doslovné výňatky, nikoli celý prompt)

> Zdrojový kód reklamní ukázky umísti samostatně do složky:
> `ads/`
> Po nasazení musí být dostupná na veřejné URL:
> `/add`

> Výchozí ETF:
> - SPY
> - VOO
> Použij jejich skutečné názvy a nákladovost z ověřených projektových dat.

> Výpočty musí odpovídat aktuální kalkulačce v hlavní aplikaci, včetně modelovaného započtení roční nákladovosti ETF.

> Zachovej jeden Vercel projekt, jeden GitHub repozitář, jeden build příkaz `npm run build` a výstupní adresář `dist`.

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

## Provedení a kontrola návrhu

Zkontrolován čistý checkout design-exploration, AGENTS.md, současná Vite/Vercel konfigurace, schválený katalog a sdílená matematika. Vite má dva standardní HTML vstupy. Přesný přepis /add na ads/index.html zajišťuje Vercel; lokální Vite middleware mapuje totéž v dev a preview. Žádná nová služba, závislost, druhý build ani React root pro reklamu.

Samostatné ads/index.html, style.css, main.ts a funds.ts. Statická metadata SPY a VOO jsou porovnána testem se schváleným katalogem; skutečné datum převzaté kontroly není vydáváno za novou návštěvu emitentských stránek. SPY zachovává přesných 0,0945 %. Výchozích 6 % je výslovně ilustrační, žádné historické výnosy nebyly vymyšleny. Sdílené scenarioProfit/profitScale jsou importovány při sestavení; nejsou přepsány. Stejná stupnice umožňuje porovnání záporných i kladných výsledků. CTA vede na /#comparator bez obcházení hlavního e-mailového přístupu.

Atribuce odlišuje TickerInside a přesný údaj SPY z factsheetu SSGA; všechny odkazy jsou převzaté z existující evidence. E-maily, databáze, analytika, cookie nastavení, prostředí ani vzdálené služby nebyly měněny.

## Ověření

Lint, typecheck, produkční build (obě HTML stránky v dist), všech 71 unit/backend testů a všech deset NodeNext/server endpointů prošly. Oficiální lokální Vercel builder vytvořil a spustil všech deset funkcí; regresní vadný .ts import byl zachycen. /add, /add/ a /add?demo=1 byly skutečně načteny v dev režimu. Browser ukázky prošel na 320/390/1440 px: reload, částka, horizont, nezávislá procenta, nulový/záporný výnos, pruhy, neplatné vstupy, CTA a root. Screenshot 320 px byl vizuálně prohlédnut. První browser test měl příliš přesnou toleranci pro CSS procenta (CSSOM zaokrouhluje zápis); tolerance byla opravena na 1e-6, výpočet se nezměnil. Celá browser sada po opravě prošla (MVP, soukromí, preview admin, atribuce, investice i /add). Při kontrole dev HTML byly odkazy na zdrojové assety zpřesněny na /ads/style.css a /ads/main.ts, aby fungovaly i z aliasu /add; následný build má stejné sestavené assety. Samostatný browser test byl zopakován v dev i nad produkčním dist. Browser API fixtures ověřují pouze regresní chování hlavní aplikace; nejsou testem živé Supabase nebo doručení. Samotná microsite běží s nulovým počtem API/externích požadavků.
