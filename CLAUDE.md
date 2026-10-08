# kaza-living – Projektkontext für Claude Code

- Zwei Seiten, ein Astro-7-Projekt, ein Cloudflare Worker (`kaza-living`, Account info@kaza-living.de): kaza-living.de (Hauptseite) und deals.kaza-living.de (`src/pages/deals.astro`). Routing nach Hostname in `src/worker.js` – Details in README.md.
- Vorher: statisches HTML auf IIS (Azure-VM 20.86.34.24), Domain bei Strato. Seit 2026-09-30 live auf Cloudflare: Zone kaza-living.de im Account, Custom Domains kaza-living.de, www, deals am Worker. IIS-Sites auf der VM können abgeschaltet werden.
- `build.format: 'file'` beibehalten – URLs sind `/datenschutz.html` usw. wie auf der alten Seite; `html_handling: "none"`, damit Cloudflare keine .html-Endungen umleitet.
- Deals-Seite: Werbekennzeichnung (Banner oben + Affiliate-Hinweis) nicht entfernen; Links mit `rel="sponsored noopener"`. Keine adblocker-typischen Klassen (ad-*, affiliate-*, sponsor*, promo*) – Banner heißt `werbehinweis`.
- Keine externen Schriften/CDNs (DSGVO) – alles liegt unter `public/`.
- SEO: Sitemap per `@astrojs/sitemap` → `/sitemap-index.xml` (noindex-Seiten über `NOINDEX_PAGES` in astro.config.mjs ausgeschlossen), `public/robots.txt` verweist darauf (Cloudflare stellt seinen Content-Signals-Block davor). Canonical nur auf indexierbaren Seiten, `/index.html` → 301 auf `/`. LocalBusiness-JSON-LD in index.astro – bei Adressänderung mitpflegen.
- Automatisches Deploy (Workers Builds, seit 2026-09-30): jeder Push auf `main` baut (`npm run build`) und deployt (`npx wrangler deploy`) – ein Push ist also ein Livegang. `npm run deploy` lokal nur noch im Notfall.
- Workers Builds nutzt npm 10 (`npm clean-install`); lokal ist npm 11 installiert, dessen Lockfile npm 10 ablehnt (fehlende @emnapi-Einträge, Build-Abbruch am 2026-10-08). Nach jeder Abhängigkeitsänderung: `npx -y npm@10.9.2 install --package-lock-only`.
- Der Nutzer gibt jeden Commit/Push/Deploy frei.
