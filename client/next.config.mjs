/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_SOCKET_SERVER_URL: process.env.VITE_SOCKET_SERVER_URL,
  },
};

export default nextConfig;
