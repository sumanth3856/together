/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: process.env.VITE_SOCKET_SERVER_URL 
          ? `${process.env.VITE_SOCKET_SERVER_URL}/socket.io/:path*` 
          : 'http://localhost:4000/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
