/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    // Use environment variable for backend port (staging: 4001, prod: 4000)
    const backendPort = process.env.BACKEND_PORT || '4000';
    return [
      {
        // Proxy all API routes to backend (includes OTP, auth sessions, etc.)
        source: '/api/:path*',
        destination: `http://localhost:${backendPort}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
