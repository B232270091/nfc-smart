import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadAsset } from '../src/lib/storage';
import { MAX_IMAGE_BYTES } from '../src/lib/upload-limits';

it('rejects oversized files before reading bytes or contacting Storage', async () => {
  const arrayBuffer = vi.fn();
  const from = vi.fn();
  await expect(uploadAsset({ storage: { from } } as unknown as SupabaseClient, 'org', { size: MAX_IMAGE_BYTES + 1, arrayBuffer } as unknown as File)).rejects.toThrow('2 MB');
  expect(arrayBuffer).not.toHaveBeenCalled();
  expect(from).not.toHaveBeenCalled();
});

it('accepts a valid image exactly at the boundary', async () => {
  const bytes = new Uint8Array(MAX_IMAGE_BYTES);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const upload = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({ upload });
  await expect(uploadAsset({ storage: { from } } as unknown as SupabaseClient, 'org', new File([bytes], 'logo.png', { type: 'image/png' }), 'branding')).resolves.toMatch(/^org\/branding\/.*\.png$/);
  expect(upload).toHaveBeenCalledOnce();
});
