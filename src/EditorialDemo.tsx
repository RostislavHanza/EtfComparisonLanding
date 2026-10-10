import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { annualCost, etfs, MAX_AMOUNT, money, percent, validAmount } from './etfData'
import type { Etf } from './etfData'
import './editorial-comparator.css'

type View = 'compare' | 'email' | 'preview'
function initialState() {
  const query = new URLSearchParams(window.location.search)
  const chosen = [...new Set((query.get('etfs') ?? 'SPY,VOO').split(','))].filter(t => etfs.some(e => e.ticker === t))
  const raw = query.get('amount')
  const amount = raw !== null && raw.trim() !== '' ? Number(raw) : 100_000
  return { selected: chosen.length >= 2 && chosen.length <= 3 ? chosen : ['SPY', 'VOO'], amount: validAmount(amount) ? amount : 100_000, view: query.get('view') === 'preview' ? 'preview' as const : 'compare' as const }
}

function DataNotice() {
  return <div className="data-notice"><strong>Demonstrační parametry, nikoli ověřená aktuální data.</strong><p>SPY, VOO a IVV jsou skutečné tickery z tohoto zadání. Zde uvedené názvy, index, nákladovost, dividendy a charakteristiky čekají na kontrolu primárních zdrojů; stránky emitentů nebyly při přípravě dostupné. Výpočty proto slouží k vyzkoušení rozhraní.</p></div>
}

function ComparisonTable({ funds }: { funds: readonly Etf[] }) {
  return <section className="comparison-section" aria-labelledby="comparison-title"><div className="section-heading"><span className="eyebrow">02 / Souvislosti</span><h2 id="comparison-title">Vedle sebe. Srozumitelně.</h2><p>Každý parametr níže je demonstrační. Zdrojové odkazy jsou určené k ověření.</p></div>
    <table className="comparison-table"><caption>Srovnání vybraných ETF · demonstrační údaje</caption><thead><tr><th scope="col">Parametr</th>{funds.map(f => <th scope="col" key={f.ticker}>{f.ticker}</th>)}</tr></thead><tbody>{[
      { label: 'Sledovaný index', value: (f: Etf) => f.index },
      { label: 'Roční nákladovost', value: (f: Etf) => percent(f.expenseRatioPercent) },
      { label: 'Dividendy', value: (f: Etf) => f.dividends },
      { label: 'Charakteristika', value: (f: Etf) => f.description },
    ].map(row => <tr key={row.label}><th scope="row">{row.label} <small>Demo</small></th>{funds.map(f => <td key={f.ticker}><span className="mobile-column-label" aria-hidden="true">{f.ticker}</span><span>{row.value(f)}</span></td>)}</tr>)}<tr><th scope="row">Zdroj k ověření</th>{funds.map(f => <td key={f.ticker}><span className="mobile-column-label" aria-hidden="true">{f.ticker}</span><a href={f.source} target="_blank" rel="noreferrer">Dokumentace {f.ticker} →</a></td>)}</tr></tbody></table>
  </section>
}

function CostCalculator({ funds, amount, amountInput, updateAmount, invalid }: { funds: readonly Etf[], amount: number, amountInput: string, updateAmount: (value: string) => void, invalid: boolean }) {
  const costs = funds.map(f => ({ ticker: f.ticker, cost: annualCost(amount, f.expenseRatioPercent) }))
  const scaleMax = Math.max(100, Math.ceil(Math.max(...costs.map(f => f.cost), 0) / 100) * 100)
  return <section className="calculator-section" aria-labelledby="calculator-title"><div className="section-heading"><span className="eyebrow">03 / Náklady v korunách</span><h2 id="calculator-title">Kolik je procento v praxi?</h2><p>Vyzkoušejte částku a porovnejte orientační roční náklady.</p></div><div className="calculator-layout"><div className="amount-controls"><label htmlFor="investment">Investovaná částka v Kč</label><input id="investment" type="number" min="0" max={MAX_AMOUNT} step="any" value={amountInput} onChange={e => updateAmount(e.target.value)} aria-invalid={invalid} aria-describedby="amount-help amount-error"/><p id="amount-error" role="status">{invalid ? 'Zadejte částku od 0 do 10 000 000 Kč. Graf zatím ukazuje poslední platnou částku.' : ''}</p><label className="range-label" htmlFor="investment-range">Upravit částku posuvníkem</label><input id="investment-range" type="range" min="0" max={MAX_AMOUNT} step="1000" value={amount} onChange={e => updateAmount(e.target.value)} aria-valuetext={money(amount)}/><div className="range-limits"><span>0 Kč</span><span>10 mil. Kč</span></div><p id="amount-help" className="calculator-formula">Částka × expense ratio / 100.<br/>100 000 Kč × 0,03 % = 30 Kč za rok.</p></div><figure className="cost-chart"><figcaption>Orientační roční náklady <span>Demo sazby · Kč / rok</span></figcaption><div className="chart-axis" aria-hidden="true"><span>0</span><span>{money(scaleMax)}</span></div><ul>{costs.map(f => <li key={f.ticker}><div className="bar-label"><strong>{f.ticker}</strong><span className="cost-value" data-ticker={f.ticker}>{money(f.cost)}</span></div><div className="bar-track" aria-hidden="true"><div className="bar-fill" style={{ width: `${f.cost / scaleMax * 100}%` }}/></div></li>)}</ul><p className="chart-note">Všechny sloupce mají společnou stupnici. Při změně částky se její rozsah může upravit.</p></figure></div><p className="calculation-note">Orientační výpočet podle <strong>demonstračního expense ratio</strong> při neměnné hodnotě investice. Nezahrnuje poplatky brokera, měnové konverze, daně ani změny hodnoty investice. Nákladovost se obvykle promítá do hodnoty fondu; nejde o samostatnou fakturu ani predikci výnosů.</p></section>
}

