import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { concepts, funds } from './data'
import type { Concept } from './data'

function initialConcept(): Concept {
  const value = new URLSearchParams(window.location.search).get('variant')
  return concepts.find(c => c.id === value)?.id ?? 'editorial'
}

function Selection({ selected, toggle, variant }: { selected: string[], toggle: (id: string) => void, variant: Concept }) {
  return <fieldset className="selection"><legend>Vyberte 2–3 položky do svého srovnání</legend>
    <p className="fixture-note">Zástupné položky pro návrh rozhraní. Nejde o skutečná ETF.</p>
    <div className="fund-list">{funds.map(f => variant === 'guide' ?
      <details className="fund-detail" key={f.id} open={selected.includes(f.id)}>
        <summary><span className="fund-mark">{f.mark}</span><span>{f.category}</span></summary>
        <p>{f.description}</p><label className="fund-option"><input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} disabled={!selected.includes(f.id) && selected.length >= 3}/><span>Zařadit {f.name}</span></label>
      </details> :
      <label key={f.id} className={`fund-option ${selected.includes(f.id) ? 'chosen' : ''}`}>
        <input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} disabled={!selected.includes(f.id) && selected.length >= 3}/>
        <span className="fund-mark" aria-hidden="true">{f.mark}</span><span className="fund-copy"><strong>{variant === 'compact' ? f.category : f.name}</strong><small>{variant === 'compact' ? f.name : f.category}</small></span><span className="check-mark" aria-hidden="true">{selected.includes(f.id) ? '✓' : '+'}</span>
      </label>)}</div>
    <p className="selection-summary" aria-live="polite">Vybráno {selected.length} ze 3 · {selected.map(id => funds.find(f => f.id === id)?.mark).join(' + ') || 'zatím nic'}</p>
  </fieldset>
}

function EmailForm({ selected }: { selected: string[] }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selected.length < 2) { setError('Vyberte alespoň dvě položky výše.'); return }
    setError(''); setDone(true); event.currentTarget.reset()
  }
  return <section className="email-panel" aria-labelledby="email-title">
    <span className="eyebrow">Druhý krok · váš e-mail</span><h3 id="email-title">Váš výběr. Jeden přehled.</h3>
    <p>V hotové službě srovnání otevřete až po potvrzení e-mailové adresy.</p>
    <form onSubmit={submit} onChange={() => {setDone(false); setError('')}}>
      <label htmlFor="email">E-mailová adresa</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="vy@priklad.cz" required aria-describedby="demo-note form-status" />
      <button className="primary" type="submit">Vyzkoušet formulář <span aria-hidden="true">→</span></button>
      <p className="form-note" id="demo-note">Pouze ukázka: nic neodesíláme ani neukládáme. Použijte testovací adresu. <a href="#privacy">Ochrana údajů</a></p>
      <p id="form-status" role="status" className="form-status">{error || (done ? 'Ukázka dokončena. Žádný e-mail nebyl odeslán a srovnání zatím není dostupné.' : '')}</p>
    </form>
  </section>
}

