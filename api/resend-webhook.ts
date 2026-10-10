import { Resend } from 'resend'
import { header, handler, runtime } from '../server/http.ts'
import { HttpError } from '../server/application.ts'
export const config={api:{bodyParser:false}}
export default handler(async req=>{
 if(req.method!=='POST')throw new HttpError(405,'Nepovolená metoda.')
 const secret=process.env.RESEND_WEBHOOK_SECRET
 if(!secret)throw new HttpError(503,'Webhook zatím není nakonfigurovaný.')
 let raw='';for await(const chunk of req){raw+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);if(Buffer.byteLength(raw)>65536)throw new HttpError(413,'Požadavek je příliš velký.')}
 let event
 try{event=new Resend().webhooks.verify({payload:raw,headers:{id:header(req,'svix-id'),timestamp:header(req,'svix-timestamp'),signature:header(req,'svix-signature')},webhookSecret:secret})}catch{throw new HttpError(401,'Neplatný podpis.')}
 if(!['email.delivered','email.bounced','email.failed','email.complained'].includes(event.type))return{ok:true}
 const data=event.data as {email_id?:string}
 if(typeof data.email_id!=='string'||!Number.isFinite(Date.parse(event.created_at)))throw new HttpError(400,'Neplatná událost.')
 return runtime().app.webhook(header(req,'svix-id'),data.email_id,event.type,event.created_at)
})
