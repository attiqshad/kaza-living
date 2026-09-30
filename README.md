# Kaza Living — kaza-living.de + deals.kaza-living.de

Beide Seiten in einem Astro-Projekt, ausgeliefert von **einem** Cloudflare Worker (Static Assets). Inhaltlich 1:1 wie die bisherige IIS-Version auf der Azure-VM, nur die Datenschutzerklärung nennt Cloudflare statt Strato als Hosting-Anbieter.

## Befehle

```bash
npm install
npm run dev       # http://localhost:4321 – Hauptseite unter /, Deals-Seite unter /deals.html
npm run build     # → dist/
npm run preview   # Build + wrangler dev (echter Worker lokal)
npm run deploy    # Build + wrangler deploy
```

## Aufbau

| Datei | Zweck |
|---|---|
| `src/pages/index.astro`, `datenschutz.astro`, `agb.astro`, `widerruf.astro` | Hauptseite (`build.format: 'file'` → exakt `index.html`, `datenschutz.html` … wie bisher) |
| `src/pages/deals.astro` | deals.kaza-living.de – Produkte als Liste oben in der Datei |
| `src/pages/404.astro` | Fehlerseite (noindex) |
| `src/worker.js` | Routing nach Hostname, Weiterleitungen, Header (Ersatz für die `web.config`) |
| `wrangler.jsonc` | Worker-Konfiguration; Custom Domains noch auskommentiert |
| `public/` | Schriften (lokal, keine Google-Fonts-Anfragen), Bilder, `fonts.css` – von beiden Seiten genutzt |

### Was der Worker macht

- `kaza-living.de` → Hauptseite; `/` liefert `index.html`, Rechtsseiten mit `X-Robots-Tag: noindex, follow`
- `deals.kaza-living.de/` → `deals.html` mit `noindex, nofollow`; nur `/css/`, `/fonts/`, `/img/`, `/_astro/` sind dort zusätzlich erreichbar, alles andere → 301 auf die Hauptseite
- `kaza-living.de/deals.html` → 301 auf `https://deals.kaza-living.de/`
- `www.kaza-living.de` und `http://` → 301 auf `https://kaza-living.de`
- alle anderen Hosts (`*.workers.dev`, Vorschau-URLs) zeigen alles, aber mit `noindex, nofollow`
- Security-Header wie bisher (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy); Cache: Schriften 1 Jahr, Bilder/CSS 7 Tage

## Umzug auf Cloudflare

1. `npm run deploy` → Seite läuft unter `https://kaza-living.<account>.workers.dev` (Deals-Seite dort unter `/deals.html`) zum Prüfen.
2. Domain `kaza-living.de` im Cloudflare-Dashboard als Zone hinzufügen, DNS-Einträge prüfen (v. a. **MX/TXT für E-Mail** `info@kaza-living.de` übernehmen!), dann bei Strato die Nameserver auf die von Cloudflare angezeigten umstellen.
3. Sobald die Zone aktiv ist: in `wrangler.jsonc` den `routes`-Block einkommentieren und erneut `npm run deploy`. Die alten A-Records für `@`, `www` und `deals` (Azure-VM `20.86.34.24`) vorher löschen – Custom Domains legen ihre DNS-Einträge selbst an.
4. Prüfen, dann die IIS-Sites auf der Azure-VM abschalten.

Optional: Im Cloudflare-Dashboard den Worker mit dem GitHub-Repo verbinden (Workers Builds: Build `npm run build`, Deploy `npx wrangler deploy`), dann deployt jeder Push auf `main` automatisch.

## Offen

- eBay-/Amazon-Shop-Links auf der Startseite sind noch Platzhalter (`ebay.de` / `amazon.de`).
- Datenschutzerklärung (Abschnitt 2 „Hosting“) vor Livegang gegenlesen.
- AGB idealerweise von Anwalt/IHK prüfen lassen.
- Produktbilder sind SVG-Platzhalter im Markendesign.
