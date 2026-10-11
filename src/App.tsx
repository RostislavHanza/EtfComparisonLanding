import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { concepts, designs, funds } from './data'
import type { Concept, DesignId } from './data'
import EditorialComparator from './EditorialComparator'
import EditorialDemo from './EditorialDemo'
import PreviewAdmin from './PreviewAdmin'

function initialDesign(): DesignId {
  const value = new URLSearchParams(window.location.search).get('variant')
  if (value === 'editorial' || value === 'editorial-demo' || value === 'terminal' || value === 'guide') return value
  const design = designs.find(d => d.id === value || `${value}-blue` === d.id)
  return design?.id ?? 'editorial'
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

function EmailForm({ selected, onComplete, roundTwo = false }: { selected: string[], onComplete?: () => void, roundTwo?: boolean }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selected.length < 2) { setError('Vyberte alespoň dvě položky výše.'); return }
    setError(''); setDone(true); event.currentTarget.reset(); onComplete?.()
  }
  return <section className="email-panel" aria-labelledby="email-title">
    <span className="eyebrow">{roundTwo ? 'Třetí krok · odkaz na srovnání' : 'Druhý krok · váš e-mail'}</span><h3 id="email-title">Váš výběr. Jeden přehled.</h3>
    <p>V hotové službě vám přijde odkaz na interaktivní srovnání. Přístup získáte až po potvrzení e-mailové adresy.</p>
    <form onSubmit={submit} onChange={() => {setDone(false); setError('')}}>
      <label htmlFor="email">E-mailová adresa</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="vy@priklad.cz" required aria-describedby="demo-note form-status" />
      <button className="primary" type="submit">Vyzkoušet formulář <span aria-hidden="true">→</span></button>
      <p className="form-note" id="demo-note">Pouze ukázka: nic neodesíláme ani neukládáme. Použijte testovací adresu. <a href="#privacy">Ochrana údajů</a></p>
      <p id="form-status" role="status" className="form-status">{error || (done ? 'Ukázka dokončena. Žádný e-mail nebyl odeslán a srovnání zatím není dostupné.' : '')}</p>
    </form>
  </section>
}

const parameterOptions = [
  { id: 'cost', label: 'Náklady', description: 'Poplatky uvedené emitentem' },
  { id: 'holdings', label: 'Zaměření', description: 'Složení a diverzifikace' },
  { id: 'risk', label: 'Dividendy a rizika', description: 'Výplaty a měnové souvislosti' },
] as const

function CompareSettings({ parameters, setParameters }: { parameters: string[], setParameters: (value: string[]) => void }) {
  return <fieldset className="compare-settings"><legend>Co chcete porovnat?</legend><p className="settings-caption">Vyberte parametry svého přehledu. Alespoň jeden ponechte zapnutý.</p><div className="parameter-list">{parameterOptions.map(p => <label className="parameter-option" key={p.id}><input type="checkbox" checked={parameters.includes(p.id)} disabled={parameters.includes(p.id) && parameters.length === 1} onChange={() => setParameters(parameters.includes(p.id) ? parameters.filter(id => id !== p.id) : [...parameters, p.id])}/><span><strong>{p.label}</strong><small>{p.description}</small></span></label>)}</div></fieldset>
}

