import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  sassOptions: {
    additionalData: `@use "@/styles/variables" as *;`,
  },
}

export default nextConfig
