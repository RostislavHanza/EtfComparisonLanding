import { guard,handler } from '../server/http.js'
import { performanceCatalog } from '../server/performance.js'
export default handler(async(req,res)=>{
 guard(req,['GET'],false)
 const data=await performanceCatalog()
 res.setHeader('Cache-Control',`public, max-age=300, s-maxage=${data.unavailable.length?300:86400}`)
 return data
})
