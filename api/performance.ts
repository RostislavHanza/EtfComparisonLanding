import { cookie,guard,handler,runtime } from '../server/http.js'
import { performanceCatalog } from '../server/performance.js'
export default handler(async(req,res)=>{
 guard(req,['GET'],false)
 await runtime().app.read(req.query.comparison,cookie(req))
 const data=await performanceCatalog()
 res.setHeader('Cache-Control','private, no-store')
 return data
})
