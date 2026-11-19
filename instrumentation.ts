// Runs once when the Next.js server starts (`next start` / `next dev`).
// Logs the portal's environment variables so you can check, e.g. with
// `heroku logs --tail`, that the platform config vars are being read.
//
// Note: Next.js also loads .env.local at runtime, but real environment
// variables (Heroku config vars) take precedence. A variable missing from
// Heroku is therefore silently filled from .env.local; the "origen" column
// shows which one is in effect.

const VARS = [
  "ADMIN_EMAIL_DOMAIN",
  "ALLOWED_EMAIL_DOMAINS",
  "BRAND_NAME",
  "BROKER_CONFIG_ADMIN_EMAIL",
  "NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN",
  "SMTP_FROM_EMAIL",
  "SMTP_FROM_NAME",
  "SMTP_HOST",
  "SMTP_PASSWORD",
  "SMTP_PORT",
  "SMTP_USER",
  "TRACKED_EMAIL_DOMAIN",
];

// Secrets are masked so they don't end up in plain text in the logs.
const SECRET_VARS = new Set(["SMTP_PASSWORD"]);

async function readDotEnvLocal(): Promise<Record<string, string>> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  try {
    const text = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const out: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
    return out;
  } catch {
    return {};
  }
}

function mask(value: string): string {
  if (value.length <= 8) return `${"*".repeat(value.length)} (${value.length} caracteres)`;
  return `${value.slice(0, 3)}…${value.slice(-2)} (${value.length} caracteres)`;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const dotEnv = await readDotEnvLocal();
  const rows = VARS.map((name) => {
    const value = process.env[name];
    const origin =
      value === undefined || value === ""
        ? "—"
        : !(name in dotEnv)
          ? "entorno (Heroku)"
          : dotEnv[name] === value
            ? ".env.local (o Heroku con el mismo valor)"
            : "entorno (Heroku)";
    const shown =
      value === undefined
        ? "(no definida)"
        : value === ""
          ? "(vacía)"
          : SECRET_VARS.has(name)
            ? mask(value)
            : value;
    return { name, shown, origin };
  });

  const width = Math.max(...VARS.map((v) => v.length));
  console.log("[env] Variables de entorno del portal al arrancar:");
  for (const r of rows) {
    console.log(`[env]   ${r.name.padEnd(width)} = ${r.shown}   [origen: ${r.origin}]`);
  }
}
