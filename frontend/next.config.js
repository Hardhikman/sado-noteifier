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
}

module.exports = nextConfig