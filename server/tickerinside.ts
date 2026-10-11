import { InputError, object } from '../shared/validation.ts'
export const ETF_SYNC_TICKERS = ['SPY','VOO','IVV','VTI','ITOT','SCHB','SPYD','VYM','SCHD','IWM','IJH','IJR','MDY','DIA','RSP','VTV','VUG','VT','VEA','VWO'] as const
export interface EtfCandidate {
 ticker:string; name:string; exchange:'NYSE Arca'; expenseRatioPercent:number;
 expenseRatioSource:'sec_filing'|'sec_filing_text'|'market_data'; expenseRatioAsOf:string|null;
 filingUrl:string|null; sourceUrl:string; attributionUrl:string; checkedAt:string; license:'CC BY 4.0'
}
export class SourceError extends Error { constructor(public code:string){super(code)} }
function text(v:unknown){if(typeof v!=='string'||!v.trim()||v.length>500)throw new SourceError('invalid_field');return v.trim()}
function sourceDate(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||Date.parse(v)>Date.now())throw new SourceError('invalid_source_date');return v}
export function normalizeTickerInside(input:unknown,ticker:string,checkedAt=new Date().toISOString()):EtfCandidate {
 let d:Record<string,unknown>, identifiers:Record<string,unknown>
 try{d=object(input);identifiers=object(d.identifiers)}catch{throw new SourceError('invalid_response')}
 if(d.ticker!==ticker||!ETF_SYNC_TICKERS.includes(ticker as typeof ETF_SYNC_TICKERS[number]))throw new SourceError('unknown_ticker')
 if(identifiers.exchange!=='NYSE Arca'||identifiers.asset_type!=='etf')throw new SourceError('wrong_exchange_or_type')
 if(typeof d.expense_ratio!=='number'||!Number.isFinite(d.expense_ratio)||d.expense_ratio<0||d.expense_ratio>10)throw new SourceError('invalid_expense_ratio')
 if(d.license!=='CC BY 4.0')throw new SourceError('unsupported_license')
 if(!['sec_filing','sec_filing_text','market_data'].includes(String(d.expense_ratio_source)))throw new SourceError('invalid_expense_source')
 const source=d.expense_ratio_source as EtfCandidate['expenseRatioSource']
 const asOf=d.expense_ratio_as_of==null?null:sourceDate(d.expense_ratio_as_of)
 let filingUrl:string|null=null
 if(d.expense_ratio_filing_url!=null){
  try{const u=new URL(text(d.expense_ratio_filing_url));if(u.protocol!=='https:'||u.hostname!=='www.sec.gov'||!u.pathname.startsWith('/Archives/edgar/data/')||u.username||u.password||u.search||u.hash)throw Error();filingUrl=u.toString()}catch{throw new SourceError('invalid_filing_url')}
 }
 if(source!=='market_data'&&(!asOf||!filingUrl))throw new SourceError('missing_filing_evidence')
 const page=`https://tickerinside.com/etf/${ticker.toLowerCase()}/`
 if(d.page_url!==page||typeof d.cite_as!=='string'||!d.cite_as.includes(page))throw new SourceError('missing_attribution')
 if(!Number.isFinite(Date.parse(checkedAt))||Date.parse(checkedAt)>Date.now())throw new SourceError('invalid_check_date')
 return{ticker,name:text(d.name),exchange:'NYSE Arca',expenseRatioPercent:d.expense_ratio,expenseRatioSource:source,expenseRatioAsOf:asOf,filingUrl,sourceUrl:`https://tickerinside.com/api/v1/fund/${ticker.toLowerCase()}.json`,attributionUrl:page,checkedAt,license:'CC BY 4.0'}
}
export async function fetchTickerInside(ticker:string,fetcher:typeof fetch=fetch,timeoutMs=4000):Promise<EtfCandidate>{
 if(!ETF_SYNC_TICKERS.includes(ticker as typeof ETF_SYNC_TICKERS[number]))throw new SourceError('unknown_ticker')
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs)
 try{
  const res=await fetcher(`https://tickerinside.com/api/v1/fund/${ticker.toLowerCase()}.json`,{signal:controller.signal,redirect:'error',headers:{Accept:'application/json','User-Agent':'ClienteloEtfDemo/1.0 (+https://github.com/RostislavHanza/EtfComparisonLanding)'}})
  if(res.status===404)throw new SourceError('unknown_ticker')
  if(!res.ok)throw new SourceError('upstream_unavailable')
  if(!res.headers.get('content-type')?.includes('application/json'))throw new SourceError('invalid_content_type')
  if(!res.body)throw new SourceError('invalid_response')
  const reader=res.body.getReader(),chunks:Uint8Array[]=[];let size=0
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024){await reader.cancel();throw new SourceError('response_too_large')}chunks.push(value)}
  let data:unknown;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new SourceError('invalid_json')}
  return normalizeTickerInside(data,ticker)
 }catch(error){if(controller.signal.aborted)throw new SourceError('upstream_timeout');if(error instanceof SourceError)throw error;throw new SourceError('upstream_unavailable')}
 finally{clearTimeout(timer)}
}
export interface SyncFailure { ticker:string;code:string }
export interface SyncResult { state:string; id?:string; candidates?:number; updated?:number; failed?:number }
export interface SyncStore {
 begin():Promise<SyncResult>;
 finish(id:string,records:EtfCandidate[],failures:SyncFailure[]):Promise<SyncResult>;
}
export async function synchronizeEtfs(store:SyncStore,load:(ticker:string)=>Promise<EtfCandidate>=fetchTickerInside,tickers:readonly string[]=ETF_SYNC_TICKERS):Promise<SyncResult>{
 if(!tickers.length||tickers.length>20||new Set(tickers).size!==tickers.length||tickers.some(t=>!ETF_SYNC_TICKERS.includes(t as typeof ETF_SYNC_TICKERS[number])))throw new InputError('Neplatná nebo duplicitní dávka ETF.')
 const run=await store.begin();if(run.state!=='started')return run
 if(!run.id)throw Error('sync_run_missing')
 const records:EtfCandidate[]=[],failures:SyncFailure[]=[];let next=0
 await Promise.all([0,1].map(async()=>{while(next<tickers.length){const ticker=tickers[next++];try{const row=await load(ticker);if(row.ticker!==ticker)throw new SourceError('unknown_ticker');records.push(row)}catch(error){failures.push({ticker,code:error instanceof SourceError?error.code:'upstream_unavailable'})}}}))
 records.sort((a,b)=>a.ticker.localeCompare(b.ticker));failures.sort((a,b)=>a.ticker.localeCompare(b.ticker))
 try{return await store.finish(run.id,records,failures)}catch{
  try{await store.finish(run.id,[],[{ticker:'*',code:'database_write_failed'}])}catch{/* The persisted lease expires; never print credentials or raw DB errors. */}
  throw Error('sync_write_failed')
 }
}
