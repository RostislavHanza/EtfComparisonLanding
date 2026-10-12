import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {PGlite} from '@electric-sql/pglite'
import {validateImport} from '../server/import-validation.js'
import {prepareApprovedCatalog} from '../server/catalog-approval.js'
import {normalizePerformance} from '../server/performance.js'
import {annualizedReturn,grossReturnFromNet,scenarioProfit} from '../shared/performance.js'
import {historicalLines} from '../shared/history.js'
const load=async(path:string)=>JSON.parse(await readFile(path,'utf8'))
const approved=await load('data/final-three.approved.json'),draft=await load('data/review/final-three.pending.json'),decision=await load('data/review/final-three.demo-approval.json'),evidence=await load('data/review/final-three.evidence.json'),observed=await load('data/review/final-three.performance.json')
test('final three use actual issuer evidence and explicit operator decision; domain and publication gates remain strict',t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse(decision.verifiedAt)+1000})
 assert.deepEqual(prepareApprovedCatalog(draft,decision),approved)
 const rows=validateImport(approved);assert.deepEqual(rows.map(r=>r.ticker),['RSP','SCHB','SCHD'])
 assert.deepEqual(rows.map(r=>r.expense_ratio_percent),[.2,.03,.06]);assert.equal(rows[2].name,'Schwab U.S. Dividend Equity ETF')
 for(const row of rows){assert.equal(row.exchange,'NYSE Arca');assert.match(row.dividends,/čtvrtletní/);assert.equal(row.usage_review.issuerPermissionClaimed,false)}
 for(const ticker of ['RSP','SCHB','SCHD'])assert.equal(evidence.sources.find((s:{id:string})=>s.id===ticker+'-page').httpStatus,200)
 assert.equal(evidence.verifiedFields.find((f:{ticker:string})=>f.ticker==='SCHB').dividendEvidenceType,'observed_quarterly_income_distribution_dates_in_official_product_profile')
 const wrongIssuer=structuredClone(approved);wrongIssuer.records[0].sources.find((s:{field:string;provider:string})=>s.field==='index'&&s.provider==='issuer').url='https://www.schwabassetmanagement.com/products/schb';assert.throws(()=>validateImport(wrongIssuer),/emitent/)
 const spoof=structuredClone(approved);spoof.records[1].sources.find((s:{provider:string})=>s.provider==='issuer').url='https://www.schwabassetmanagement.com.attacker.invalid/products/schb';assert.throws(()=>validateImport(spoof),/doméně/)
 const denied=structuredClone(decision);denied.usageReview.approved=false;assert.throws(()=>prepareApprovedCatalog(draft,denied),/schválené/)
 t.mock.timers.tick(15*86400000);assert.throws(()=>validateImport(approved),/14 dní/)
})
test('final three have actual cumulative returns and weekly history; net/gross cost model round trips without duplication',()=>{
 const history:ReturnType<typeof normalizePerformance>[]=observed.funds.map((r:{ticker:string;retrievedAt:string})=>normalizePerformance(r,r.ticker,r.retrievedAt))
 for(const period of [1,3,5] as const){
  const lines=historicalLines(history,period);assert.equal(lines.length,3)
  assert.equal(lines[0].points.length,period===1?53:157)
  for(const row of approved.records){const net=history.find(r=>r.ticker===row.ticker)![`r${period}`];assert.notEqual(net,null);const gross=grossReturnFromNet(annualizedReturn(net,period),row.expenseRatioPercent)!
   assert.ok(Math.abs(scenarioProfit(100000,gross,period,row.expenseRatioPercent)!-100000*net!/100)<1e-7)
  }
 }
 assert.ok(Math.abs(scenarioProfit(100000,0,1,.2)!+200)<1e-8)
 assert.ok(Math.abs(scenarioProfit(100000,0,1,.03)!+30)<1e-8)
 assert.ok(Math.abs(scenarioProfit(100000,0,1,.06)!+60)<1e-8)
})
test('final upsert reaches twenty without modifying seventeen original funds, contacts or saved comparisons',async t=>{
 t.mock.timers.enable({apis:['Date'],now:Date.parse(decision.verifiedAt)+1000})
 const db=new PGlite()
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;')
  await db.exec(await readFile('supabase/migrations/202610100001_mvp.sql','utf8'))
  const upsert=async(row:ReturnType<typeof validateImport>[number])=>{const names=Object.keys(row),values=Object.values(row).map(v=>typeof v==='object'?JSON.stringify(v):v);await db.query(`insert into etfs(${names.join(',')}) values(${names.map((_,i)=>'$'+(i+1)).join(',')}) on conflict(ticker) do update set ${names.filter(n=>n!=='ticker').map(n=>`${n}=excluded.${n}`).join(',')}`,values)}
  const old=validateImport({records:[...(await load('data/priority-five.approved.json')).records,...(await load('data/remaining-twelve.approved.json')).records]})
  for(const row of old)await upsert(row)
  const before=(await db.query('select * from etfs order by ticker')).rows
  await db.query('select create_comparison($1,$2,$3,$4,$5,false,$6,null)',['11111111-1111-4111-8111-111111111111','test@example.invalid',['SPY','ITOT'],10000000,'a'.repeat(64),'TEST ONLY'])
  const snapshot=(await db.query('select * from comparisons')).rows
  for(let run=0;run<2;run++)for(const row of validateImport(approved))await upsert(row)
  assert.equal((await db.query('select * from etfs where published')).rows.length,20)
  assert.deepEqual((await db.query('select * from etfs where ticker=any($1) order by ticker',[old.map(r=>r.ticker)])).rows,before)
  assert.deepEqual((await db.query('select * from comparisons')).rows,snapshot);assert.equal((await db.query('select * from contacts')).rows.length,1)
 }finally{await db.close()}
})
