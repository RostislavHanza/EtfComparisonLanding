# Plovoucí lišta a konkrétní publikace katalogu

## Skutečné zadání – výňatky

Uživatel: „Souhlas s analytikou se zobrazuje jako obyčejný formulář nahoře na stránce. Chtěl jsem klasickou vyskakovací cookie lištu.“

„Při první návštěvě se automaticky objeví jako position: fixed panel nad obsahem stránky.“

„V patičce webu zůstane nenápadný odkaz ‚Nastavení soukromí‘, kterým lze panel znovu otevřít a rozhodnutí změnit.“

„Nepředstírej dokončené ověření ani právní souhlas. Pokud je nutná akce správce, uveď přesně, co má potvrdit, kde to má potvrdit a jak poté provést import bez ručního přepisování dat.“

„Neprováděj vzdálené databázové zápisy, neposílej skutečné e-maily a nic ručně nenasazuj.“

Zadání zároveň vyžaduje zachování logiky souhlasů, oddělený marketing, ověření všech backendových testů, lint/typecheck/build/browser a commit/push výhradně na design-exploration. Dostupná migrace 006 je podle potvrzení uživatele již aplikovaná; znovu se nespouští. Uvedené prompty jsou skutečné výňatky, nikoli domýšlená historie.

## Provedené změny a kontrola

- Dosavadní panel byl v běžném toku nad hlavním obsahem, což neodpovídalo požadované plovoucí liště. Komponenta se nyní umísťuje u patičky; její otevřený panel se renderuje React portalem do body, position: fixed dole vpravo. Není součástí horního rozložení ani potomkem patičky ovlivňovaným jejím layoutem.
- Stejně výrazná tlačítka, mobilní šířka s odsazením, safe-area, omezení výšky na dostupný viewport a vnitřní scroll pro malý displej. Bez backdropu/inert nebo blokace stránky. Křížek dovolí zavření bez udělení souhlasu; neukládá rozhodnutí a další návštěva se znovu zeptá.
- Detail měření je rozbalovací, hlavní panel je kompaktní. Nastavení soukromí je vždy dostupné v patičce. Klávesnicový fokus při opětovném otevření jde do panelu a vrací se na odkaz bez scroll skoku; automatické zobrazení fokus nepřebírá. Kliknutí první volby nesmí přesunout uživatele na konec stránky.
- Existující analytics.ts, databázová ochrana, API, SMTP, tokeny i marketing jsou beze změny. Neúspěšné mazání stále zobrazí chybu a umožní opakování, měření ihned zastaví, čekající odvolání přetrvá reload.
- Skutečný kód repository.catalog čte pouze etfs published=true s verified_at nejvýše 14 dní starým. Synchronizace má kandidátní vrstvu a nesmí publikovat neověřené fondy. Počet 20 kandidátů/0 publikovaných pochází z potvrzení uživatele, nikoli z přímé vzdálené kontroly této úlohy.
- Přečteny pending/evidence JSON, šablona, přípravný helper, importní script a validátor. Lidská data jsou null, usageReview.approved=false: import není schválený. Nevytvořeno falešné schválení ani nové hodnoty ETF; využívají se doložené podklady posledního commitu.
- docs/CATALOG_REVIEW.md doplněno o nejkratší konkrétní postup: nepřepisující kopie šablony pomocí Node, přesná tabulka polí pro správce, SPY 0.0945 a aktuální Morningstar VTI, práva emitentů, prepare/dry run a následný explicitní import. Příkazy pro DB zápis jsou pouze dokumentované, zde se neprováděly. Podkladem pro usageReview musí být skutečné oprávnění/posouzení; licence TickerInside nenahrazuje cizí emitentská práva.
- Existující nástroje automatizují přípravu, validaci a ticker upsert, nikoli lidské nebo právní rozhodnutí. Pro publikaci není potřeba nová migrace. Zdrojové datum nelze automaticky zaměnit s datem stažení nebo historickým datem přejmenování VTI.

## Testování

Lint, typecheck, všech 38 testů, produkční build a oficiální Vercel artifact kontrola 9 endpointů již prošly. Kontrola chybného .ts importu se zachovala. Backendové testy jsou izolované a neodesílají skutečné e-maily.

Browser testy jsou rozšířené o fixed pozici, patičkový odkaz, zachování polohy hero při zavření, nepřetékání panelu i ve viewportu 320×480, zavření bez souhlasu a automatické opětovné zobrazení, vedle stávajícího přijetí/odmítnutí/reload/odvolání/chyb/retry a formuláře bez analytiky. Katalog s 0 fondy i dostupnými schválenými fixture ověřuje celá MVP suite. Browser API jsou mockované; nejde o skutečné doručení nebo vzdálenou publikaci. Výsledek browser běhu se doplní po dokončení.

Žádné environment variables ani staré migrace se nemění, nepoužívá se nové připojení, token, služba nebo další AI agent.

Závěrečný browser běh prošel ve všech šířkách: MVP 320/390/768/1100/1440, soukromí 320/390/768/1440 a nízký viewport 320×480, administrace 320/390/768. Screenshoty 320 a 1440 px byly skutečně vizuálně zkontrolovány. Panel je fixed, hero se při zavření neposune, příjem/odmítnutí a chyba mazání/retry zůstaly funkční. Read-only review report stále správně odmítá všech pět neschválených návrhů (0/5). Nikdo zde nevyplnil schvalovací JSON za správce.

Pokus o read-only HTTP kontrolu skutečného veřejného Preview HTML a /api/catalog se z tohoto prostředí nepodařil (síťová URLError). Není tvrzeno vzdálené ověření této nové verze. Po automatickém Git deploymentu musí správce vyzkoušet Preview v čistém prohlížeči a následně patičkové Nastavení soukromí; samotné lokální fixture neprokazují stav nasazené databáze nebo SMTP.

Ověřen lokální autor RostislavHanza s GitHub noreply e-mailem; globální konfigurace se nemění. Commit je omezen na frontendovou lištu, její browser regrese a dokumentovaný schvalovací postup. Žádný backend, secret, migrace, cloudová konfigurace ani skutečné fondové schválení se nemění.
