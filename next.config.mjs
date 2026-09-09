/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: false,
  allowedDevOrigins: ['192.168.18.7'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig