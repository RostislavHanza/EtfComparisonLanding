import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
test('withdrawal blocks late events and late comparison attribution while preserving functional comparisons and marketing',async()=>{
 const db=new PGlite(),visit='11111111-1111-4111-8111-111111111111'
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;')
  for(const file of ['202610100001_mvp.sql','202610100002_retention.sql','202610110006_analytics_revocation.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
  await db.exec("insert into contacts(id,email)values('22222222-2222-4222-8222-222222222222','test@example.invalid')")
  await db.query(`insert into comparisons(id,contact_id,tickers,amount_halere,snapshot,token_hash,token_expires_at,attribution) values('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222',array['A','B'],100,'[]',repeat('b',64),now()+interval '1 day',$1)`,[JSON.stringify({consent:true,visitId:visit,campaign:'direct'})])
  await db.exec("insert into consent_records(contact_id,comparison_id,marketing_granted,text_version)values('22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333',true,'TEST ONLY');insert into comparison_sessions(session_hash,comparison_id,expires_at)values(repeat('c',64),'33333333-3333-4333-8333-333333333333',now()+interval '1 day')")
  await db.query("insert into funnel_events(name,visit_id,campaign)values('landing_view',$1,'direct')",[visit])
  await db.query('select withdraw_analytics($1)',[visit]);await db.query('select withdraw_analytics($1)',[visit])
  await db.query("insert into funnel_events(name,visit_id,campaign)values('comparison_interacted',$1,'direct')",[visit])
  assert.equal((await db.query('select * from funnel_events')).rows.length,0)
  await db.exec('set role anon');await assert.rejects(db.query('select * from analytics_revocations'),/permission denied/);await assert.rejects(db.query('select withdraw_analytics($1)',[visit]),/permission denied/);await db.exec('reset role')

  assert.equal((await db.query<{attribution:unknown}>('select attribution from comparisons')).rows[0].attribution,null)
  assert.equal((await db.query<{marketing_granted:boolean}>('select marketing_granted from consent_records')).rows[0].marketing_granted,true)
  assert.equal((await db.query('select * from comparison_sessions')).rows.length,1)
  const trigger=(await db.query<{attribution:unknown}>(`insert into comparisons(id,contact_id,tickers,amount_halere,snapshot,token_hash,token_expires_at,attribution) values(gen_random_uuid(),'22222222-2222-4222-8222-222222222222',array['A','B'],100,'[]',repeat('a',64),now()+interval '1 day',$1) returning attribution`,[JSON.stringify({consent:true,visitId:visit,campaign:'direct'})])).rows[0]
  assert.equal(trigger.attribution,null)
 }finally{await db.close()}
})
