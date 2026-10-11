# Dokončení první veřejné dávky pro demo

## Skutečně dostupné prompty

Výňatky aktuálního zadání:

> Provozovatel již výslovně přijal navržený model použití omezených faktických údajů a požaduje označení kontrolora `admin`.

> Nevydávej toto rozhodnutí za právní stanovisko ani za výslovné povolení od emitentů.

> Chci skončit se skutečně použitelným katalogem, ne s další sadou návrhů.

> Zatím neprováděj vzdálený zápis do Supabase. Finální import provedeme po kontrole připravené dávky.

> Commitni a pushni pouze na `design-exploration`; `main` neměň.

Skutečná korekce doručená během práce:

> Úplné právní podmínky TickerInside již byly nezávisle otevřeny a ověřeny. Není správné nadále uvádět, že jsou nedostupné kvůli HTTP 403.

> Stránka `/legal/`, naposledy revidovaná 9. 10. 2026, výslovně potvrzuje licenci CC BY 4.0 pro vlastní práci TickerInside v aktuálních API snapshotech, včetně komerčního použití s atribucí.

> Zachovej již připravený finální importní JSON, kontrolora `admin`, přesnou sazbu SPY a aktuální název/index VTI.

Další části zadání požadují pět fondů SPY/VOO/IVV/VTI/IWM, upsert, validaci/dry run, zdroje/atribuci, zachování NodeNext/Gmail/soukromí a testy. Nejsou rekonstruované dřívější prompty ani vymyšlené osobní údaje. Žádní další agenti nebyli použiti.

## Provedená kontrola a rozhodnutí

Navázáno na 4532ad22ae0fc554628be60adfc37e928689013b, čistá větev design-exploration. Původní pending návrh a schvalovací hash zůstaly beze změny. Použity již skutečně stažené API odpovědi a deset emitentských profilů/PDF v pracovní cache z předchozího kroku; hashe byly zkontrolovány proti evidenci. V podkladech znovu zkontrolováno NYSE Arca a Quarterly všech pěti, přesné SPY 0.0945 a aktuální VTI Morningstar název/index. Nevydává se to za nové stažení, osobní návštěvu webů správcem nebo právní audit.

Výslovné rozhodnutí provozovatele je skutečně dostupné v tomto zadání, proto není důvod žádat znovu obecné oprávnění. Existující batch helper vytvořil manifest priority-five.demo-approval.json s admin a skutečným časem provedené technické kontroly/přípravy (20:19:38.179 UTC); finální import data/priority-five.approved.json má všech pět fondů. Zápis do DB zůstává samostatný krok správce po kontrole dávky.

Validátor nyní uchová odlišný význam schválení: approvalType=operator-publication-decision, issuerPermissionClaimed=false, neprázdná limitations. approved=true není tvrzení o auditu nebo licenci emitenta. Původ sedmi polí, licence konkrétního fund endpointu, shoda emitenta, doklad burzy, čerstvost, sazba, zdrojová data a duplicate ochrany se neodstranily. Starší schvalovací formáty zůstávají kompatibilní. Z připraveného výstupu se odstraní pouze pending-only verificationStatus, zdrojové doklady zůstávají.

## Konkrétní oprava licenční evidence

Na korekci správce odstraněno tvrzení o aktuální nedostupnosti úplných podmínek z současné dokumentace, manifestu a finálního importu. /legal/ (revize 9. 10. 2026), /terms/ a /api/ jsou v evidence uvedené jako independently_verified_by_operator s časem zaznamenání korekce. Není vymyšlen nový HTTP 200 nebo tvrzení, že je v tomto kroku četl AI agent. CC BY 4.0 pokrývá vlastní práci TickerInside v aktuálních fund snapshotech včetně komerčního použití s atribucí. Historie holdings a ETF flows se nepoužívají. Přetrvává upozornění na práva třetích stran a absence emitentského písemného povolení; neopakuje se požadavek na další formální audit omezeného demo modelu již přijatého provozovatelem.

Oprava změnila jen licenční evidence a usageReview, nikoli ETF hodnoty, sources, datum technické kontroly nebo admin. Jejich shoda byla programově ověřena před aktualizací finálního souboru. Historické rešeršní poznámky jsou označené jako historické, ne nové blokace.

## Kontrola výsledků a opravy

První typecheck odhalil příliš úzké odvození typu dočasného zdrojového objektu a spread metadata rozhodnutí; doplněn Record pro zdroj a přesné optional typy rozhodnutí, bez any. Test callback odstranil nesprávnou ruční anotaci. Test schválené dávky má hodiny pevně nastavené na skutečný zaznamenaný krok a zvlášť ověřuje expiraci po 15 dnech. CLI test má izolovaný proces bez DB secrets a stejné testovací hodiny; nezpůsobí trvalé selhání CI po zestárnutí skutečné dávky ani nepřepisuje její skutečné datum.

Prošly lint, typecheck, 44 testů a produkční build včetně běžného NodeNext spuštění všech 9 API endpointů bez TS loaderu. Oficiální Vercel builder prošel pro všech 9 artefaktů i regresi špatného .ts importu. Přidány testy skutečné dávky/admin, odmítnutí chybějícího rozhodnutí, nepravdivého issuerPermissionClaimed, skrytých omezení, chybějícího burzovního důkazu a starých dat. Lokální PostgreSQL dvakrát upsertoval pět fondů včetně existujících IVV/IWM, bez duplicit; ani se zapnutým sync opt-in starší API jméno nesnížilo SPY sazbu ani VTI název/index. Tyto zápisy byly pouze do izolovaného PGlite, nikoli vzdálené Supabase.

Po licenční korekci znovu prošel publikační validátor 5/5, skutečný CLI dry run a všechny tři cílené testy schválené dávky. Celá browser suite prošla: srovnávač 320/390/768/1100/1440 px, prázdný katalog, obnovení/úpravy uloženého srovnání, neúspěšný mail, všechny archivní návrhy; soukromí 320/390/768/1440 px, přijetí/odmítnutí/reload/odvolání/chyba/retry/zachované funkční cookies; Preview administrace 320/390/768 px; atribuce a SPY/VTI nad aktuálním připraveným JSON 320/1440 px. API v browser testech jsou izolované fixture, nikoli důkaz vzdáleného importu nebo SMTP doručení. Finální lint a diff whitespace kontrola také prošly.

Žádný skutečný e-mail, vzdálený zápis, migrace, cloudová konfigurace nebo ruční deployment. Nová migrace není potřeba; rozlišení rozhodnutí se vejde do existujícího usage_review JSONB. Schválení a příprava souboru nejsou doklad jeho importu nebo naplnění veřejného Vercel katalogu.
