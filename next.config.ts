import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  // cPanel/Apache has no rewrite rules to map /collections -> collections.html, and a
  // same-named directory of RSC payloads shadows the .html file. Emitting
  // collections/index.html instead makes every route resolve with zero server config.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Lets the dev server serve JS chunks/HMR to phones on the LAN — Next.js
  // blocks cross-origin dev asset requests by default, which otherwise makes
  // client components (nav, hero, buttons) render but never hydrate.
  // Allow localhost and common private network ranges (works on any device)
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    // Home/office networks: 192.168.x.x range
    "192.168.1.*",
    "192.168.0.*",
    // Enterprise networks: 10.x.x.x range
    "10.0.0.*",
    "10.1.*.*",
  ],
};

export default nextConfig;
