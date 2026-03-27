/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Electron production packaging
  // Creates .next/standalone with a self-contained server + minimal node_modules
  output: process.env.ELECTRON_BUILD === '1' ? 'standalone' : undefined,

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('html2canvas', 'jspdf')
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
}

module.exports = nextConfig
