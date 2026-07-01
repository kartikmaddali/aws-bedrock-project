import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/client-metadata.json",
        destination: "/api/cimd",
      },
      {
        source: "/.well-known/agents/:slug/metadata.json",
        destination: "/api/cimd-agent/:slug",
      },
    ]
  },
}

export default nextConfig