function Benefits() {
  return <section className="benefits" aria-labelledby="benefits-title"><div><span className="eyebrow">Méně hledání. Více souvislostí.</span><h2 id="benefits-title">Co bude ve vašem srovnání?</h2><p>Podklady k vlastnímu rozhodování, srozumitelně a v češtině.</p></div><div className="benefit-grid">{[
    ['01', 'Náklady v kontextu', 'Co fond účtuje a kde údaj najdete v dokumentaci emitenta.'],
    ['02', 'Co fond drží', 'Zaměření, diverzifikace a rozdíly mezi vybranými fondy.'],
    ['03', 'Dividendy a rizika', 'Způsob distribuce, měnové riziko a omezení pro český retail.'],
  ].map(([n, title, description]) => <article key={n}><span className="benefit-number">{n}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
}

function FAQ() {
  return <section className="faq"><span className="eyebrow">Než začnete</span><h2>Dobré otázky.</h2>{[
    ['Mohu americká ETF jako český investor koupit?', 'Americká ETF mohou být pro český retail nedostupná kvůli požadavkům PRIIPs/KID. Dostupnost záleží na instrumentu a brokerovi. Srovnání není doporučení k nákupu.'],
    ['Kdy dostanu srovnání?', 'V plánované službě až po potvrzení adresy ve schránce. Tento frontendový návrh neodesílá e-maily a neobsahuje skutečné srovnávací údaje.'],
    ['Odkud budou údaje?', 'Z primárních dokumentů emitentů a burz, s uvedením zdroje a data kontroly. V tomto návrhu nejsou ověřené údaje konkrétních ETF.'],
  ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
}

function Landing({ variant }: { variant: Concept }) {
  const [selected, setSelected] = useState<string[]>(['a', 'b'])
  const [step, setStep] = useState(1)
  const toggle = (id: string) => setSelected(old => old.includes(id) ? old.filter(i => i !== id) : old.length < 3 ? [...old, id] : old)
  const heroTitles: Record<Concept, React.ReactNode> = {
    editorial: <>Americká ETF.<br/><em>Jasnější pohled.</em></>,
    steps: <>Od výběru<br/>k <em>přehledu.</em></>,
    terminal: <>Méně šumu.<br/><em>Více kontextu.</em></>,
    guide: <>Váš první krok<br/>k pochopení <em>ETF.</em></>,
    compact: <>Vyberte.<br/>Porovnejte.<br/><em>Pochopte.</em></>,
  }
  return <div className={`landing ${variant}`}>
    <header className="site-header"><a className="brand" href="#main"><span className="brand-icon" aria-hidden="true">≋</span> ETF<span className="brand-light">přehled</span></a><span className="header-label">Pro české investory</span></header>
    <main id="main">
      <div className="opening">
        <section className="hero"><div className="eyebrow"><span className="dot"/> Americký trh. Český pohled.</div><h1>{heroTitles[variant]}</h1><p className="hero-description">Náklady, zaměření a rizika na jednom místě. Vyberte fondy, které vás zajímají. Srovnání získáte zdarma po potvrzení e-mailu.</p><a className="primary hero-cta" href="#selection">Sestavit můj přehled <span aria-hidden="true">→</span></a><p className="hero-footnote">Bez účtu · V češtině · Žádné sliby výnosu</p>
          {variant !== 'compact' && <div className="hero-art" aria-hidden="true"><div className="art-label">VÝBĚR → SOUVISLOSTI → PŘEHLED</div><div className="art-orbit"><span>A</span><span>B</span><span>C</span></div><div className="art-caption">Různé fondy.<br/><strong>Společný kontext.</strong></div></div>}
        </section>
        <section className="builder" id="selection" aria-labelledby="builder-title">
          <div className="builder-heading"><span className="eyebrow">{variant === 'terminal' ? '01 / SESTAVIT VÝBĚR' : 'Začněte tím, co vás zajímá'}</span><h2 id="builder-title">Váš vlastní přehled</h2></div>
          <p className="risk-note">Americká ETF mohou být českému retailu nedostupná kvůli PRIIPs/KID. Ověřte dostupnost u svého brokera.</p>
          {variant === 'steps' && <ol className="step-indicator"><li aria-current={step === 1 ? 'step' : undefined}>1. Výběr</li><li aria-current={step === 2 ? 'step' : undefined}>2. E-mail</li></ol>}
          {(variant !== 'steps' || step === 1) && <Selection selected={selected} toggle={toggle} variant={variant}/>}
          {variant === 'steps' && step === 1 && <button className="primary" disabled={selected.length < 2} onClick={() => setStep(2)}>Pokračovat k e-mailu →</button>}
          {variant === 'steps' && step === 2 && <button className="back-button" onClick={() => setStep(1)}>← Upravit výběr ({selected.map(id => id.toUpperCase()).join(' + ')})</button>}
          {(variant !== 'steps' || step === 2) && <EmailForm selected={selected}/>}
        </section>
      </div>
      <Benefits/><FAQ/>
      <section className="closing"><span className="eyebrow">Vaše rozhodnutí začíná přehledem</span><h2>Dejte si fondy do souvislostí.</h2><a className="primary" href="#selection">Zpět k mému výběru →</a></section>
    </main>
    <footer><a className="brand" href="#main">ETF přehled</a><p>Vzdělávací obsah, nikoli investiční doporučení. Investování nese riziko ztráty.</p><details id="privacy"><summary>Ochrana údajů a stav prototypu</summary><p>Tento návrh neukládá kontakty, nepoužívá analytiku ani cookies a neodesílá formuláře na server. Pole je pouze ukázka rozhraní. Před spuštěním skutečné služby je nutné doplnit provozovatele, kontakt, právní základ, dobu uchování a úplné informace o zpracování.</p></details><p className="footer-note">Vizuální prototyp · Ověřená data ETF budou doplněna před produkčním spuštěním.</p></footer>
  </div>
}

export default function App() {
  const [variant, setVariant] = useState<Concept>(initialConcept)
  useEffect(() => {const onPop = () => setVariant(initialConcept()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop)}, [])
  function choose(value: Concept) { const url = new URL(window.location.href); url.searchParams.set('variant', value); window.history.pushState({}, '', url); setVariant(value) }
  return <><a className="skip-link" href="#main">Přejít na obsah</a><aside className="concept-bar" aria-label="Přepínání návrhů"><div className="concept-inner"><span className="prototype-label">DESIGN STUDIE <span>• 5 návrhů</span></span><label className="mobile-switch">Návrh<select value={variant} onChange={e => choose(e.target.value as Concept)}>{concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><nav className="desktop-switch" aria-label="Varianty">{concepts.map(c => <button key={c.id} onClick={() => choose(c.id)} aria-pressed={variant === c.id}>{c.name}</button>)}</nav></div><p className="concept-description">{concepts.find(c => c.id === variant)?.note} <strong>Demo bez odesílání.</strong></p></aside><Landing key={variant} variant={variant}/></>
}
