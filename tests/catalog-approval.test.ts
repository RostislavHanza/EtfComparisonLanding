import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { prepareApprovedCatalog } from '../server/catalog-approval.js'
import { validateImport } from '../server/import-validation.js'
const draft=JSON.parse(await readFile(new URL('../data/review/priority-five.pending.json',import.meta.url),'utf8'))
const example=JSON.parse(await readFile(new URL('../data/review/priority-five.approval.example.json',import.meta.url),'utf8'))
function fixture(){ // Synthetic reviewer and approvals, only for isolated tests. Never saved/imported remotely.
 const date=new Date().toISOString(),decision=structuredClone(example)
 decision.reviewer='TEST ONLY';decision.verifiedAt=date
 decision.usageReview={approved:true,reviewer:'TEST ONLY',reviewedAt:date,basis:'TEST ONLY',policyUrl:'https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy'}
 for(const item of decision.records){const row=draft.records.find((r:{ticker:string})=>r.ticker===item.ticker);item.approved=true;item.dataAsOf=date;item.confirmedSourceIds=row.sources.map((s:{evidenceId:string})=>s.evidenceId);for(const source of row.sources)if(!source.as_of)item.sourceDateOverrides[source.evidenceId]=date}
 return decision
}
test('operator batch preparation requires explicit per-fund and source approvals and never infers dates or rights',()=>{
 assert.throws(()=>prepareApprovedCatalog(draft,example))
 const approval=fixture(),prepared=prepareApprovedCatalog(draft,approval);assert.equal(prepared.records.length,5);assert.ok(prepared.records.every(row=>!('reviewStatus' in row)&&!('blockers' in row)));assert.equal(draft.records[0].reviewStatus,'pending_not_importable')
 const missing=fixture();missing.records[0].confirmedSourceIds=[];assert.throws(()=>prepareApprovedCatalog(draft,missing),/Nepotvrzený/)
 const denied=fixture();denied.usageReview.approved=false;assert.throws(()=>prepareApprovedCatalog(draft,denied),/schválené/)
 const undated=fixture();undated.verifiedAt=null;assert.throws(()=>prepareApprovedCatalog(draft,undated),/ověření/)
})
test('issuer exchange evidence must match the known fund issuer and explicitly identify ticker and NYSE Arca',()=>{
 const records=prepareApprovedCatalog(draft,fixture()).records
 assert.equal(validateImport({records}).length,5)
 for(const [url,evidence] of [['https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf','SPY NYSE Arca'],['https://www.ssga.com/test','NYSE Arca'],['https://www.ssga.com/test','SPY Nasdaq'],['https://www.ssga.com.attacker.invalid/test','SPY NYSE Arca'],['https://tickerinside.com/api/v1/fund/spy.json','SPY NYSE Arca']]){
  const row=structuredClone(records[0]);row.sources=row.sources.map(s=>s.field==='exchange'?{...s,url,evidence}:s);assert.throws(()=>validateImport({records:[row]}))
 }
 const wrong=structuredClone(records[0]);wrong.exchange='Nasdaq';assert.throws(()=>validateImport({records:[wrong]}))
})
test('validated catalog can upsert IVV/IWM repeatedly without duplicates in local PostgreSQL',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;')
  await db.exec(await readFile(new URL('../supabase/migrations/202610100001_mvp.sql',import.meta.url),'utf8'))
  await db.exec(await readFile(new URL('../supabase/migrations/202610110004_etf_sync.sql',import.meta.url),'utf8'))
  await db.query("insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published,tickerinside_sync_enabled) values('IVV','TEST PENDING','NYSE Arca','TEST',0.5,'TEST','TEST',now(),current_date,$1,'TEST','{}',false,true),('IWM','TEST PENDING','NYSE Arca','TEST',0.5,'TEST','TEST',now(),current_date,$1,'TEST','{}',false,false)",[JSON.stringify(Array.from({length:6},()=>({field:'exchange',evidence:'TEST ONLY'})))])
  const rows=validateImport(prepareApprovedCatalog(draft,fixture()))
  for(let run=0;run<2;run++)for(const row of rows)await db.query(`insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict(ticker) do update set name=excluded.name,expense_ratio_percent=excluded.expense_ratio_percent,published=excluded.published,sources=excluded.sources`,[row.ticker,row.name,row.exchange,row.tracked_index,row.expense_ratio_percent,row.dividends,row.description,row.verified_at,row.data_as_of,JSON.stringify(row.sources),row.verified_by,JSON.stringify(row.usage_review),row.published])
  assert.equal((await db.query('select ticker from etfs')).rows.length,5)
  const ivv=(await db.query<{name:string;expense_ratio_percent:string;published:boolean;tickerinside_sync_enabled:boolean}>("select name,expense_ratio_percent,published,tickerinside_sync_enabled from etfs where ticker='IVV'")).rows[0]
  assert.equal(ivv.name,'iShares Core S&P 500 ETF');assert.equal(Number(ivv.expense_ratio_percent),0.03);assert.equal(ivv.tickerinside_sync_enabled,true);assert.equal(ivv.published,true)
 }finally{await db.close()}
})
