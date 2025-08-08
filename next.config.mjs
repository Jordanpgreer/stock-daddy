
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['@prisma/client', 'pg'] }
};
export default nextConfig;
