import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" menghasilkan server mandiri tanpa node_modules penuh,
  // sehingga citra Docker hanya membawa yang benar-benar dipakai.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
