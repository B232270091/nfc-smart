'use client';

import { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { interfaceCopy as c } from '@/lib/interface-copy';

export function FormDialog({ title, children }: { title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button type="button" className="button" onClick={() => dialog.current?.showModal()}>{title}</button>
    <dialog ref={dialog} className="form-dialog" aria-labelledby={titleId}>
      <div className="page-header"><h2 id={titleId}>{title}</h2><button type="button" className="button button-secondary button-icon" aria-label={c.close} onClick={() => dialog.current?.close()}><X size={18} /></button></div>
      {children}
    </dialog>
  </>;
}
