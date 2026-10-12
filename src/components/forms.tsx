'use client';
import { useActionState, useEffect, type InputHTMLAttributes, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionState } from '@/lib/actions/shared';
import { mn } from '@/lib/copy';
export function ActionForm({action,children,submitLabel=mn.save,className,confirmMessage}: {action:(state:ActionState,form:FormData)=>Promise<ActionState>;children:ReactNode;submitLabel?:string;className?:string;confirmMessage?:string}) {
  const [state,formAction,pending] = useActionState(action,{});
  useEffect(()=>{if(state.success)toast.success(state.success);},[state]);
  return <form action={formAction} className={className || 'stack'} onSubmit={e=>{if(confirmMessage&&!window.confirm(confirmMessage))e.preventDefault();}}>
    {children}{state.error&&<p role="alert" className="alert error">{state.error}</p>}{state.success&&<p role="status" className="alert success">{state.success}</p>}
    <Button type="submit" disabled={pending}>{pending?mn.saving:submitLabel}</Button>
  </form>;
}
export function Field({label,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string;name:string}) { return <label className="field"><span>{label}</span><Input {...props}/></label>; }
