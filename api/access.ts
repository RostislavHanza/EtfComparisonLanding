import { body, guard, handler, ip, runtime, sessionCookie } from '../server/http.ts'
export default handler(async(req,res)=>{guard(req,['POST']);const {id,session}=await runtime().app.access(body(req),ip(req));res.setHeader('Set-Cookie',sessionCookie(session));return{id}})