function ProductFlow({ step }: { step: number }) {
  return <ol className="product-flow" aria-label="Cesta ke srovnání">{['Výběr ETF', 'Nastavení', 'E-mail', 'Odkaz na srovnání'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined}><span className="flow-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{label}</span></li>)}</ol>
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

function Landing({ variant, palette }: { variant: Concept, palette?: 'blue' | 'green' }) {
  const [selected, setSelected] = useState<string[]>(['a', 'b'])
  const [step, setStep] = useState(1)
  const [parameters, setParameters] = useState<string[]>(['cost', 'holdings', 'risk'])
  const stageRef = useRef<HTMLDivElement>(null)
  const roundTwo = Boolean(palette)
  const previousStep = useRef(step)
  useEffect(() => {
    if (roundTwo && previousStep.current !== step) {
      stageRef.current?.focus({ preventScroll: true })
      stageRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
    previousStep.current = step
  }, [roundTwo, step])
  const toggle = (id: string) => setSelected(old => old.includes(id) ? old.filter(i => i !== id) : old.length < 3 ? [...old, id] : old)
  const heroTitles: Record<Concept, React.ReactNode> = {
    editorial: <>Vyberte ETF.<br/><em>Najděte souvislosti.</em></>,
    steps: <>Vaše ETF.<br/>Vaše <em>srovnání.</em></>,
    terminal: <>Méně šumu.<br/><em>Více kontextu.</em></>,
    guide: <>Váš první krok<br/>k pochopení <em>ETF.</em></>,
    compact: <>Vyberte.<br/>Porovnejte.<br/><em>Pochopte.</em></>,
  }
  return <div className={`landing ${variant} ${roundTwo ? `round-two palette-${palette}` : ''}`}>
    <header className="site-header"><a className="brand" href="#main"><span className="brand-icon" aria-hidden="true">≋</span> ETF<span className="brand-light">přehled</span></a><span className="header-label">Pro české investory</span></header>
    <main id="main">
      <div className="opening">
        <section className="hero"><div className="eyebrow"><span className="dot"/> Americký trh. Český pohled.</div><h1>{heroTitles[variant]}</h1><p className="hero-description">{roundTwo ? 'Vyberte 2–3 ETF a nastavte, co chcete porovnat. Náklady, zaměření a rizika v jednom interaktivním přehledu. Odkaz získáte zdarma po potvrzení e-mailu.' : 'Náklady, zaměření a rizika na jednom místě. Vyberte fondy, které vás zajímají. Srovnání získáte zdarma po potvrzení e-mailu.'}</p><a className="primary hero-cta" href="#selection">Vybrat ETF ke srovnání <span aria-hidden="true">→</span></a><p className="hero-footnote">Bez účtu · V češtině · Žádné sliby výnosu</p>
          {!roundTwo && variant !== 'compact' && <div className="hero-art" aria-hidden="true"><div className="art-label">VÝBĚR → SOUVISLOSTI → PŘEHLED</div><div className="art-orbit"><span>A</span><span>B</span><span>C</span></div><div className="art-caption">Různé fondy.<br/><strong>Společný kontext.</strong></div></div>}
        </section>
        <section className="builder" id="selection" aria-labelledby="builder-title">
          <div className="builder-heading"><span className="eyebrow">{variant === 'terminal' ? '01 / SESTAVIT VÝBĚR' : 'Začněte tím, co vás zajímá'}</span><h2 id="builder-title">Váš vlastní přehled</h2></div>
          <p className="risk-note">Americká ETF mohou být českému retailu nedostupná kvůli PRIIPs/KID. Ověřte dostupnost u svého brokera.</p>
          {roundTwo ? <>
            <ProductFlow step={step === 4 ? 4 : variant === 'steps' ? step : step === 1 ? 1 : 3}/>
            <div ref={stageRef} tabIndex={-1} className="builder-stage" aria-label={step === 1 ? 'Výběr a nastavení srovnání' : step === 2 && variant === 'steps' ? 'Nastavení srovnání' : step === 4 ? 'Výsledek ukázky' : 'Zadání e-mailu'}>
              {(step === 1) && <Selection selected={selected} toggle={toggle} variant={variant}/>}
              {((step === 1 && variant !== 'steps') || (step === 2 && variant === 'steps')) && <CompareSettings parameters={parameters} setParameters={setParameters}/>}
              {step === 1 && <button className="primary continue-button" disabled={selected.length < 2} onClick={() => setStep(variant === 'steps' ? 2 : 3)}>{variant === 'steps' ? 'Nastavit srovnání' : 'Pokračovat k odkazu'} <span aria-hidden="true">→</span></button>}
              {step > 1 && <div className="configuration-summary"><span className="eyebrow">Vaše srovnání</span><strong>{selected.map(id => `Fond ${id.toUpperCase()}`).join(' + ')}</strong><p>{parameterOptions.filter(p => parameters.includes(p.id)).map(p => p.label).join(' · ')}</p></div>}
              {step === 2 && variant === 'steps' && <button className="primary continue-button" onClick={() => setStep(3)}>Pokračovat k odkazu <span aria-hidden="true">→</span></button>}
              {step > 1 && step !== 4 && <button className="back-button" onClick={() => setStep(step === 3 && variant === 'steps' ? 2 : 1)}>← {step === 3 && variant === 'steps' ? 'Upravit nastavení' : 'Upravit výběr'}</button>}
              {step === 3 && <EmailForm selected={selected} roundTwo onComplete={() => setStep(4)}/>}
              {step === 4 && <section className="demo-result" aria-labelledby="result-title"><span className="result-symbol" aria-hidden="true">✓</span><h3 id="result-title">Takhle bude vypadat další krok.</h3><p role="status">Ukázka dokončena. Žádný e-mail nebyl odeslán a srovnání zatím není dostupné.</p><p>V hotové službě potvrdíte adresu ve schránce a otevřete odkaz na své interaktivní srovnání.</p><button className="back-button" onClick={() => setStep(1)}>← Zpět ke srovnávači</button></section>}
            </div>
            <p className="builder-caption">Nejprve sestavíte srovnání. E-mail až v dalším kroku.</p>
          </> : <>
          {variant === 'steps' && <ol className="step-indicator"><li aria-current={step === 1 ? 'step' : undefined}>1. Výběr</li><li aria-current={step === 2 ? 'step' : undefined}>2. E-mail</li></ol>}
          {(variant !== 'steps' || step === 1) && <Selection selected={selected} toggle={toggle} variant={variant}/>}
          {variant === 'steps' && step === 1 && <button className="primary" disabled={selected.length < 2} onClick={() => setStep(2)}>Pokračovat k e-mailu →</button>}
          {variant === 'steps' && step === 2 && <button className="back-button" onClick={() => setStep(1)}>← Upravit výběr ({selected.map(id => id.toUpperCase()).join(' + ')})</button>}
          {(variant !== 'steps' || step === 2) && <EmailForm selected={selected}/>}
          </>}
        </section>
      </div>
      <Benefits/><FAQ/>
      <section className="closing"><span className="eyebrow">Vaše rozhodnutí začíná přehledem</span><h2>Dejte si fondy do souvislostí.</h2><a className="primary" href="#selection">Zpět k mému výběru →</a></section>
    </main>
    <footer><a className="brand" href="#main">ETF přehled</a><p>Vzdělávací obsah, nikoli investiční doporučení. Investování nese riziko ztráty.</p><details id="privacy"><summary>Ochrana údajů a stav prototypu</summary><p>Tento návrh neukládá kontakty, nepoužívá analytiku ani cookies a neodesílá formuláře na server. Pole je pouze ukázka rozhraní. Před spuštěním skutečné služby je nutné doplnit provozovatele, kontakt, právní základ, dobu uchování a úplné informace o zpracování.</p></details><p className="footer-note">Vizuální prototyp · Ověřená data ETF budou doplněna před produkčním spuštěním.</p></footer>
  </div>
}

function LandingApp() {
  const [designId, setDesignId] = useState<DesignId>(initialDesign)
  const design = designs.find(d => d.id === designId)
  const variant: Concept = design?.concept ?? (designId === 'editorial' ? 'editorial' : designId === 'terminal' ? 'terminal' : 'guide')
  useEffect(() => {const onPop = () => setDesignId(initialDesign()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop)}, [])
  function choose(value: DesignId) {
    if (value === designId) return
    const url = new URL(window.location.href)
    url.searchParams.set('variant', value)
    window.history.pushState({}, '', url)
    setDesignId(value)
  }
  return <><a className="skip-link" href="#main">Přejít na obsah</a><aside className={`concept-bar palette-${designId === 'editorial' ? 'original' : design?.palette ?? 'blue'}`} aria-label="Přepínání návrhů"><div className="concept-inner"><span className="prototype-label">DESIGN STUDIE <span>• Editorial + designové návrhy</span></span><label className="mobile-switch">Návrh<select value={designId} onChange={e => choose(e.target.value as DesignId)}><option value="editorial">Editorial – funkční srovnávač</option><option value="editorial-demo">Editorial – archivní demo</option>{!design && designId !== 'editorial' && designId !== 'editorial-demo' && <option value={designId}>{concepts.find(c => c.id === variant)?.name} (kolo 1)</option>}{designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><nav className="desktop-switch" aria-label="Varianty"><button onClick={() => choose('editorial')} aria-pressed={designId === 'editorial'}>Editorial – původní</button>{designs.map(d => <button key={d.id} onClick={() => choose(d.id)} aria-pressed={designId === d.id}>{d.name}</button>)}</nav></div><p className="concept-description">{design ? `${design.name} · Výběr ETF → nastavení → e-mail → odkaz na srovnání.` : designId === 'editorial' ? 'Katalog ETF → porovnání nákladů → odkaz na uložené srovnání.' : concepts.find(c => c.id === variant)?.note} <strong>{designId === 'editorial' ? 'Pouze ověřené údaje.' : 'Demo bez odesílání.'}</strong></p></aside>{designId === 'editorial' ? <EditorialComparator/> : designId === 'editorial-demo' ? <EditorialDemo/> : <Landing key={variant} variant={variant} palette={design?.palette}/>}</>
}

export default function App(){
 return new URLSearchParams(window.location.search).get("admin")==="etf-sync"?<PreviewAdmin/>:<LandingApp/>
}
