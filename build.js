/* ==========================================================================
   Tokenization 2050 — Build Script
   Reads content JSON/Markdown, renders Nunjucks templates, outputs static HTML.
   Usage: node build.js [--serve] [--preview]
     --preview (only together with --serve, i.e. "npm run preview"):
       local-only preview with DEMO numbers from dev/preview-data.json and
       draft articles included, under a visible "PREVIEW ONLY" bar.
       The live site (GitHub Actions runs "npm run build") never uses it.
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const { marked } = require('marked');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATE_DIR = path.join(ROOT, 'templates');
const STATIC_DIR = path.join(ROOT, 'static');
const OUTPUT_DIR = path.join(ROOT, 'site');

const SERVE = process.argv.includes('--serve');
const PREVIEW = process.argv.includes('--preview');
if (PREVIEW && !SERVE) {
  console.error('✗ --preview only works together with --serve (npm run preview). It is never used for the live site.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Empty a directory (remove its contents, keep the folder itself).
 * Removing the folder itself fails on Windows with EPERM when a terminal,
 * editor or Explorer window has it open, so we only delete its children.
 */
function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

/** Recursively copy a directory */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** Write file, creating parent dirs as needed */
function writeOutput(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

/** Read and parse a JSON file */
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/** Format an ISO date to "17 Nov 2026 · 14:32 UTC" */
function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hours}:${minutes} UTC`;
}

/** Format a date as short "17 Nov 2026" */
function formatDateShort(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Relative time ago string */
function timeAgo(isoString, now) {
  const then = new Date(isoString).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Estimate reading time in minutes */
function readingTime(text) {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 230));
}

/**
 * Split a display value like "$24.5B" or "1,250" into parts for the
 * animated counter: { prefix: "$", number: 24.5, decimals: 1, suffix: "B" }.
 * Returns null when the value has no single number in it (then no animation).
 */
function parseCount(value) {
  const m = String(value).trim().match(/^([^0-9-]*)(-?[0-9][0-9,]*(?:.[0-9]+)?)(.*)$/);
  if (!m || /[0-9]/.test(m[3])) return null;
  const numText = m[2].replace(/,/g, '');
  return {
    prefix: m[1],
    number: Number(numText),
    decimals: numText.includes('.') ? numText.split('.')[1].length : 0,
    suffix: m[3],
    grouped: m[2].includes(','),
  };
}

/** Escape XML for feeds */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// Load content
// ---------------------------------------------------------------------------

console.log('📦 Loading content...');

const config = readJSON(path.join(CONTENT_DIR, 'config.json'));
const data = PREVIEW
  ? readJSON(path.join(ROOT, 'dev', 'preview-data.json'))
  : readJSON(path.join(CONTENT_DIR, 'data.json'));
if (PREVIEW) console.log('  ⚠ PREVIEW MODE: demo numbers + drafts (local only, never published)');
const glossaryData = readJSON(path.join(CONTENT_DIR, 'glossary.json'));

// Social channels: only those listed in config.social are shown anywhere
// (order = priority). Icons come from content/social-icons.json.
const socialIcons = readJSON(path.join(CONTENT_DIR, 'social-icons.json'));
const social = (config.social || [])
  .filter((c) => c && c.name && c.url)
  .map((c) => {
    const key = c.name.toLowerCase();
    if (!socialIcons[key]) console.warn(`  ⚠ No icon for social channel "${c.name}" (add it to content/social-icons.json)`);
    return { ...c, key, icon: socialIcons[key] || null };
  });
const whatsapp = social.find((c) => c.key === 'whatsapp') || null;
const socialOthers = social.filter((c) => c.key !== 'whatsapp');
const contactEmail = config.site.contact_email || '';

/**
 * Placeholders usable in pages (content/pages/*.json) and static/llms.txt:
 *   {{CONTACT_EMAIL}}  → config.site.contact_email
 *   {{SOCIAL_LIST}}    → Markdown list of every channel in config.social
 */
function fillPlaceholders(text) {
  const list = social.map((c) => `- **${c.name}**: [${c.url}](${c.url})`).join('\n');
  return String(text)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, contactEmail)
    .replace(/\{\{SOCIAL_LIST\}\}/g, list);
}
function fillPlaceholdersPlain(text) {
  const list = social.map((c) => `- ${c.name}: ${c.url}`).join('\n');
  return String(text)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, contactEmail)
    .replace(/\{\{SOCIAL_LIST\}\}/g, list);
}

// Build section lookup
const sectionMap = {};
for (const s of config.sections) {
  sectionMap[s.slug] = s;
}

// Load articles
const articlesDir = path.join(CONTENT_DIR, 'articles');
let articles = [];
let draftCount = 0;
if (fs.existsSync(articlesDir)) {
  for (const file of fs.readdirSync(articlesDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const article = readJSON(path.join(articlesDir, file));
      // Drafts ("draft": true) are kept in content/ but never published
      if (article.draft === true && !PREVIEW) {
        draftCount++;
        continue;
      }
      article.sectionName = sectionMap[article.section]
        ? sectionMap[article.section].name
        : article.section;
      article.bodyHtml = marked(article.body || '', { breaks: false, gfm: true });
      article.dateFormatted = formatDate(article.publishedAt);
      article.dateShort = formatDateShort(article.publishedAt);
      article.readTime = readingTime(article.body || '');
      article.byline = config.site.byline;
      articles.push(article);
    } catch (err) {
      console.error(`  ⚠ Error loading ${file}:`, err.message);
    }
  }
}

// Sort articles by date descending
articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

console.log(`  ✓ ${articles.length} articles loaded (${draftCount} drafts skipped)`);

// Load pages
const pagesDir = path.join(CONTENT_DIR, 'pages');
let pages = [];
if (fs.existsSync(pagesDir)) {
  for (const file of fs.readdirSync(pagesDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const page = readJSON(path.join(pagesDir, file));
      page.bodyHtml = marked(fillPlaceholders(page.body || ''), { breaks: false, gfm: true });
      pages.push(page);
    } catch (err) {
      console.error(`  ⚠ Error loading page ${file}:`, err.message);
    }
  }
}

console.log(`  ✓ ${pages.length} pages loaded`);
console.log(`  ✓ ${glossaryData.terms.length} glossary terms loaded`);

// ---------------------------------------------------------------------------
// Setup Nunjucks
// ---------------------------------------------------------------------------

const env = nunjucks.configure(TEMPLATE_DIR, {
  autoescape: true,
  trimBlocks: true,
  lstripBlocks: true,
});

// Custom filters
env.addFilter('formatDate', formatDate);
env.addFilter('formatDateShort', formatDateShort);
// JSON for a <script type="application/json"> block ("<" escaped so text can't close the tag)
env.addFilter('jsonScript', (obj) => JSON.stringify(obj).replace(/</g, '\\u003c'));
env.addFilter('urlencode', (str) => encodeURIComponent(str || ''));
env.addFilter('truncate', (str, len) => {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.substring(0, len) + '…';
});

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

console.log('\n🔨 Building site...');

// Clean output
cleanDir(OUTPUT_DIR);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy static assets
console.log('  → Copying static assets...');
copyDir(STATIC_DIR, path.join(OUTPUT_DIR, 'assets'));

// Also copy robots.txt and llms.txt to root
if (fs.existsSync(path.join(STATIC_DIR, 'robots.txt'))) {
  fs.copyFileSync(
    path.join(STATIC_DIR, 'robots.txt'),
    path.join(OUTPUT_DIR, 'robots.txt')
  );
}
if (fs.existsSync(path.join(STATIC_DIR, 'llms.txt'))) {
  const llms = fillPlaceholdersPlain(fs.readFileSync(path.join(STATIC_DIR, 'llms.txt'), 'utf-8'));
  writeOutput(path.join(OUTPUT_DIR, 'llms.txt'), llms);
  // the copy under /assets keeps the raw placeholders; remove it
  fs.rmSync(path.join(OUTPUT_DIR, 'assets', 'llms.txt'), { force: true });
}

// Self-hosted Chart.js (loaded only on the Data page, only when charts exist)
fs.mkdirSync(path.join(OUTPUT_DIR, 'assets', 'vendor'), { recursive: true });
fs.copyFileSync(
  path.join(ROOT, 'node_modules', 'chart.js', 'dist', 'chart.umd.min.js'),
  path.join(OUTPUT_DIR, 'assets', 'vendor', 'chart.umd.min.js')
);

// Custom domain for GitHub Pages (from config.site.url)
writeOutput(path.join(OUTPUT_DIR, 'CNAME'), new URL(config.site.url).host + '\n');

const now = Date.now();
const buildDate = formatDateShort(new Date().toISOString());

// Common template data
// Ticker: only items with a verified value are shown; with none, the strip is hidden
const tickerItems = (data.ticker || []).filter(
  (item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== ''
);

// Key figures: same rule — only figures with a verified value are published
const verifiedFigures = (data.keyFigures || [])
  .filter((fig) => fig.value !== undefined && fig.value !== null && String(fig.value).trim() !== '')
  .map((fig, i) => ({
    ...fig,
    id: 'fig-' + i,
    count: parseCount(fig.value),
    // Charts only from real history points: [{ "date": "2026-10-31", "value": 24.5 }, ...]
    history: Array.isArray(fig.history)
      ? fig.history.filter((p) => p && p.date && typeof p.value === 'number')
      : [],
  }));

// Data for the charts on the Data page (rendered by Chart.js in the browser).
// Trend charts: one per figure with at least 2 history points.
// Comparison bar chart: figures whose values share the same unit (e.g. "$…B").
const chartData = { trends: [], comparison: null };
for (const fig of verifiedFigures) {
  if (fig.history.length >= 2) {
    chartData.trends.push({ id: fig.id, label: fig.label, unit: fig.count ? fig.count.prefix + '|' + fig.count.suffix : '|', points: fig.history });
  }
}
{
  const units = {};
  for (const fig of verifiedFigures) {
    if (!fig.count || fig.count.suffix === '%') continue;
    const unit = fig.count.prefix + '|' + fig.count.suffix;
    (units[unit] = units[unit] || []).push(fig);
  }
  const best = Object.entries(units).sort((a, b) => b[1].length - a[1].length)[0];
  if (best && best[1].length >= 2) {
    chartData.comparison = {
      unit: best[0],
      labels: best[1].map((f) => f.label),
      values: best[1].map((f) => f.count.number),
    };
  }
}

// Rotating "Latest" headline strip: the 5 newest published articles
const latestHeadlines = articles.slice(0, 5).map((a) => ({
  title: a.title.replace('[SAMPLE] ', ''),
  url: '/' + a.section + '/' + a.id + '/',
  sectionName: a.sectionName,
  publishedAt: a.publishedAt,
  timeAgo: timeAgo(a.publishedAt, Date.now()),
}));

const common = { config, data, buildDate, sectionMap, tickerItems, verifiedFigures, latestHeadlines, previewMode: PREVIEW, social, socialOthers, whatsapp, contactEmail };

// Warn about menu entries in config.nav that don't match a section slug
for (const slug of [...config.nav.primary, ...config.nav.secondary]) {
  if (!sectionMap[slug]) console.warn(`  ⚠ config.nav lists unknown section "${slug}"`);
}

// --- Home page ---
console.log('  → Building home page...');
const leadStory = articles[0] || null;
const latestArticles = articles.map((a) => ({
  ...a,
  timeAgo: timeAgo(a.publishedAt, now),
}));

// Group articles by section for homepage previews
const articlesBySection = {};
for (const article of articles) {
  if (!articlesBySection[article.section]) {
    articlesBySection[article.section] = [];
  }
  if (articlesBySection[article.section].length < 3) {
    articlesBySection[article.section].push(article);
  }
}

const homeHtml = nunjucks.render('home.njk', {
  ...common,
  pageTitle: 'Home',
  leadStory,
  latestArticles: latestArticles.slice(0, 8),
  articlesBySection,
});
writeOutput(path.join(OUTPUT_DIR, 'index.html'), homeHtml);

// --- Article pages ---
console.log('  → Building article pages...');
for (const article of articles) {
  // Find related articles (same section, excluding self)
  const relatedArticles = articles
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  const html = nunjucks.render('article.njk', {
    ...common,
    pageTitle: article.title.replace('[SAMPLE] ', ''),
    currentSection: article.section,
    article,
    relatedArticles,
  });
  writeOutput(
    path.join(OUTPUT_DIR, article.section, article.id, 'index.html'),
    html
  );
}

// --- Section pages ---
console.log('  → Building section pages...');
for (const section of config.sections) {
  if (section.slug === 'glossary' || section.slug === 'data') continue;

  const sectionArticles = articles.filter((a) => a.section === section.slug);
  const html = nunjucks.render('section.njk', {
    ...common,
    pageTitle: section.name,
    currentSection: section.slug,
    section,
    articles: sectionArticles,
  });
  writeOutput(path.join(OUTPUT_DIR, section.slug, 'index.html'), html);
}

// --- Glossary page ---
console.log('  → Building glossary page...');
const glossaryHtml = nunjucks.render('glossary.njk', {
  ...common,
  pageTitle: 'Glossary',
  currentSection: 'glossary',
  glossary: glossaryData.terms.sort((a, b) => a.term.localeCompare(b.term)),
});
writeOutput(path.join(OUTPUT_DIR, 'glossary', 'index.html'), glossaryHtml);

// --- Data page ---
console.log('  → Building data page...');
const dataPageHtml = nunjucks.render('data-page.njk', {
  ...common,
  pageTitle: 'Data',
  currentSection: 'data',
  chartData,
  hasCharts: chartData.trends.length > 0 || !!chartData.comparison,
});
writeOutput(path.join(OUTPUT_DIR, 'data', 'index.html'), dataPageHtml);

// --- Static pages ---
console.log('  → Building static pages...');
for (const page of pages) {
  const html = nunjucks.render('page.njk', {
    ...common,
    pageTitle: page.title,
    page,
  });
  writeOutput(path.join(OUTPUT_DIR, page.slug, 'index.html'), html);
}

// --- RSS Feed ---
console.log('  → Generating RSS feed...');
const rssItems = articles.slice(0, 20).map((a) => `    <item>
      <title>${escapeXml(a.title.replace('[SAMPLE] ', ''))}</title>
      <link>${config.site.url}/${a.section}/${a.id}/</link>
      <guid isPermaLink="true">${config.site.url}/${a.section}/${a.id}/</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(a.summary)}</description>
      <category>${escapeXml(a.sectionName)}</category>
      <dc:creator>${escapeXml(config.site.byline)}</dc:creator>
    </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Tokenization 2050</title>
    <link>${config.site.url}</link>
    <description>${escapeXml(config.site.description)}</description>
    <language>${config.site.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${config.site.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${config.site.url}${config.brand.icon144}</url>
      <title>Tokenization 2050</title>
      <link>${config.site.url}</link>
      <width>144</width>
      <height>144</height>
    </image>
${rssItems}
  </channel>
</rss>`;
writeOutput(path.join(OUTPUT_DIR, 'feed.xml'), rss);

// --- JSON Feed ---
console.log('  → Generating JSON feed...');
const jsonFeed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Tokenization 2050',
  home_page_url: config.site.url,
  feed_url: `${config.site.url}/feed.json`,
  description: config.site.description,
  language: config.site.language,
  icon: config.site.url + config.brand.icon512,
  favicon: config.site.url + config.brand.icon192,
  items: articles.slice(0, 20).map((a) => ({
    id: `${config.site.url}/${a.section}/${a.id}/`,
    url: `${config.site.url}/${a.section}/${a.id}/`,
    title: a.title.replace('[SAMPLE] ', ''),
    summary: a.summary,
    content_html: a.bodyHtml,
    date_published: a.publishedAt,
    authors: [{ name: config.site.byline }],
    tags: a.tags || [],
  })),
};
writeOutput(path.join(OUTPUT_DIR, 'feed.json'), JSON.stringify(jsonFeed, null, 2));

// --- Sitemap ---
console.log('  → Generating sitemap.xml...');
const sitemapUrls = [
  { loc: config.site.url + '/', priority: '1.0', changefreq: 'daily' },
  { loc: config.site.url + '/data/', priority: '0.8', changefreq: 'daily' },
  { loc: config.site.url + '/glossary/', priority: '0.6', changefreq: 'monthly' },
];

for (const section of config.sections) {
  if (section.slug !== 'glossary' && section.slug !== 'data') {
    sitemapUrls.push({
      loc: `${config.site.url}/${section.slug}/`,
      priority: '0.7',
      changefreq: 'daily',
    });
  }
}

for (const article of articles) {
  sitemapUrls.push({
    loc: `${config.site.url}/${article.section}/${article.id}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: article.updatedAt || article.publishedAt,
  });
}

