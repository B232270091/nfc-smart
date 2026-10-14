import { messages } from '@/lib/messages/mn';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { unstable_rethrow } from 'next/navigation';
export type ActionState = { error?: string; success?: string };
export async function withAction(fn: () => Promise<unknown>): Promise<ActionState> {
  try { const result = await fn(); return result && typeof result === 'object' && 'success' in result ? result as ActionState : { success: messages.libActionsShared.success }; }
  catch (error) {
    unstable_rethrow(error);
    if (error instanceof ZodError) return { error: error.issues[0]?.message || messages.libActionsShared.message };
    if (error instanceof Error) return { error: error.message };
    return { error: messages.libActionsShared.error };
  }
}
export function revalidateOrg() { revalidatePath('/dashboard', 'layout'); revalidatePath('/p', 'layout'); }
