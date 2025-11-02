/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove trailing slash from URLs
  trailingSlash: false,
  // Ensure static files are served correctly
  output: 'standalone',
  // Disable x-powered-by header
  poweredByHeader: false,
  // Optimize fonts
  optimizeFonts: true,
  // Configure image optimization
  images: {
    unoptimized: true, // Disable image optimization if there are issues
  },
}

module.exports = nextConfig