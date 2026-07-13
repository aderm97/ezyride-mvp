import type { NextConfig } from "next";

// Content-Security-Policy tuned to what the app actually loads: the static
// landing's inline theme script + Google Fonts, Leaflet/CartoDB map tiles,
// Unsplash imagery, and the Nominatim/Finnhub/AviationStack fetches.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://nominatim.openstreetmap.org https://*.basemaps.cartocdn.com https://finnhub.io https://api.aviationstack.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=()' },
];

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  // Serve the bespoke static landing page at the site root. `beforeFiles`
  // runs ahead of the App Router, so "/" resolves to the self-contained
  // landing bundle in /public/landing while the app owns /login, /rider,
  // /driver and /api.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/landing' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
