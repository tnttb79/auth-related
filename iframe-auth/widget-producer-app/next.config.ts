import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply only to /widget routes — this is the iframe content
        // frame-ancestors controls which sites can embed this page in an <iframe>.
        // We do NOT set X-Frame-Options: SAMEORIGIN here — that would block all embedding.
        // Keep this broad so newly registered customer sites can load the iframe
        // without redeploying; /api/widget-session enforces the per-site DB origin check.
        source: "/widget/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https: http://localhost:*",
          },
        ],
      },
    ]
  },
}

export default nextConfig
