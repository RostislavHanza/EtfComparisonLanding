import { test } from 'node:test'
import assert from 'node:assert/strict'
import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
import { readSmtpConfig,smtpOptions,comparisonMessage,SmtpMailer } from '../server/mail.ts'
import { logMailFailure } from '../server/logging.ts'
// Fixtures only. Not real account credentials and never used for network delivery.
const env={SMTP_HOST:'smtp.gmail.com',SMTP_PORT:'465',SMTP_SECURE:'true',SMTP_USER:'test@example.invalid',SMTP_PASSWORD:'TEST ONLY NOT A PASSWORD',EMAIL_FROM:'ETF Test <test@example.invalid>'}
test('SMTP loads only server configuration, requires all fields and enforces encrypted Gmail transport',()=>{
 const config=readSmtpConfig(env),options=smtpOptions(config)
 assert.equal(config.from.address,env.SMTP_USER);assert.equal(options.auth.pass,env.SMTP_PASSWORD);assert.equal(options.secure,true);assert.equal(options.tls.rejectUnauthorized,true);assert.equal(options.logger,false);assert.equal(options.debug,false)
 for(const name of Object.keys(env)){const partial={...env};delete partial[name as keyof typeof partial];assert.throws(()=>readSmtpConfig(partial),/Chybí serverové proměnné/)}
 for(const patch of [{SMTP_SECURE:'yes'},{SMTP_PORT:'25'},{SMTP_HOST:'attacker.invalid'},{SMTP_SECURE:'false'},{EMAIL_FROM:'other@example.invalid'},{EMAIL_FROM:'test@example.invalid\r\nBcc: x@x.invalid'}])assert.throws(()=>readSmtpConfig({...env,...patch}))
 const starttls=smtpOptions(readSmtpConfig({...env,SMTP_PORT:'587',SMTP_SECURE:'false'}));assert.equal(starttls.requireTLS,true);assert.equal(starttls.secure,false)
})
test('SMTP mail has professional Czech HTML and text alternatives, with escaped HTML link',async()=>{
 const message=comparisonMessage('https://example.invalid/#access=TEST_ONLY&extra="quoted"')
 assert.match(message.text,/Dobrý den,\n\nVaše osobní kalkulačka ETF je vytvořená\./);assert.match(message.html,/Dobrý den,<br\/><br\/>Vaše osobní kalkulačka ETF je vytvořená\./);assert.ok(!message.text.includes('v aktivním prohlížeči'));assert.ok(!message.html.includes('v aktivním prohlížeči'));assert.match(message.text,/90 dní/);assert.match(message.html,/&amp;extra=&quot;quoted&quot;/);assert.match(message.html,/<html lang="cs">/)
 const transport=nodemailer.createTransport({streamTransport:true,buffer:true,newline:'unix'})
 const result=await transport.sendMail({from:'test@example.invalid',to:'recipient@example.invalid',...message})
 const mime=result.message.toString();assert.match(mime,/multipart\/alternative/);assert.match(mime,/text\/plain/);assert.match(mime,/text\/html/)
})
test('mailer requires actual SMTP recipient acceptance and propagates rejected/failed sends',async()=>{
 let payload:SendMailOptions|undefined
 const transport={verify:async()=>true as const,sendMail:async(options:SendMailOptions)=>{payload=options;return{messageId:'TEST MESSAGE ID',accepted:['recipient@example.invalid'],rejected:[]}}}
 const mailer=new SmtpMailer(readSmtpConfig(env),transport)
 assert.equal(await mailer.verify(),true);assert.equal(await mailer.send('recipient@example.invalid','https://example.invalid/#access=TEST_ONLY','test-id'),'TEST MESSAGE ID')
 assert.deepEqual(payload?.to,['recipient@example.invalid']);assert.match(String(payload?.html),/Otevřít moje srovnání/);assert.ok(payload?.text)
 const rejected=new SmtpMailer(readSmtpConfig(env),{verify:async()=>true,sendMail:async()=>({messageId:'TEST',accepted:[],rejected:['recipient@example.invalid']})});await assert.rejects(rejected.send('recipient@example.invalid','test','test'),/not_accepted/)
 const failed=new SmtpMailer(readSmtpConfig(env),{verify:async()=>true,sendMail:async()=>{throw Error('TEST FAILURE')}});await assert.rejects(failed.send('recipient@example.invalid','test','test'),/TEST FAILURE/)
})
test('mail failure logging includes only a safe code, never error contents or credentials',()=>{
 const captured:string[]=[],original=console.error;console.error=(value:string)=>{captured.push(value)}
 try{logMailFailure('email_delivery_failed',Object.assign(new Error('TEST PASSWORD TOKEN ADDRESS'),{code:'EAUTH',response:'TEST PRIVATE SMTP RESPONSE'}));logMailFailure('smtp_verify_failed',{code:'PRIVATE ERROR VALUE'});assert.deepEqual(captured.map(s=>JSON.parse(s)),[{event:'email_delivery_failed',code:'EAUTH'},{event:'smtp_verify_failed',code:'unclassified'}])}finally{console.error=original}
})

test('SMTP diagnostic endpoint rejects unauthenticated requests and safely reports missing configuration',async()=>{
 const {default:health}=await import('../api/mail-health.ts')
 const names=['CRON_SECRET','SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_PASSWORD','EMAIL_FROM'],old=names.map(name=>process.env[name])
 const original=console.error;console.error=()=>{}
 try{
  for(const name of names)delete process.env[name];process.env.CRON_SECRET='T'.repeat(32)
  async function request(authorization:string){let status=0,result:unknown;const req={method:'GET',headers:{authorization}} as import('@vercel/node').VercelRequest;const res={setHeader(){},status(code:number){status=code;return this},json(value:unknown){result=value}} as unknown as import('@vercel/node').VercelResponse;await health(req,res);return{status,result}}
  assert.equal((await request('')).status,401)
  const missing=await request('Bearer '+'T'.repeat(32));assert.equal(missing.status,503);assert.match(JSON.stringify(missing.result),/SMTP_HOST/);assert.ok(!JSON.stringify(missing.result).includes('T'.repeat(32)))
 }finally{console.error=original;names.forEach((name,i)=>{if(old[i]===undefined)delete process.env[name];else process.env[name]=old[i]})}
})
