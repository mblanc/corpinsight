/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: 5 * 1024 * 1024,  // Changed from maxRequestBodySize to bodySizeLimit
      },
    },
    output: "standalone",
  };
  
export default nextConfig;