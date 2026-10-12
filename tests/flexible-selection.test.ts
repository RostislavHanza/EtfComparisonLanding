import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('nonempty catalog-wide selections create, restore and update without weakening publication, freshness or session checks',async()=>{
 const db=new PGlite(),id='11111111-1111-4111-8111-111111111111'
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
  for(const name of ['202610100001_mvp.sql','202610100002_retention.sql','202610100003_gmail_smtp.sql','202610110006_analytics_revocation.sql','202610120008_reusable_comparison_links.sql','202610120009_flexible_etf_selection.sql'])await db.exec(await readFile(`supabase/migrations/${name}`,'utf8'))
  const tickers=Array.from({length:20},(_,i)=>`TEST${i}`)
  for(const ticker of tickers)await db.query("insert into etfs(ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources,verified_by,usage_review,published) values($1,'TEST ONLY','NYSE Arca','TEST',0.03,'TEST','TEST',now(),current_date,$2,'TEST','{}',true)",[ticker,JSON.stringify(Array.from({length:6},()=>({test:true})))])
  const create=(selection:string[])=>db.query('select create_comparison($1,$2,$3,$4,$5,false,$6,null)',[id,'test@example.invalid',selection,10000000,'a'.repeat(64),'test'])
  await assert.rejects(create([]),/invalid_selection/);await assert.rejects(create(['TEST0','TEST0']),/invalid_selection/);await assert.rejects(create(['MISSING']),/unavailable_etf/)
  await create(['TEST0'])
  assert.equal(Number((await db.query<{days:string}>('select extract(epoch from token_expires_at-created_at)/86400 as days from comparisons')).rows[0].days),90)
  assert.equal((await db.query<{id:string}>('select redeem_comparison($1,$2) as id',['a'.repeat(64),'b'.repeat(64)])).rows[0].id,id)
  const read=async()=>(await db.query<{saved:{tickers:string[];funds:unknown[];amountCzk:number}}>('select read_comparison($1,$2) as saved',['b'.repeat(64),id])).rows[0].saved
  assert.deepEqual((await read()).tickers,['TEST0']);assert.equal((await read()).funds.length,1)
  const update=(selection:string[],session='b'.repeat(64))=>db.query<{ok:boolean}>('select update_comparison($1,$2,$3,$4) as ok',[session,id,selection,25000000])
  assert.equal((await update(tickers)).rows[0].ok,true);assert.deepEqual((await read()).tickers,tickers);assert.equal((await read()).funds.length,20)
  assert.equal((await update(tickers,'c'.repeat(64))).rows[0].ok,false)
  await assert.rejects(update([]),/invalid_selection/);await assert.rejects(update(['TEST0','TEST0']),/invalid_selection/)
  await db.exec("update etfs set published=false where ticker='TEST19';update etfs set verified_at=now()-interval '15 days' where ticker='TEST18'")
  await assert.rejects(update(['TEST19']),/unavailable_etf/);await assert.rejects(update(['TEST18']),/unavailable_etf/)
  assert.deepEqual((await read()).tickers,tickers)
  assert.equal((await update(['TEST1'])).rows[0].ok,true);assert.equal((await read()).funds.length,1)
  assert.equal((await db.query<{id:string}>('select redeem_comparison($1,$2) as id',['a'.repeat(64),'d'.repeat(64)])).rows[0].id,id)
  await db.exec('set role anon');await assert.rejects(update(['TEST1']),/permission denied/)
 }finally{await db.close()}
})
