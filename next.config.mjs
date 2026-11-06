/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hides the round Next.js "N" badge shown in the corner during `next dev`.
  devIndicators: false,
  async headers() {
    return [
      {
        // Browsers must always re-check the service worker script for updates.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};
export default nextConfig;
