/**
 * Fetch recent tweets from X / Twitter using a headless browser.
 * Requires: TWITTER_AUTH_TOKEN, TWITTER_CT0 (or you must be logged in via a session).
 *
 * NOTE: For ethical scraping, prefer using official X API when possible.
 * This script is for personal use only — be respectful of rate limits.
 */
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/');

interface Tweet {
  id: string;
  authorHandle: string;
  authorName: string;
  datetime: string;
  text: string;
  url: string;
  metrics?: { replies?: number; retweets?: number; likes?: number; views?: number };
  source?: 'official' | 'founder' | 'community' | 'thirdparty';
}

const QUERIES = [
  { q: 'Jev typesafe.ai', sort: 'live' },
  { q: 'Jev typesafe', sort: 'live' },
  { q: 'System One model', sort: 'live' },
  { q: 'RLCD calibrated', sort: 'live' },
  { q: 'Jev typesafe.ai', sort: 'top' },
];

async function scrapeQuery(page: any, query: string, sort: string): Promise<Tweet[]> {
  const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=${sort}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);

  return await page.evaluate(() => {
    const results: any[] = [];
    for (const a of document.querySelectorAll('article')) {
      let handle = '';
      let displayName = '';
      for (const ul of a.querySelectorAll('a[role="link"]')) {
        const href = ul.getAttribute('href') || '';
        if (/^\/[A-Za-z0-9_]+$/.test(href)) {
          handle = href.slice(1);
          displayName = (ul.textContent || '').trim();
          break;
        }
      }
      let statusUrl = '';
      for (const sl of a.querySelectorAll('a')) {
        const h = sl.getAttribute('href') || '';
        if (h.includes('/status/')) { statusUrl = 'https://x.com' + h; break; }
      }
      const textEl = a.querySelector('[data-testid="tweetText"]');
      const text = textEl ? textEl.innerText : '';
      const timeEl = a.querySelector('time');
      const datetime = timeEl ? timeEl.getAttribute('datetime') || '' : '';
      const ariaLabels: string[] = [];
      const group = a.querySelector('[role="group"]');
      if (group) {
        for (const lab of group.querySelectorAll('[aria-label]')) {
          ariaLabels.push(lab.getAttribute('aria-label') || '');
        }
      }
      function parseMetric(label: string): number | undefined {
        const m = ariaLabels.find((l) => l.includes(label));
        if (!m) return undefined;
        const n = parseInt(m.replace(/[^\d]/g, ''), 10);
        return isNaN(n) ? undefined : n;
      }
      results.push({
        handle,
        displayName,
        statusUrl,
        datetime,
        text: text.slice(0, 800),
        metrics: {
          replies: parseMetric('回复') ?? parseMetric('repl'),
          retweets: parseMetric('转帖') ?? parseMetric('repost'),
          likes: parseMetric('喜欢') ?? parseMetric('like'),
          views: parseMetric('查看') ?? parseMetric('view'),
        },
      });
    }
    return results;
  });
}

async function scrapeProfile(page: any, handle: string): Promise<Tweet[]> {
  const url = `https://x.com/${handle}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollBy(0, 1500));
  await page.waitForTimeout(2000);

  return await page.evaluate(() => {
    const results: any[] = [];
    for (const a of document.querySelectorAll('article')) {
      let statusUrl = '';
      for (const sl of a.querySelectorAll('a')) {
        const h = sl.getAttribute('href') || '';
        if (h.includes('/status/')) { statusUrl = 'https://x.com' + h; break; }
      }
      const textEl = a.querySelector('[data-testid="tweetText"]');
      const text = textEl ? textEl.innerText : '';
      const timeEl = a.querySelector('time');
      const datetime = timeEl ? timeEl.getAttribute('datetime') || '' : '';
      const ariaLabels: string[] = [];
      const group = a.querySelector('[role="group"]');
      if (group) for (const lab of group.querySelectorAll('[aria-label]')) ariaLabels.push(lab.getAttribute('aria-label') || '');
      function parseMetric(label: string): number | undefined {
        const m = ariaLabels.find((l) => l.includes(label));
        if (!m) return undefined;
        const n = parseInt(m.replace(/[^\d]/g, ''), 10);
        return isNaN(n) ? undefined : n;
      }
      results.push({
        handle: location.pathname.split('/').filter(Boolean)[0],
        displayName: (document.querySelector('[data-testid="UserName"]')?.textContent || '').trim(),
        statusUrl, datetime, text: text.slice(0, 800),
        metrics: {
          replies: parseMetric('回复') ?? parseMetric('repl'),
          retweets: parseMetric('转帖') ?? parseMetric('repost'),
          likes: parseMetric('喜欢') ?? parseMetric('like'),
          views: parseMetric('查看') ?? parseMetric('view'),
        },
      });
    }
    return results;
  });
}

async function main() {
  console.log('[fetch-x] launching browser…');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' });
  const page = await ctx.newPage();

  // load saved cookies if any
  try {
    const cookies = JSON.parse(process.env.X_COOKIES_JSON || '[]');
    await ctx.addCookies(cookies);
  } catch {}

  try {
    const allDiscussions: Tweet[] = [];
    for (const { q, sort } of QUERIES) {
      console.log(`[fetch-x] searching "${q}" (${sort})`);
      const tweets = await scrapeQuery(page, q, sort);
      allDiscussions.push(...tweets);
    }
    const dedup = [...new Map(allDiscussions.filter((t) => t.statusUrl).map((t) => [t.statusUrl, t])).values()];

    const officialTweets = await scrapeProfile(page, 'typesafeai');
    const founderTweets = await scrapeProfile(page, 'CompleteSkeptic');

    for (const t of officialTweets) t.source = 'official';
    for (const t of founderTweets) t.source = 'founder';
    for (const t of dedup) t.source = t.source ?? 'community';

    await writeFile(join(OUT, 'official-tweets.json'), JSON.stringify(officialTweets.slice(0, 20), null, 2));
    await writeFile(join(OUT, 'founder-tweets.json'), JSON.stringify(founderTweets.slice(0, 20), null, 2));
    await writeFile(join(OUT, 'recent-discussions.json'), JSON.stringify(dedup.slice(0, 50), null, 2));

    console.log(`[fetch-x] saved ${officialTweets.length} official, ${founderTweets.length} founder, ${dedup.length} discussions`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
