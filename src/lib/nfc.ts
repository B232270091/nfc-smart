import { randomBytes,createHmac } from 'node:crypto';
export const cardCodePattern=/^[a-f0-9]{24}$/;
export function generateCardCode(){return randomBytes(12).toString('hex');}
export function cardUrl(origin:string,code:string,source?:'qr') {if(!cardCodePattern.test(code))throw new Error('Invalid card code');const url=new URL(`/t/${code}`,origin);if(source)url.searchParams.set('src',source);return url.href;}
export function eligibleUserAgent(ua:string|null){return !!ua&&!/bot|crawl|spider|preview|facebookexternalhit|headless|slurp|pingdom|uptime/i.test(ua);}
export function eligibleScanRequest(method: string, headers: Headers) {
  if (method !== 'GET' || !eligibleUserAgent(headers.get('user-agent'))) return false;
  return !headers.has('next-router-prefetch') && !headers.has('x-moz') &&
    !/prefetch|prerender/i.test(`${headers.get('purpose') ?? ''} ${headers.get('sec-purpose') ?? ''}`);
}
export function scanFingerprint(ip:string,code:string,secret:string,day=new Date().toISOString().slice(0,10)){return createHmac('sha256',secret).update(`${day}|${code}|${ip}`).digest('hex');}
