import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  turbopack: {
    root: process.cwd()
  }
}

export default nextConfig
