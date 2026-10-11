import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto'
import { comparisonInput, leadInput, tokenInput, uuid, InputError, events, attribution, object } from '../shared/validation.js'
import type { Repository } from './repository.js'
import { DatabaseError } from './repository.js'
import { logMailFailure } from './logging.js'
import type { Mailer } from './mail.js'
export class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }
export const hash = (value:string) => createHash('sha256').update(value).digest('hex')
export const newToken = () => randomBytes(32).toString('base64url')
export interface AppConfig { baseUrl:string; secret:string; environment:'development'|'preview'|'production'; previewRecipients:string[]; privacy?:{controllerName:string;controllerContact:string;retentionDays:number} }
export class Application {
  constructor(private repo:Repository,private config:AppConfig,private mail?:Mailer) {}
  private key(scope:string,value:string){return createHmac('sha256',this.config.secret).update(`${scope}:${value}`).digest('hex')}
  private async limit(scope:string,value:string,count:number,seconds:number){if(!await this.repo.limit(this.key(scope,value),count,seconds))throw new HttpError(429,'Příliš mnoho požadavků. Zkuste to později.')}
  async catalog(id?:unknown,session=''){
    if(id!==undefined)await this.read(id,session)
    const funds=await this.repo.catalog()
    return {funds:id===undefined?funds.map(({ticker,name,verifiedAt})=>({ticker,name,verifiedAt})):funds,privacy:this.config.privacy??null}
  }
  async create(body:unknown,ip:string){
    await this.limit('lead-ip',ip,20,3600)
    const input=leadInput(body)
    if(input.marketingConsent)throw new InputError('Marketingový souhlas v tomto formuláři nesbíráme.')
    if(!this.config.privacy)throw new HttpError(503,'Odesílání zatím není dostupné: chybí nastavení provozovatele.')
    if(!this.mail)throw new HttpError(503,'Odesílání není nyní dostupné.')
    if(this.config.environment!=='production'&&!this.config.previewRecipients.includes(input.email))throw new HttpError(403,'V testovacím prostředí lze posílat pouze na povolené testovací adresy.')
    await this.limit('lead-email',input.email,3,3600)
    await this.limit('smtp-day','all',100,86400)
    const id=randomUUID(),token=newToken()
    await this.repo.create({...input,id,tokenHash:hash(token)})
    if(input.attribution)await this.safeEvent('lead_accepted',input.attribution,id)
    try{
      const link=new URL(this.config.baseUrl);link.hash=`access=${token}`
      const providerId=await this.mail.send(input.email,link.toString(),id)
      await this.repo.sent(id,providerId)
      if(input.attribution)await this.safeEvent('email_sent',input.attribution,id)
    }catch(error){
      logMailFailure('email_delivery_failed',error)
      try{await this.repo.failed(id)}catch{/* Safe response; no credentials or addresses logged. */}
      throw new HttpError(503,'Odeslání se nepodařilo dokončit. Zkuste to později; zpráva při síťové chybě přesto mohla dorazit.')
    }
    return {status:'sent',message:'Zpráva byla předána k odeslání. Zkontrolujte schránku včetně složky spam.'}
  }
  async access(body:unknown,ip:string,currentSession=''){
    await this.limit('access-ip',ip,30,600)
    const token=tokenInput(body),session=newToken(),id=await this.repo.redeem(hash(token),hash(session))
    if(!id&&/^[A-Za-z0-9_-]{43}$/.test(currentSession)&&this.repo.reopen){
      const previous=await this.repo.reopen(hash(token),hash(currentSession))
      if(previous)return{id:previous,session:currentSession}
    }
    if(!id)throw new HttpError(410,'Odkaz vypršel, byl již použit nebo není platný. Vraťte se do původního prohlížeče nebo si vyžádejte nové srovnání.')
    return {id,session}
  }
  async read(id:unknown,session:string){if(!/^[A-Za-z0-9_-]{43}$/.test(session))throw new HttpError(401,'Přístup vyžaduje platný e-mailový odkaz.');const result=await this.repo.read(hash(tokenInput({token:session})),uuid(id));if(!result)throw new HttpError(401,'Přístup vypršel nebo srovnání není dostupné.');return result}
  async update(id:unknown,session:string,body:unknown,ip:string){
    await this.limit('save-ip',ip,60,600)
    const input=comparisonInput(body)
    if(!await this.repo.update(hash(tokenInput({token:session})),uuid(id),input.tickers,input.amountCzk))throw new HttpError(401,'Nemáte platný přístup k tomuto srovnání.')
    return this.read(id,session)
  }
  private async safeEvent(name:typeof events[number],a:{visitId:string;campaign:string},id?:string){try{await this.repo.event(name,a,id)}catch{/* Analytics failure does not break delivery. */}}
  async event(body:unknown,ip:string){
    await this.limit('event-ip',ip,100,600)
    const v=object(body),a=attribution(v.attribution)
    if(v.withdraw===true&&a){await this.repo.withdrawAnalytics(a.visitId);return{ok:true}}
    const clientEvents=['landing_view','comparison_interacted','comparison_configured','form_started','lead_submit_attempt']
    if(!a||typeof v.name!=='string'||!clientEvents.includes(v.name))throw new InputError('Neplatná událost nebo chybějící souhlas.')
    await this.repo.event(v.name as typeof events[number],a)
    return {ok:true}
  }
}
export function publicError(error:unknown){
 if(error instanceof HttpError)return{status:error.status,message:error.message}
 if(error instanceof InputError)return{status:400,message:error.message}
 if(error instanceof DatabaseError&&error.message==='unavailable_etf')return{status:409,message:'Některý fond již není dostupný s aktuálně ověřenými údaji. Obnovte katalog.'}
 return{status:503,message:'Služba nyní není dostupná. Zkuste to později.'}
}
