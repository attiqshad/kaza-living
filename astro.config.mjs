// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Seiten mit noindex gehören nicht in die Sitemap (Rechtstexte, Deals-Subdomain, Fehlerseite)
const NOINDEX_PAGES = ['datenschutz', 'agb', 'widerruf', 'deals', '404'];

export default defineConfig({
  site: 'https://kaza-living.de',
  // Exakte Dateinamen (datenschutz.html, agb.html, widerruf.html, deals.html)
  // statt /datenschutz/index.html – bestehende Links und Bookmarks bleiben gültig.
  build: {
    format: 'file',
  },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX_PAGES.some((p) => page.endsWith(`/${p}.html`) || page.endsWith(`/${p}`)),
    }),
  ],
});
