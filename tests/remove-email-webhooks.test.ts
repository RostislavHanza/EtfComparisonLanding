import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const path='supabase/migrations/'
const cleanup=await readFile(path+'202610120010_remove_email_webhooks.sql','utf8')
async function beforeCleanup(){
 const db=new PGlite()
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;')
 for(const file of (await readdir(path)).filter(f=>f.endsWith('.sql')&&!f.includes('0010_')).sort())await db.exec(await readFile(path+file,'utf8'))
 return db
}
test('webhook cleanup preserves messages and unrelated tables, keeps secure working retention and is repeatable',async()=>{
 const db=await beforeCleanup()
 try{
  const before=(await db.query<{name:string}>("select tablename as name from pg_tables where schemaname='public' order by tablename")).rows.map(r=>r.name)
  await db.exec("insert into public.webhook_receipts values('obsolete',now());insert into public.contacts(id,email) values('11111111-1111-4111-8111-111111111111','test@example.invalid');insert into public.comparisons(id,contact_id,tickers,amount_halere,snapshot,token_hash,token_expires_at) values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',array['TEST'],10000000,'[]','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',now()+interval '1 day')")
  // Use the real current message schema without inventing provider delivery.
  await db.exec("insert into public.email_messages(comparison_id,status) values('22222222-2222-4222-8222-222222222222','sent')")
  await db.exec(cleanup)
  const after=(await db.query<{name:string}>("select tablename as name from pg_tables where schemaname='public' order by tablename")).rows.map(r=>r.name)
  assert.deepEqual(after,before.filter(n=>n!=='webhook_receipts'))
  assert.equal((await db.query('select * from public.email_messages')).rows.length,1)
  assert.equal((await db.query<{rpc:null}>("select to_regprocedure('public.record_email_webhook(text,text,text,timestamp with time zone)') as rpc")).rows[0].rpc,null)
  const definition=(await db.query<{body:string}>("select pg_get_functiondef('public.purge_expired_data()'::regprocedure) as body")).rows[0].body
  assert.equal(definition.includes('webhook_receipts'),false)
  await db.query('select public.purge_expired_data()')
  assert.equal((await db.query('select * from public.email_messages')).rows.length,1)
  await db.exec(cleanup)
  await db.exec('set role anon');await assert.rejects(db.query('select public.purge_expired_data()'),/permission denied/)
 }finally{await db.close()}
})
test('webhook cleanup aborts for an unexpected routine dependency without removing anything',async()=>{
 const db=await beforeCleanup()
 try{
  await db.exec("create function public.unexpected_webhook_user() returns bigint language sql as $$ select count(*) from public.webhook_receipts $$")
  await assert.rejects(db.exec(cleanup),/Unexpected email webhook dependencies/)
  await db.exec('rollback')
  assert.equal((await db.query('select * from public.webhook_receipts')).rows.length,0)
  assert.equal((await db.query<{exists:boolean}>("select to_regclass('public.email_messages') is not null as exists")).rows[0].exists,true)
 }finally{await db.close()}
})
