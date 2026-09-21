/**
 * Fetch Hacker News discussions about Jev.
 * Uses Algolia HN Search API (no auth required, generous rate limits).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/hn-discussions.json');

interface HNItem {
  id: string;
  title: string;
  author: string;
  url: string;
  hnUrl: string;
  points: number;
  numComments: number;
  createdAt: string;
  source: 'hn';
}

// Search queries for HN stories about Jev / TypeSafe.
const QUERIES = [
  'Jev TypeSafe',
  'Jev AI model',
  'System One model AI',
  'RLCD reinforcement learning calibrated',
  'TypeSafe AI',
];

async function main() {
  const all: HNItem[] = [];
  for (const q of QUERIES) {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=20`;
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json() as any;
      for (const h of data.hits ?? []) {
        all.push({
          id: String(h.objectID),
          title: h.title ?? '',
          author: h.author ?? '',
          url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
          hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
          points: h.points ?? 0,
          numComments: h.num_comments ?? 0,
          createdAt: h.created_at ?? '',
          source: 'hn',
        });
      }
    } catch (e) {
      console.warn(`[fetch-hn] ${q}: ${e}`);
    }
  }

  const fresh = [...new Map(all.map((h) => [h.hnUrl, h])).values()];

  // Merge with existing so discussions that drop out of the top-N window are
  // kept (refreshed when re-seen) instead of being deleted on every run.
  let existing: HNItem[] = [];
  try {
    existing = JSON.parse(await readFile(OUT, 'utf8')) as HNItem[];
  } catch {}

  const map = new Map<string, HNItem>();
  for (const h of existing) if (h.hnUrl) map.set(h.hnUrl, { ...h });
  for (const h of fresh) {
    const prev = map.get(h.hnUrl);
    map.set(h.hnUrl, prev ? { ...prev, ...h } : h);
  }
  const merged = [...map.values()]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 30);

  await writeFile(OUT, JSON.stringify(merged, null, 2));
  console.log(`[fetch-hn] saved ${merged.length} discussions (${fresh.length} fresh, merged with ${existing.length} existing)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
