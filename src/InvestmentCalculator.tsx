import { useEffect,useState } from 'react'
import type { Dispatch,SetStateAction } from 'react'
import type { EtfRecord } from '../shared/model'
import { MAX_AMOUNT_CZK,money,percent } from '../shared/model'
import { PERFORMANCE_TICKERS,annualizedReturn,scenarioProfit,profitScale } from '../shared/performance'
import type { HistoricalYears,PerformanceCatalog } from '../shared/performance'
import { loadPerformance } from './performance-client'
import HistoricalChart from './HistoricalChart'
export interface InvestmentSettings {period:HistoricalYears;horizon:number;edits:Record<string,string>}
interface Props {funds:EtfRecord[];amount:number;draft:string;update:(value:string)=>void;invalid:boolean;settings:InvestmentSettings;onSettingsChange:Dispatch<SetStateAction<InvestmentSettings>>}
export default function InvestmentCalculator({funds,amount,draft,update,invalid,settings,onSettingsChange}:Props){
 const {period,horizon,edits}=settings
 const setPeriod=(period:HistoricalYears)=>onSettingsChange(previous=>previous.period===period?previous:{...previous,period,edits:{}})
 const setHorizon=(horizon:number)=>onSettingsChange(previous=>({...previous,horizon}))
 const setEdits=(update:(previous:Record<string,string>)=>Record<string,string>)=>onSettingsChange(previous=>({...previous,edits:update(previous.edits)}))
 const [data,setData]=useState<PerformanceCatalog>(),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const supported=funds.some(f=>PERFORMANCE_TICKERS.includes(f.ticker as typeof PERFORMANCE_TICKERS[number]))
 async function reload(){setLoading(true);setError('');try{setData(await loadPerformance())}catch{setError('Historická data nyní nejsou dostupná. Vlastní předpoklady můžete zadat dál.')}finally{setLoading(false)}}
 useEffect(()=>{
  if(!supported)return
  let active=true
  loadPerformance().then(value=>{if(active)setData(value)}).catch(()=>{if(active)setError('Historická data nyní nejsou dostupná. Vlastní předpoklady můžete zadat dál.')})
  return()=>{active=false}
 },[supported])
 const records=funds.flatMap(f=>{const record=data?.funds.find(r=>r.ticker===f.ticker);return record?[record]:[]})
 function restore(ticker:string){setEdits(previous=>{const next={...previous};delete next[ticker];return next})}
 const models=funds.map(f=>{
  const record=data?.funds.find(r=>r.ticker===f.ticker),annual=annualizedReturn(record?.[`r${period}`]??null,period)
  const manual=Object.hasOwn(edits,f.ticker),rate=manual?edits[f.ticker]:annual===null?'':annual.toFixed(2)
  const valid=rate.trim()!==''&&Number.isFinite(Number(rate))&&Number(rate)>=-100&&Number(rate)<=100
  return {f,annual,manual,rate,valid,profit:valid?scenarioProfit(amount,Number(rate),horizon):null}
 })
 const scale=profitScale(models.map(m=>m.profit))
 return <>
 <section className="calculator-section investment-section" aria-labelledby="investment-title">
 <div className="section-heading"><span className="eyebrow">02 / Odhadovaný výnos</span><h2 id="investment-title">Odhadovaný zisk / ztráta</h2></div>
 <div className="investment-setup"><div className="amount-controls"><label htmlFor="investment">Investovaná částka v Kč</label><input id="investment" type="number" min="0" max={MAX_AMOUNT_CZK} step="0.01" value={draft} onChange={e=>update(e.target.value)} aria-invalid={invalid} aria-describedby="amount-error"/><p id="amount-error" role="status">{invalid?'Zadejte částku od 0 do 10 milionů Kč, nejvýše se dvěma desetinnými místy. Model ukazuje poslední platnou částku.':''}</p><label className="range-label" htmlFor="investment-range">Upravit částku posuvníkem</label><input id="investment-range" type="range" min="0" max={MAX_AMOUNT_CZK} step="1000" value={amount} onChange={e=>update(e.target.value)} aria-valuetext={money(amount)}/><div className="range-limits"><span>0 Kč</span><span>10 mil. Kč</span></div></div><div className="investment-controls"><div><label htmlFor="investment-horizon">Investiční horizont</label><select id="investment-horizon" value={horizon} onChange={e=>setHorizon(Number(e.target.value))}>{[1,3,5,10,15,20].map(year=><option key={year} value={year}>{year} {year===1?'rok':year===3?'roky':'let'}</option>)}</select></div></div></div>
 {error&&<p role="status">{error} <button className="back-button" disabled={loading} onClick={()=>void reload()}>Zkusit historická data znovu</button></p>}
 <p className="profit-explainer">Rozdíl proti vkladu po {horizon} {horizon===1?'roce':'letech'} · společná stupnice všech fondů. Historická reference: {period} {period===1?'rok':period===3?'roky':'let'}.</p>
 <ul className="profit-comparison" aria-label="Srovnání odhadovaných zisků">{models.map(({f,annual,manual,rate,valid,profit},i)=>{
  const bar=scale.bars[i]
  return <li className="profit-row" key={f.ticker} aria-label={`Odhad ${f.ticker}`}>
   <div className="profit-fund"><strong>{f.ticker}</strong><span>{f.name}</span><small>Historické roční tempo: {annual===null?'Data nejsou dostupná':percent(Math.round(annual*100)/100)} · Expense ratio: {percent(f.expenseRatioPercent)}</small></div>
   <div className="profit-assumption"><label htmlFor={`assumed-${f.ticker}`}>Předpokládaný výnos ročně (%)</label><input id={`assumed-${f.ticker}`} type="number" min="-100" max="100" step="any" value={rate} onChange={e=>setEdits(previous=>({...previous,[f.ticker]:e.target.value}))} aria-invalid={rate!==''&&!valid} aria-describedby={`rate-help-${f.ticker}`}/><small id={`rate-help-${f.ticker}`}>Po průběžných nákladech ETF. {manual?'Vlastní předpoklad.':'Podle historie.'}</small><button className="restore-history" type="button" onClick={()=>restore(f.ticker)}>Obnovit podle historie</button></div>
   <div className="profit-result"><div className="profit-track" aria-hidden="true"><span className="profit-zero" style={{left:`${scale.zero}%`}}/>{bar&&<span className={`profit-bar ${profit!<0?'negative':'positive'}`} style={{left:`${bar.start}%`,width:`${bar.width}%`}}/>}</div><strong className={profit===null?'':profit<0?'profit-loss':'profit-gain'} data-testid={`profit-${f.ticker}`}>{profit===null?'Zadejte vlastní předpoklad':`${profit>0?'+':''}${money(profit)}`}</strong>{rate!==''&&!valid&&<p role="status">Zadejte roční výnos od −100 do 100 %.</p>}</div>
  </li>
 })}</ul>
 <p className="model-note">Výchozí předpoklad vychází z historické výkonnosti ETF. Jde o modelový scénář, nikoliv předpověď. Minulé výnosy nezaručují budoucí výsledky.</p><p className="calculation-note">Korunový model nezohledňuje změny USD/CZK, daně ani poplatky brokera.</p>
 <details className="investment-methodology"><summary>Metodika výnosů a zdroje</summary><p>Roční historické tempo = ((1 + kumulativní výnos / 100)^(1 / počet let) − 1) × 100. Předvyplněný vstup je zaokrouhlen na dvě desetinná místa. Model = vklad × (1 + roční předpoklad / 100)^horizont. Ruční změny zůstávají při změně částky a horizontu. Přepnutí historického období obnoví sazby všech fondů; tlačítko u fondu obnoví pouze jeho sazbu. Zisk je modelová hodnota minus počáteční vklad, všechny pruhy používají společnou nulu a lineární stupnici.</p><p>Podklad tvoří dividendově upravená tržní výkonnost ETF v USD. Průběžné náklady už ovlivňují hodnotu fondu, nejde o hrubou indexovou řadu; expense ratio znovu neodečítáme. Historie ETF může zahrnovat změnu benchmarku. Není to skutečně dosažený korunový výnos ani investiční doporučení.</p><p>Graf násobí skutečné týdenní výnosy, nikoli interpolaci nebo předpokládané roční tempo. Data jsou zaokrouhlená u zdroje, součin se může mírně lišit od souhrnného r3. Datum označuje kalendářní konec týdne podle weeks_end; nejde o tvrzení, že obchodování proběhlo přesně v tento den. Chybějící týdny nenahrazujeme nulou; používáme společný souvislý úsek. Základ 100 je normalizace, nikoli historická cena.</p>{records.map(r=><p key={r.ticker}>{r.ticker}: data cen k {r.asOf}, staženo {r.retrievedAt.slice(0,10)}. <a href={r.sourceUrl} target="_blank" rel="noreferrer">Konkrétní fund JSON</a>{r.stale?' · poslední platná data po chybě obnovení':''}.</p>)}</details>
 </section><HistoricalChart records={records} period={period} onPeriodChange={setPeriod}/>
 </>
}
