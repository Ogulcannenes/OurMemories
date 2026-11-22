import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is private and per-user (session cookie), so there is no static shell to
  // prerender: Cache Components / Partial Prefetching are left off (still opt-in in Next 16).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
