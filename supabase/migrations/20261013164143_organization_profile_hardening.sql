-- Additive Phase 2 hardening. Existing Auth tables, sessions and users are untouched.
-- NOT VALID keeps existing rows intact; constraints still protect new/updated rows.
-- See docs/phase-2-organizations.md before validating historical rows.
alter table public.organizations
  add constraint organizations_profile_lengths check (
    char_length(phone) <= 40 and char_length(email) <= 254 and char_length(address) <= 200
    and char_length(maps_url) <= 2048 and char_length(facebook_url) <= 2048
    and char_length(instagram_url) <= 2048 and char_length(website_url) <= 2048
  ) not valid;

alter table public.organizations
  add constraint organizations_canonical_slug check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid;

alter table public.organizations
  add constraint organizations_nonblank_name check (char_length(btrim(name)) >= 2) not valid;

-- Credentials in URLs must never become publicly rendered contact links.
alter table public.organizations
  add constraint organizations_contact_urls check (
    (maps_url = '' or maps_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
    and (facebook_url = '' or facebook_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
    and (instagram_url = '' or instagram_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
    and (website_url = '' or website_url ~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$')
  ) not valid;

comment on table public.organizations is 'Tenant workspace. Creation and initial owner membership are one transaction via create_organization.';
comment on table public.organization_members is 'Explicit tenant memberships. Only checked owner RPCs can change roles; the final owner cannot be removed.';
