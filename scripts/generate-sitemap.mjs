// Generates public/sitemap.xml before each production build: a handful of
// static marketing/shop routes plus one <url> per active product, fetched
// from the live API so new products show up without a manual sitemap edit.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.SITE_URL || 'https://eggys.store').replace(/\/$/, '');
const API_URL = (process.env.SITEMAP_API_URL || process.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const PAGE_SIZE = 100;

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/track-order', changefreq: 'monthly', priority: '0.3' },
];

async function fetchAllProducts() {
  const products = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${API_URL}/products?page=${page}&pageSize=${PAGE_SIZE}`);
    if (!res.ok) throw new Error(`GET /products failed: ${res.status}`);
    const { products: rows, total } = await res.json();
    products.push(...rows);
    if (products.length >= total || rows.length === 0) break;
    page += 1;
  }
  return products;
}

function urlEntry(loc, { changefreq, priority, lastmod }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const entries = STATIC_ROUTES.map((r) =>
    urlEntry(`${SITE_URL}${r.path}`, { ...r, lastmod: today }),
  );

  try {
    const products = await fetchAllProducts();
    for (const p of products) {
      entries.push(
        urlEntry(`${SITE_URL}/products/${p.id}`, {
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: (p.updatedAt || p.createdAt || today).slice(0, 10),
        }),
      );
    }
    console.log(`sitemap: added ${products.length} product URL(s)`);
  } catch (err) {
    console.warn(`sitemap: couldn't fetch products (${err.message}) — writing static routes only`);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  const outPath = path.join(__dirname, '../public/sitemap.xml');
  await writeFile(outPath, xml, 'utf8');
  console.log(`sitemap: wrote ${outPath}`);
}

main();
