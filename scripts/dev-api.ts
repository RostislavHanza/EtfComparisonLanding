// Minimal local adapter for the same Vercel handlers; no replacement database or mail service.
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
if(existsSync('.env.local'))process.loadEnvFile('.env.local')
const routes = {
 '/api/catalog':(await import('../api/catalog.ts')).default,
 '/api/comparisons':(await import('../api/comparisons.ts')).default,
 '/api/comparison':(await import('../api/comparison.ts')).default,
 '/api/access':(await import('../api/access.ts')).default,
 '/api/events':(await import('../api/events.ts')).default,
 '/api/mail-health':(await import('../api/mail-health.ts')).default,
 '/api/etf-sync':(await import('../api/etf-sync.ts')).default,
 '/api/maintenance':(await import('../api/maintenance.ts')).default,
}
createServer(async (incoming,outgoing) => {
 const url = new URL(incoming.url??'/','http://localhost:3001')
 const route = routes[url.pathname as keyof typeof routes]
 if(!route){outgoing.writeHead(404);outgoing.end();return}
 const req=incoming as VercelRequest, res=outgoing as VercelResponse
 req.query=Object.fromEntries(url.searchParams)
 res.status=function(code:number){this.statusCode=code;return this}
 res.json=function(value:unknown){this.setHeader('Content-Type','application/json');this.end(JSON.stringify(value));return this}
 {
  const chunks:Buffer[]=[];let size=0;for await(const chunk of incoming){size+=chunk.length;if(size>8192){res.status(413).json({error:'Požadavek je příliš velký.'});return}chunks.push(chunk)}
  req.body=Buffer.concat(chunks).toString('utf8')||undefined
 }
 await route(req,res)
}).listen(3001,'127.0.0.1',()=>console.log('Local Vercel handler adapter listening on port 3001.'))
