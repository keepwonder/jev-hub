/**
 * Refresh awesome-typesafe project list with current GitHub star counts
 * and auto-discover trending Jev-related repos.
 *
 * Output shape:
 *   {
 *     meta: { lastUpdated, totalFound, featuredCount, okCount, trendingCount },
 *     projects: [...],        // curated FEATURED set, with current stars
 *     trending: [...],        // auto-discovered NEW repos (last 60 days, ≥10 stars)
 *   }
 */
import { writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/awesome-typesafe.json');

// Curated whitelist — high quality, manually picked. To add a new repo,
// PR an edit here. Don't auto-add to this list.
const FEATURED = new Set([
  'typesafe-ai/typesafe-sdk-python',
  'typesafe-ai/typesafe-sdk-js',
  'typesafe-ai/skills',
  'Anil-matcha/awesome-jev-by-typesafe',
  'yibie/awesome-jev',
  'AbdelStark/awesome-typesafe',
  'cobanov/awesome-jev',
  'v-modal/awesome-jev-tools',
  'jkudish/jev-browser',
  'jkudish/jev-mcp',
  'tamaratran/jev-pruner',
  'y0usaf/pi-jev',
  'realZachi/pg-jev',
  'fhshaik/typesafe-mario',
  'thruwire/foreman',
  'dbreunig/building-with-jev-skill',
  'itsmostafa/typesafe-mcp',
  'fatwang2/awesome-jev',
]);

// Thresholds for the auto-discovered "trending" section
const TRENDING_DAYS = 60;
const TRENDING_MIN_STARS = 10;
const TRENDING_MAX_ITEMS = 12;

interface Project {
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number | null;
  language: string | null;
  tags: string[];
  updatedAt: string | null;
  status: 'ok' | 'not-found';
}

function classify(fullName: string, desc: string): string[] {
  const t = (fullName + ' ' + desc).toLowerCase();
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
  if (tags.length === 0) tags.push('Tool');
  return tags;
}

async function loadExisting(): Promise<{ projects: Record<string, Project>; trending: Record<string, Project> }> {
  try {
    const raw = await readFile(OUT, 'utf8');
    const data = JSON.parse(raw);
    const map: Record<string, Project> = {};
    for (const p of data.projects ?? []) map[`${p.owner}/${p.name}`] = p;
    const tmap: Record<string, Project> = {};
    for (const p of data.trending ?? []) map[`${p.owner}/${p.name}`] = p;
    return { projects: map, trending: tmap };
  } catch {
    return { projects: {}, trending: {} };
  }
}

async function fetchRepo(
  fullName: string,
  headers: Record<string, string>,
): Promise<Project | null> {
  const [owner, name] = fullName.split('/');
  try {
    let r = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
    if (r.status === 401) {
      delete headers.Authorization;
      r = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
    }
    if (r.status === 404) return null;
    if (!r.ok) return null;
    const repo = await r.json() as any;
    const desc = (repo.description ?? '').slice(0, 200);
    return {
      name, owner,
      description: desc,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
      tags: classify(fullName, desc),
      updatedAt: (repo.updated_at ?? '').slice(0, 10),
      status: 'ok',
    };
  } catch {
    return null;
  }
}

async function main() {
  const existing = await loadExisting();
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'jev-hub-fetcher',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  // 1) Search for top Jev-related repos
  const searchUrl = `https://api.github.com/search/repositories?q=typesafe+jev&per_page=100&sort=stars`;
  console.log('[fetch-github] querying GitHub Search API…');
  let r = await fetch(searchUrl, { headers });
  if (r.status === 401 && process.env.GITHUB_TOKEN) {
    console.warn('[fetch-github] 401 with token — falling back to anonymous');
    delete headers.Authorization;
    r = await fetch(searchUrl, { headers });
  }
  if (!r.ok) {
    console.error(`[fetch-github] GitHub API ${r.status}`);
    process.exit(1);
  }
  const data = await r.json() as any;
  const items = data.items ?? [];
  console.log(`[fetch-github] got ${items.length} of ${data.total_count ?? 0} matching repos`);

  // 2) Refresh FEATURED set
  const lookup: Record<string, any> = {};
  for (const repo of items) lookup[repo.full_name] = repo;

  const projects: Project[] = [];
  const missedFromSearch: string[] = [];
  for (const fullName of FEATURED) {
    const repo = lookup[fullName];
    if (repo) {
      const desc = (repo.description ?? '').slice(0, 200);
      projects.push({
        name: fullName.split('/')[1],
        owner: fullName.split('/')[0],
        description: desc,
        url: repo.html_url,
        stars: repo.stargazers_count ?? 0,
        language: repo.language ?? null,
        tags: classify(fullName, desc),
        updatedAt: (repo.updated_at ?? '').slice(0, 10),
        status: 'ok',
      });
    } else {
      missedFromSearch.push(fullName);
    }
  }
  for (const fullName of missedFromSearch) {
    const fetched = await fetchRepo(fullName, { ...headers });
    const previous = existing.projects[fullName];
    if (fetched) {
      projects.push(fetched);
    } else if (previous) {
      projects.push({ ...previous, status: 'not-found' });
    } else {
      const [owner, name] = fullName.split('/');
      projects.push({
        name, owner, description: '',
        url: `https://github.com/${owner}/${name}`,
        stars: null, language: null, tags: [],
        updatedAt: null, status: 'not-found',
      });
    }
    await new Promise((res) => setTimeout(res, 700));
  }

  // 3) Discover trending — NEW repos (created in last N days, ≥ M stars)
  //    that aren't already in FEATURED.
  const cutoff = new Date(Date.now() - TRENDING_DAYS * 24 * 3600 * 1000);
  const featuredNames = new Set(FEATURED);
  const trendingCandidates = items.filter((repo: any) => {
    if (featuredNames.has(repo.full_name)) return false;
    if ((repo.stargazers_count ?? 0) < TRENDING_MIN_STARS) return false;
    const created = new Date(repo.created_at);
    return created > cutoff;
  });
  // Sort by stars desc, take top N
  trendingCandidates.sort((a: any, b: any) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0));
  const topTrending = trendingCandidates.slice(0, TRENDING_MAX_ITEMS);
  console.log(`[fetch-github] discovered ${trendingCandidates.length} trending candidates (last ${TRENDING_DAYS} days, ≥${TRENDING_MIN_STARS}★), keeping top ${topTrending.length}`);

  const trending: Project[] = topTrending.map((repo: any) => {
    const desc = (repo.description ?? '').slice(0, 200);
    return {
      name: repo.full_name.split('/')[1],
      owner: repo.full_name.split('/')[0],
      description: desc,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
      tags: classify(repo.full_name, desc),
      updatedAt: (repo.updated_at ?? '').slice(0, 10),
      status: 'ok',
    };
  });

  // Sort featured by stars desc, trending already sorted
  projects.sort((a, b) => {
    if (a.status !== 'ok' && b.status === 'ok') return 1;
    if (b.status !== 'ok' && a.status === 'ok') return -1;
    return (b.stars ?? 0) - (a.stars ?? 0);
  });

  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      totalFound: data.total_count ?? 0,
      featuredCount: projects.length,
      okCount: projects.filter((p) => p.status === 'ok').length,
      trendingCount: trending.length,
    },
    projects,
    trending,
  };

  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n');

  console.log(`\n[fetch-github] saved ${projects.filter((p) => p.status === 'ok').length} featured + ${trending.length} trending`);
  console.log(`[fetch-github] lastUpdated: ${output.meta.lastUpdated}\n`);
  console.log('Top featured:');
  for (const p of projects.slice(0, 5)) {
    const s = p.stars != null ? `${p.stars}★` : 'N/A';
    console.log(`  ${s.padStart(7)}  ${p.owner}/${p.name}`);
  }
  console.log('\nTrending (new):');
  for (const p of trending.slice(0, 5)) {
    console.log(`  ${`${p.stars}★`.padStart(7)}  ${p.owner}/${p.name}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
