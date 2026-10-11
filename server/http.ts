import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SupabaseRepository } from './repository.ts'
import { Application, HttpError, publicError } from './application.ts'
import { SmtpMailer,readSmtpConfig } from './mail.ts'
import type { AppConfig } from './application.ts'
export function readAppConfig(env:NodeJS.ProcessEnv):AppConfig {
 const base=env.APP_BASE_URL,secret=env.RATE_LIMIT_SECRET,environment=env.APP_ENV
 if(!base||!secret||secret.length<32||!['development','preview','production'].includes(environment??''))throw new HttpError(503,'Služba zatím není nakonfigurovaná.')
 const parsed=new URL(base)
 if(parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/'||(parsed.protocol!=='https:'&&!(environment==='development'&&['localhost','127.0.0.1'].includes(parsed.hostname))))throw new HttpError(503,'Služba zatím není nakonfigurovaná.')
 const smtpUser=env.SMTP_USER?.trim().toLowerCase()
 const config:AppConfig={baseUrl:parsed.origin,secret,environment:environment as AppConfig['environment'],previewRecipients:smtpUser?[smtpUser]:[]}
 if(env.OPERATOR_NAME?.trim()&&env.OPERATOR_CONTACT?.trim())config.privacy={controllerName:env.OPERATOR_NAME.trim(),controllerContact:env.OPERATOR_CONTACT.trim(),retentionDays:90}
 return config
}
export function runtime(){
 const config=readAppConfig(process.env)
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)throw new HttpError(503,'Služba zatím není nakonfigurovaná.')
 const repo=new SupabaseRepository(url,key)
 let mail:SmtpMailer|undefined
 try{mail=new SmtpMailer(readSmtpConfig(process.env))}catch{/* Missing/invalid SMTP cannot block the public catalog. Lead creation fails safely. */}
 return {app:new Application(repo,config,mail),baseUrl:config.baseUrl}
}
export function header(req:VercelRequest,key:string){const v=req.headers[key.toLowerCase()];return Array.isArray(v)?v[0]??'':v??''}
export function ip(req:VercelRequest){return header(req,'x-vercel-forwarded-for').split(',')[0]?.trim()||req.socket?.remoteAddress||'unknown'}
export function guard(req:VercelRequest,methods:string[],mutating=true){
 if(!methods.includes(req.method??''))throw new HttpError(405,'Nepovolená metoda.')
 if(mutating){
  const base=process.env.APP_BASE_URL
  const origin=header(req,'origin')
  const allowed=[base?new URL(base).origin:'',process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'',...(process.env.ALLOWED_ORIGINS??'').split(',').map(s=>s.trim())].filter(Boolean)
  if(!origin||!allowed.includes(origin))throw new HttpError(403,'Požadavek musí pocházet z tohoto webu.')
  if(!header(req,'content-type').toLowerCase().startsWith('application/json'))throw new HttpError(415,'Očekává se JSON.')
 }
}
export function body(req:VercelRequest){
 if(Number(header(req,'content-length')||0)>8192)throw new HttpError(413,'Požadavek je příliš velký.')
 const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body??null)
 if(Buffer.byteLength(raw)>8192)throw new HttpError(413,'Požadavek je příliš velký.')
 try{return JSON.parse(raw)}catch{throw new HttpError(400,'Neplatný JSON.')}
}
export function cookie(req:VercelRequest){return header(req,'cookie').split(';').map(x=>x.trim()).find(x=>x.startsWith('etf_session='))?.slice('etf_session='.length)??''}
export const sessionCookie=(token:string)=>`etf_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.APP_BASE_URL?.startsWith('https://')?'; Secure':''}`
export function handler(run:(req:VercelRequest,res:VercelResponse)=>Promise<unknown>){return async(req:VercelRequest,res:VercelResponse)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff')
 try{res.status(200).json(await run(req,res))}catch(error){const out=publicError(error);if(out.status===429)res.setHeader('Retry-After','600');res.status(out.status).json({error:out.message})}
}}
