/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'replicate.delivery',
      'pbxt.replicate.delivery',
    ],
  },
};

module.exports = nextConfig;