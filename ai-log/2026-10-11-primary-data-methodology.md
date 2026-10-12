# TickerInside jako hlavní zdroj, jednoduché dávkové schválení

## Skutečné zadání (výňatky)

„TickerInside bude hlavním licencovaným datovým zdrojem. Oficiální stránky emitentů budou sloužit především k ověřování správnosti a aktuálnosti faktických údajů.“

„Nesmíme tvrdit, že TickerInside poskytl údaje, které jsme ve skutečnosti získali odjinud.“

„Preferuji jednoduché dávkové schválení prvních pěti ETF, nikoli další administrační systém.“

„Nezhoršuj přesnost údaje kvůli shodě s API.“

„Nepředstírej lidskou ani právní kontrolu.“

„Neprováděj vzdálené zápisy do Supabase.“

Použité jsou skutečně dostupné výňatky posledního promptu. Zadání dále určuje větev design-exploration, commit/push, SPY 0.0945, aktuální Morningstar VTI, původní české popisy, licence a atribuci, bezpečný upsert, testy a zachování backendu/souhlasů. Nevznikaly jiné rekonstruované prompty ani další AI agenti.

## Skutečně prověřené podklady

- Všech pět dokumentovaných fund JSON bylo skutečně načteno HTTP 200, stejně jako oficiální /api/ a odkazované /api/index.md. Použité hodnoty jsou zaznamenané v redukované evidence projekci a hashi/čase odpovědi. Plné odpovědi s nevyužívanými poli zůstávají jen v ignorované pracovní cache, nejsou datovým katalogem ani publikovaným artefaktem.
- Dokumentace výslovně popisuje aktuální fund soubory pod CC BY 4.0, uchování aktuálních kopií, atribuci odkazem na stránku fondu, nejvýše jednu kopii za nightly build a User-Agent. Historie/flows mají jiné podmínky; nepoužíváme je. API deklaruje vlastní licenci, ne nezávislé právní oprávnění ke všem cizím zdrojům. exchange dokumentace odvozuje z Nasdaq Trader directory; nevydáváme jej za přímý NYSE feed.
- Aktuální /terms/ i skutečně odkazovaný /legal/ vrátily HTTP 403. Aktuální úplné podmínky proto nejsou označené za přečtené. Pokus načíst canonical CC BY web také skončil síťovou chybou. Existující link CC BY 4.0 a providerova dokumentovaná licenční nabídka jsou uchovány; nepředstírá se získání písemného povolení.
- Všech pět oficiálních emitentských profilů a factsheetů bylo v této úloze znovu načteno HTTP 200; PDF byla textově přečtena pouze jako pracovní kontrola. Aktuální profil SPY obsahuje 0.0945, VTI aktuální Morningstar název/index; quarterly, listing a ostatní sazby doložené v uvedených podkladech. Do Git nepatří celé emitentské dokumenty, marketing, ratingy, holdings, obrázky nebo cenové série.
- SPY API stále má 0.09 market_data bez fee data a starší název. VTI stále starší název. Návrh tyto hodnoty nepřebírá, používá doložené emitentské opravy. Žádné datum historického přejmenování nebylo vymyšleno. Pozorovaný stav má zvláštní date_basis, stažení a lidská kontrola zůstávají odlišné.

## Implementace a kontrola výsledků

