import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.31.19:3000',
    '192.168.31.19',
    'localhost',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_SOCKET_SERVER_URL: process.env.VITE_SOCKET_SERVER_URL,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'encrypted-media=(self "https://w.soundcloud.com" "https://soundcloud.com" "https://www.youtube.com" "https://player.vimeo.com"), autoplay=*',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
