import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { Application,hash } from '../server/application.js'
import type { Repository } from '../server/repository.js'
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222'
test('public selection metadata excludes protected financial data; protected catalog requires a bound session',async()=>{
 const funds=[{ticker:'TESTA',name:'TEST ONLY',exchange:'NYSE Arca' as const,index:'TEST',expenseRatioPercent:.03,dividends:'TEST',description:'TEST',verifiedAt:'test',dataAsOf:'test',sources:[]}]
 let calls=0
 const repo={catalog:async()=>{calls++;return funds},read:async(hash:string,comparison:string)=>hash&&comparison===id?{id}:null} as unknown as Repository
 const app=new Application(repo,{baseUrl:'https://example.invalid',secret:'x'.repeat(32),environment:'preview',previewRecipients:[]})
 assert.deepEqual((await app.catalog()).funds,[{ticker:'TESTA',name:'TEST ONLY',verifiedAt:'test'}])
 await assert.rejects(app.catalog(id,''),/platný e-mailový/);assert.equal(calls,1)
 await assert.rejects(app.catalog(other,'s'.repeat(43)),/Přístup vypršel/);assert.equal(calls,1)
 assert.deepEqual((await app.catalog(id,'s'.repeat(43))).funds,funds)
})
test('reusable return token creates fresh sessions, confirms only once and rejects expired/revoked tokens',async()=>{
 const db=new PGlite()
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
  for(const name of ['202610100001_mvp.sql','202610100003_gmail_smtp.sql','202610120007_email_link_access.sql'])await db.exec(await readFile(`supabase/migrations/${name}`,'utf8'))
  for(const ticker of ['TESTA','TESTB'])await db.query("insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published) values($1,'TEST','NYSE Arca','TEST',0.03,'TEST','TEST',now(),current_date,$2,'TEST','{}',true)",[ticker,JSON.stringify(Array.from({length:6},()=>({test:true})))])
  const create=async(comparison:string,token:string)=>db.query('select create_comparison($1,$2,$3,$4,$5,false,$6,$7)',[comparison,'test@example.invalid',['TESTA','TESTB'],10000000,token,'test',JSON.stringify({visitId:other,campaign:'direct'})])
  await create(other,'9'.repeat(64))
  await db.query("update comparisons set token_expires_at=now()-interval '1 second' where id=$1",[other])
  const originalExpiry=(await db.query<{expiry:string}>('select token_expires_at::text as expiry from comparisons where id=$1',[other])).rows[0].expiry
  await db.exec(await readFile('supabase/migrations/202610120008_reusable_comparison_links.sql','utf8'))
  assert.equal((await db.query<{expiry:string}>('select token_expires_at::text as expiry from comparisons where id=$1',[other])).rows[0].expiry,originalExpiry)
  await create(id,'a'.repeat(64))
  assert.equal(Number((await db.query<{days:string}>('select extract(epoch from token_expires_at-created_at)/86400 as days from comparisons where id=$1',[id])).rows[0].days),90)
  const redeem=async(token:string,session:string)=>(await db.query<{id:string|null}>('select redeem_comparison($1,$2) as id',[token,session])).rows[0].id
  assert.equal(await redeem('9'.repeat(64),'e'.repeat(64)),null)
  assert.equal(await redeem('a'.repeat(64),'b'.repeat(64)),id)
  assert.equal((await db.query<{ok:boolean}>('select update_comparison($1,$2,$3,$4) as ok',['b'.repeat(64),id,['TESTA','TESTB'],12345678])).rows[0].ok,true)
  const confirmed=(await db.query<{stamp:string}>('select confirmed_at::text as stamp from comparisons where id=$1',[id])).rows[0].stamp
  await db.exec("update comparison_sessions set expires_at=now()-interval '1 second'")
  assert.equal((await db.query<{saved:unknown}>('select read_comparison($1,$2) as saved',['b'.repeat(64),id])).rows[0].saved,null)
  // No original session/cookie is an input. Concurrent return visits both succeed.
  assert.deepEqual(await Promise.all([redeem('a'.repeat(64),'c'.repeat(64)),redeem('a'.repeat(64),'d'.repeat(64))]),[id,id])
  const saved=(await db.query<{saved:{tickers:string[];amountCzk:number}}>('select read_comparison($1,$2) as saved',['c'.repeat(64),id])).rows[0].saved
  assert.deepEqual(saved.tickers,['TESTA','TESTB']);assert.equal(saved.amountCzk,123456.78)
  assert.equal((await db.query<{stamp:string}>('select confirmed_at::text as stamp from comparisons where id=$1',[id])).rows[0].stamp,confirmed)
  assert.equal((await db.query("select * from funnel_events where name='email_confirmed'")).rows.length,1)
  assert.equal((await db.query('select * from comparison_sessions')).rows.length,3)
  assert.equal(await redeem('x'.repeat(64),'e'.repeat(64)),null)
  await db.exec("update comparisons set token_expires_at=now()-interval '1 second'");assert.equal(await redeem('a'.repeat(64),'e'.repeat(64)),null)
  assert.equal((await db.query('select * from comparison_sessions')).rows.length,3)
  await db.exec('set role anon');await assert.rejects(redeem('a'.repeat(64),'f'.repeat(64)),/permission denied/)
 }finally{await db.close()}
})

test('automatic return link does not require the previous browser session',async()=>{
 const token='t'.repeat(43);let expired=false
 const repo={limit:async()=>true,redeem:async(t:string)=>!expired&&t===hash(token)?id:null} as unknown as Repository
 const app=new Application(repo,{baseUrl:'https://example.invalid',secret:'x'.repeat(32),environment:'preview',previewRecipients:[]})
 const first=await app.access({token},'test-ip'),again=await app.access({token},'test-ip')
 assert.equal(again.id,first.id);assert.notEqual(again.session,first.session)
 await assert.rejects(app.access({token:'x'.repeat(43)},'test-ip'),/Odkaz vypršel/)
 expired=true;await assert.rejects(app.access({token},'test-ip'),/Odkaz vypršel/)
})

test('GET and HEAD email scans cannot redeem a token at the access endpoint',async()=>{
 const endpoint=(await import('../api/access.js')).default
 let status=0
 const response={setHeader(){},status(code:number){status=code;return this},json(){}}
 for(const method of ['GET','HEAD']){await endpoint({method,headers:{},query:{token:'t'.repeat(43)}} as unknown as Parameters<typeof endpoint>[0],response as unknown as Parameters<typeof endpoint>[1]);assert.equal(status,405)}
})

test('email-only form cannot silently record an unsupported marketing opt-in',async()=>{
 let created=false
 const repo={limit:async()=>true,create:async()=>{created=true}} as unknown as Repository
 const app=new Application(repo,{baseUrl:'https://example.invalid',secret:'x'.repeat(32),environment:'production',previewRecipients:[]})
 await assert.rejects(app.create({tickers:['TESTA','TESTB'],amountCzk:100000,email:'test@example.invalid',website:'',marketingConsent:true},'test-ip'),/Marketingový souhlas/)
 assert.equal(created,false)
})
