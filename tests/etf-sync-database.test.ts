import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { normalizeTickerInside } from '../server/tickerinside.ts'
const fixture=JSON.parse(await readFile(new URL('./fixtures/tickerinside/voo.json',import.meta.url),'utf8'))
const id='11111111-1111-4111-8111-111111111111',id2='22222222-2222-4222-8222-222222222222'
async function database(){
 const db=new PGlite();await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
 for(const file of ['202610100001_mvp.sql','202610100002_retention.sql','202610100003_gmail_smtp.sql','202610110004_etf_sync.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
 return db
}
async function seed(db:PGlite,ticker:string,published:boolean,enabled:boolean){
 const sources=['name','exchange','index','expenseRatioPercent','dividends','description'].map(field=>({field,url:'https://investor.vanguard.com/test',verified_at:new Date().toISOString(),as_of:'2020-01-01',evidence:'TEST ONLY'}))
 await db.query(`insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published,tickerinside_sync_enabled) values($1,$2,'NYSE Arca','TEST ONLY',0.1,'TEST ONLY','TEST ONLY',now(),'2020-01-01',$3,'TEST ONLY','{"approved":true}',$4,$5)`,[ticker,fixture.name,JSON.stringify(sources),published,enabled])
}
const begin=(db:PGlite,run=id)=>db.query<{begin_etf_sync:{state:string}}>('select begin_etf_sync($1)',[run])
const finish=(db:PGlite,rows:unknown[],run=id,failures:unknown[]=[])=>db.query<{finish_etf_sync:{state:string;updated:number;candidates:number}}>('select finish_etf_sync($1,$2,$3)',[run,JSON.stringify(rows),JSON.stringify(failures)])
test('new migration denies anon access; candidates upsert but drafts never publish, change or insert into catalog',async()=>{
 const db=await database();try{
  for(const ticker of ['IVV','ITOT','IWM'])await seed(db,ticker,false,true)
  await db.exec('set role anon');await assert.rejects(begin(db),/permission denied/);await assert.rejects(db.query('select * from etf_sync_candidates'),/permission denied/);await db.exec('reset role')
  const row=normalizeTickerInside(fixture,'VOO');assert.equal((await begin(db)).rows[0].begin_etf_sync.state,'started')
  assert.equal((await begin(db,id2)).rows[0].begin_etf_sync.state,'busy')
  const result=await finish(db,[row,{...row,ticker:'IVV',sourceUrl:'https://tickerinside.com/api/v1/fund/ivv.json',attributionUrl:'https://tickerinside.com/etf/ivv/'}]);assert.equal(result.rows[0].finish_etf_sync.updated,0)
  assert.equal((await db.query('select * from etfs')).rows.length,3);assert.equal((await db.query('select * from etfs where published')).rows.length,0)
  assert.equal((await db.query<{expense_ratio_percent:string}>('select expense_ratio_percent from etfs where ticker=\'IVV\'')).rows[0].expense_ratio_percent,'0.100000')
  assert.equal((await begin(db,id2)).rows[0].begin_etf_sync.state,'already_attempted')
  assert.deepEqual((await finish(db,[])).rows[0],result.rows[0]);assert.equal((await db.query('select * from etf_sync_candidates')).rows.length,2)
 }finally{await db.close()}
})
test('approved expense change preserves human verification and static fields; failed and older/undated data preserve last valid costs',async()=>{
 const db=await database();try{
  await seed(db,'VOO',true,true);const before=(await db.query<{verified_at:Date;tracked_index:string}>('select verified_at,tracked_index from etfs')).rows[0]
  const row=normalizeTickerInside(fixture,'VOO');await begin(db);assert.equal((await finish(db,[row])).rows[0].finish_etf_sync.updated,1)
  const after=(await db.query<{verified_at:Date;tracked_index:string;expense_ratio_percent:string}>('select verified_at,tracked_index,expense_ratio_percent from etfs')).rows[0];assert.equal(after.expense_ratio_percent,'0.030000');assert.deepEqual(after.verified_at,before.verified_at);assert.equal(after.tracked_index,before.tracked_index)
  await db.exec('update etf_sync_lease set attempt_day=null');await begin(db,id2);await finish(db,[],id2,[{ticker:'VOO',code:'upstream_timeout'}]);assert.equal((await db.query<{expense_ratio_percent:string}>('select expense_ratio_percent from etfs')).rows[0].expense_ratio_percent,'0.030000')
  for(const patch of [{expenseRatioAsOf:'2020-01-01',expenseRatioPercent:0.2},{expenseRatioSource:'market_data',expenseRatioAsOf:null,filingUrl:null,expenseRatioPercent:0.2}]){
   await db.exec('update etf_sync_lease set attempt_day=null');const next=crypto.randomUUID();await begin(db,next);assert.equal((await finish(db,[{...row,...patch}],next)).rows[0].finish_etf_sync.updated,0)
  }
  assert.equal((await db.query('select * from etf_sync_candidates')).rows.length,1)
 }finally{await db.close()}
})
test('duplicate and invalid sync batches roll back without overwriting previous data; stale approval prevents update',async()=>{
 const db=await database();try{
  await seed(db,'VOO',true,true);await db.exec("update etfs set verified_at=now()-interval '15 days'")
  const row=normalizeTickerInside(fixture,'VOO');await begin(db)
  await assert.rejects(finish(db,[row,row]),/duplicate_sync_ticker/)
  await assert.rejects(finish(db,[{...row,exchange:'NASDAQ'}]),/invalid_sync_record/)
  assert.equal((await db.query('select * from etf_sync_candidates')).rows.length,0)
  assert.equal((await finish(db,[row])).rows[0].finish_etf_sync.updated,0)
 }finally{await db.close()}
})
