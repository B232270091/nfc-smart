import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrganizationSchema, organizationProfileSchema } from '../src/lib/organization-schema';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), set: vi.fn(), maybeSingle: vi.fn(), user: vi.fn(), org: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: mocks.set }) }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }, unstable_rethrow: (error: Error) => { if (error.message.startsWith('NEXT_REDIRECT:')) throw error; } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireUser: mocks.user, requireOrg: mocks.org, canManage: vi.fn() }));
vi.mock('@/lib/storage', () => ({ uploadAsset: vi.fn() }));
import { createOrganization, selectOrganization } from '../src/lib/actions/organizations';
import { updateOrganization } from '../src/lib/actions/content';
const orgId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const form = (input: Record<string, string>) => { const f = new FormData(); Object.entries(input).forEach(([k,v]) => f.set(k,v)); return f; };
const profile = { name:'Миний кафе',slug:'my-cafe',description:'',phone:'',email:'',address:'',maps_url:'',facebook_url:'',instagram_url:'',website_url:'https://example.com',primary_color:'#087f8c',secondary_color:'#0c1930' };
beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue({ user:{id:userId},supabase:{rpc:mocks.rpc,from:mocks.from} }); });
describe('organization input validation', () => {
  it('normalizes names and shares the same slug limits for create/update', () => { expect(createOrganizationSchema.parse({name:'  Кафе  ',slug:'  cafe  '}).name).toBe('Кафе'); expect(createOrganizationSchema.safeParse({name:'Кафе',slug:'a'.repeat(80)}).success).toBe(true); expect(organizationProfileSchema.safeParse(profile).success).toBe(true); });
  it.each(['//other.example','javascript:alert(1)','https://user:password@example.com','invalid'])('rejects unsafe contact URL %s', value => { expect(organizationProfileSchema.safeParse({...profile,website_url:value}).success).toBe(false); });
  it.each(['x','foo--bar','UPPERCASE','a/b','a'.repeat(81)])('rejects invalid slug %s',slug => { expect(createOrganizationSchema.safeParse({name:'Кафе',slug}).success).toBe(false); });
});
describe('organization Server Actions', () => {
  it('uses atomic RPC and never passes caller-supplied ownership', async () => {
    mocks.rpc.mockResolvedValue({data:orgId,error:null});
    await expect(createOrganization({},form({name:'Миний кафе',slug:'my-cafe',owner_id:'attacker',role:'owner'}))).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('create_organization',{p_name:'Миний кафе',p_slug:'my-cafe'});
    expect(mocks.set).toHaveBeenCalledWith('active_org',orgId,expect.objectContaining({httpOnly:true,sameSite:'lax'}));
  });
  it('does not change workspace after a duplicate slug error', async () => { mocks.rpc.mockResolvedValue({data:null,error:{code:'23505'}});const result=await createOrganization({},form({name:'Кафе',slug:'my-cafe'})); expect(result.error).toContain('ашиглагдаж');expect(mocks.set).not.toHaveBeenCalled(); });
  it('rejects malformed input before calling the database', async () => { const result=await createOrganization({},form({name:'x',slug:'bad/slug'}));expect(result.error).toBeTruthy();expect(mocks.rpc).not.toHaveBeenCalled(); });
  it('requires verified membership before changing the workspace cookie', async () => {
    const query={select:vi.fn(),eq:vi.fn(),maybeSingle:mocks.maybeSingle};query.select.mockReturnValue(query);query.eq.mockReturnValue(query);mocks.from.mockReturnValue(query);mocks.maybeSingle.mockResolvedValue({data:null,error:null});
    const result=await selectOrganization({},form({organization_id:orgId}));expect(result.error).toContain('эрхгүй');expect(query.eq).toHaveBeenCalledWith('organization_id',orgId);expect(query.eq).toHaveBeenCalledWith('user_id',userId);expect(mocks.set).not.toHaveBeenCalled();
    mocks.maybeSingle.mockResolvedValue({data:{organization_id:orgId},error:null});await expect(selectOrganization({},form({organization_id:orgId}))).rejects.toThrow('NEXT_REDIRECT:/dashboard');expect(mocks.set).toHaveBeenCalledOnce();
  });
  it('checks owner permission before updating details and scopes the update', async () => {
    const q={update:vi.fn(),eq:vi.fn(),select:vi.fn(),single:vi.fn().mockResolvedValue({data:{id:orgId},error:null})};q.update.mockReturnValue(q);q.eq.mockReturnValue(q);q.select.mockReturnValue(q);mocks.from.mockReturnValue(q);mocks.org.mockResolvedValue({supabase:{from:mocks.from}});
    expect((await updateOrganization({},form({...profile,organization_id:orgId,is_active:'on'}))).success).toBeTruthy();
    expect(mocks.org).toHaveBeenCalledWith(orgId,'owner');expect(q.eq).toHaveBeenCalledWith('id',orgId);expect(q.update).toHaveBeenCalledWith(expect.objectContaining({name:'Миний кафе',is_active:true}));
  });
  it('does not mutate when owner authorization fails', async () => { mocks.org.mockRejectedValue(new Error('Эрх хүрэлцэхгүй.'));expect((await updateOrganization({},form({...profile,organization_id:orgId}))).error).toBeTruthy();expect(mocks.from).not.toHaveBeenCalled(); });
});
