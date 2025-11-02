/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        // Proxy all API routes to backend EXCEPT /api/auth (handled by NextAuth)
        source: '/api/((?!auth).*)',
        destination: 'http://localhost:4000/api/$1',
      },
    ];
  },
};

module.exports = nextConfig; 