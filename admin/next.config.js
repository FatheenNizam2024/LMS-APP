/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com','randomuser.me', '192.168.1.2'],
      },
      experimental:{
        // reactRoot: true,
        // suppressHydrationWarning: true,
      }
}

module.exports = nextConfig
