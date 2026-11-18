# Demo Portal: Agentic Use Cases (template)

Generic Next.js portal template that showcases MuleSoft Agent Fabric
agent-broker use cases. Visitors verify their work email, browse the use cases
as cards, open a use case to inspect its agent network, and chat live with the
broker.

> Template starter. The `../instruction-prompt.md` workflow copies this folder
> into a customer workspace and rebrands it (colors, logo, wordmark, allowed
> email domains, hero copy) — see the **Portal — copy-and-rebrand** section of
> that prompt for the step-by-step. No database — content is generated at
> build time from the sibling use-case folders, and likes/views are persisted
> to a JSON file on disk.

## Features

- **Email verification gate** — only addresses on the configured allowed
  domains can sign in. A 6-digit code is emailed via SMTP.
- **Use case cards** — title, truncated description (100 chars), agent/MCP
  counts, and live **views** and **likes** counters.
- **Use case detail** with three tabs:
  1. **Overview** — persona, business pain, orchestration, the available
     agents/MCP servers tables, the orchestrator (broker) name + model, and the
     full README rendered as rich markdown.
  2. **Agent Network** — a visualization of the broker, its A2A agents, and MCP
     servers parsed from `agent-network.yaml`.
  3. **Chat with Broker** — a ChatGPT-style chat. The broker URL (and optional
     `x-anypoint-api-instance-id`) are configurable per use case from the UI.
     Requests are proxied server-side as A2A `message/send` calls.
- **Like & view tracking** — likes toggle from cards and the detail page; views
  increment when a detail page is opened.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · nodemailer ·
