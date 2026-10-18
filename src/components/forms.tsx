'use client';
import { useActionState, useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionState } from '@/lib/actions/shared';
import { mn } from '@/lib/copy';
import { interfaceCopy as c } from '@/lib/interface-copy';
import { MAX_IMAGE_BYTES } from '@/lib/upload-limits';
import { messages } from '@/lib/messages/mn';
export function ActionForm({action,children,submitLabel=mn.save,className,confirmMessage}: {action:(state:ActionState,form:FormData)=>Promise<ActionState>;children:ReactNode;submitLabel?:string;className?:string;confirmMessage?:string}) {
  const [state,formAction,pending] = useActionState(action,{});
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(()=>{if(state.success)toast.success(state.success);},[state]);
  return <form ref={form} action={formAction} className={className || 'stack'} onSubmit={e=>{
    if (confirmMessage && !confirmed.current) { e.preventDefault(); dialog.current?.showModal(); }
    confirmed.current = false;
  }}>
    {children}{state.error&&<p role="alert" className="alert error">{state.error}</p>}{state.success&&<p role="status" className="alert success">{state.success}</p>}
    <Button type="submit" disabled={pending}>{pending?mn.saving:submitLabel}</Button>
    {confirmMessage && <dialog ref={dialog} className="form-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <h2 id={titleId}>{c.confirmTitle}</h2><p id={descriptionId} className="muted">{confirmMessage}</p>
      <div className="actions"><button type="button" className="button button-secondary" autoFocus onClick={() => dialog.current?.close()}>{c.cancel}</button>
        <button type="button" className="button button-danger" onClick={() => { confirmed.current = true; dialog.current?.close(); form.current?.requestSubmit(); }}>{c.confirm}</button></div>
    </dialog>}
  </form>;
}
export function Field({label,onChange,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string;name:string}) {
  return <label className="field"><span>{label}</span><Input {...props} onChange={event => {
    if (props.type === 'file') {
      const files = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.setCustomValidity(files.some(file => file.size === 0 || file.size > MAX_IMAGE_BYTES) ? messages.libStorage.message : '');
      event.currentTarget.reportValidity();
    }
    onChange?.(event);
  }}/></label>;
}
