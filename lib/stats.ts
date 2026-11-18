import fs from "node:fs";
import path from "node:path";
import type { UseCaseStats } from "./types";

// DB-free persistence. On Railway the filesystem is ephemeral (resets on
// redeploy), which is acceptable for a demo portal. Mount a volume and set
// STATS_DIR to make it durable.
const STATS_DIR = process.env.STATS_DIR || path.join(process.cwd(), ".data");
const STATS_FILE = path.join(STATS_DIR, "stats.json");

type StatsMap = Record<string, UseCaseStats>;

function ensureDir() {
  try {
    fs.mkdirSync(STATS_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function readAll(): StatsMap {
  try {
    const raw = fs.readFileSync(STATS_FILE, "utf8");
    return JSON.parse(raw) as StatsMap;
  } catch {
    return {};
  }
}

function writeAll(map: StatsMap) {
  ensureDir();
  fs.writeFileSync(STATS_FILE, JSON.stringify(map, null, 2));
}

function normalize(s?: Partial<UseCaseStats>): UseCaseStats {
  return { views: s?.views ?? 0, likes: s?.likes ?? 0 };
}

export function getStats(slug: string): UseCaseStats {
  return normalize(readAll()[slug]);
}

export function getAllStats(slugs: string[]): StatsMap {
  const all = readAll();
  const out: StatsMap = {};
  for (const slug of slugs) out[slug] = normalize(all[slug]);
  return out;
}

export function incrementView(slug: string): UseCaseStats {
  const all = readAll();
  const current = normalize(all[slug]);
  current.views += 1;
  all[slug] = current;
  writeAll(all);
  return current;
}

export function setLike(slug: string, liked: boolean): UseCaseStats {
  const all = readAll();
  const current = normalize(all[slug]);
  current.likes = Math.max(0, current.likes + (liked ? 1 : -1));
  all[slug] = current;
  writeAll(all);
  return current;
}
