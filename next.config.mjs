/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,  // Keep if using CSS optimization
    // Remove optimizeFonts if present
  },
  // Other configs...
};

export default nextConfig;
