'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { withAction,type ActionState } from './shared';
export async function createOrganization(_:ActionState,form:FormData):Promise<ActionState>{return withAction(async()=>{const {name,slug}=z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Хаяг зөвхөн жижиг латин үсэг, тоо, зураастай байна.').min(3).max(60)}).parse(Object.fromEntries(form));const {supabase}=await requireUser();const {data,error}=await supabase.rpc('create_organization',{p_name:name,p_slug:slug});if(error)throw new Error('Байгууллага үүсгэж чадсангүй. Хаягийн нэр давхардсан эсэхийг шалгана уу.');(await cookies()).set('active_org',data,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});redirect('/dashboard');});}
export async function selectOrganization(form:FormData){const orgId=z.uuid().parse(form.get('organization_id'));const {supabase,user}=await requireUser();const {data}=await supabase.from('organization_members').select('organization_id').eq('organization_id',orgId).eq('user_id',user.id).maybeSingle();if(!data)throw new Error('Хандах эрх хүрэлцэхгүй.');(await cookies()).set('active_org',orgId,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});redirect('/dashboard');}
