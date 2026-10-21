import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**": ["./prompts/**/*.txt"],
  },
};

export default nextConfig;
