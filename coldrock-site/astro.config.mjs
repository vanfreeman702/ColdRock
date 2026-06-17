// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // TODO[BRAND]: confirm final production domain before launch.
  site: "https://coldrock.co",

  // Output stays static by default. The Vercel adapter lets individual
  // routes opt into on-demand (serverless) rendering — used by the
  // contact API endpoint (src/pages/api/contact.ts sets prerender=false).
  // Every .astro page remains a prerendered static file.
  adapter: vercel(),

  // Tailwind v4 is wired in through its Vite plugin (no separate
  // @astrojs/tailwind integration needed).
  vite: {
    plugins: [tailwindcss()],
  },
});
