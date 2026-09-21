/**
 * Fetch recent tweets from X / Twitter using a headless browser.
 * Requires: TWITTER_AUTH_TOKEN, TWITTER_CT0 (or you must be logged in via a session).
 *
 * Strategy (incremental merge + metric refresh):
 *   1. Load EXISTING data (official-tweets / founder-tweets / recent-discussions).
 *   2. Scrape fresh tweets from search + profiles (previous behavior).
 *   3. MERGE by status URL — existing posts are kept (no data loss), their
 *      metrics are updated when re-seen, and new posts are appended.
 *   4. REFRESH pass — visit a bounded number of existing status URLs that were
 *      NOT re-seen in this scrape, to pull current metrics (replies/RT/likes/views).
 *
 * This keeps the set growing and the numbers fresh, instead of overwriting the
 * file with only whatever happened to be in the latest scrape window.
 *
 * NOTE: For ethical scraping, prefer using official X API when possible.
 * This script is for personal use only — be respectful of rate limits.
 */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
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

// Per-category caps (merge keeps the most recent N by datetime).
const MAX_OFFICIAL = 30;
const MAX_FOUNDER = 30;
const MAX_DISCUSSIONS = 60;
// How many existing status URLs to re-visit for fresh metrics each run.
const MAX_REFRESH = 30;

async function loadJSON(file: string): Promise<Tweet[]> {
  try {
    return JSON.parse(await readFile(join(OUT, file), 'utf8'));
  } catch {
    return [];
  }
}

function statusId(url: string): string {
  const m = url.match(/status\/(\d+)/);
  return m ? m[1] : '';
}

// Only overwrite metrics that are actually present, so a partial scrape
// (e.g. missing views) never wipes a previously-known value.
function mergeMetrics(
  prev: Tweet['metrics'],
  next: Tweet['metrics'],
): Tweet['metrics'] {
  const out = { ...(prev ?? {}) };
  if (!next) return out;
  for (const k of ['replies', 'retweets', 'likes', 'views'] as const) {
    if (next[k] != null) out[k] = next[k];
  }
  return out;
}

// Merge by status URL: keep existing entries, refresh metrics when re-seen,
// append new ones, sort newest-first and cap.
function mergeTweets(existing: Tweet[], incoming: Tweet[], max: number): Tweet[] {
  const map = new Map<string, Tweet>();
  for (const t of existing) if (t.url) map.set(t.url, { ...t });
  for (const t of incoming) {
    if (!t.url) continue;
    const prev = map.get(t.url);
    if (prev) {
      map.set(t.url, {
        ...prev, // keeps prev.id / prev.source
        text: t.text || prev.text,
        datetime: t.datetime || prev.datetime,
        metrics: mergeMetrics(prev.metrics, t.metrics),
      });
    } else {
      map.set(t.url, {
        ...t,
        id: t.id || statusId(t.url) || t.authorHandle,
      });
    }
  }
  return [...map.values()]
    .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime))
    .slice(0, max);
}

