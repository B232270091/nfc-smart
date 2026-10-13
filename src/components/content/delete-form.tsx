"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions/shared";
import { contentCopy as c } from "@/lib/content-copy";

export function DeleteForm({ action, organizationId, id, confirmation = c.deleteConfirm }: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  organizationId: string;
  id: string;
  confirmation?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} onSubmit={(event) => {
    if (!window.confirm(confirmation)) event.preventDefault();
  }} className="stack">
    <input type="hidden" name="organization_id" value={organizationId} />
    <input type="hidden" name="id" value={id} />
    <button className="button button-secondary" type="submit" disabled={pending}>{pending ? c.saving : c.delete}</button>
    {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-emerald-600">{state.success}</p>}
  </form>;
}
