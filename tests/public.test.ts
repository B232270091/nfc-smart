import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), hasSupabase: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));
vi.mock("@/lib/env", () => ({ hasSupabase: mocks.hasSupabase }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc }) }));

import { brandColor, contentText, contrastText, getPublicPage, publicLinks, safeEmail, safePhone } from "@/components/marketing/public-data";
import { GET } from "@/app/api/contact-card/[slug]/route";

const publicCard = {
  organization: { name: "Нээлттэй компани", phone: "+976 99112233", email: "contact@example.com", address: "Улаанбаатар; төв", website_url: "https://example.com" },
  page: { type: "business_card", title: "Нэрийн хуудас", content: { person_name: "Бат Эрдэнэ", position: "Менежер" } },
  categories: [], items: [],
};

beforeEach(() => {
  mocks.rpc.mockReset();
  mocks.hasSupabase.mockReturnValue(true);
});

describe("published public data boundary", () => {
  it("uses the publication-filtered RPC instead of querying private tables", async () => {
    mocks.rpc.mockResolvedValue({ data: publicCard, error: null });
    expect(await getPublicPage("business-card")).toEqual(publicCard);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("get_public_page", { p_slug: "business-card" });
  });

  it("does not fabricate a public page when missing or unconfigured", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    expect(await getPublicPage("draft-page")).toBeNull();
    mocks.rpc.mockClear();
    mocks.hasSupabase.mockReturnValue(false);
    expect(await getPublicPage("business-card")).toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(["../private", "javascript:alert(1)", "a".repeat(81), "a--b"])("rejects invalid slug %s before database access", async (slug) => {
    expect(await getPublicPage(slug)).toBeNull();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("reports database failure without returning a fabricated empty page", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "secret database details" } });
    await expect(getPublicPage("business-card")).rejects.toThrow("Нийтэлсэн хуудсыг ачаалж чадсангүй.");
  });

  it("drops malformed and executable links while keeping valid public links", () => {
    expect(publicLinks({ links: [null, {}, { label: "Wrong", url: "javascript:alert(1)" }, { label: "Inline", url: "data:text/html,bad" }, { label: "Credential", url: "https://user:pass@example.com" }, { label: " ", url: "https://example.com" }, { label: "Сайт", url: "https://example.com/about" }] })).toEqual([{ label: "Сайт", url: "https://example.com/about" }]);
    expect(contentText({ person_name: { unexpected: true } }, "person_name")).toBe("");
  });

  it("validates public contact schemes and brand CSS values", () => {
    expect(safePhone("+976 9911-2233")).toBe("tel:+97699112233");
    expect(safePhone("javascript:1234")).toBeNull();
    expect(safeEmail("user@example.com\nBCC:bad@example.com")).toBeNull();
    expect(safeEmail("user@example.com")).toBe("mailto:user@example.com");
    expect(brandColor("red;background:url(bad)", "#164f76")).toBe("#164f76");
    expect(contrastText("#ffffff")).toBe("#10212d");
    expect(contrastText("#000000")).toBe("#ffffff");
  });
});

describe("downloadable public contact", () => {
  it.each([null, { ...publicCard, page: { ...publicCard.page, type: "company" } }])("does not download private/missing pages or non-card pages", async (data) => {
    mocks.rpc.mockResolvedValue({ data, error: null });
    const response = await GET(new Request("https://example.com/api/contact-card/person"), { params: Promise.resolve({ slug: "person" }) });
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns UTF-8 vCard with escaped delimiters and no executable extra fields", async () => {
    const name = "Өлзийтөгс ".repeat(18) + ";,\\\r\nURL:javascript:bad";
    mocks.rpc.mockResolvedValue({ data: { ...publicCard, page: { ...publicCard.page, content: { person_name: name, position: "Удирдагч", internal_note: "DO NOT EXPOSE" } } }, error: null });
    const response = await GET(new Request("https://example.com/api/contact-card/person"), { params: Promise.resolve({ slug: "person" }) });
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/vcard; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="contact.vcf"');
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(text).toContain("BEGIN:VCARD\r\nVERSION:3.0\r\n");
    expect(text).toContain("ORG:Нээлттэй компани");
    expect(text).toContain("TEL;TYPE=WORK,VOICE:+976 99112233");
    expect(text).not.toContain("\r\nURL:javascript");
    expect(text).not.toContain("DO NOT EXPOSE");
    expect(text.replace(/\r\n /g, "")).toContain("\\;\\,\\\\\\nURL:javascript:bad");
    for (const line of text.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    expect(text).not.toContain("�");
  });
});
