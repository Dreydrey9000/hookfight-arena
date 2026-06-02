import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next walks up and
  // finds a stray package-lock.json in the home dir and guesses wrong.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
