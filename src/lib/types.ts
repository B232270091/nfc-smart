export type Permission = 'menu' | 'pages' | 'cards' | 'analytics';
export type Membership = { organization_id: string; user_id: string; role: 'owner' | 'staff'; permissions: Permission[] };
export type Organization = { id: string; name: string; slug: string; description: string | null; logo_path: string | null; cover_path: string | null; phone: string | null; email: string | null; address: string | null; maps_url: string | null; facebook_url: string | null; instagram_url: string | null; website_url: string | null; primary_color: string; secondary_color: string; is_active: boolean; created_at: string; updated_at: string };
export type Page = { id: string; organization_id: string; slug: string; title: string; type: 'menu' | 'company' | 'business_card' | 'links'; description: string | null; content: Record<string, unknown>; is_published: boolean };
export type Category = { id: string; organization_id: string; name: string; sort_order: number; is_active: boolean };
export type MenuItem = { id: string; organization_id: string; category_id: string; name_mn: string; name_en: string | null; description: string | null; price_mnt: number; image_path: string | null; is_available: boolean; is_published: boolean; sort_order: number };
export type NfcCard = { id: string; organization_id: string; page_id: string | null; code: string; name: string; is_active: boolean; created_at: string };
