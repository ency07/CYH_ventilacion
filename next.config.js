/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
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
