'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireOrg } from '@/lib/auth';
import { withAction,type ActionState } from './shared';
import { nfcCopy as c } from '@/lib/nfc-copy';
const schema=z.object({organization_id:z.uuid(),id:z.union([z.uuid(),z.literal('')]),name:z.string().trim().min(1).max(120),page_id:z.uuid()});
export async function saveCard(_:ActionState,form:FormData):Promise<ActionState>{return withAction(async()=>{const input=schema.parse({organization_id:form.get('organization_id'),id:form.get('id')||'',name:form.get('name'),page_id:form.get('page_id')});const {supabase}=await requireOrg(input.organization_id,'cards');const {data:page,error:pageError}=await supabase.from('pages').select('id').eq('id',input.page_id).eq('organization_id',input.organization_id).single();if(pageError||!page)throw new Error(c.failure);const values={name:input.name,page_id:input.page_id,is_active:form.get('is_active')==='on'};const query=input.id?supabase.from('nfc_cards').update(values).eq('id',input.id).eq('organization_id',input.organization_id):supabase.from('nfc_cards').insert({...values,organization_id:input.organization_id});const {data,error}=await query.select('id').single();if(error||!data)throw new Error(c.failure);revalidatePath('/dashboard/nfc-cards');});}
