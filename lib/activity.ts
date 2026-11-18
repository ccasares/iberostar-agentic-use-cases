import fs from "node:fs";
import path from "node:path";
import { emailDomain } from "./email-domains";

// DB-free persistence, mirroring lib/stats.ts. On Railway the filesystem is
// ephemeral (resets on redeploy); mount a volume and set STATS_DIR to persist.
const ACTIVITY_DIR = process.env.STATS_DIR || path.join(process.cwd(), ".data");
const ACTIVITY_FILE = path.join(ACTIVITY_DIR, "activity.json");

// Cap stored events so the file can't grow unbounded on a long-running demo.
const MAX_EVENTS = 5000;

export interface LoginEvent {
  email: string;
  at: string;
}

export interface ViewEvent {
  email: string;
  slug: string;
  at: string;
}

interface ActivityData {
  logins: LoginEvent[];
  views: ViewEvent[];
}

export interface UserSummary {
  email: string;
  count: number;
  lastAt: string;
}

export interface ViewerSummary extends UserSummary {
  slug: string;
}

function ensureDir() {
  try {
    fs.mkdirSync(ACTIVITY_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function readAll(): ActivityData {
  try {
    const raw = fs.readFileSync(ACTIVITY_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<ActivityData>;
    return {
      logins: Array.isArray(parsed.logins) ? parsed.logins : [],
      views: Array.isArray(parsed.views) ? parsed.views : [],
    };
  } catch {
    return { logins: [], views: [] };
  }
}

function writeAll(data: ActivityData) {
  ensureDir();
  // Keep only the most recent events.
  data.logins = data.logins.slice(-MAX_EVENTS);
  data.views = data.views.slice(-MAX_EVENTS);
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2));
}

export function recordLogin(email: string) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized.includes("@")) return;
  const data = readAll();
  data.logins.push({ email: normalized, at: new Date().toISOString() });
  writeAll(data);
}

export function recordView(email: string, slug: string) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized.includes("@") || !slug) return;
  const data = readAll();
  data.views.push({ email: normalized, slug, at: new Date().toISOString() });
  writeAll(data);
}

function summarize(
  events: { email: string; at: string }[]
): UserSummary[] {
  const map = new Map<string, UserSummary>();
  for (const e of events) {
    const existing = map.get(e.email);
    if (existing) {
      existing.count += 1;
      if (e.at > existing.lastAt) existing.lastAt = e.at;
    } else {
      map.set(e.email, { email: e.email, count: 1, lastAt: e.at });
    }
  }
  return [...map.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

// Logins, optionally filtered to a single domain.
export function getLogins(domain?: string): UserSummary[] {
  const data = readAll();
  const events = domain
    ? data.logins.filter((l) => emailDomain(l.email) === domain)
    : data.logins;
  return summarize(events);
}

// Distinct viewers for a single use case, optionally filtered to a domain.
export function getViewersForSlug(
  slug: string,
  domain?: string
): UserSummary[] {
  const data = readAll();
  const events = data.views
    .filter((v) => v.slug === slug)
    .filter((v) => (domain ? emailDomain(v.email) === domain : true));
  return summarize(events);
}

// Total view counts per use case for a given domain (slug -> distinct viewers).
export function getViewerCountsBySlug(
  domain?: string
): Record<string, number> {
  const data = readAll();
  const bySlug = new Map<string, Set<string>>();
  for (const v of data.views) {
    if (domain && emailDomain(v.email) !== domain) continue;
    if (!bySlug.has(v.slug)) bySlug.set(v.slug, new Set());
    bySlug.get(v.slug)!.add(v.email);
  }
  const out: Record<string, number> = {};
  for (const [slug, set] of bySlug) out[slug] = set.size;
  return out;
}
