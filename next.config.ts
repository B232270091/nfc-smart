import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  distDir: process.env.NFC_E2E_SERVER === '1' ? '.next-e2e' : '.next',
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default nextConfig;
