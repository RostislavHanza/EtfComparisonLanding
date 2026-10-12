import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { PGlite } from '@electric-sql/pglite'
import { normalizeTickerInside } from '../server/tickerinside.js'
import { prepareApprovedCatalog } from '../server/catalog-approval.js'
import { validateImport } from '../server/import-validation.js'
const draft=JSON.parse(await readFile('data/review/priority-five.pending.json','utf8'))
const decision=JSON.parse(await readFile('data/review/priority-five.demo-approval.json','utf8'))
const approved=JSON.parse(await readFile('data/priority-five.approved.json','utf8'))
test('real demo batch records operator acceptance without claiming issuer permission or a legal audit',t=>{
 // Validate at the recorded preparation time; later expiry is intentional, not a permanently fresh fixture.
 t.mock.timers.enable({apis:['Date'],now:Date.parse(decision.verifiedAt)+1000})
 assert.deepEqual(approved,prepareApprovedCatalog(draft,decision))
 const rows=validateImport(approved)
 assert.deepEqual(rows.map(r=>r.ticker),['SPY','VOO','IVV','VTI','IWM'])
 for(const row of rows){
  assert.equal(row.exchange,'NYSE Arca');assert.match(row.dividends,/čtvrtletní/)
  assert.equal(row.verified_by,'admin');assert.equal(row.usage_review.approvalType,'operator-publication-decision')
  assert.equal(row.usage_review.issuerPermissionClaimed,false)
  assert.equal(row.published,true)
  assert.ok(row.sources.some(s=>s.field==='exchange'&&s.provider==='issuer'&&s.role==='verification'&&s.evidence.includes('NYSE Arca')))
 }
 assert.equal(rows[0].expense_ratio_percent,0.0945)
 assert.equal(rows[3].name,'Vanguard Morningstar Total Stock Market ETF')
 assert.equal(rows[3].tracked_index,'Morningstar US Total Market Index')
 assert.ok(approved.records.every((r:{sources:{verificationStatus?:string}[]})=>r.sources.every(s=>s.verificationStatus===undefined)))
 const denied=structuredClone(decision);denied.usageReview.approved=false;assert.throws(()=>prepareApprovedCatalog(draft,denied),/schválené/)
 const falsePermission=structuredClone(decision);falsePermission.usageReview.issuerPermissionClaimed=true;assert.throws(()=>prepareApprovedCatalog(draft,falsePermission),/povolení/)
 const hidden=structuredClone(decision);hidden.usageReview.limitations=[];assert.throws(()=>prepareApprovedCatalog(draft,hidden))
 const missing=structuredClone(approved);missing.records[0].sources=missing.records[0].sources.filter(s=>s.field!=='exchange');assert.throws(()=>validateImport(missing))
 t.mock.timers.tick(15*86400000);assert.throws(()=>validateImport(approved),/14 dní/)
})
test('committed demo import dry run never uses database credentials',()=>{
 // Pin the child clock to preparation time so the regression remains useful after the real batch expires.
 // No DB credentials; the unchanged CLI still chooses its normal dry-run branch.
 const output=execFileSync(process.execPath,['--import','tsx','--input-type=module','--eval',`Date.now=()=>${Date.parse(decision.verifiedAt)+1000};process.argv=[process.execPath,'scripts/import-etfs.ts','data/priority-five.approved.json'];await import('./scripts/import-etfs.ts')`],{encoding:'utf8',env:{PATH:process.env.PATH},stdio:'pipe'})
 assert.match(output,/5 záznamů/);assert.match(output,/Pouze dry run/)
})
test('demo rows upsert existing IVV/IWM without duplicates and stale API cannot downgrade SPY/VTI',async t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse(decision.verifiedAt)+1000})
 const db=new PGlite()
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
  for(const file of ['202610100001_mvp.sql','202610110004_etf_sync.sql'])await db.exec(await readFile('supabase/migrations/'+file,'utf8'))
  const upsert=async(row:ReturnType<typeof validateImport>[number])=>db.query(`insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict(ticker) do update set name=excluded.name,tracked_index=excluded.tracked_index,expense_ratio_percent=excluded.expense_ratio_percent,published=excluded.published,sources=excluded.sources,verified_at=excluded.verified_at,usage_review=excluded.usage_review`,[row.ticker,row.name,row.exchange,row.tracked_index,row.expense_ratio_percent,row.dividends,row.description,row.verified_at,row.data_as_of,JSON.stringify(row.sources),row.verified_by,JSON.stringify(row.usage_review),row.published])
  const rows=validateImport(approved)
  for(const row of rows.filter(r=>['IVV','IWM'].includes(r.ticker)))await upsert({...row,name:'TEST ONLY pending',published:false})
  for(let i=0;i<2;i++)for(const row of rows)await upsert(row)
  assert.equal((await db.query('select * from etfs where published')).rows.length,5)
  assert.equal((await db.query('select * from etfs')).rows.length,5)
  await db.exec("update etfs set tickerinside_sync_enabled=true where ticker in ('SPY','VTI')") // Stronger regression even with accidental opt-in.
  const fixture=JSON.parse(await readFile('tests/fixtures/tickerinside/voo.json','utf8'))
  const observations=JSON.parse(await readFile('data/review/priority-five.evidence.json','utf8')).tickerInsideObservations
  const candidates=['SPY','VTI'].map(ticker=>normalizeTickerInside({...fixture,ticker,name:observations[ticker].name,expense_ratio:observations[ticker].expense_ratio,page_url:`https://tickerinside.com/etf/${ticker.toLowerCase()}/`,cite_as:`TEST ONLY https://tickerinside.com/etf/${ticker.toLowerCase()}/`},ticker))
  const run=crypto.randomUUID();await db.query('select begin_etf_sync($1)',[run])
  const result=await db.query<{finish_etf_sync:{updated:number}}>('select finish_etf_sync($1,$2,$3)',[run,JSON.stringify(candidates),'[]'])
  assert.equal(result.rows[0].finish_etf_sync.updated,0)
  const spy=(await db.query<{expense_ratio_percent:string}>("select expense_ratio_percent from etfs where ticker='SPY'")).rows[0];assert.equal(Number(spy.expense_ratio_percent),0.0945)
  const vti=(await db.query<{name:string;tracked_index:string}>("select name,tracked_index from etfs where ticker='VTI'")).rows[0];assert.equal(vti.name,'Vanguard Morningstar Total Stock Market ETF');assert.equal(vti.tracked_index,'Morningstar US Total Market Index')
 }finally{await db.close()}
})
