import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/shared", "@repo/ui"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  // Webpack (e.g. `next dev --webpack` / `next build --webpack`): ensures CSS rules
  // stay wired to MiniCssExtractPlugin. See https://github.com/shadcn-ui/ui/issues/4706
  webpack: (config) => config,
};

export default nextConfig;