- Pending pětice nyní označuje konkrétní původ sedmi polí včetně tickeru: origin, verification, authored. Dostupná přesná metadata/fees používají licencovaný fund endpoint; emitent ověřuje listing/správnost a dodává chybějící index/dividendy, přesnější SPY sazbu a opravené názvy. Původní projektový popis má vlastní autorství a samostatné věcné kontrolní zdroje.
- Validátor zachovává povinné údaje, HTTPS domény, čerstvost, lidský podpis/čas, usageReview a důkaz burzy. Pro novou metodiku navíc vyžaduje původ každého pole, konkrétní ticker API URL/licenci a nepřipouští chybějící API pole vydávané za API nebo vlastní autorství finančního parametru. Dokumenty verification nemohou nahrazovat origin. Zdrojové doklady dovolují přesný význam data pozorovaného stavu, ne zpětnou fikci účinnosti. Kontrola nesmí časově předcházet získání podkladu.
- Malý batch manifest obsahuje vybrané tickery, kontrolora, skutečný čas, výslovné potvrzení uvedených podkladů a usageReview s konkrétním basis. SHA-256 váže souhlas na přesné návrhy. Po potvrzení se technické přiřazení zdrojových ID a opakované údaje kontrolora přenesou, nevytvářejí se jako autonomní lidské/právní schválení. Původní podrobný manifest zůstává kompatibilní. Neznámý nebo duplicitní fond, změněný návrh, neschválená práva a neúplnost selžou před DB zápisem.
- Atribuce na webu výslovně platí jen pro označené převzaté údaje. Obsahuje TickerInside, konkrétní stránku fondu, odkaz CC BY 4.0 a informaci o adaptaci/doplnění; žádné tvrzení o dodání indexu/popisu API. Per-field přehled rozlišuje skutečný původ a ověření. Zdrojové datum kalkulačky používá origin, nikoli novější ověřovací dokument vydávaný za původ převzaté sazby.
- Práva k emitentským faktickým doplněním dosud nejsou právně/lidsky uzavřená. Rozlišujeme jednotlivé veřejné fakty od kopie chráněného díla; netvrdíme ani blanket zákaz všech faktů, ani blanket licenci emitenta. Pro SPY/VOO/IVV/VTI/IWM jsou připravené podklady k jedné konkrétní konečné kontrole. usageReview stále false, žádný skutečný fond nebyl zde schválen. Pro takové fondy nemůže vzniknout produkční validní import.
- Zjednodušena CATALOG_REVIEW.md na konkrétní tabulku pěti fondů, právní rozhodnutí, malý schvalovací soubor a tři příkazy prepare/dry-run/explicitní apply. Další kandidáty lze doplnit stejnou metodikou; všech 15 se bez chybějících podkladů automaticky nepublikuje. SCHB/SCHD/RSP mají stále nepovolené emitenty. Synchronizace nadále mění jen schválenou datovanou nákladovost s opt-in a shodou názvu; SPY/VTI neupgradují starší hodnoty. Žádná migrace ani environment variable není potřebná.

## Opravy během práce

Po prvním typechecku opraveno TypeScript zúžení records před callbackem v batch helperu. Nepoužito any. Stávající test neznámého data VTI upraven: nově je jeho konkrétní pozorovaný stav doložený date_basis, takže namísto nucení člověka vyplňovat technický override test stále odmítá skutečně chybějící lidské datum. Kontrola vlastního textu má výjimku jen pro příslušné JSON v tomto repozitáři, nikoli obecný finanční zdroj github.com.

## Ověření

41 testů prošlo, včetně odmítnutí pending, explicitního batche pro dva i pět fondů, změněného hashe, špatné atribuce původu, licence, CLI přípravy/dry run a lokálního upsertu IVV/IWM bez duplicit. Platná syntetická schválení jsou pouze testy označené TEST ONLY; dočasné soubory se po testu odstraní. Nejsou to produkční schválení.

Prošly lint, typecheck, build, NodeNext runtime všech 9 API endpointů a oficiální Vercel artifact regresní kontrola včetně chybného .ts importu. Browser suite prošla pro celý srovnávač, empty katalog, soukromí/odvolání/retry/formulář bez analytiky, administraci a novou atribuci/přesnost SPY a VTI na 320/1440 px. Browser API jsou izolované fixture, nejsou důkazem vzdálené publikace ani SMTP doručení. Finální lint, typecheck, 41 testů a build po doplnění časové validace také prošly; browser kontroly ověřily stejné výsledné frontendové artefakty.

Žádné skutečné e-maily, vzdálené DB zápisy/migrace, změny cloudových proměnných ani ruční deployment. Pracovní cache se necommitne. Identita pro commit se znovu ověří pouze v lokální konfiguraci.
