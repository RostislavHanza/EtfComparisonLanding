import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
import {prepareApprovedCatalog} from '../server/catalog-approval.js'
import {validateImport} from '../server/import-validation.js'
import {normalizePerformance,createPerformanceCache} from '../server/performance.js'
import {normalizeTickerInside} from '../server/tickerinside.js'
import {PERFORMANCE_TICKERS} from '../shared/performance.js'
const load=async(path:string)=>JSON.parse(await readFile(path,'utf8'))
const draft=await load('data/review/remaining-fifteen.pending.json'),decision=await load('data/review/remaining-fifteen.demo-approval.json'),approved=await load('data/remaining-twelve.approved.json'),blocked=await load('data/review/remaining-fifteen.blocked.json'),observed=await load('data/review/remaining-fifteen.performance.json')
test('remaining batch contains only primary-verified funds; changed Vanguard names and distribution are explicit',t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse(decision.verifiedAt)+1000})
 assert.deepEqual(prepareApprovedCatalog(draft,decision),approved)
 const rows=validateImport(approved);assert.equal(rows.length,12)
 assert.deepEqual(blocked.records.map((r:{ticker:string})=>r.ticker),['RSP','SCHB','SCHD'])
 assert.throws(()=>validateImport(blocked));assert.throws(()=>validateImport(draft),/schválené/)
 for(const row of rows){assert.equal(row.exchange,'NYSE Arca');assert.equal(row.usage_review.issuerPermissionClaimed,false);assert.ok(row.sources.some(s=>s.field==='exchange'&&s.provider==='issuer'&&s.evidence.includes(row.ticker)&&s.evidence.includes('NYSE Arca')))}
 assert.match(rows.find(r=>r.ticker==='DIA')!.dividends,/měsíční/)
 assert.ok(rows.filter(r=>r.ticker!=='DIA').every(r=>r.dividends.includes('čtvrtletní')))
 assert.equal(rows.find(r=>r.ticker==='VTV')!.name,'Vanguard Morningstar Value ETF');assert.equal(rows.find(r=>r.ticker==='VTV')!.tracked_index,'Morningstar US Large Cap Value Index')
 assert.equal(rows.find(r=>r.ticker==='VUG')!.name,'Vanguard Morningstar Growth ETF');assert.equal(rows.find(r=>r.ticker==='VUG')!.tracked_index,'Morningstar US Large Cap Growth Index')
 const edited=structuredClone(draft);edited.records[0].expenseRatioPercent=.99;assert.throws(()=>prepareApprovedCatalog(edited,decision),/verzi/)
 t.mock.timers.tick(15*86400000);assert.throws(()=>validateImport(approved),/14 dní/)
})
test('all 15 real API observations have licensed, dated historical data; cache stays within three simultaneous source requests',async()=>{
 assert.equal(observed.funds.length,15)
 for(const raw of observed.funds){const normalized=normalizePerformance(raw,raw.ticker,raw.retrievedAt);assert.equal(normalized.asOf,'2026-10-09');assert.ok([normalized.r1,normalized.r3,normalized.r5].every(r=>r!==null));assert.equal(normalized.weeklyReturns!.length,156)}
 let running=0,peak=0
 const raw=observed.funds[0]
 const cache=createPerformanceCache(async ticker=>{running++;peak=Math.max(peak,running);await new Promise(resolve=>setTimeout(resolve,1));running--;return normalizePerformance({...raw,ticker},ticker)})
 assert.equal((await cache()).funds.length,PERFORMANCE_TICKERS.length);assert.equal(peak,3)
})
test('catalog upsert updates ITOT without duplicates and preserves original five, snapshots and other tables',async t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse(decision.verifiedAt)+1000})
 const db=new PGlite()
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;')
  await db.exec(await readFile('supabase/migrations/202610100001_mvp.sql','utf8'))
  await db.exec(await readFile('supabase/migrations/202610110004_etf_sync.sql','utf8'))
  const upsert=async(row:ReturnType<typeof validateImport>[number])=>{
   const names=Object.keys(row),values=Object.values(row).map(value=>typeof value==='object'?JSON.stringify(value):value)
   await db.query(`insert into etfs(${names.join(',')}) values(${names.map((_,i)=>'$'+(i+1)).join(',')}) on conflict(ticker) do update set ${names.filter(n=>n!=='ticker').map(n=>`${n}=excluded.${n}`).join(',')}`,values)
  }
  const first=validateImport(await load('data/priority-five.approved.json'))
  for(const row of first)await upsert(row)
  const before=(await db.query('select * from etfs order by ticker')).rows
  const id='11111111-1111-4111-8111-111111111111'
  await db.query('select create_comparison($1,$2,$3,$4,$5,false,$6,null)',[id,'test@example.invalid',['SPY','VTI'],10000000,'a'.repeat(64),'TEST ONLY'])
  const snapshot=(await db.query('select snapshot from comparisons')).rows
  const rows=validateImport(approved),itot=rows.find(r=>r.ticker==='ITOT')!
  await upsert({...itot,published:false,name:'TEST ONLY preexisting pending ITOT'})
  for(let run=0;run<2;run++)for(const row of rows)await upsert(row)
  assert.equal((await db.query('select * from etfs')).rows.length,17)
  assert.equal((await db.query("select * from etfs where ticker='ITOT' and published")).rows.length,1)
  assert.deepEqual((await db.query("select * from etfs where ticker=any($1) order by ticker",[first.map(r=>r.ticker)])).rows,before)
  assert.deepEqual((await db.query('select snapshot from comparisons')).rows,snapshot)
  assert.equal((await db.query('select * from contacts')).rows.length,1)
  assert.equal((await db.query("select * from etfs where ticker in ('RSP','SCHB','SCHD')")).rows.length,0)
  await db.exec("update etfs set tickerinside_sync_enabled=true where ticker in ('VTV','VUG')")
  const fixture=await load('tests/fixtures/tickerinside/voo.json')
  const candidates=['VTV','VUG'].map(ticker=>{const old=observed.funds.find((r:{ticker:string})=>r.ticker===ticker);return normalizeTickerInside({...fixture,ticker,name:old.name,expense_ratio:old.expense_ratio,page_url:`https://tickerinside.com/etf/${ticker.toLowerCase()}/`,cite_as:`TEST ONLY https://tickerinside.com/etf/${ticker.toLowerCase()}/`},ticker)})
  const run=crypto.randomUUID();await db.query('select begin_etf_sync($1)',[run]);const result=await db.query<{result:{updated:number}}>('select finish_etf_sync($1,$2,$3) as result',[run,JSON.stringify(candidates),'[]'])
  assert.equal(result.rows[0].result.updated,0)
  assert.deepEqual((await db.query<{name:string}>("select name from etfs where ticker in ('VTV','VUG') order by ticker")).rows.map(r=>r.name),['Vanguard Morningstar Value ETF','Vanguard Morningstar Growth ETF'])

 }finally{await db.close()}
})
