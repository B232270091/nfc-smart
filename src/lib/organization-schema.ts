import { messages } from '@/lib/messages/mn';
import { z } from 'zod';
export const organizationIdSchema = z.uuid(messages.libOrganizationSchema.message);
export const organizationSlugSchema = z.string().trim().min(3, messages.libOrganizationSchema.message2).max(80, messages.libOrganizationSchema.message3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, messages.libOrganizationSchema.message4);
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, messages.libOrganizationSchema.message5).max(120, messages.libOrganizationSchema.message6),
  slug: organizationSlugSchema,
});
const optionalUrl = z.string().trim().max(2048, messages.libOrganizationSchema.message7).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; } catch { return false; }
}, messages.libOrganizationSchema.message8);
export const organizationProfileSchema = createOrganizationSchema.extend({
  description: z.string().trim().max(4000, messages.libOrganizationSchema.message9),
  phone: z.string().trim().max(40, messages.libOrganizationSchema.message10),
  email: z.union([z.literal(''), z.email(messages.libOrganizationSchema.message11).max(254)]),
  address: z.string().trim().max(200, messages.libOrganizationSchema.message12),
  maps_url: optionalUrl, facebook_url: optionalUrl, instagram_url: optionalUrl, website_url: optionalUrl,
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, messages.libOrganizationSchema.message13),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, messages.libOrganizationSchema.message14),
});
