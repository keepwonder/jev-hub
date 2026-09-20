/**
 * Refresh awesome-typesafe project list with current GitHub star counts.
 *
 * Strategy:
 *   - Use GitHub Search API to fetch top 100 jev-related repos in ONE request.
 *   - Filter to FEATURED whitelist.
 *   - Save meta.lastUpdated so the UI can show data freshness.
 *
 * Rate limits:
 *   - Anonymous: 30 requests/min for search
 *   - With GITHUB_TOKEN: 30/min search, 5000/hr for other endpoints
 *
 * To run locally with token:
 *   GITHUB_TOKEN=ghp_xxx npm run fetch:github
 */
import { writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/awesome-typesafe.json');

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
  if (tags.length === 0) tags.push('Tool');
  return tags;
}

async function loadExisting(): Promise<Record<string, Project>> {
  try {
    const raw = await readFile(OUT, 'utf8');
    const data = JSON.parse(raw);
    const projects: Project[] = data.projects ?? data ?? [];
    const map: Record<string, Project> = {};
    for (const p of projects) {
      map[`${p.owner}/${p.name}`] = p;
    }
    return map;
  } catch {
    return {};
  }
}

async function main() {
  const existing = await loadExisting();

  // Use GitHub Search API — returns up to 100 repos matching query
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'jev-hub-fetcher',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const url = 'https://api.github.com/search/repositories?q=typesafe+jev&per_page=100&sort=stars';
  console.log('[fetch-github] querying GitHub Search API…');
  let r = await fetch(url, { headers });
  // If 401 with token, fall back to anonymous
  if (r.status === 401 && process.env.GITHUB_TOKEN) {
    console.warn('[fetch-github] 401 with token — falling back to anonymous');
    delete headers.Authorization;
    r = await fetch(url, { headers });
  }
  if (!r.ok) {
    console.error(`[fetch-github] GitHub API ${r.status}: ${await r.text()}`);
    process.exit(1);
  }
  const data = await r.json() as any;
  const total = data.total_count ?? 0;
  console.log(`[fetch-github] got ${data.items?.length ?? 0} of ${total} matching repos`);

  // Build lookup from search results
  const lookup: Record<string, any> = {};
  for (const repo of data.items ?? []) {
    lookup[repo.full_name] = repo;
  }

  // Update each featured repo
  const projects: Project[] = [];
  const missedFromSearch: string[] = [];
  for (const fullName of FEATURED) {
    const [owner, name] = fullName.split('/');
    const repo = lookup[fullName];

    if (repo) {
      const desc = (repo.description ?? '').slice(0, 200);
      projects.push({
        name,
        owner,
        description: desc,
        url: repo.html_url,
        stars: repo.stargazers_count ?? 0,
        language: repo.language ?? null,
        tags: classify(fullName, desc),
        updatedAt: (repo.updated_at ?? '').slice(0, 10),
        status: 'ok',
      });
    } else {
      // Not in search results — might still exist (e.g. official SDKs
      // whose description doesn't mention "jev"). Queue for direct fetch.
      missedFromSearch.push(fullName);
    }
  }

  // Direct fetch for repos missed by search — uses 1 request per repo
  for (const fullName of missedFromSearch) {
    const [owner, name] = fullName.split('/');
    const direct = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
    let entry: Project;
    if (direct.ok) {
      const repo = await direct.json() as any;
      const desc = (repo.description ?? '').slice(0, 200);
      entry = {
        name, owner,
        description: desc,
        url: repo.html_url,
        stars: repo.stargazers_count ?? 0,
        language: repo.language ?? null,
        tags: classify(fullName, desc),
        updatedAt: (repo.updated_at ?? '').slice(0, 10),
        status: 'ok',
      };
    } else if (direct.status === 404) {
      entry = {
        name, owner, description: '',
        url: `https://github.com/${owner}/${name}`,
        stars: existing[fullName]?.stars ?? null,
        language: null, tags: [],
        updatedAt: null, status: 'not-found',
      };
    } else {
      // 401/403/5xx — keep previous data
      entry = existing[fullName] ?? {
        name, owner, description: '',
        url: `https://github.com/${owner}/${name}`,
        stars: null, language: null, tags: [],
        updatedAt: null, status: 'not-found',
      };
    }
    projects.push(entry);
    await new Promise((r) => setTimeout(r, 800));  // throttle
  }

  projects.sort((a, b) => {
    if (a.status !== 'ok' && b.status === 'ok') return 1;
    if (b.status !== 'ok' && a.status === 'ok') return -1;
    return (b.stars ?? 0) - (a.stars ?? 0);
  });

  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      totalFound: total,
      featuredCount: projects.length,
      okCount: projects.filter((p) => p.status === 'ok').length,
    },
    projects,
  };

  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n');

  const ok = projects.filter((p) => p.status === 'ok').length;
  console.log(`\n[fetch-github] saved ${ok}/${projects.length} projects (lastUpdated: ${output.meta.lastUpdated})`);
  for (const p of projects.slice(0, 5)) {
    const starStr = p.stars != null ? `${p.stars}★` : 'N/A';
    console.log(`  ${starStr.padStart(7)}  ${p.owner}/${p.name}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
