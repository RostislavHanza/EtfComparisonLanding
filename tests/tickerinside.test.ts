import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchTickerInside,normalizeTickerInside,synchronizeEtfs, SourceError, type SyncStore } from '../server/tickerinside.ts'
import health from '../api/etf-sync.ts'
const fixture=JSON.parse(await readFile(new URL('./fixtures/tickerinside/voo.json',import.meta.url),'utf8'))
test('actual reduced VOO response validates percentages, source, dates and attribution; missing fields are not fabricated',()=>{
 const row=normalizeTickerInside(fixture,'VOO');assert.equal(row.expenseRatioPercent,0.03);assert.equal(row.exchange,'NYSE Arca');assert.equal(row.expenseRatioAsOf,'2026-04-28');assert.ok(row.attributionUrl.endsWith('/voo/'));assert.equal('index' in row,false);assert.equal('dividends' in row,false)
 for(const patch of [{ticker:'UNKNOWN'},{identifiers:{asset_type:'etf',exchange:'NASDAQ'}},{expense_ratio:null},{expense_ratio:-1},{expense_ratio:NaN},{name:''},{license:'unknown'},{expense_ratio_as_of:'2026-02-30'},{expense_ratio_as_of:'2099-01-01'},{expense_ratio_filing_url:'https://attacker.invalid/'}])assert.throws(()=>normalizeTickerInside({...fixture,...patch},'VOO'),SourceError)
 assert.throws(()=>normalizeTickerInside(null,'VOO'));assert.throws(()=>normalizeTickerInside(fixture,'UNKNOWN'))
 const undated=normalizeTickerInside({...fixture,expense_ratio_source:'market_data',expense_ratio_as_of:null,expense_ratio_filing_url:null},'VOO');assert.equal(undated.expenseRatioAsOf,null)
})
test('loader uses documented fixed URL, accepts JSON, rejects unknown ticker, HTTP failures and times out',async()=>{
 const ok:typeof fetch=async(url,init)=>{assert.equal(url,'https://tickerinside.com/api/v1/fund/voo.json');assert.equal(init?.redirect,'error');assert.ok(JSON.stringify(init?.headers).includes('ClienteloEtfDemo'));return new Response(JSON.stringify(fixture),{headers:{'content-type':'application/json'}})}
 assert.equal((await fetchTickerInside('VOO',ok)).ticker,'VOO')
 await assert.rejects(fetchTickerInside('UNKNOWN',ok),/unknown_ticker/)
 for(const status of [404,500,429])await assert.rejects(fetchTickerInside('VOO',async()=>new Response('',{status})),SourceError)
 await assert.rejects(fetchTickerInside('VOO',async()=>new Response('bad',{headers:{'content-type':'application/json'}})),/invalid_json/)
 await assert.rejects(fetchTickerInside('VOO',async()=>new Response('{}')),/invalid_content_type/)
 const timeout:typeof fetch=async(_url,init)=>new Promise((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(new Error('TEST ONLY'))))
 await assert.rejects(fetchTickerInside('VOO',timeout,10),/upstream_timeout/)
})
test('synchronization preserves successes alongside failed tickers; duplicate batches and repeated runs do not fetch',async()=>{
 let calls=0
 const store:SyncStore={begin:async()=>({state:'started',id:'TEST RUN'}),finish:async(_id,rows,errors)=>{assert.equal(rows.length,1);assert.equal(errors[0].code,'upstream_timeout');return{state:'partial',candidates:rows.length,failed:errors.length}}}
 const result=await synchronizeEtfs(store,async(ticker)=>{calls++;if(ticker==='IVV')throw new SourceError('upstream_timeout');return normalizeTickerInside(fixture,'VOO')},['VOO','IVV']);assert.equal(result.state,'partial');assert.equal(calls,2)
 await assert.rejects(synchronizeEtfs(store,async()=>{throw Error('must not fetch')},['VOO','VOO']),/duplicitní/)
 for(const state of ['already_attempted','busy'])assert.equal((await synchronizeEtfs({...store,begin:async()=>({state})},async()=>{throw Error('must not fetch')})).state,state)
})
test('sync endpoint denies unauthorized access before connecting to database or source',async()=>{
 const before=process.env.CRON_SECRET;process.env.CRON_SECRET='T'.repeat(32)
 try{
  let status=0;const res={setHeader(){},status(code:number){status=code;return this},json(){}} as unknown as VercelResponse
  await health({method:'GET',headers:{}} as VercelRequest,res);assert.equal(status,401)
  await health({method:'POST',headers:{authorization:'Bearer '+'T'.repeat(32)}} as VercelRequest,res);assert.equal(status,403)
 }finally{if(before===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=before}
})
