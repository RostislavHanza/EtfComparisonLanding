import type { EtfRecord } from '../shared/model'
const labels:Record<string,string>={ticker:'Ticker',name:'Název',exchange:'Burza',index:'Index',expenseRatioPercent:'Nákladovost',dividends:'Dividendy',description:'Český popis'}
export const hasTickerInside=(fund:EtfRecord)=>fund.sources.some(s=>new URL(s.url).hostname==='tickerinside.com'&&s.role!=='verification')
export function TickerInsideAttribution(){return <p className="data-attribution">Údaje označené jako převzaté z <a href="https://tickerinside.com/api/" target="_blank" rel="noreferrer">TickerInside</a> používáme pod licencí <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Data byla vybrána a upravena pro zobrazení; některé údaje byly doplněny z jiných zdrojů. Původ a ověřovací zdroje jsou uvedeny u každého fondu. Český popis je vlastní text projektu. TickerInside projekt neschvaluje ani neposkytuje investiční doporučení.</p>}
export default function EtfSources({fund}:{fund:EtfRecord}){
 return <details className="field-sources"><summary>Původ a ověření údajů · {fund.ticker}</summary><ul>{fund.sources.map((s,i)=>{
 const tickerInside=new URL(s.url).hostname==='tickerinside.com'
 const role=s.role==='verification'?'ověření':s.role==='authored'?'vlastní text':'původ'
 const provider=tickerInside?'TickerInside':s.provider==='project'?'Projekt':s.provider==='sec'||new URL(s.url).hostname==='www.sec.gov'?'SEC':'Emitent / primární zdroj'
 return <li key={`${s.field}-${s.url}-${i}`}><strong>{labels[s.field]??s.field}</strong> · {role}: <a href={s.url} target="_blank" rel="noreferrer">{provider} →</a>{tickerInside&&<span> · CC BY 4.0</span>}<small>{s.date_basis==='observed_state'?'Pozorovaný stav':'Datum podkladu'}: {s.as_of.slice(0,10)} · Kontrola: {s.verified_at.slice(0,10)}</small></li>
 })}</ul>{hasTickerInside(fund)&&<a href={`https://tickerinside.com/etf/${fund.ticker.toLowerCase()}/`} target="_blank" rel="noreferrer">TickerInside · stránka fondu {fund.ticker} →</a>}</details>
}
