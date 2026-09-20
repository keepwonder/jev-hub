/**
 * Fetch awesome-typesafe project list from GitHub Search API.
 * Pulls the top Jev-related repos by star count, then filters to a curated whitelist.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/awesome-typesafe.json');

interface Project {
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number;
  language: string | null;
  tags: string[];
  updatedAt: string;
}

// Curated whitelist — only include repos we want to feature on the site.
// Add a repo here to feature it.
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
  if (t.includes('discord') || t.includes('bot')) tags.push('Bot');
  if (tags.length === 0) tags.push('Tool');
  return tags;
}

async function main() {
  // Query GitHub Search API for top Jev-related repos
  const url = 'https://api.github.com/search/repositories?q=typesafe+jev&per_page=100&sort=stars';
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'jev-hub-fetcher',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const r = await fetch(url, { headers });
  if (!r.ok) {
    throw new Error(`GitHub API ${r.status}: ${await r.text()}`);
  }
  const data = await r.json() as any;

  const projects: Project[] = [];
  for (const repo of data.items ?? []) {
    const fullName: string = repo.full_name;
    if (!FEATURED.has(fullName)) continue;
    projects.push({
      name: fullName.split('/')[1],
      owner: fullName.split('/')[0],
      description: (repo.description ?? '').slice(0, 200),
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
      tags: classify(fullName, repo.description ?? ''),
      updatedAt: (repo.updated_at ?? '').slice(0, 10),
    });
  }

  projects.sort((a, b) => b.stars - a.stars);

  await writeFile(OUT, JSON.stringify(projects, null, 2) + '\n');
  console.log(`[fetch-github] saved ${projects.length} featured projects (out of ${data.total_count} total matching)`);
  for (const p of projects.slice(0, 5)) {
    console.log(`  ${String(p.stars).padStart(5)}★  ${p.owner}/${p.name}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
