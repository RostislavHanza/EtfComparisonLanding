import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
export interface Mailer { send(email:string,link:string,comparisonId:string):Promise<string> }
export class MailConfigurationError extends Error {}
export interface SmtpConfig {
 host:string; port:number; secure:boolean; user:string; password:string;
 from:{name:string;address:string}
}
const required=['SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_PASSWORD','EMAIL_FROM'] as const
export function readSmtpConfig(env:NodeJS.ProcessEnv):SmtpConfig {
 const missing=required.filter(name=>!env[name]?.trim())
 if(missing.length)throw new MailConfigurationError(`Chybí serverové proměnné: ${missing.join(', ')}.`)
 const host=env.SMTP_HOST!.trim(),port=Number(env.SMTP_PORT),secure=env.SMTP_SECURE!.trim()
 if(host!=='smtp.gmail.com'||!['true','false'].includes(secure)||!((port===465&&secure==='true')||(port===587&&secure==='false')))throw new MailConfigurationError('Gmail vyžaduje smtp.gmail.com a buď 465/true, nebo 587/false s povinným STARTTLS.')
 const user=env.SMTP_USER!.trim().toLowerCase(),rawFrom=env.EMAIL_FROM!.trim()
 if(/[\r\n]/.test(rawFrom)||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(user))throw new MailConfigurationError('Neplatná konfigurace odesílatele.')
 const match=rawFrom.match(/^([^<>]*)<([^<>]+)>$/),address=(match?match[2]:rawFrom).trim().toLowerCase()
 if(address!==user)throw new MailConfigurationError('EMAIL_FROM musí používat stejnou adresu jako SMTP_USER; Gmail jiné adresy může přepsat.')
 return{host,port,secure:secure==='true',user,password:env.SMTP_PASSWORD!,from:{name:match?match[1].trim():'ETF přehled',address:user}}
}
export const smtpOptions=(c:SmtpConfig)=>({
 host:c.host,port:c.port,secure:c.secure,requireTLS:!c.secure,
 auth:{user:c.user,pass:c.password},pool:false,logger:false,debug:false,
 connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,
 tls:{rejectUnauthorized:true,minVersion:'TLSv1.2' as const},
 disableFileAccess:true,disableUrlAccess:true,
})
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
export function comparisonMessage(link:string){
 const href=escape(link)
 return{subject:'Vaše ETF srovnání je připravené',
 text:`Dobrý den,\n\nvaše ETF srovnání je uložené. Pro otevření přehledu a potvrzení přístupu ke schránce použijte odkaz:\n${link}\n\nNa stránce klikněte na „Potvrdit a otevřít srovnání“. Samotné otevření odkazu adresu nepotvrdí. Odkaz lze potvrdit jednou během 7 dní. Poté se můžete v tomto prohlížeči vracet k přehledu 30 dní.\n\nZasíláme pouze vámi vyžádaný přehled. Nejde o marketingový odběr ani investiční doporučení. Pokud jste o srovnání nežádali, zprávu ignorujte.\n\nETF přehled`,
 html:`<!doctype html><html lang="cs"><body style="margin:0;background:#f6f3ea;color:#24382e;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:auto;background:#fffdf8"><tr><td style="padding:32px"><p style="font-size:13px;letter-spacing:1px">ETF PŘEHLED</p><h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px">Vaše srovnání je připravené.</h1><p style="line-height:1.7">Dobrý den, váš výběr ETF i nastavená částka jsou uložené. Otevřete odkaz a na stránce zvolte <strong>„Potvrdit a otevřít srovnání“</strong>.</p><p style="margin:28px 0"><a href="${href}" style="display:inline-block;background:#284c39;color:#fff;padding:16px 22px;text-decoration:none;border-radius:3px">Otevřít moje srovnání →</a></p><p style="line-height:1.7;font-size:13px">Samotné otevření odkazu adresu nepotvrdí. Odkaz je jednorázový a platí 7 dní. Po potvrzení se k přehledu můžete vracet v tomto prohlížeči 30 dní.</p><p style="font-size:12px;line-height:1.7">Pokud tlačítko nefunguje, zkopírujte tento odkaz:<br/><a href="${href}" style="color:#284c39;word-break:break-all">${href}</a></p><hr style="border:0;border-top:1px solid #d5d9cb;margin:28px 0"/><p style="font-size:12px;line-height:1.7;color:#56675e">Jde o vyžádané srovnání, nikoli marketingový odběr nebo investiční doporučení. Pokud jste o srovnání nežádali, zprávu ignorujte.</p></td></tr></table></td></tr></table></body></html>`}
}
export interface MailTransport {
 sendMail(options:SendMailOptions):Promise<{messageId:string;accepted?:unknown[];rejected?:unknown[]}>
 verify():Promise<true>
}
export class SmtpMailer implements Mailer {
 private transport:MailTransport
 constructor(private config:SmtpConfig,transport?:MailTransport){this.transport=transport??nodemailer.createTransport(smtpOptions(config))}
 async verify(){return this.transport.verify()}
 async sendAdmin(link:string){
  const text=`Přihlášení ke správě Preview ETF\n\n${link}\n\nNa stránce klikněte na „Potvrdit přihlášení“. Odkaz je jednorázový a platí 10 minut. Session platí 30 minut. Pokud jste o přihlášení nežádali, zprávu ignorujte.`
  return this.deliver(this.config.user,{subject:"Přihlášení ke správě Preview ETF",text,html:`<html lang="cs"><body><h1>Správa Preview ETF</h1><p>Otevřete odkaz a potvrďte přihlášení tlačítkem. Samotné otevření odkazu vás nepřihlásí.</p><p><a href="${escape(link)}">Otevřít přihlášení</a></p><p>Odkaz platí 10 minut a lze jej použít jednou. Přihlášení platí 30 minut. Pokud jste o přihlášení nežádali, zprávu ignorujte.</p></body></html>`})
 }
 private async deliver(email:string,message:SendMailOptions){
  const info=await this.transport.sendMail({from:this.config.from,to:[email],...message})
  const accepted=info.accepted?.some(value=>typeof value==='string'?value.toLowerCase()===email.toLowerCase():Boolean(value&&typeof value==='object'&&'address' in value&&String(value.address).toLowerCase()===email.toLowerCase()))
  if(!accepted||info.rejected?.length||!info.messageId)throw new Error('smtp_recipient_not_accepted')
  return info.messageId
 }
 async send(email:string,link:string,id:string){
  const info=await this.transport.sendMail({from:this.config.from,to:[email],...comparisonMessage(link),messageId:`<etf-${id}@${this.config.from.address.split('@')[1]}>`})
  const accepted=info.accepted?.some(value=>typeof value==='string'?value.toLowerCase()===email.toLowerCase():Boolean(value&&typeof value==='object'&&'address' in value&&String(value.address).toLowerCase()===email.toLowerCase()))
  if(!accepted||info.rejected?.length||!info.messageId)throw new Error('smtp_recipient_not_accepted')
  return info.messageId
 }
}
