import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Avatares do Google
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // Avatares do GitHub
      },
    ],
  },
};

export default nextConfig;
