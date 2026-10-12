# Souhlas a konverzní měření

Lišta je plovoucí position: fixed panel dole vpravo, na mobilu přes dostupnou šířku s odsazením a safe-area. Renderuje se do body přes React portal, nezabírá místo v rozložení a nemá modalitu/backdrop ani blokaci ostatního webu. Zavření křížkem není souhlas a neukládá rozhodnutí; při další návštěvě bez rozhodnutí se panel znovu ukáže. Odkaz Nastavení soukromí je v patičce. Při otevření odkazem se fokus přesune do panelu a po zavření se vrátí bez skoku stránky; při automatickém zobrazení se fokus nekrade. První návštěva má nezvolenou volbu a žádné měření. Odmítnout a Přijmout analytiku mají stejný vzhled a dostupnost z klávesnice. Nastavení lze kdykoliv znovu otevřít, souhlas není podmínkou sestavení ani doručení/otevření/úprav srovnání. Archivní designová dema neprovádějí analytiku.

## Úložiště a souhlasy

- localStorage.etf_analytics_consent: granted/denied, pouze preference volby; bez udělení souhlasu se neodesílají nepovinné události.
- sessionStorage.etf_visit_id: náhodné UUID návštěvy, jen při povolení; během reloadu se zachová. Po odvolání se odstraní; nové povolení má nový identifikátor. UTM se omezuje na ad-a/ad-b/direct, ostatní parametry/tokeny se do analytiky neposílají.
- localStorage.etf_pending_withdrawal: pouze známý identifikátor/campaign čekající na odstranění; není to pokračování měření. Při reloadu se mazání zopakuje. Dokud neuspěje, měření zůstává vypnuté, UI nesmí hlásit smazání.
- Žádné analytické cookies. Nezbytná HttpOnly cookie etf_session pro potvrzený přehled zůstává zachovaná; stejně tak Preview admin session. Volbu ukládáme v prohlížeči, proto nejde o serverový profil souhlasů napříč zařízeními.
- Marketing je samostatný opt-in v e-mailovém formuláři. consent_records evidují tento marketingový souhlas, nikoli volbu lišty. U žádosti vzniklé s analytickým souhlasem se uchovává consent=true a visitId/campaign v comparisons.attribution; bez souhlasu je attribution=null.

## Odvolání

Frontend ihned vypne další track/attribution, počká na již odeslané klientské události a zavolá stávající POST /api/events s withdraw=true. Serverové withdraw_analytics smaže funnel_events přiřazené návštěvě a vynuluje comparisons.attribution. Srovnání, marketingový souhlas, kontaktní žádost a přístupové session se nemažou. Chyba se zobrazí a retry je trvalý přes reload; nové přijetí nelze použít k přeskočení nezdařeného odstranění.

Nová migrace 202610110006_analytics_revocation.sql doplňuje RLS chráněnou tabulku revokovaných UUID a triggery: opožděná událost nebo nová žádost se starým visitId po odvolání nepřidá analytiku zpět. Sdílený transakční lock na návštěvu koordinuje zápis a odvolání; první vyčištění attribution respektuje pořadí row locků používané read/redeem, druhé zachytí souběžnou novou žádost. Ostatní funkce srovnávače zůstávají stejné. Revokační doklady se drží 90 dní, poté je odstraní stávající denní purge nebo další odvolání. Migrace 006 byla podle aktuálního potvrzení správce v Preview aplikována; tato úloha ji vzdáleně nespouští ani nemění.

Odvolání se vztahuje na známou aktuální návštěvu; browser bez jejího identifikátoru nemůže rekonstruovat historické návštěvy. Pro širší žádost o odstranění použijte kontakt správce. Serverové události potvrzení/otevření se řídí původním souhlasem uloženým u žádosti, i při otevření na jiném zařízení; po odvolání této návštěvy již nepokračují.

## Skutečně podporovaný funnel

Klient po souhlasu: landing_view (aktuální zobrazení, nikoli zpětné měření), comparison_interacted (výběr, hledání, částka), comparison_configured (pokračování), form_started (focus e-mailu), lead_submit_attempt (submit). Jednou na návštěvu a typ; serverový unikátní index chrání duplicity i po reloadu.

Server jen u consented attribution: lead_accepted, email_sent po skutečném SMTP přijetí, email_confirmed při vědomém potvrzení tokenu, comparison_opened při oprávněném načtení. Gmail SMTP neposkytuje důkaz doručení do schránky; email_sent se nesmí vykazovat jako delivered. Read/redeem chráněné API a tokeny zůstávají beze změny.

Návštěvy bez souhlasu se v tomto funnelu **nepočítají**. Naměřená konverze je konverze souhlasící kohorty, nikoli veškerého reklamního provozu; jde o výběrové zkreslení. Dřívější interakce se po přijetí zpětně nedopočítávají. Odstranění událostí po odvolání změní historické počty. Původní dvě reklamy, odhady a A/B hypotézy v docs/PLAN.md zůstávají; testy nelze vyhodnocovat jako vítězství bez dostatečné souhlasící kohorty.
