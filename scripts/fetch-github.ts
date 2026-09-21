/**
 * Fetch all jev-related repos from GitHub Search API.
 *
 * Strategy:
 *   - Fetch all matching repos up to GitHub's 1000-result search cap
 *     (10 pages × 100). This keeps the set comprehensive and stable —
 *     previously capping at 300 meant lower-starred Jev projects fell out
 *     of the top-300 window as stars shifted, so the count shrank.
 *   - Query uses OR (typesafe OR jev) so repos with only 'jev' in
 *     name/description (e.g., awesome-jev-projects) are also picked up
 *   - Each repo carries full metadata (stars, language, created, updated, topics)
 *     so the UI can filter/sort client-side.
 *
 * Thresholds:
 *   - Min 5 stars (filters out forks/abandoned experiments)
 *   - Up to 1000 repos total (GitHub search API result cap)
 *
 * Runs every 6 hours via GitHub Actions.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/awesome-typesafe.json');

const MIN_STARS = 5;
const PER_PAGE = 100;
const MAX_PAGES = 10;  // up to 1000 repos (GitHub search API result cap)

// Relevance check — Jev-specific signal required (not just 'typesafe'):
//   Tier 1: Jev-specific keyword in description
//     (most reliable — a project whose description says 'Jev' is Jev-related)
//   Tier 2: Jev-specific keyword in BOTH name AND topics
//     (catches 'awesome-jev-*' repos and similar — named with jev AND tagged)
//   Tier 3: 'typesafe-ai' OR 'system-one' in topics AND Jev-specific in topics
//     (catches official typesafe-ai/jev-* repos and similar — tagged as Jev-related)
//   Tier 4: blacklist (manual exceptions like tinystruct/tinystruct)
//
// 'typesafe' alone (without any Jev-specific signal) is too permissive —
// TypeSafe was also the old name of Lightbend (Akka, Play, Slick, Lagom era),
// so any keyword match would let unrelated Java/Scala/Next.js projects slip through.
const JEV_PATTERNS = [
  /\bjev\b/i,
  /system[\s-]*one/i,
  /\brlcd\b/i,
];
const TYPESAFE_TOPIC = /\btypesafe(-ai)?\b/i;
const SYSTEM_ONE_TOPIC = /\bsystem[\s-]*one\b/i;

function isRelevant(p: { description?: string; name?: string; topics?: string[] }): boolean {
  const name = p.name ?? '';
  const desc = p.description ?? '';
  const topics = (p.topics ?? []).join(' ');

  // Tier 1: Jev-specific keyword in description (most common case for legit Jev projects)
  if (JEV_PATTERNS.some((re) => re.test(desc))) return true;

  // Tier 2: Jev-specific in BOTH name AND topics
  if (JEV_PATTERNS.some((re) => re.test(name)) &&
      JEV_PATTERNS.some((re) => re.test(topics))) return true;

  // Tier 3: 'typesafe-ai' or 'system-one' topic AND Jev-specific in topics
  if ((TYPESAFE_TOPIC.test(topics) || SYSTEM_ONE_TOPIC.test(topics)) &&
      JEV_PATTERNS.some((re) => re.test(topics))) return true;

  return false;
}

// Confirmed false positives — projects that match "typesafe jev" in search
// but are unrelated. Add owner/name here to permanently exclude.
const BLACKLIST = new Set([
  'tinystruct/tinystruct',  // 2017 Java framework — spam-tagged with jev topics
]);

interface Project {
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  tags: string[];
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date
  pushedAt: string | null; // ISO date (last commit)
}

function classify(fullName: string, desc: string, topics: string[]): string[] {
  const t = (fullName + ' ' + desc + ' ' + topics.join(' ')).toLowerCase();
  const tags: string[] = [];
  if (t.includes('awesome') || t.includes('curated')) tags.push('awesome-list');
  if (t.includes('sdk') || t.includes('client') || t.includes('wrapper')) tags.push('SDK');
  if (t.includes('mcp')) tags.push('MCP');
  if (t.includes('agent')) tags.push('Agent');
  if (t.includes('browser')) tags.push('Browser');
  if (t.includes('claude code') || /\bpi\b/.test(t)) tags.push('Claude Code');
  if (t.includes('guardrail') || t.includes('prune') || t.includes('warden')) tags.push('guardrail');
  if (t.includes('postgres') || t.includes('sql') || t.includes('database')) tags.push('Database');
  if (t.includes('mario') || t.includes('doom') || t.includes('game')) tags.push('Games');
  if (t.includes('rerank') || t.includes('search') || t.includes('retrieval')) tags.push('Search');
  if (t.includes('bot') || t.includes('discord') || t.includes('slack')) tags.push('Bot');
  if (t.includes('cookbook') || t.includes('tutorial') || t.includes('example')) tags.push('Tutorial');
  if (tags.length === 0) tags.push('Tool');
  return tags;
}

async function fetchPage(page: number, headers: Record<string, string>, attempt = 1): Promise<any> {
  const url = `https://api.github.com/search/repositories?q=typesafe+OR+jev+stars:%3E${MIN_STARS}&per_page=${PER_PAGE}&page=${page}&sort=stars&order=desc`;
  let r = await fetch(url, { headers });
  if (r.status === 401) {
    delete headers.Authorization;
    r = await fetch(url, { headers });
  }
  if (r.status === 403 || r.status === 429) {
    if (attempt > 4) throw new Error(`GitHub API ${r.status} after ${attempt} retries`);
    // Prefer Retry-After, then x-ratelimit-reset, then exponential backoff.
    // GitHub secondary rate limits (403 without a useful reset header) require
    // a long, minimum backoff — otherwise we re-hit the limit instantly.
    const retryAfter = r.headers.get('retry-after');
    const resetHeader = r.headers.get('x-ratelimit-reset');
    let wait = Math.pow(2, attempt) * 15000;  // 30s, 60s, 120s, 240s…
    if (retryAfter) wait = Math.max(wait, parseInt(retryAfter, 10) * 1000);
    else if (resetHeader) wait = Math.max(wait, parseInt(resetHeader, 10) * 1000 - Date.now());
    wait = Math.max(wait, 15000);
    console.warn(`[fetch-github] page ${page}: ${r.status} — waiting ${Math.ceil(wait / 1000)}s`);
    await new Promise((res) => setTimeout(res, wait));
    return fetchPage(page, headers, attempt + 1);
  }
  if (!r.ok) throw new Error(`GitHub API ${r.status}: ${await r.text()}`);
  return r.json() as Promise<any>;
}

async function main() {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'jev-hub-fetcher',
  };
  const hasToken = !!process.env.GITHUB_TOKEN;
  if (hasToken) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  console.log(`[fetch-github] fetching up to ${MAX_PAGES * PER_PAGE} jev repos (≥${MIN_STARS}★)...`);

  const allRepos: any[] = [];
  let totalFound = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await fetchPage(page, headers);
    if (page === 1) totalFound = data.total_count ?? 0;
    const items = data.items ?? [];
    if (items.length === 0) break;
    allRepos.push(...items);
    console.log(`  page ${page}: +${items.length} (total ${allRepos.length}/${totalFound})`);
    if (items.length < PER_PAGE) break;  // last page
    // Throttle: with token 30 req/min → 2.5s is fine; anonymous is 10 req/min,
    // so wait longer (6.5s) to avoid hammering the limit. Retry logic handles
    // any residual 403/429 by waiting for the reset header.
    await new Promise((res) => setTimeout(res, hasToken ? 2500 : 6500));
  }

  // Filter out blacklisted and non-relevant repos (false positives
  // with topic spam but no actual Jev mention in description)
  const beforeFilter = allRepos.length;
  const filtered = allRepos.filter((r) => {
    if (BLACKLIST.has(r.full_name)) return false;
    if (!isRelevant(r)) return false;
    return true;
  });
  console.log(`  filtered: -${beforeFilter - filtered.length} (blacklist + non-relevant)`);

  const projects: Project[] = filtered.map((repo: any) => {
    const desc = (repo.description ?? '').slice(0, 200);
    return {
      name: repo.full_name.split('/')[1],
      owner: repo.full_name.split('/')[0],
      description: desc,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      language: repo.language ?? null,
      topics: repo.topics ?? [],
      tags: classify(repo.full_name, desc, repo.topics ?? []),
      createdAt: (repo.created_at ?? '').slice(0, 10),
      updatedAt: (repo.updated_at ?? '').slice(0, 10),
      pushedAt: (repo.pushed_at ?? '').slice(0, 10) || null,
    };
  });

  // Sort by stars desc (already sorted from API, but defensive)
  projects.sort((a, b) => b.stars - a.stars);

  // Build language facets (for filter UI)
  const langCounts: Record<string, number> = {};
  for (const p of projects) {
    const lang = p.language ?? 'Unknown';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  }
  const languages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      totalFound,
      shownCount: projects.length,
      languages,
    },
    projects,
  };

  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n[fetch-github] saved ${projects.length} projects (of ${totalFound} total matching)`);
  console.log(`[fetch-github] languages: ${languages.slice(0, 5).map((l) => `${l.name}(${l.count})`).join(', ')}...`);
  console.log(`[fetch-github] lastUpdated: ${output.meta.lastUpdated}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
