import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".analytics");
const SEARCHES_FILE = join(DATA_DIR, "searches.json");

type SearchEvent = {
  query: string;
  resultCount: number;
  timestamp: string;
  ip: string;
  blocked: boolean;
};

// Serial write queue to prevent concurrent write data loss
let writeQueue: Promise<void> = Promise.resolve();

async function ensureDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

async function readEvents(): Promise<SearchEvent[]> {
  try {
    const data = await readFile(SEARCHES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function logSearch(event: SearchEvent): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await ensureDir();
    const events = await readEvents();
    events.push(event);
    const trimmed = events.slice(-1000);
    await writeFile(SEARCHES_FILE, JSON.stringify(trimmed, null, 2));
  }).catch(() => {});
  return writeQueue;
}

export async function getAnalytics() {
  const events = await readEvents();

  const totalSearches = events.length;
  const blockedSearches = events.filter((e) => e.blocked).length;
  const uniqueIPs = new Set(events.map((e) => e.ip)).size;

  // Top queries
  const queryCounts: Record<string, number> = {};
  for (const e of events) {
    if (!e.blocked) {
      const q = e.query.toLowerCase().trim();
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    }
  }
  const topQueries = Object.entries(queryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([query, count]) => ({ query, count }));

  // Searches per hour (last 24h)
  const now = Date.now();
  const last24h = events.filter(
    (e) => now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
  );

  // Average results per search
  const withResults = events.filter((e) => !e.blocked && e.resultCount > 0);
  const avgResults =
    withResults.length > 0
      ? Math.round(
          withResults.reduce((s, e) => s + e.resultCount, 0) /
            withResults.length
        )
      : 0;

  return {
    totalSearches,
    blockedSearches,
    uniqueUsers: uniqueIPs,
    searchesLast24h: last24h.length,
    avgResults,
    topQueries,
    recentSearches: events
      .filter((e) => !e.blocked)
      .slice(-10)
      .reverse()
      .map((e) => ({
        query: e.query,
        results: e.resultCount,
        time: e.timestamp,
      })),
  };
}
