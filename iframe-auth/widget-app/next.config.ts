import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    const allowedOrigins = process.env.ALLOWED_EMBED_ORIGINS ?? ""

    return [
      {
        // Apply only to /widget routes — this is the iframe content
        // frame-ancestors controls which sites can embed this page in an <iframe>.
        // We do NOT set X-Frame-Options: SAMEORIGIN here — that would block all embedding.
        source: "/widget/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${allowedOrigins}`,
          },
        ],
      },
    ]
  },
}

export default nextConfig
