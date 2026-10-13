import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({cookie:vi.fn(),from:vi.fn(),getUser:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/headers',()=>({cookies:async()=>({get:mocks.cookie})}));
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw new Error(`redirect:${path}`);}}));
vi.mock('@/lib/env',()=>({hasSupabase:()=>true}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:mocks.from,auth:{getUser:mocks.getUser}})}));
import { requireOrg } from '../src/lib/auth';
const own='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222', user='33333333-3333-4333-8333-333333333333';
function query(data:unknown){const q={select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data,error:null}),single:vi.fn().mockResolvedValue({data,error:null})};q.select.mockReturnValue(q);q.eq.mockReturnValue(q);q.order.mockReturnValue(q);q.limit.mockReturnValue(q);return q;}
const membership={organization_id:own,user_id:user,role:'owner',permissions:[]};
beforeEach(()=>{vi.resetAllMocks();mocks.getUser.mockResolvedValue({data:{user:{id:user}},error:null});});
describe('organization access with the existing authentication client',()=>{
  it('uses verified user identity to reject an explicit foreign organization',async()=>{const q=query(null);mocks.from.mockReturnValue(q);await expect(requireOrg(other,'owner')).rejects.toThrow('эрх');expect(q.eq).toHaveBeenCalledWith('user_id',user);expect(q.eq).toHaveBeenCalledWith('organization_id',other);expect(mocks.from).toHaveBeenCalledExactlyOnceWith('organization_members');});
  it('rejects staff before reading owner-only details',async()=>{mocks.from.mockReturnValue(query({...membership,role:'staff',permissions:['menu']}));await expect(requireOrg(own,'owner')).rejects.toThrow('эрх');expect(mocks.from).toHaveBeenCalledTimes(1);});
  it('recovers from a removed workspace cookie only to another authorized membership',async()=>{mocks.cookie.mockReturnValue({value:other});const missing=query(null),fallback=query(membership),org=query({id:own,name:'Кафе'});mocks.from.mockReturnValueOnce(missing).mockReturnValueOnce(fallback).mockReturnValueOnce(org);expect((await requireOrg()).organization.id).toBe(own);expect(fallback.eq).toHaveBeenCalledWith('user_id',user);expect(org.eq).toHaveBeenCalledWith('id',own);});
  it('rejects invalid explicit UUID before database query',async()=>{await expect(requireOrg('not-a-uuid')).rejects.toThrow('дугаар');expect(mocks.from).not.toHaveBeenCalled();});
  it('retains the existing protected-route behavior for expired sessions',async()=>{mocks.getUser.mockResolvedValue({data:{user:null},error:null});await expect(requireOrg(own)).rejects.toThrow('redirect:/login');expect(mocks.from).not.toHaveBeenCalled();});
});
