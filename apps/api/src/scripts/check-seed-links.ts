import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheetSeedSchema } from '@dsa/shared';

function resolveSeedPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, '../data/sheet-seed.json'),
    path.join(here, '../../src/data/sheet-seed.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('sheet-seed.json not found');
}

type CheckResult = {
  url: string;
  ok: boolean;
  blocked?: boolean;
  status?: number;
  error?: string;
};

const browserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
};

function isWafHost(url: string): boolean {
  return url.includes('leetcode.com') || url.includes('codeforces.com');
}

async function checkUrl(url: string): Promise<CheckResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: browserHeaders,
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });

    if (response.ok) {
      return { url, ok: true, status: response.status };
    }

    // LeetCode/Codeforces often return 403 to datacenter/bot clients even for valid URLs.
    if (response.status === 403 && isWafHost(url)) {
      return { url, ok: true, blocked: true, status: response.status };
    }

    return { url, ok: false, status: response.status };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main(): Promise<void> {
  const raw = JSON.parse(readFileSync(resolveSeedPath(), 'utf8')) as unknown;
  const parsed = sheetSeedSchema.parse(raw);

  const youtube = new Set<string>();
  const articles = new Set<string>();
  const platforms = new Set<string>();

  for (const chapter of parsed.chapters) {
    for (const topic of chapter.topics) {
      for (const problem of topic.problems) {
        youtube.add(problem.resources.youtube);
        articles.add(problem.resources.article);
        if (problem.resources.leetcode) platforms.add(problem.resources.leetcode);
        if (problem.resources.codeforces) platforms.add(problem.resources.codeforces);
      }
    }
  }

  // Sample: all unique youtube + article hosts, plus a few platform problem URLs.
  const platformSample = [...platforms].filter((_, index) => index % 20 === 0).slice(0, 8);
  const uniqueSample = [...youtube, ...articles, ...platformSample];

  console.log(`Checking ${uniqueSample.length} sample URLs…`);
  console.log(
    'Note: leetcode.com / codeforces.com may return 403 to automated clients; those are treated as WAF-blocked, not dead.',
  );

  const results: CheckResult[] = [];
  for (const url of uniqueSample) {
    const result = await checkUrl(url);
    results.push(result);
    const mark = result.blocked ? 'WAF' : result.ok ? 'OK ' : 'DEAD';
    console.log(`${mark} ${result.status ?? ''} ${url}${result.error ? ` (${result.error})` : ''}`);
  }

  const dead = results.filter((result) => !result.ok);
  const blocked = results.filter((result) => result.blocked);

  console.log(`\nOK: ${results.filter((r) => r.ok && !r.blocked).length}`);
  console.log(`WAF-blocked (manual browser check recommended): ${blocked.length}`);
  console.log(`Dead: ${dead.length}`);

  if (dead.length > 0) {
    console.error('\nDead links found. Fix them in sheet-seed.json.');
    process.exitCode = 1;
    return;
  }

  console.log('\nNo dead links in the sample.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