// Scrape a single tweet's status page and return its live metrics.
async function scrapeStatusMetrics(page: any, url: string): Promise<Partial<Tweet> | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    return await page.evaluate(() => {
      const a = document.querySelector('article');
      if (!a) return null;
      const ariaLabels: string[] = [];
      const group = a.querySelector('[role="group"]');
      if (group) {
        // 汇总 aria-label(含 views)在 group 自身，按钮级标签在子元素里
        const own = group.getAttribute('aria-label');
        if (own) ariaLabels.push(own);
        for (const lab of group.querySelectorAll('[aria-label]')) {
          ariaLabels.push(lab.getAttribute('aria-label') || '');
        }
      }
      // 用匿名 IIFE 解析指标，避免 esbuild keepNames 注入 __name 导致
      // page.evaluate 序列化后在浏览器里报 ReferenceError: __name is not defined
      const metrics = (() => {
        let replies: number | undefined;
        let retweets: number | undefined;
        let likes: number | undefined;
        let views: number | undefined;
        for (const l of ariaLabels) {
          // 匹配「数字 + 单位 + 关键词」，兼容按钮级("65 回复。回复")和
          // 汇总级("65 回复、147 次转帖、2734 喜欢、709 书签、252164 次观看")，
          // 只有汇总标签里才有 views，且数字可能带 万/亿/K/M 单位。
          const re = /([\d.,]+)\s*([万亿KkMm]?)\s*[次]?\s*(回复|转帖|喜欢|书签|观看|查看|repl|repost|like|view)/g;
          let mm: RegExpExecArray | null;
          while ((mm = re.exec(l)) !== null) {
            const num = parseFloat(mm[1].replace(/,/g, ''));
            if (isNaN(num)) continue;
            const u = mm[2];
            const kw = mm[3];
            const val = Math.round(num * (u === '万' ? 10000 : u === '亿' ? 100000000 : (u === 'K' || u === 'k') ? 1000 : (u === 'M' || u === 'm') ? 1000000 : 1));
            if (kw === '回复' || kw === 'repl') { if (replies === undefined) replies = val; }
            else if (kw === '转帖' || kw === 'repost') { if (retweets === undefined) retweets = val; }
            else if (kw === '喜欢' || kw === 'like') { if (likes === undefined) likes = val; }
            else if (kw === '观看' || kw === '查看' || kw === 'view') { if (views === undefined) views = val; }
          }
        }
        return { replies, retweets, likes, views };
      })();
      const textEl = a.querySelector('[data-testid="tweetText"]');
      const timeEl = a.querySelector('time');
      return {
        text: textEl ? textEl.innerText : '',
        datetime: timeEl ? timeEl.getAttribute('datetime') || '' : '',
        metrics,
      };
    });
  } catch (e) {
    console.warn(`[fetch-x] refresh ${url}: ${e}`);
    return null;
  }
}

// X 懒加载推文，多滚几次才能加载出最新推文（否则只抓到已缓存的旧推文）。
async function scrollToLoad(page: any, times = 3): Promise<void> {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(1800);
  }
}

async function scrapeQuery(page: any, query: string, sort: string): Promise<Tweet[]> {
  const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=${sort}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  await scrollToLoad(page);

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
        // 汇总 aria-label(含 views)在 group 自身，按钮级标签在子元素里
        const own = group.getAttribute('aria-label');
        if (own) ariaLabels.push(own);
        for (const lab of group.querySelectorAll('[aria-label]')) {
          ariaLabels.push(lab.getAttribute('aria-label') || '');
        }
      }
      const metrics = (() => {
        let replies: number | undefined;
        let retweets: number | undefined;
        let likes: number | undefined;
        let views: number | undefined;
        for (const l of ariaLabels) {
          // 匹配「数字 + 单位 + 关键词」，兼容按钮级("65 回复。回复")和
          // 汇总级("65 回复、147 次转帖、2734 喜欢、709 书签、252164 次观看")，
          // 只有汇总标签里才有 views，且数字可能带 万/亿/K/M 单位。
          const re = /([\d.,]+)\s*([万亿KkMm]?)\s*[次]?\s*(回复|转帖|喜欢|书签|观看|查看|repl|repost|like|view)/g;
          let mm: RegExpExecArray | null;
          while ((mm = re.exec(l)) !== null) {
            const num = parseFloat(mm[1].replace(/,/g, ''));
            if (isNaN(num)) continue;
            const u = mm[2];
            const kw = mm[3];
            const val = Math.round(num * (u === '万' ? 10000 : u === '亿' ? 100000000 : (u === 'K' || u === 'k') ? 1000 : (u === 'M' || u === 'm') ? 1000000 : 1));
            if (kw === '回复' || kw === 'repl') { if (replies === undefined) replies = val; }
            else if (kw === '转帖' || kw === 'repost') { if (retweets === undefined) retweets = val; }
            else if (kw === '喜欢' || kw === 'like') { if (likes === undefined) likes = val; }
            else if (kw === '观看' || kw === '查看' || kw === 'view') { if (views === undefined) views = val; }
          }
        }
        return { replies, retweets, likes, views };
      })();
      results.push({
        handle,
        displayName,
        statusUrl,
        datetime,
        text: text.slice(0, 800),
        metrics,
      });
    }
    return results;
  });
}

