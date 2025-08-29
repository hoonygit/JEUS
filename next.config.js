/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // React의 엄격 모드를 활성화하여 잠재적인 문제를 감지합니다.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;