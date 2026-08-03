/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://safra-vv3z.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
