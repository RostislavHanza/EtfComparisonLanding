import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const smtpMigration=await readFile(new URL('../supabase/migrations/202610100003_gmail_smtp.sql',import.meta.url),'utf8')
const retention=await readFile(new URL('../supabase/migrations/202610100002_retention.sql',import.meta.url),'utf8')
const migration=await readFile(new URL('../supabase/migrations/202610100001_mvp.sql',import.meta.url),'utf8')
const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222'
async function database(){const db=new PGlite();await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');await db.exec(migration);await db.exec(retention);await db.exec(smtpMigration);return db}
async function seed(db:PGlite){
 for(const ticker of ['TESTA','TESTB','TESTC'])await db.query(`insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published) values($1,'TEST ONLY','NYSE Arca','Test',0.03,'Test','Test',now(),current_date,$2,'Test','{}',true)`,[ticker,JSON.stringify(Array.from({length:6},()=>({test:true})))])
}
const create=(db:PGlite,selection=['TESTA','TESTB'])=>db.query('select create_comparison($1,$2,$3,$4,$5,$6,$7,$8)',[id,'test@example.invalid',selection,10000000,'a'.repeat(64),false,'test',JSON.stringify({visitId:other,campaign:'direct'})])
test('migration denies anonymous access and RPC calls',async()=>{const db=await database();await db.exec('set role anon');await assert.rejects(db.query('select * from contacts'),/permission denied/);await assert.rejects(db.query("select consume_rate_limit('x',1,60)"),/permission denied/);await db.close()})
test('transactional creation, one-time token, sessions, updates and expiry',async()=>{
 const db=await database();try{await seed(db);await create(db);
 assert.equal((await db.query('select * from contacts')).rows.length,1)
 assert.equal((await db.query('select * from consent_records')).rows.length,1)
 await assert.rejects(create(db,['TESTA','UNVERIFIED']),/unavailable_etf/)
 const access=await db.query<{redeem_comparison:string|null}>('select redeem_comparison($1,$2)',['a'.repeat(64),'b'.repeat(64)]);assert.equal(access.rows[0].redeem_comparison,id)
 assert.equal((await db.query<{redeem_comparison:null}>('select redeem_comparison($1,$2)',['a'.repeat(64),'c'.repeat(64)])).rows[0].redeem_comparison,null)
 assert.equal((await db.query<{read_comparison:null}>('select read_comparison($1,$2)',['c'.repeat(64),id])).rows[0].read_comparison,null)
 const read=await db.query<{read_comparison:{amountCzk:number;tickers:string[]}}>('select read_comparison($1,$2)',['b'.repeat(64),id]);assert.equal(Number(read.rows[0].read_comparison.amountCzk),100000);assert.deepEqual(read.rows[0].read_comparison.tickers,['TESTA','TESTB'])
 await db.query('select update_comparison($1,$2,$3,$4)',['b'.repeat(64),id,['TESTB','TESTC'],25000000]);const updated=await db.query<{read_comparison:{amountCzk:number}}> ('select read_comparison($1,$2)',['b'.repeat(64),id]);assert.equal(Number(updated.rows[0].read_comparison.amountCzk),250000)
 await db.exec("update comparison_sessions set expires_at=now()-interval '1 second'");assert.equal((await db.query<{read_comparison:null}>('select read_comparison($1,$2)',['b'.repeat(64),id])).rows[0].read_comparison,null)
 assert.equal((await db.query("select * from funnel_events where name='email_confirmed'")).rows.length,1)
 }finally{await db.close()}
})
test('rate limiter counts atomically',async()=>{
 const db=await database();try{
 await seed(db);await create(db);assert.equal((await db.query<{consume_rate_limit:boolean}>("select consume_rate_limit('k',2,60)")).rows[0].consume_rate_limit,true);await db.query("select consume_rate_limit('k',2,60)");assert.equal((await db.query<{consume_rate_limit:boolean}>("select consume_rate_limit('k',2,60)")).rows[0].consume_rate_limit,false)
 }finally{await db.close()}
})

test('retention deletes expired comparisons and orphaned contacts with dependent personal data',async()=>{
 const db=await database();try{await seed(db);await create(db);await db.exec("update comparisons set created_at=now()-interval '31 days'");await db.query('select purge_expired_data()');for(const table of ['comparisons','contacts','consent_records','email_messages'])assert.equal((await db.query(`select * from ${table}`)).rows.length,0);assert.equal((await db.query('select * from etfs')).rows.length,3)}finally{await db.close()}
})

test('withdrawing optional analytics clears attribution and events without deleting the requested comparison',async()=>{
 const db=await database();try{await seed(db);await create(db);await db.query('select redeem_comparison($1,$2)',['a'.repeat(64),'b'.repeat(64)]);await db.query('select withdraw_analytics($1)',[other]);assert.equal((await db.query<{attribution:null}>('select attribution from comparisons')).rows[0].attribution,null);assert.equal((await db.query('select * from funnel_events')).rows.length,0);assert.equal((await db.query('select * from comparisons')).rows.length,1)}finally{await db.close()}
})


test('saved campaign is preserved through email access, reads and edits without direct attribution overwrite',async()=>{
 for(const campaign of ['ad-a','ad-b','direct']){
  const db=await database()
  try{
   await db.exec(await readFile(new URL('../supabase/migrations/202610120008_reusable_comparison_links.sql',import.meta.url),'utf8'))
   await seed(db)
   await db.query('select create_comparison($1,$2,$3,$4,$5,$6,$7,$8)',[id,'test@example.invalid',['TESTA','TESTB'],10000000,'a'.repeat(64),false,'test',JSON.stringify({visitId:other,campaign})])
   await db.query('select redeem_comparison($1,$2)',['a'.repeat(64),'b'.repeat(64)])
   await db.query('select read_comparison($1,$2)',['b'.repeat(64),id])
   await db.query('select update_comparison($1,$2,$3,$4)',['b'.repeat(64),id,['TESTB','TESTC'],20000000])
   await db.exec('delete from comparison_sessions')
   await db.query('select redeem_comparison($1,$2)',['a'.repeat(64),'c'.repeat(64)])
   await db.query('select read_comparison($1,$2)',['c'.repeat(64),id])
   assert.equal((await db.query<{attribution:{campaign:string}}>('select attribution from comparisons')).rows[0].attribution.campaign,campaign)
   const events=await db.query<{name:string;campaign:string}>('select name,campaign from funnel_events')
   assert.ok(events.rows.some(e=>e.name==='email_confirmed'));assert.ok(events.rows.some(e=>e.name==='comparison_opened'))
   assert.ok(events.rows.every(e=>e.campaign===campaign))
  }finally{await db.close()}
 }
})