async function scrapeProfile(page: any, handle: string): Promise<Tweet[]> {
  const url = `https://x.com/${handle}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  await scrollToLoad(page);

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
      if (group) {
        // 汇总 aria-label(含 views)在 group 自身，按钮级标签在子元素里
        const own = group.getAttribute('aria-label');
        if (own) ariaLabels.push(own);
        for (const lab of group.querySelectorAll('[aria-label]')) ariaLabels.push(lab.getAttribute('aria-label') || '');
      }
      const metrics = (() => {
        let replies: number | undefined;
        let retweets: number | undefined;
        let likes: number | undefined;
        let views: number | undefined;
        for (const l of ariaLabels) {
          // 匹配「数字 + 单位 + 关键词」，兼容按钮级("65 回复。回复")和
          // 汇总级("65 回复、147 次转帖、2734 喜欢、709 书签、252164 次观看")，
          // 只有汇总标签里才有 views，且数字可能带 万/亿/K/M 单位。
          const re = /([\d.,]+)\s*([万亿KkMm]?)\s*[次]?\s*(回复|转帖|喜欢|书签|观看|查看|repl|repost|like|view)/g;
          let mm: RegExpExecArray | null;
          while ((mm = re.exec(l)) !== null) {
            const num = parseFloat(mm[1].replace(/,/g, ''));
            if (isNaN(num)) continue;
            const u = mm[2];
            const kw = mm[3];
            const val = Math.round(num * (u === '万' ? 10000 : u === '亿' ? 100000000 : (u === 'K' || u === 'k') ? 1000 : (u === 'M' || u === 'm') ? 1000000 : 1));
            if (kw === '回复' || kw === 'repl') { if (replies === undefined) replies = val; }
            else if (kw === '转帖' || kw === 'repost') { if (retweets === undefined) retweets = val; }
            else if (kw === '喜欢' || kw === 'like') { if (likes === undefined) likes = val; }
            else if (kw === '观看' || kw === '查看' || kw === 'view') { if (views === undefined) views = val; }
          }
        }
        return { replies, retweets, likes, views };
      })();
      results.push({
        handle: location.pathname.split('/').filter(Boolean)[0],
        displayName: (document.querySelector('[data-testid="UserName"]')?.textContent || '').trim(),
        statusUrl, datetime, text: text.slice(0, 800),
        metrics,
      });
    }
    return results;
  });
}

// Normalize raw scraped articles into the Tweet shape.
function toTweets(raw: any[], source: Tweet['source']): Tweet[] {
  return raw
    .filter((t) => t.statusUrl)
    .map((t) => ({
      id: t.id || statusId(t.statusUrl) || t.handle,
      authorHandle: t.handle,
      authorName: t.displayName || `@${t.handle}`,
      datetime: t.datetime || '',
      text: t.text || '',
      url: t.statusUrl,
      metrics: t.metrics,
      source,
    }));
}

async function main() {
  console.log('[fetch-x] launching browser…');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' });
  const page = await ctx.newPage();

  // load saved cookies if any
  // Accept both formats:
  //   - Playwright array: [{name, value, domain, path}, ...]
  //   - object shorthand (per DEPLOY.md): { auth_token, ct0 }
  try {
    const raw = process.env.X_COOKIES_JSON || '[]';
    const parsed = JSON.parse(raw);
    let cookies: any[];
    if (Array.isArray(parsed)) {
      cookies = parsed;
    } else {
      cookies = Object.entries(parsed)
        .filter(([, v]) => typeof v === 'string')
        .map(([name, value]) => ({ name, value, domain: '.x.com', path: '/' }));
    }
    if (cookies.length) {
      await ctx.addCookies(cookies);
      console.log(`[fetch-x] loaded ${cookies.length} cookies`);
    } else {
      console.warn('[fetch-x] ⚠️ X_COOKIES_JSON 解析后为空 —— 抓取将以未登录状态运行');
    }
  } catch (e) {
    console.warn(`[fetch-x] ⚠️ 解析 X_COOKIES_JSON 失败: ${e}`);
  }

  try {
    // 1. Load existing data so we can merge (instead of overwrite).
    const existingOfficial = await loadJSON('official-tweets.json');
    const existingFounder = await loadJSON('founder-tweets.json');
    const existingDiscussions = await loadJSON('recent-discussions.json');
    console.log(`[fetch-x] existing: ${existingOfficial.length} official, ${existingFounder.length} founder, ${existingDiscussions.length} discussions`);

    // 2. Scrape fresh tweets.
    const allDiscussions: Tweet[] = [];
    for (const { q, sort } of QUERIES) {
      console.log(`[fetch-x] searching "${q}" (${sort})`);
      const tweets = await scrapeQuery(page, q, sort);
      allDiscussions.push(...toTweets(tweets, 'community'));
    }
    const officialRaw = await scrapeProfile(page, 'typesafeai');
    const founderRaw = await scrapeProfile(page, 'CompleteSkeptic');
    const officialTweets = toTweets(officialRaw, 'official');
    const founderTweets = toTweets(founderRaw, 'founder');
    console.log(`[fetch-x] scraped: ${officialTweets.length} official, ${founderTweets.length} founder, ${allDiscussions.length} discussions`);

    // 3. Merge with existing (keeps all, updates metrics, appends new).
    const official = mergeTweets(existingOfficial, officialTweets, MAX_OFFICIAL);
    const founder = mergeTweets(existingFounder, founderTweets, MAX_FOUNDER);
    const discussions = mergeTweets(existingDiscussions, allDiscussions, MAX_DISCUSSIONS);

    // 4. Refresh pass — re-visit existing statuses NOT seen in this scrape,
    //    so their engagement numbers stay current even if they fell out of
    //    the search window.
    const seen = new Set<string>();
    [...officialTweets, ...founderTweets, ...allDiscussions].forEach((t) => t.url && seen.add(t.url));
    const refreshPool = [...official, ...founder, ...discussions]
      .filter((t) => t.url && !seen.has(t.url))
      .sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime))
      .slice(0, MAX_REFRESH);
    console.log(`[fetch-x] refreshing metrics for ${refreshPool.length} existing tweets…`);
    let refreshed = 0;
    for (const t of refreshPool) {
      const fresh = await scrapeStatusMetrics(page, t.url);
      if (fresh) {
        t.metrics = mergeMetrics(t.metrics, fresh.metrics);
        if (fresh.text) t.text = fresh.text;
        if (fresh.datetime) t.datetime = fresh.datetime;
        refreshed++;
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    console.log(`[fetch-x] refreshed ${refreshed}/${refreshPool.length}`);

    // Likely cookie-expiry guard: if the scrape returned almost nothing, or
    // every tweet lacks engagement metrics, the session is probably dead.
    // Warn loudly instead of silently writing an empty/stale file.
    const freshTotal = allDiscussions.length + officialTweets.length + founderTweets.length;
    if (freshTotal === 0) {
      console.warn('[fetch-x] ⚠️ 抓取到 0 条推文 —— X_COOKIES_JSON 可能已过期或无效，请重新导出 auth_token/ct0 并更新 secret。');
    } else {
      const withMetrics = [...allDiscussions, ...officialTweets, ...founderTweets]
        .filter((t) => t.metrics && (t.metrics.likes != null || t.metrics.views != null)).length;
      if (withMetrics === 0) {
        console.warn('[fetch-x] ⚠️ 抓到推文但所有卡片都无指标(喜欢/查看) —— 疑似未登录，X_COOKIES_JSON 需重新导出。');
      } else {
        console.log(`[fetch-x] scraped ${freshTotal} fresh tweets (${withMetrics} with metrics)`);
      }
    }

    await writeFile(join(OUT, 'official-tweets.json'), JSON.stringify(official, null, 2));
    await writeFile(join(OUT, 'founder-tweets.json'), JSON.stringify(founder, null, 2));
    await writeFile(join(OUT, 'recent-discussions.json'), JSON.stringify(discussions, null, 2));

    console.log(`[fetch-x] saved ${official.length} official, ${founder.length} founder, ${discussions.length} discussions (merged)`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
