import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import admin from '../api/preview-admin.ts'
import sync from '../api/etf-sync.ts'
import { adminCookie, adminHash } from '../server/preview-admin.ts'
import { SmtpMailer, readSmtpConfig } from '../server/mail.ts'
async function invoke(fn:typeof admin,method:string,headers:Record<string,string>={},body?:unknown){
 let status=200,data:unknown
 const response={setHeader(){},status(code:number){status=code;return this},json(value:unknown){data=value}} as unknown as VercelResponse
 await fn({method,headers,body} as VercelRequest,response)
 return {status,data}
}
test('Preview controls deny production, anonymous sync, foreign origins and GET confirmation without touching services',async()=>{
 const names=['APP_ENV','APP_BASE_URL','RATE_LIMIT_SECRET'] as const,previous=names.map(name=>process.env[name])
 try{
  process.env.APP_ENV='production';assert.equal((await invoke(admin,'GET')).status,404)
  process.env.APP_ENV='preview';process.env.APP_BASE_URL='https://preview.example.com';process.env.RATE_LIMIT_SECRET='x'.repeat(32)
  assert.deepEqual(await invoke(admin,'GET'),{status:200,data:{authenticated:false}})
  const headers={origin:'https://preview.example.com','content-type':'application/json'}
  assert.equal((await invoke(sync,'POST',headers,{})).status,401)
  assert.equal((await invoke(sync,'POST',{...headers,origin:'https://evil.example.com'},{})).status,403)
  assert.equal((await invoke(admin,'POST',headers,{action:'confirm',token:'bad'})).status,400)
  assert.deepEqual(await invoke(admin,'GET',headers,{action:'confirm',token:'x'.repeat(43)}),{status:200,data:{authenticated:false}})
  process.env.APP_ENV='production';assert.equal((await invoke(sync,'POST',headers,{})).status,404)
 }finally{names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i]})}
})
test('admin cookie is secure and SMTP admin mail goes exclusively to configured user with both MIME alternatives',async()=>{
 const cookie=adminCookie('test');for(const flag of ['__Host-','HttpOnly','Secure','SameSite=Strict','Max-Age=1800'])assert.ok(cookie.includes(flag))
 let captured:import('nodemailer').SendMailOptions|undefined
 const config=readSmtpConfig({SMTP_HOST:'smtp.gmail.com',SMTP_PORT:'465',SMTP_SECURE:'true',SMTP_USER:'admin@example.com',SMTP_PASSWORD:'TEST ONLY',EMAIL_FROM:'Demo <admin@example.com>'})
 const mail=new SmtpMailer(config,{async verify(){return true},async sendMail(options){captured=options;return {messageId:'test',accepted:['admin@example.com'],rejected:[]}}})
 await mail.sendAdmin('https://preview.example.com/?admin=etf-sync#admin-access=TEST')
 assert.deepEqual(captured?.to,['admin@example.com']);assert.ok(captured?.text);assert.ok(captured?.html)
 const rejected=new SmtpMailer(config,{async verify(){return true},async sendMail(){return{messageId:'test',accepted:[],rejected:['admin@example.com']}}})
 await assert.rejects(rejected.sendAdmin('https://preview.example.com/'),/smtp_recipient_not_accepted/)
})
test('admin migration denies anonymous access and atomically enforces one-time confirmation, origin binding and expiry',async()=>{
 const db=new PGlite()
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
  await db.exec(await readFile(new URL('../supabase/migrations/202610110005_preview_admin.sql',import.meta.url),'utf8'))
  const token=adminHash('TEST token'),session=adminHash('TEST session'),origin='https://preview.example.com'
  await db.query('insert into preview_admin_access(token_hash,origin) values($1,$2)',[token,origin])
  await db.exec('set role anon');await assert.rejects(db.query('select * from preview_admin_access'),/permission denied/);await assert.rejects(db.query('select confirm_preview_admin($1,$2,$3)',[token,session,origin]),/permission denied/);await db.exec('reset role')
  const confirm=async(host=origin)=>(await db.query<{ok:boolean}>('select confirm_preview_admin($1,$2,$3) as ok',[token,session,host])).rows[0].ok
  assert.equal(await confirm('https://evil.example.com'),false);assert.equal(await confirm(),true);assert.equal(await confirm(),false)
  const row=(await db.query<{confirmed_at:Date;session_expires_at:Date}>('select confirmed_at,session_expires_at from preview_admin_access')).rows[0]
  assert.equal(row.session_expires_at.getTime()-row.confirmed_at.getTime(),1800000)
  await db.exec('delete from preview_admin_access');await db.query("insert into preview_admin_access(token_hash,origin,token_expires_at) values($1,$2,now()-interval '1 second')",[token,origin]);assert.equal(await confirm(),false)
 }finally{await db.close()}
})
test('authenticated Preview POST reuses protected synchronization and returns stored counts; expired sessions cannot start it',async()=>{
 const names=['APP_ENV','APP_BASE_URL','RATE_LIMIT_SECRET','SUPABASE_URL','SUPABASE_SECRET_KEY','CRON_SECRET'] as const,previous=names.map(name=>process.env[name]),originalFetch=globalThis.fetch
 let authenticated=true,begins=0
 try{
  process.env.APP_ENV='preview';process.env.APP_BASE_URL='https://preview.example.com';process.env.RATE_LIMIT_SECRET='x'.repeat(32);process.env.SUPABASE_URL='https://database.example.com';process.env.SUPABASE_SECRET_KEY='TEST ONLY';process.env.CRON_SECRET='c'.repeat(32)
  globalThis.fetch=async(input)=>{
   const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url)
   assert.equal(url.hostname,'database.example.com')
   if(url.pathname==='/rest/v1/preview_admin_access'){
    assert.equal(url.searchParams.get('session_hash'),`eq.${adminHash('t'.repeat(43))}`)
    assert.ok(url.searchParams.get('session_expires_at')?.startsWith('gt.'))
    return Response.json(authenticated?[{token_hash:'hash'}]:[])
   }
   if(url.pathname==='/rest/v1/rpc/begin_etf_sync'){begins++;return Response.json({state:'already_attempted',id:'test'})}
   if(url.pathname==='/rest/v1/etf_sync_runs')return Response.json({result:{state:'partial',candidates:19,updated:0,failed:1}})
   throw Error('Unexpected mocked database operation')
  }
  const headers={origin:'https://preview.example.com','content-type':'application/json',cookie:`__Host-etf_preview_admin=${'t'.repeat(43)}`}
  const answer=await invoke(sync,'POST',headers,{})
  assert.equal(answer.status,200);assert.deepEqual(answer.data,{state:'already_attempted',previousState:'partial',candidates:19,updated:0,failed:1});assert.equal(begins,1)
  assert.ok(!JSON.stringify(answer.data).includes(process.env.CRON_SECRET))
  authenticated=false;assert.equal((await invoke(sync,'POST',headers,{})).status,401);assert.equal(begins,1)
  authenticated=true;delete process.env.CRON_SECRET;assert.equal((await invoke(sync,'POST',headers,{})).status,503);assert.equal(begins,1)
 }finally{globalThis.fetch=originalFetch;names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i]})}
})