react-markdown.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in SMTP_PASSWORD
npm run dev                  # http://localhost:3000
```

`predev`/`prebuild` automatically run `scripts/generate-data.mjs`, which reads
every sibling `../<use-case>/` folder (its `README.md` + `agent-network.yaml`)
and the top-level `../README.md`, and writes `lib/use-cases.json`.

## Environment variables

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP server host (e.g. `smtp.office365.com`) |
| `SMTP_PORT` | SMTP port — `587` (STARTTLS) or `465` (implicit TLS, detected automatically) |
| `SMTP_USER` | SMTP username. Several providers want a fixed literal or an API key here rather than your email — see the table below |
| `SMTP_PASSWORD` | SMTP password, SMTP key, or API key |
| `SMTP_FROM_NAME` | Sender display name |
| `SMTP_FROM_EMAIL` | Sender email address. Falls back to `SMTP_USER` |
| `BRAND_NAME` | Name rendered in the verification email header/footer (default `AcmeCo`) |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated allowed login domains (default `acme.example.com`) |
| `ADMIN_EMAIL_DOMAIN` | Domain whose users see engagement/sign-in activity |
| `NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN` | Client-side mirror of `ADMIN_EMAIL_DOMAIN` |
| `TRACKED_EMAIL_DOMAIN` | Domain whose viewer activity is surfaced to admins |
| `BROKER_CONFIG_ADMIN_EMAIL` | Single user allowed to configure broker URLs |
| `STATS_DIR` | Optional dir for likes/views + broker config JSON (default `./.data`) |
| `BROKER_CONFIG_JSON` | Optional JSON map of broker URLs that persists across deploys and is shared by all instances. UI-set URLs (on a durable `STATS_DIR`) override it. |

## Free SMTP providers

Nobody can sign in until the `SMTP_*` block is filled in, and a corporate relay
is usually the slowest thing to get approved. Any of these free tiers will run a
demo — the portal sends one 6-digit code per visitor, so even the smallest cap
is generous. `.env.example` carries each of these as a commented, ready-to-paste
preset.

| Provider | Free tier | Host / port | `SMTP_USER` | `SMTP_PASSWORD` | Worth knowing |
|---|---|---|---|---|---|
| **Brevo** | 300/day, no expiry | `smtp-relay.brevo.com` : 587 | your login email | generated SMTP key | Best default. No card, no domain needed. Free tier appends a "Sent with Brevo" footer, and sending starts only once Brevo approves the account (usually minutes). |
| **Resend** | 3,000/month, 100/day | `smtp.resend.com` : 587 | the literal `resend` | API key | Cleanest sender reputation, but until you verify a domain it only delivers to the address you signed up with. |
| **Mailjet** | 6,000/month, 200/day | `in-v3.mailjet.com` : 587 | API key | secret key | Highest monthly ceiling of the no-domain options. |
| **Gmail** | 500/day | `smtp.gmail.com` : 587 | your Gmail address | 16-char App Password | Needs 2-step verification on; a normal account password is rejected. Sends from a consumer address, so fine internally, weak for a customer-facing demo. |
| **Mailtrap Sandbox** | testing only | `sandbox.smtp.mailtrap.io` : 2525 | Mailtrap username | Mailtrap password | Captures mail in a web inbox and never delivers it. Use it to prove the gate works locally, never for a live demo. |

Skip **SendGrid** — its perpetual free tier ended in 2025 and what remains is a
60-day trial that will silently stop your portal two months after the demo.

Two things that trip people up regardless of provider:

- **`SMTP_USER` is often not an email address.** Resend wants the literal string
  `resend`; Mailjet wants an API key. Putting your email there fails auth.
- **`SMTP_FROM_EMAIL` must be an address the provider has authorised** — a
  verified domain or the sign-up address. An unverified `from` is the usual
  cause of a send that authenticates fine and then bounces.

Port `465` works too; the route switches to implicit TLS when `SMTP_PORT` is
`465` and uses STARTTLS otherwise.

## Customer rebrand (what changes per deploy)

The rebrand step in `../instruction-prompt.md` replaces, in order:

- `app/globals.css` brand tokens: `--primary`, `--brand-primary`,
  `--brand-surface`, `--brand-surface-alt`, `--brand-accent`.
- `components/brand.tsx` wordmark text + accent split.
- `public/brand-logo.svg` placeholder → customer SVG.
- `lib/email-domains.ts` allowed/admin domains.
- `app/api/send-verification/route.ts` brand-name header/footer and the email
  hero gradient color.
- `app/layout.tsx` page metadata.
- `app/(portal)/page.tsx` hero subtitle + footer line.

## Data, likes & views (no DB)

- **Use case content** is committed as `lib/use-cases.json`. The generator only
  regenerates it when the source folders are present (locally); on a deploy
  target where the folders are absent, the committed JSON is used as-is.
- **Likes/views** are stored in `${STATS_DIR}/stats.json`. On Railway the
  filesystem is ephemeral and resets on redeploy. For durable counts, attach a
  volume and set `STATS_DIR` to its mount path (e.g. `/data`).
- **Broker URLs** (set per use case from the Chat tab) are stored in
  `${STATS_DIR}/broker-config.json`. Because that file lives on the same
  ephemeral, per-instance disk, a URL configured via the UI is **lost on
  redeploy and invisible to other instances** unless a volume is mounted. To
  make configured brokers reliably chat-enabled for everyone, either mount a
  volume + set `STATS_DIR`, or set `BROKER_CONFIG_JSON` (recommended for
  Railway) to a JSON map of `slug → url`.

## Deploy to Heroku

The repo is Heroku-ready: `Procfile` (`web: npm run start`, binds to `$PORT`),
Node pinned to `22.x` in `package.json` `engines`, and `lib/use-cases.json`
committed, so the build does not need the sibling use-case folders.

```bash
heroku create <app-name>
heroku git:remote -a <app-name>
# .env.local is NOT read on Heroku — push its values as config vars:
grep -vE '^\s*(#|$)' .env.local | xargs -d '\n' heroku config:set
heroku config:set STATS_DIR=/tmp/portal-data
git push heroku main
heroku open
```

On macOS (BSD `xargs` has no `-d`), set them with
`heroku config:set $(grep -vE '^\s*(#|$)' .env.local | tr '\n' ' ')` or one by one.

Notes:

- **`NEXT_PUBLIC_*` vars are baked in at build time.** Set them as config vars
  *before* `git push heroku main`; changing one later needs a rebuild
  (`git commit --allow-empty -m rebuild && git push heroku main`).
- **The dyno filesystem is ephemeral** (wiped on every restart/deploy, at least
  daily). Likes, views, sign-in activity and UI-set broker URLs reset. Set
  `BROKER_CONFIG_JSON` (JSON map `slug → broker URL`) so chat brokers survive
  restarts.
- **Run a single web dyno**: stats live on local disk, so several dynos would
  each keep their own counters.

## Deploy to Railway

1. Push this folder to a Git repo and create a new Railway project from it.
2. Railway auto-detects Next.js (Nixpacks): build `npm run build`, start
   `npm run start` (binds to `$PORT`). See `railway.json`.
3. Add the environment variables above (at minimum the `SMTP_*` ones).
4. (Optional) Add a Volume mounted at `/data` and set `STATS_DIR=/data` to keep
   likes/views across deploys.

## Regenerating content

```bash
npm run generate-data
```

Run this after editing any use-case `README.md` or `agent-network.yaml`, then
commit the updated `lib/use-cases.json`.
