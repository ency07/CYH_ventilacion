/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'images.unsplash.com'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 
      canvas: 'canvas',
      canvg: 'canvg',
      html2canvas: 'html2canvas',
      dompurify: 'dompurify'
    }];
    return config;
  },
};

module.exports = nextConfig;