for (const page of pages) {
  sitemapUrls.push({
    loc: `${config.site.url}/${page.slug}/`,
    priority: '0.5',
    changefreq: 'monthly',
  });
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod.split('T')[0]}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
writeOutput(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);

// --- 404 page ---
console.log('  → Building 404 page...');
const notFoundHtml = nunjucks.render('page.njk', {
  ...common,
  pageTitle: 'Page Not Found',
  page: {
    title: 'Page Not Found',
    slug: '404',
    description: 'The page you are looking for does not exist.',
    bodyHtml: '<h1>Page Not Found</h1><p>The page you are looking for does not exist or has been moved.</p><p><a href="/">Return to the home page</a>.</p>',
  },
});
writeOutput(path.join(OUTPUT_DIR, '404.html'), notFoundHtml);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

// Count output files
let fileCount = 0;
function countFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      countFiles(path.join(dir, entry.name));
    } else {
      fileCount++;
    }
  }
}
countFiles(OUTPUT_DIR);

console.log(`\n✅ Build complete! ${fileCount} files written to site/`);

// ---------------------------------------------------------------------------
// Optional: local preview server
// ---------------------------------------------------------------------------
if (SERVE) {
  const http = require('http');
  const PORT = 8050;

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    // Ignore query strings and #fragments (e.g. /?utm=x) like a real web host does
    const urlPath = decodeURIComponent(req.url.split(/[?#]/)[0]);
    let filePath = path.join(OUTPUT_DIR, urlPath === '/' ? '/index.html' : urlPath);

    // Try adding index.html for directory-like URLs
    if (!path.extname(filePath)) {
      if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      } else {
        filePath = path.join(filePath, 'index.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        // Try 404 page
        fs.readFile(path.join(OUTPUT_DIR, '404.html'), (err404, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content404 || '<h1>404 Not Found</h1>');
        });
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`\n🌐 Preview server running at http://localhost:${PORT}`);
    console.log('   Press Ctrl+C to stop.\n');
  });
}
