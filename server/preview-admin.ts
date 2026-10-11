import { createHash, createHmac, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'
import { HttpError } from './application.ts'
import { header, ip, readAppConfig } from './http.ts'
import { SmtpMailer, readSmtpConfig } from './mail.ts'
import { logMailFailure } from './logging.ts'
export const adminHash=(value:string)=>createHash('sha256').update(value).digest('hex')
export const adminCookie=(value:string)=>`__Host-etf_preview_admin=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${value?1800:0}`
export function previewConfig(){
 if(process.env.APP_ENV!=='preview')throw new HttpError(404,'Stránka není dostupná.')
 return readAppConfig(process.env)
}
function database(){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)throw new HttpError(503,'Administrátorský přístup není nakonfigurovaný.')
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(5000)})}})
}
export async function previewAuthenticated(req:VercelRequest){
 const config=previewConfig()
 const token=header(req,'cookie').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-etf_preview_admin='))?.split('=')[1]??''
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))return false
 const {data,error}=await database().from('preview_admin_access').select('token_hash').eq('session_hash',adminHash(token)).eq('origin',config.baseUrl).gt('session_expires_at',new Date().toISOString()).not('confirmed_at','is',null).maybeSingle()
 if(error)throw new HttpError(503,'Přihlášení není dostupné. Ověřte migraci pro Preview administraci.')
 return Boolean(data)
}
export async function requestPreviewAccess(req:VercelRequest){
 const config=previewConfig(),db=database(),smtp=readSmtpConfig(process.env)
 const limits:[string,string,number,number][]=[['preview-admin-ip',ip(req),3,3600],['preview-admin-global','all',1,60],['preview-admin-day','all',6,86400],['smtp-day','all',100,86400]]
 for(const [scope,value,limit,seconds] of limits){
  const key=createHmac('sha256',config.secret).update(`${scope}:${value}`).digest('hex')
  const {data,error}=await db.rpc('consume_rate_limit',{p_key:key,p_limit:limit,p_seconds:seconds})
  if(error)throw new HttpError(503,'Přihlášení není dostupné.')
  if(!data)throw new HttpError(429,'Přihlašovací odkaz byl vyžádán příliš často. Zkuste to později.')
 }
 const token=randomBytes(32).toString('base64url')
 const {error:cleanup}=await db.from('preview_admin_access').delete().or(`and(session_expires_at.is.null,token_expires_at.lt.${new Date().toISOString()}),session_expires_at.lt.${new Date().toISOString()}`)
 if(cleanup)throw new HttpError(503,'Přihlášení není dostupné. Ověřte novou migraci.')
 const {error}=await db.from('preview_admin_access').insert({token_hash:adminHash(token),origin:config.baseUrl})
 if(error)throw new HttpError(503,'Přihlášení není dostupné. Ověřte novou migraci.')
 const link=`${config.baseUrl}/?admin=etf-sync#admin-access=${token}`
 try{await new SmtpMailer(smtp).sendAdmin(link)}catch(error){logMailFailure('email_delivery_failed',error);throw new HttpError(503,'Přihlašovací e-mail se nepodařilo odeslat. Zkuste to později.')}
 return {sent:true}
}
export async function confirmPreviewAccess(token:unknown){
 const config=previewConfig()
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))throw new HttpError(400,'Neplatný přihlašovací odkaz.')
 const session=randomBytes(32).toString('base64url')
 const {data,error}=await database().rpc('confirm_preview_admin',{p_token:adminHash(token),p_session:adminHash(session),p_origin:config.baseUrl})
 if(error)throw new HttpError(503,'Přihlášení není dostupné.')
 if(!data)throw new HttpError(401,'Odkaz vypršel nebo již byl použit. Vyžádejte nový.')
 return session
}
export async function logoutPreview(req:VercelRequest){
 previewConfig()
 const token=header(req,'cookie').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-etf_preview_admin='))?.split('=')[1]??''
 if(/^[A-Za-z0-9_-]{43}$/.test(token)){
  const {error}=await database().from('preview_admin_access').delete().eq('session_hash',adminHash(token))
  if(error)throw new HttpError(503,'Odhlášení se nepodařilo. Zkuste to znovu.')
 }
}
