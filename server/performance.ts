import { PERFORMANCE_TICKERS } from '../shared/performance.js'
import type { FundPerformance,PerformanceCatalog } from '../shared/performance.js'
import { object } from '../shared/validation.js'
import { HttpError } from './application.js'
export function normalizePerformance(input:unknown,ticker:string,retrievedAt=new Date().toISOString()):FundPerformance{
 const d=object(input),identity=object(d.identifiers)
 if(!PERFORMANCE_TICKERS.includes(ticker as typeof PERFORMANCE_TICKERS[number])||d.ticker!==ticker||identity.exchange!=='NYSE Arca'||identity.asset_type!=='etf'||d.license!=='CC BY 4.0')throw new Error('invalid_identity_or_license')
 if(typeof d.as_of!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.as_of)||!Number.isFinite(Date.parse(d.as_of))||new Date(d.as_of).toISOString().slice(0,10)!==d.as_of||Date.parse(d.as_of)>Date.now())throw new Error('invalid_price_date')
 if(!Number.isFinite(Date.parse(retrievedAt))||Date.parse(retrievedAt)>Date.now())throw new Error('invalid_retrieval_date')
 const value=(key:string)=>{const v=d[key];if(v===null||v===undefined)return null;if(typeof v!=='number'||!Number.isFinite(v)||v< -100||v>1_000_000)throw new Error('invalid_return');return v}
 // Only derived cumulative figures leave the server. Never forward weekly, prices, holdings or provider HTML.
 return{ticker,r1:value('r1'),r3:value('r3'),r5:value('r5'),asOf:d.as_of,retrievedAt,sourceUrl:`https://tickerinside.com/api/v1/fund/${ticker.toLowerCase()}.json`,attributionUrl:`https://tickerinside.com/etf/${ticker.toLowerCase()}/`,license:'CC BY 4.0',currency:'USD'}
}
export async function fetchPerformance(ticker:string,fetcher:typeof fetch=fetch,timeoutMs=5000){
 if(!PERFORMANCE_TICKERS.includes(ticker as typeof PERFORMANCE_TICKERS[number]))throw new Error('unknown_ticker')
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs)
 try{
  const response=await fetcher(`https://tickerinside.com/api/v1/fund/${ticker.toLowerCase()}.json`,{signal:controller.signal,redirect:'error',headers:{Accept:'application/json','User-Agent':'ClienteloEtfDemo/1.0 (+https://github.com/RostislavHanza/EtfComparisonLanding)'}})
  if(!response.ok)throw new Error('upstream_unavailable')
  return normalizePerformance(await response.json(),ticker)
 }finally{clearTimeout(timer)}
}
export function createPerformanceCache(load:(ticker:string)=>Promise<FundPerformance>=fetchPerformance,now=Date.now){
 let snapshot:PerformanceCatalog|undefined,expires=0,pending:Promise<PerformanceCatalog>|undefined,failure:HttpError|undefined
 return async()=>{
  if(now()<expires){if(failure)throw failure;if(snapshot)return snapshot}
  if(pending)return pending
  pending=(async()=>{
   const funds:FundPerformance[]=[],unavailable:string[]=[]
   // Small fixed catalog, sequential requests; no caller-selected upstream URL or bulk history extraction.
   for(const ticker of PERFORMANCE_TICKERS){try{funds.push(await load(ticker))}catch{
    unavailable.push(ticker);const last=snapshot?.funds.find(f=>f.ticker===ticker);if(last)funds.push({...last,stale:true})
   }}
   if(!funds.length){expires=now()+300_000;failure=new HttpError(503,'Historická data nyní nejsou dostupná. Hypotetický výpočet můžete použít dál.');throw failure}
   failure=undefined;snapshot={funds,unavailable};expires=now()+(unavailable.length?300_000:86_400_000);return snapshot
  })()
  try{return await pending}finally{pending=undefined}
 }
}
export const performanceCatalog=createPerformanceCache()
