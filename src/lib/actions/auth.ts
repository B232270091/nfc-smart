'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { hasSupabase, appUrl } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { withAction, type ActionState } from './shared';
const credentials = z.object({email:z.email('И-мэйл хаягаа зөв оруулна уу.'),password:z.string().min(8,'Нууц үг 8-аас дээш тэмдэгт байна.').max(128)});
export async function login(_:ActionState,form:FormData):Promise<ActionState> {
  if(!hasSupabase())return {error:'Supabase тохиргоо хийгдээгүй байна.'};
  return withAction(async()=>{const input=credentials.parse(Object.fromEntries(form)); const client=await createClient();const {error}=await client.auth.signInWithPassword(input);if(error)throw new Error('И-мэйл эсвэл нууц үг буруу байна.');redirect('/dashboard');});
}
export async function register(_:ActionState,form:FormData):Promise<ActionState> {
  if(!hasSupabase())return {error:'Supabase тохиргоо хийгдээгүй байна.'};
  try {const input=credentials.parse(Object.fromEntries(form)); const client=await createClient();const {data,error}=await client.auth.signUp({...input,options:{emailRedirectTo:`${appUrl()}/auth/callback`}}); if(error)return {error:'Бүртгэл үүсгэж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу.'};if(data.session)redirect('/dashboard/organizations');return {success:'И-мэйл рүү илгээсэн холбоосоор бүртгэлээ баталгаажуулаарай.'};}catch(error){return withAction(async()=>{throw error;});}
}
export async function logout(){const client=await createClient();await client.auth.signOut();(await cookies()).delete('active_org');redirect('/login');}
export async function requestPasswordReset(_:ActionState,form:FormData):Promise<ActionState>{
  const parsed=z.email().safeParse(form.get('email'));if(!parsed.success)return {error:'И-мэйл хаягаа зөв оруулна уу.'};if(!hasSupabase())return {error:'Supabase тохиргоо шаардлагатай.'};
  const client=await createClient();await client.auth.resetPasswordForEmail(parsed.data,{redirectTo:`${appUrl()}/auth/callback?next=/reset-password`});return {success:'Хэрэв бүртгэлтэй хаяг бол сэргээх холбоос илгээгдэнэ.'};
}
export async function updatePassword(_:ActionState,form:FormData):Promise<ActionState>{return withAction(async()=>{const password=z.string().min(8).max(128).parse(form.get('password'));const {supabase}=await requireUser();const {error}=await supabase.auth.updateUser({password});if(error)throw new Error('Нууц үг шинэчилж чадсангүй. Шинэ сэргээх холбоос авна уу.');redirect('/dashboard');});}
