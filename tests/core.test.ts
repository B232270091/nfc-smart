import { describe,it,expect } from 'vitest';
import { generateCardCode,cardCodePattern,cardUrl,eligibleUserAgent,scanFingerprint } from '../src/lib/nfc';
import { safeRedirect,safeWebUrl,formatMnt } from '../src/lib/utils';
import { canManage } from '../src/lib/permissions';
import { imageType } from '../src/lib/storage';
describe('permanent card links',()=>{
  it('generates unique 96-bit nonsequential identifiers',()=>{const codes=Array.from({length:1000},generateCardCode);expect(new Set(codes).size).toBe(1000);expect(codes.every(v=>cardCodePattern.test(v))).toBe(true);});
  it('keeps source attribution separate from permanent code',()=>{const code=generateCardCode();expect(cardUrl('https://nfc.example',code)).toBe(`https://nfc.example/t/${code}`);expect(cardUrl('https://nfc.example',code,'qr')).toBe(`https://nfc.example/t/${code}?src=qr`);expect(()=>cardUrl('https://nfc.example','../redirect')).toThrow();});
  it('filters bots, not normal browser user agents',()=>{expect(eligibleUserAgent('Mozilla/5.0 Chrome/140.0')).toBe(true);for(const ua of ['Googlebot','facebookexternalhit',null,'HeadlessChrome'])expect(eligibleUserAgent(ua)).toBe(false);});
  it('rotates keyed fingerprints daily and per card without raw IP',()=>{const a=scanFingerprint('192.0.2.1','one','secret','2026-10-12');expect(a).toMatch(/^[a-f0-9]{64}$/);expect(a).not.toContain('192.0.2.1');expect(a).not.toBe(scanFingerprint('192.0.2.1','two','secret','2026-10-12'));expect(a).not.toBe(scanFingerprint('192.0.2.1','one','secret','2026-10-13'));});
});
describe('untrusted input',()=>{
  it('blocks external redirect tricks',()=>{for(const v of ['//evil.example','/\\evil.example','https://evil.example','/\nevil.example'])expect(safeRedirect(v)).toBe('/dashboard');expect(safeRedirect('/reset-password?next=ok')).toBe('/reset-password?next=ok');});
  it('limits external links to web URLs without embedded credentials',()=>{for(const v of ['javascript:alert(1)','data:text/html,ok','https://u:p@example.com','garbage'])expect(safeWebUrl(v)).toBeNull();expect(safeWebUrl('https://example.com')).toBe('https://example.com/');});
  it('uses integer MNT amounts with no floating point calculations',()=>{expect(formatMnt(12500)).toContain('12,500');expect(formatMnt('1000000000000')).toContain('1,000,000,000,000');expect(()=>formatMnt(1.5)).toThrow();});
  it('recognizes file content rather than file extension',()=>{expect(imageType(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]))).toBe('png');expect(imageType(new TextEncoder().encode('<svg onload="alert(1)"></svg>'))).toBeNull();});
});
describe('permissions',()=>{
  const staff={organization_id:'a',user_id:'u',role:'staff' as const,permissions:['menu' as const]};
  it('never grants staff ownership or unassigned resources',()=>{expect(canManage(staff,'owner')).toBe(false);expect(canManage(staff,'cards')).toBe(false);expect(canManage(staff,'menu')).toBe(true);});
  it('allows owners to manage organization resources',()=>{expect(canManage({...staff,role:'owner'},'owner')).toBe(true);expect(canManage({...staff,role:'owner'},'analytics')).toBe(true);});
});
