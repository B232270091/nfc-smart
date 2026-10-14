"use client";

import { ActionForm } from "@/components/forms";
import type { ActionState } from "@/lib/actions/shared";
import { contentCopy as c } from "@/lib/content-copy";

export function DeleteForm({ action, organizationId, id, confirmation = c.deleteConfirm }: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  organizationId: string;
  id: string;
  confirmation?: string;
}) {
  return <ActionForm action={action} confirmMessage={confirmation} submitLabel={c.delete}>
    <input type="hidden" name="organization_id" value={organizationId} />
    <input type="hidden" name="id" value={id} />
  </ActionForm>;
}
