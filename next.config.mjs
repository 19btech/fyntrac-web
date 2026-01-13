/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,  // Keep if using CSS optimization
    // Remove optimizeFonts if present
  },
  reactStrictMode: false,
  // Other configs...
};

export default nextConfig;
