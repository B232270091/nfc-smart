import { contentText, getPublicPage, safeEmail, safePhone } from "@/components/marketing/public-data";
import { safeWebUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

// Fold at 75 UTF-8 bytes without splitting multibyte Mongolian characters.
function foldLine(line: string) {
  const chunks: string[] = [];
  let chunk = "";
  let length = 0;
  for (const character of line) {
    const bytes = Buffer.byteLength(character, "utf8");
    if (length + bytes > 75) { chunks.push(chunk); chunk = " "; length = 1; }
    chunk += character;
    length += bytes;
  }
  chunks.push(chunk);
  return chunks.join("\r\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicPage(slug);
  const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
  if (!data || data.page.type !== "business_card") return new Response("Контакт олдсонгүй.", { status: 404, headers });
  const name = contentText(data.page.content, "person_name") || data.page.title;
  const position = contentText(data.page.content, "position");
  const phone = contentText(data.page.content, "phone") || data.organization.phone || "";
  const email = contentText(data.page.content, "email") || data.organization.email || "";
  const website = safeWebUrl(data.organization.website_url);
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCard(name)}`, `N:;${escapeVCard(name)};;;`, `ORG:${escapeVCard(data.organization.name)}`];
  if (position) lines.push(`TITLE:${escapeVCard(position)}`);
  if (safePhone(phone)) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(phone)}`);
  if (safeEmail(email)) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCard(email)}`);
  if (website) lines.push(`URL:${escapeVCard(website)}`);
  if (data.organization.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(data.organization.address)};;;;`);
  lines.push("END:VCARD");
  return new Response(`${lines.map(foldLine).join("\r\n")}\r\n`, { headers: { ...headers, "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": 'attachment; filename="contact.vcf"' } });
}
