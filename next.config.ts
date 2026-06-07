import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allow LAN access (192.168.x) and Cloudflare quick tunnels (deploy2.sh).
  // the tunnel subdomain is random each run, so allow the whole domain.
  allowedDevOrigins: ["192.168.56.1", "*.trycloudflare.com"],
};

export default nextConfig;