export default function EditorialDemo() {
  const [initial] = useState(initialState)
  const [selected, setSelected] = useState<string[]>(initial.selected)
  const [amount, setAmount] = useState(initial.amount)
  const [amountInput, setAmountInput] = useState(String(initial.amount))
  const [view, setView] = useState<View>(initial.view)
  const [simulated, setSimulated] = useState(false)
  const contentRef = useRef<HTMLElement>(null)
  const previousView = useRef(view)
  const chosen = etfs.filter(f => selected.includes(f.ticker))
  const invalid = amountInput.trim() === '' || !validAmount(Number(amountInput))
  const ready = selected.length >= 2 && !invalid
  useEffect(() => {
    if (previousView.current !== view) {
      contentRef.current?.focus({ preventScroll: true })
      contentRef.current?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
    previousView.current = view
  }, [view])
  function updateAmount(value: string) { setAmountInput(value); if (value.trim() && validAmount(Number(value))) setAmount(Number(value)) }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!ready) return; event.currentTarget.reset(); setSimulated(true); setView('preview') }
  function previewUrl() { const url = new URL(window.location.href); url.search = ''; url.searchParams.set('variant', 'editorial'); url.searchParams.set('view', 'preview'); url.searchParams.set('etfs', selected.join(',')); url.searchParams.set('amount', String(amount)); url.hash = ''; return url.toString() }
  return <div className="landing editorial original-editorial"><header className="site-header"><a className="brand" href="#main"><span className="brand-icon" aria-hidden="true">≋</span> ETF<span className="brand-light">přehled</span></a><span className="header-label">Pro české investory</span></header><main id="main"><div className="opening"><section className="hero"><div className="eyebrow"><span className="dot"/> Americký trh. Český pohled.</div><h1>Americká ETF.<br/><em>Jasnější pohled.</em></h1><p className="hero-description">Vyberte ETF, porovnejte jejich zaměření a převeďte nákladovost na koruny. Jeden přehled, který si sestavíte sami.</p><a className="primary hero-cta" href="#comparator">Sestavit moje srovnání <span aria-hidden="true">→</span></a><p className="hero-footnote">Bez účtu · V češtině · Žádné sliby výnosu</p></section><aside className="editorial-intro"><span className="eyebrow">Malý průvodce velkým trhem</span><h2>Tři fondy.<br/>Váš vlastní pohled.</h2><ol><li><span>01</span>Vyberte ETF</li><li><span>02</span>Porovnejte parametry</li><li><span>03</span>Nastavte částku</li><li><span>04</span>Vyzkoušejte odkaz e-mailem</li></ol><p className="risk-note">Americká ETF obchodovaná na NYSE Arca mohou být pro český retail nedostupná kvůli PRIIPs/KID. Dostupnost ověřte u brokera. Burzovní údaje tohoto prototypu čekají na ověření.</p></aside></div>
    <section id="comparator" ref={contentRef} tabIndex={-1} className="comparator-content" aria-label="Interaktivní srovnávač">
      {view === 'email' ? <section className="editorial-email" aria-labelledby="prepared-title"><span className="eyebrow">04 / Odkaz na váš přehled</span><h2 id="prepared-title">Vaše srovnání je připravené.</h2><p>Pošleme vám odkaz na interaktivní přehled, ke kterému se můžete kdykoliv vrátit.</p><p className="saved-summary">{selected.join(' + ')} · {money(amount)}</p><p className="demo-email-note">Pouze simulace. Žádný e-mail neodesíláme, adresu neukládáme. Použijte testovací adresu.</p><form onSubmit={submit}><label htmlFor="prototype-email">E-mailová adresa</label><input id="prototype-email" type="email" name="email" autoComplete="email" required placeholder="test@example.com" aria-describedby="prototype-privacy"/><button className="primary" type="submit">Simulovat odeslání a otevřít náhled →</button><p id="prototype-privacy">V hotové službě by odkaz zpřístupnil srovnání po potvrzení adresy. <a href="#privacy">Ochrana údajů v prototypu</a></p></form><button className="back-button" onClick={() => setView('compare')}>← Zpět ke srovnání</button></section> : <>
        {view === 'preview' && <section className="preview-heading"><span className="eyebrow">Náhled stránky z e-mailového odkazu</span><h2>Vaše ETF. Vaše souvislosti.</h2><p role="status">{simulated ? 'Simulace odeslání dokončena. Žádný e-mail nebyl odeslán.' : 'Otevřen veřejný demonstrační přehled, nikoli skutečný e-mailový odkaz.'}</p><p>Výběr i částka zůstávají zachované. Níže je můžete dál upravovat.</p><a className="preview-link" href={previewUrl()} target="_blank" rel="noreferrer">Otevřít tento náhled v nové kartě →</a><small>Demo URL obsahuje jen tickery a částku, žádný e-mail. Je veřejná a neposkytuje zabezpečený přístup.</small></section>}
        <div className="selection-section"><div className="section-heading"><span className="eyebrow">01 / Váš výběr</span><h2>Které fondy vás zajímají?</h2><p>Vyberte 2–3 ETF. Srovnání i kalkulačka reagují okamžitě.</p></div><fieldset className="real-etf-selection"><legend>ETF ke srovnání</legend><div>{etfs.map(f => <label key={f.ticker} className={`real-etf-option ${selected.includes(f.ticker) ? 'chosen' : ''}`}><input type="checkbox" checked={selected.includes(f.ticker)} onChange={() => setSelected(old => old.includes(f.ticker) ? old.filter(t => t !== f.ticker) : [...old, f.ticker])}/><span><strong>{f.ticker}</strong><small>{f.name}</small></span></label>)}</div><p role="status">{selected.length < 2 ? 'Pro pokračování vyberte alespoň dvě ETF.' : `Vybráno ${selected.length} ze 3 ETF.`}</p></fieldset></div>
        <DataNotice/><ComparisonTable funds={chosen}/><CostCalculator funds={chosen} amount={amount} amountInput={amountInput} updateAmount={updateAmount} invalid={invalid}/>
        <section className="comparison-next"><div><span className="eyebrow">Váš přehled, na který můžete navázat</span><h3>{selected.join(' + ') || 'Vyberte ETF'} · {money(amount)}</h3><p>Další krok: ukázka formuláře a náhled stránky z odkazu.</p></div><button className="primary" disabled={!ready} onClick={() => setView('email')}>Pokračovat k e-mailu →</button></section>
      </>}
    </section><section className="faq"><span className="eyebrow">Důležité souvislosti</span><h2>Přehled není doporučení.</h2><details><summary>Jsou údaje aktuální a ověřené?</summary><p>Ne. Parametry jsou zde označené jako demonstrační, protože primární dokumenty nebylo možné při přípravě načíst. Před skutečným použitím ověřte burzu, nákladovost, index a dividendovou politiku v dokumentaci emitenta.</p></details><details><summary>Mohu tyto fondy koupit v EU?</summary><p>Americká ETF mohou být retailovým investorům v EU nedostupná kvůli PRIIPs/KID. Nejde o UCITS alternativy. Dostupnost ověřte u brokera.</p></details><details><summary>Co se stane s e-mailem?</summary><p>Nic se neodesílá ani neukládá. Formulář pouze přepne na náhled; celý průchod funguje v prohlížeči bez backendu.</p></details></section></main><footer><a className="brand" href="#main">ETF přehled</a><p>Vzdělávací frontendový prototyp, nikoli investiční doporučení. Investování nese riziko ztráty.</p><details id="privacy"><summary>Ochrana údajů v prototypu</summary><p>E-mail se neodesílá na server, neukládá do úložiště, URL ani analytiky. Po simulaci je pole vymazáno. Prohlížeč může podle svého nastavení nabídnout vlastní automatické vyplňování. Veřejný demo odkaz obsahuje pouze tickery a částku.</p></details></footer></div>
}
