import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Application, hash, publicError, type AppConfig } from '../server/application.ts'
import type { Repository, LeadRecord } from '../server/repository.ts'
import { DatabaseError } from '../server/repository.ts'
import type { EventName } from '../shared/validation.ts'
import { annualCost } from '../shared/model.ts'
import { readAppConfig } from '../server/http.ts'
const config:AppConfig={baseUrl:'https://example.invalid',secret:'x'.repeat(32),environment:'production',previewRecipients:[],privacy:{controllerName:'TEST ONLY',controllerContact:'test@example.invalid',retentionDays:90}}
const lead={tickers:['TESTA','TESTB'],amountCzk:100000,email:' Test@Example.invalid ',marketingConsent:false,website:''}
function repository(){
 let record:LeadRecord|undefined
 const sessions=new Set<string>()
 const events:EventName[]=[], statuses:string[]=[]
 const repo:Repository={
  catalog:async()=>[],limit:async()=>true,
  create:async l=>{record=l}, sent:async()=>{statuses.push('sent')},failed:async()=>{statuses.push('failed')},
  redeem:async(t,s)=>{if(t!==record?.tokenHash)return null;sessions.add(s);return record.id},
  read:async(s,id)=>sessions.has(s)&&id===record?.id?{id,tickers:record.tickers,amountCzk:record.amountCzk,funds:[],createdAt:'test',updatedAt:'test'}:null,
  update:async(s,id,tickers,amountCzk)=>{if(!sessions.has(s)||id!==record?.id)return false;Object.assign(record,{tickers,amountCzk});return true},
  event:async name=>{events.push(name)},withdrawAnalytics:async()=>{events.length=0},
 }
 return {repo,events,statuses,get record(){return record}}
}
test('requested mail carries an opaque token, persists no raw token and restores the configured comparison',async()=>{
 const db=repository();let sentLink='';let recipient=''
 const app=new Application(db.repo,config,{send:async(email,link)=>{recipient=email;sentLink=link;return 'test-provider'}})
 assert.deepEqual((await app.catalog()).funds,[])
 assert.equal((await app.create(lead,'test-ip')).status,'sent');assert.equal(recipient,'test@example.invalid')
 const url=new URL(sentLink);assert.equal(url.search,'');assert.ok(!sentLink.includes(recipient));const token=new URLSearchParams(url.hash.slice(1)).get('access')!
 assert.match(token,/^[A-Za-z0-9_-]{43}$/);assert.equal(db.record?.tokenHash,hash(token));assert.equal(db.record?.marketingConsent,false)
 assert.ok(!JSON.stringify(db.record).includes(token));assert.deepEqual(db.statuses,['sent']);assert.deepEqual(db.events,[])
 const access=await app.access({token},'test-ip');const saved=await app.read(access.id,access.session);assert.equal(saved.amountCzk,100000);assert.deepEqual(saved.tickers,['TESTA','TESTB'])
 const again=await app.access({token},'test-ip');assert.equal(again.id,access.id);assert.notEqual(again.session,access.session);assert.equal((await app.read(again.id,again.session)).amountCzk,100000)
 await assert.rejects(app.read(access.id,'z'.repeat(43)),/Přístup vypršel/)
 const updated=await app.update(access.id,access.session,{tickers:['TESTA','TESTC'],amountCzk:250000},'test-ip');assert.equal(updated.amountCzk,250000)
})
test('mailer failure stays a failure, limits block delivery and missing controller blocks personal-data storage',async()=>{
 const db=repository();const app=new Application(db.repo,config,{send:async()=>{throw Error('PRIVATE PROVIDER ERROR')}})
 await assert.rejects(app.create(lead,'test-ip'),/Odeslání se nepodařilo/);assert.deepEqual(db.statuses,['failed']);assert.ok(db.record)
 db.repo.limit=async()=>false;await assert.rejects(app.create(lead,'test-ip'),/Příliš mnoho/)
 const unavailable=repository();await assert.rejects(new Application(unavailable.repo,{...config,privacy:undefined},{send:async()=>''}).create(lead,'test-ip'),/provozovatele/);assert.equal(unavailable.record,undefined)
 assert.equal(publicError(new Error('SECRET')).message.includes('SECRET'),false)
 assert.equal(publicError(new DatabaseError('unavailable_etf')).status,409)
})
test('preview recipient allowlist prevents real campaigns; only consented server events count',async()=>{
 const db=repository(),app=new Application(db.repo,{...config,environment:'preview',previewRecipients:['test@example.invalid']},{send:async()=> 'test-provider'})
 await assert.rejects(app.create({...lead,email:'other@example.invalid'},'test-ip'),/testovací adresy/)
 const attribution={consent:true,visitId:'11111111-1111-4111-8111-111111111111',campaign:'ad-a'}
 await app.create({...lead,attribution},'test-ip');assert.deepEqual(db.events,['lead_accepted','email_sent'])
 await assert.rejects(app.event({name:'email_confirmed',attribution},'test-ip'),/Neplatná událost/)
 await assert.rejects(app.event({name:'landing_view'},'test-ip'),/chybějící souhlas/)
 await app.event({name:'comparison_configured',attribution},'test-ip');assert.equal(db.events.at(-1),'comparison_configured');await app.event({withdraw:true,attribution},'test-ip');assert.deepEqual(db.events,[])
})
test('annual expense arithmetic uses percentage units, including zero and decimal amounts',()=>{
 assert.equal(annualCost(100000,0.03),30);assert.equal(annualCost(0,0.03),0);assert.equal(annualCost(100000,0.0945),94.5);assert.ok(Math.abs(annualCost(12345.67,0.03)-3.703701)<1e-8)
})

test('preview uses only SMTP_USER, ignores retired recipient configuration and rejects other recipients before storing a comparison',async()=>{
 const env={APP_BASE_URL:'https://example.invalid',RATE_LIMIT_SECRET:'x'.repeat(32),APP_ENV:'preview',SMTP_USER:' Test@Example.invalid ',PREVIEW_RECIPIENTS:'other@example.invalid',OPERATOR_NAME:'TEST ONLY',OPERATOR_CONTACT:'test@example.invalid'}
 const db=repository(),sent:string[]=[]
 const app=new Application(db.repo,readAppConfig(env),{send:async(email)=>{sent.push(email);return 'test-provider'}})
 await assert.rejects(app.create({...lead,email:'other@example.invalid'},'test-ip'),/testovací adresy/)
 assert.equal(db.record,undefined);assert.deepEqual(sent,[])
 await app.create(lead,'test-ip');assert.deepEqual(sent,['test@example.invalid'])
 const unavailable=repository(),withoutUser=new Application(unavailable.repo,readAppConfig({...env,SMTP_USER:''}),{send:async()=>{throw Error('must not send')}})
 await assert.rejects(withoutUser.create(lead,'test-ip'),/testovací adresy/);assert.equal(unavailable.record,undefined)
})

test('SMTP-backed create and return flow accepts one or every catalog fund without a five-fund ceiling',async()=>{
 for(const tickers of [['TESTA'],Array.from({length:20},(_,i)=>`TEST${i}`)]){
  const db=repository();let link=''
  const app=new Application(db.repo,config,{send:async(_email,url)=>{link=url;return 'test-provider'}})
  assert.equal((await app.create({...lead,tickers},'test-ip')).status,'sent')
  const token=new URLSearchParams(new URL(link).hash.slice(1)).get('access')!
  const access=await app.access({token},'test-ip');assert.deepEqual((await app.read(access.id,access.session)).tickers,tickers)
 }
})
