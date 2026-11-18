import fs from "node:fs";
import path from "node:path";

// DB-free persistence, mirroring lib/stats.ts. Stores the broker URL per use
// case so that the config set by the admin applies globally for everyone.
const CONFIG_DIR = process.env.STATS_DIR || path.join(process.cwd(), ".data");
const CONFIG_FILE = path.join(CONFIG_DIR, "broker-config.json");

export interface BrokerConfig {
  url: string;
}

type ConfigMap = Record<string, BrokerConfig>;

function ensureDir() {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function readAll(): ConfigMap {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) as ConfigMap;
  } catch {
    return {};
  }
}

function writeAll(map: ConfigMap) {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(map, null, 2));
}

// Durable, deploy-safe seed of broker URLs read from an env var. On hosts with
// an ephemeral/non-shared filesystem (e.g. Railway without a mounted volume),
// the on-disk config written via the admin UI is lost on redeploy and not
// shared across instances — so every other visitor sees "not configured".
// BROKER_CONFIG_JSON lets the configured URLs persist across deploys and be
// visible to all instances. Accepts either:
//   {"slug":"https://…/"}  or  {"slug":{"url":"https://…/"}}
function parseSeed(): ConfigMap {
  const raw = process.env.BROKER_CONFIG_JSON;
  if (!raw || !raw.trim()) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: ConfigMap = {};
    for (const [slug, value] of Object.entries(obj)) {
      const url =
        typeof value === "string"
          ? value
          : ((value as { url?: unknown })?.url as string | undefined);
      if (typeof url === "string" && url.trim()) out[slug] = { url: url.trim() };
    }
    return out;
  } catch {
    return {};
  }
}

const SEED = parseSeed();

// Merge the env seed (base) with the on-disk config (admin UI overrides), so a
// URL set through the UI wins when the filesystem is durable, and the env seed
// guarantees availability everywhere otherwise.
function mergedAll(): ConfigMap {
  const out: ConfigMap = { ...SEED };
  for (const [slug, entry] of Object.entries(readAll())) {
    if ((entry?.url || "").trim()) out[slug] = { url: entry.url.trim() };
  }
  return out;
}

export function getBrokerConfig(slug: string): BrokerConfig {
  const entry = mergedAll()[slug];
  return { url: entry?.url || "" };
}

// Returns every slug that has a non-empty broker URL configured, so the UI can
// flag which use cases have a live broker to chat with.
export function getConfiguredSlugs(): string[] {
  const all = mergedAll();
  return Object.keys(all).filter((slug) => (all[slug]?.url || "").trim());
}

export function setBrokerConfig(slug: string, url: string): BrokerConfig {
  const all = readAll();
  all[slug] = { url: (url || "").trim() };
  writeAll(all);
  return all[slug];
}
