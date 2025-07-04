/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle pdf-parse and its dependencies on the server side
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
        'pdf-parse': 'pdf-parse',
      });
    }

    return config;
  },
  // Ignore build-time warnings for optional dependencies
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'canvas'],
  },
};

module.exports = nextConfig;
