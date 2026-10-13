import { z } from 'zod';
export const organizationIdSchema = z.uuid('Байгууллагын дугаар буруу байна.');
export const organizationSlugSchema = z.string().trim().min(3, 'Хаягийн нэр 3-аас доошгүй тэмдэгттэй байна.').max(80, 'Хаягийн нэр 80 хүртэл тэмдэгттэй байна.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Жижиг латин үсэг, тоо, дунд зураас ашиглана уу.');
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Байгууллагын нэр 2-оос доошгүй тэмдэгттэй байна.').max(120, 'Байгууллагын нэр 120 хүртэл тэмдэгттэй байна.'),
  slug: organizationSlugSchema,
});
const optionalUrl = z.string().trim().max(2048, 'Холбоос хэт урт байна.').refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; } catch { return false; }
}, 'Нэвтрэх мэдээлэл агуулаагүй https:// холбоос оруулна уу.');
export const organizationProfileSchema = createOrganizationSchema.extend({
  description: z.string().trim().max(4000, 'Тайлбар 4000 хүртэл тэмдэгттэй байна.'),
  phone: z.string().trim().max(40, 'Утасны дугаар хэт урт байна.'),
  email: z.union([z.literal(''), z.email('И-мэйл хаягаа шалгана уу.').max(254)]),
  address: z.string().trim().max(200, 'Хаяг 200 хүртэл тэмдэгттэй байна.'),
  maps_url: optionalUrl, facebook_url: optionalUrl, instagram_url: optionalUrl, website_url: optionalUrl,
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Өнгөний код буруу байна.'),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Өнгөний код буруу байна.'),
});
