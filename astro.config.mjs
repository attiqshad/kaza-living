// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kaza-living.de',
  // Exakte Dateinamen (datenschutz.html, agb.html, widerruf.html, deals.html)
  // statt /datenschutz/index.html – bestehende Links und Bookmarks bleiben gültig.
  build: {
    format: 'file',
  },
});
