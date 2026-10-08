// Worker vor den statischen Assets. Bedient beide Seiten aus einem Build:
//   kaza-living.de        → Hauptseite (index.html, datenschutz.html, agb.html, widerruf.html)
//   deals.kaza-living.de  → deals.html unter "/", teilt sich Schriften und Bilder mit der Hauptseite
// Setzt außerdem die Header, die vorher in der web.config (IIS) standen.
// Alle anderen Hosts (workers.dev, Vorschau-URLs, localhost) zeigen alles unverändert, aber mit noindex.
const MAIN_HOST = 'kaza-living.de';
const DEALS_HOST = 'deals.kaza-living.de';
const REDIRECT_HOSTS = new Map([['www.kaza-living.de', MAIN_HOST]]);

// Auf der Deals-Subdomain erlaubte Pfade (Rest geht auf die Hauptseite)
const SHARED_PREFIXES = ['/css/', '/fonts/', '/img/', '/_astro/', '/favicon.svg'];
const LEGAL_PAGES = new Set(['/datenschutz.html', '/agb.html', '/widerruf.html', '/404.html']);

// Loofty (Spiel) wohnt jetzt auf liyanex.de – alte Datenschutz-Links dauerhaft dorthin umleiten
const LOOFTY_PRIVACY_DE = 'https://liyanex.de/games/loofty/privacy/';
const LOOFTY_PRIVACY_EN = 'https://liyanex.de/en/games/loofty/privacy/';
const MOVED_TO_LIYANEX = new Map([
  ['/loofty/datenschutz.html', LOOFTY_PRIVACY_DE],
  ['/loofty/datenschutz', LOOFTY_PRIVACY_DE],
  ['/loofty/privacy.html', LOOFTY_PRIVACY_EN],
  ['/loofty/privacy', LOOFTY_PRIVACY_EN],
  ['/loofty', 'https://liyanex.de/games/loofty/'],
  ['/loofty/', 'https://liyanex.de/games/loofty/'],
]);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

function redirect(host, pathname, search = '') {
  return Response.redirect(`https://${host}${pathname}${search}`, 301);
}

function cacheControl(pathname) {
  if (pathname.startsWith('/fonts/') || pathname.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (pathname.startsWith('/img/') || pathname.startsWith('/css/')) return 'public, max-age=604800';
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { hostname, pathname } = url;

    if (REDIRECT_HOSTS.has(hostname)) return redirect(REDIRECT_HOSTS.get(hostname), pathname, url.search);

    const isMain = hostname === MAIN_HOST;
    const isDeals = hostname === DEALS_HOST;
    if ((isMain || isDeals) && url.protocol === 'http:') return redirect(hostname, pathname, url.search);

    // Loofty moved to liyanex.de (2026-10-06); old links keep working
    if (MOVED_TO_LIYANEX.has(pathname)) return Response.redirect(MOVED_TO_LIYANEX.get(pathname), 301);

    let assetPath = pathname;
    let robots = null;

    if (isDeals) {
      if (pathname === '/' || pathname === '/index.html') assetPath = '/deals.html';
      else if (pathname === '/deals.html') return redirect(DEALS_HOST, '/');
      else if (!SHARED_PREFIXES.some((p) => pathname.startsWith(p))) return redirect(MAIN_HOST, pathname, url.search);
      robots = 'noindex, nofollow';
    } else {
      if (isMain && (pathname === '/deals.html' || pathname === '/deals')) return redirect(DEALS_HOST, '/');
      // Nur eine URL für die Startseite (Google soll nicht / und /index.html getrennt sehen)
      if (isMain && pathname === '/index.html') return redirect(MAIN_HOST, '/', url.search);
      if (pathname === '/') assetPath = '/index.html';
      if (!isMain) robots = 'noindex, nofollow';
      else if (LEGAL_PAGES.has(pathname)) robots = 'noindex, follow';
    }

    const assetUrl = new URL(url);
    assetUrl.pathname = assetPath;
    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));

    const response = new Response(assetResponse.body, assetResponse);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
    if (robots) response.headers.set('X-Robots-Tag', robots);
    const cache = assetResponse.ok && cacheControl(assetPath);
    if (cache) response.headers.set('Cache-Control', cache);
    return response;
  },
};
