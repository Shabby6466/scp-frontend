import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/shared", "@repo/ui"],
  turbopack: {
    root: "../../",
  },
};

export default nextConfig;
