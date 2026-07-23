import type { Request, Response, NextFunction } from 'express';
import { Listing } from '../../models/Listing.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sitemap(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const listings = await Listing.find({ status: 'published' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const base = env.CLIENT_URL.replace(/\/$/, '');
    const urls = [
      `${base}/`,
      `${base}/listings`,
      ...listings.map((l) => `${base}/listings/${l.slug}`),
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (loc) => `  <url>
    <loc>${escapeHtml(loc)}</loc>
    <changefreq>daily</changefreq>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    res.type('application/xml').send(body);
  } catch (error) {
    next(error);
  }
}

export async function robots(_req: Request, res: Response): Promise<void> {
  const base = env.CLIENT_URL.replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`);
}

/** Lightweight SSR HTML for crawlers / social shares (Phase 3 SEO). */
export async function listingSsrPage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const slug = req.params.slug as string;
    const listing = await Listing.findOne({ slug, status: 'published' }).lean();
    if (!listing) {
      next(new AppError('Listing not found', 404, 'LISTING_NOT_FOUND'));
      return;
    }

    const base = env.CLIENT_URL.replace(/\/$/, '');
    const url = `${base}/listings/${listing.slug}`;
    const title = `${listing.title} | SkillVentures`;
    const description = listing.description.slice(0, 160);
    const fee = listing.fee.isFree ? 'Free' : `INR ${listing.fee.amount}`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: listing.title,
      description: listing.description,
      provider: {
        '@type': 'Organization',
        name: 'SkillVentures',
      },
      offers: {
        '@type': 'Offer',
        price: listing.fee.amount,
        priceCurrency: listing.fee.currency ?? 'INR',
        category: listing.fee.isFree ? 'Free' : 'Paid',
      },
      url,
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta name="twitter:card" content="summary" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body>
  <main>
    <h1>${escapeHtml(listing.title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p>Fee: ${escapeHtml(fee)} · Mode: ${escapeHtml(listing.mode)} · Type: ${escapeHtml(listing.type)}</p>
    <p><a href="${escapeHtml(url)}">View on SkillVentures</a></p>
  </main>
</body>
</html>`;

    res.type('html').send(html);
  } catch (error) {
    next(error);
  }
}
