import { body, cookie, guard, handler, ip, runtime, sessionCookie } from '../server/http.js'
export default handler(async(req,res)=>{guard(req,['POST']);const {id,session}=await runtime().app.access(body(req),ip(req),cookie(req));res.setHeader('Set-Cookie',sessionCookie(session));return{id}})
