/**
 * Download free Unsplash stock images for mock listings.
 * Uses Unsplash CDN direct URLs (licensed free stock) — NOT scraping Coursera/Udemy.
 *
 * Usage: npx tsx src/scripts/fetch-mock-images.ts
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../../../../apps/client/public/images/listings');

/** Curated Unsplash photo IDs — coding / campus / workshop scenes */
export const MOCK_IMAGES: { id: string; file: string; credit: string }[] = [
  { id: '1516321318423-f06f85e504b3', file: 'coding-laptop.jpg', credit: 'Unsplash — laptop learning' },
  { id: '1522202176988-66273c2fd55f', file: 'team-collab.jpg', credit: 'Unsplash — team collaboration' },
  { id: '1517245386807-bb43f82c33c4', file: 'workshop-desk.jpg', credit: 'Unsplash — workshop desk' },
  { id: '1555066931-4365d14bab8c', file: 'code-screen.jpg', credit: 'Unsplash — code on screen' },
  { id: '1523240795612-9a054b0db644', file: 'students-campus.jpg', credit: 'Unsplash — students campus' },
  { id: '1531482615713-2afd69097998', file: 'classroom.jpg', credit: 'Unsplash — classroom' },
  { id: '1517694712202-14dd9538aa97', file: 'dev-setup.jpg', credit: 'Unsplash — developer setup' },
  { id: '1552664730-d307ca884978', file: 'team-meeting.jpg', credit: 'Unsplash — team meeting' },
  { id: '1504384308090-c894fdcc538d', file: 'hackathon-night.jpg', credit: 'Unsplash — late night coding' },
  { id: '1454165804606-c3d57bc86b40', file: 'business-desk.jpg', credit: 'Unsplash — business desk' },
  { id: '1461749280684-dccba630e2f6', file: 'java-code.jpg', credit: 'Unsplash — Java monitor' },
  { id: '1498050108023-c5249f4df085', file: 'macbook-desk.jpg', credit: 'Unsplash — macbook desk' },
];

function unsplashUrl(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=80`;
}

async function downloadOne(photoId: string, file: string): Promise<string> {
  const dest = path.join(OUT_DIR, file);
  const url = unsplashUrl(photoId);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SkillVenturesMockSeeder/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Failed ${url}: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return `/images/listings/${file}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const img of MOCK_IMAGES) {
    process.stdout.write(`[fetch] ${img.file}… `);
    await downloadOne(img.id, img.file);
    console.log('ok');
  }
  console.log(`[fetch] saved ${MOCK_IMAGES.length} images → ${OUT_DIR}`);
  console.log('[fetch] credits: Unsplash free stock. Do not scrape Coursera/Udemy assets.');
}

const isDirectRun = process.argv[1]?.includes('fetch-mock-images');
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
