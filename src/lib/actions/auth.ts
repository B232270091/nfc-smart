'use server';
import { messages } from '@/lib/messages/mn';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { hasSupabase, appUrl } from '@/lib/env';
import { requireUser } from '@/lib/auth';
import { withAction, type ActionState } from './shared';
const credentials = z.object({email:z.email(messages.libActionsAuth.message),password:z.string().min(8,messages.libActionsAuth.message2).max(128)});
export async function login(_:ActionState,form:FormData):Promise<ActionState> {
  if(!hasSupabase())return {error:messages.libActionsAuth.error};
  return withAction(async()=>{const input=credentials.parse(Object.fromEntries(form)); const client=await createClient();const {error}=await client.auth.signInWithPassword(input);if(error)throw new Error(messages.libActionsAuth.message3);redirect('/dashboard');});
}
export async function register(_:ActionState,form:FormData):Promise<ActionState> {
  if(!hasSupabase())return {error:messages.libActionsAuth.error2};
  try {const input=credentials.parse(Object.fromEntries(form)); const client=await createClient();const {data,error}=await client.auth.signUp({...input,options:{emailRedirectTo:`${appUrl()}/auth/callback`}}); if(error)return {error:messages.libActionsAuth.error3};if(data.session)redirect('/dashboard/organizations');return {success:messages.libActionsAuth.success};}catch(error){return withAction(async()=>{throw error;});}
}
export async function logout(){const client=await createClient();await client.auth.signOut();(await cookies()).delete('active_org');redirect('/login');}
export async function requestPasswordReset(_:ActionState,form:FormData):Promise<ActionState>{
  const parsed=z.email().safeParse(form.get('email'));if(!parsed.success)return {error:messages.libActionsAuth.error4};if(!hasSupabase())return {error:messages.libActionsAuth.error5};
  const client=await createClient();await client.auth.resetPasswordForEmail(parsed.data,{redirectTo:`${appUrl()}/auth/callback?next=/reset-password`});return {success:messages.libActionsAuth.success2};
}
export async function updatePassword(_:ActionState,form:FormData):Promise<ActionState>{return withAction(async()=>{const password=z.string().min(8).max(128).parse(form.get('password'));const {supabase}=await requireUser();const {error}=await supabase.auth.updateUser({password});if(error)throw new Error(messages.libActionsAuth.message4);redirect('/dashboard');});}
