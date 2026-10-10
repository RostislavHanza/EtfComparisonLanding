import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'
import { header } from './http.ts'
import { HttpError } from './application.ts'
export function requireAdmin(req:VercelRequest){
 const secret=process.env.CRON_SECRET
 if(!secret||secret.length<32)throw new HttpError(503,'Administrátorský přístup není nakonfigurovaný.')
 const expected=Buffer.from(`Bearer ${secret}`),received=Buffer.from(header(req,'authorization'))
 if(received.length!==expected.length||!timingSafeEqual(received,expected))throw new HttpError(401,'Neplatné oprávnění.')
}
