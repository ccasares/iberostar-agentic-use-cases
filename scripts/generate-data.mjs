// Build-time data generator.
// Reads every use-case folder (../<slug>/) for README.md + agent-network.yaml,
// plus the top-level README.md for the curated card metadata, and emits a single
// JSON file (lib/use-cases.json) that the Next.js app imports. This keeps the
// portal DB-free and lets it deploy to Railway without the source folders.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const outFile = path.join(projectRoot, "lib", "use-cases.json");

const SELF_DIR = "top-20-agentic-use-cases";

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

// ---- Parse the curated top-level README into per-slug card metadata ----
function parseTopReadme(md) {
  if (!md) return {};
  const result = {};
  // Each use case block starts with: #### N. [slug](./slug/) — Title
  const headingRe = /^####\s+\d+\.\s+\[([^\]]+)\]\([^)]+\)\s+—\s+(.+)$/gm;
  const matches = [...md.matchAll(headingRe)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const slug = m[1].trim();
    const title = m[2].trim();
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    const block = md.slice(start, end);

    const persona = (block.match(/\*\*Persona:\*\*\s*(.+)/) || [])[1]?.trim();
    const pain = (block.match(/\*\*Business pain:\*\*\s*(.+)/) || [])[1]?.trim();
    const orchestration = (
      block.match(/\*\*Orchestration:\*\*\s*([\s\S]+?)(?:\n\n|\n####|$)/) || []
    )[1]
      ?.replace(/\s+/g, " ")
      .trim();

    const queries = [];
    const qRe = /^\s*\d+\.\s+(.+)$/gm;
    let qm;
    while ((qm = qRe.exec(block))) queries.push(qm[1].trim());

    result[slug] = {
      slug,
      title,
      persona: persona || "",
      businessPain: pain || "",
      orchestration: orchestration || "",
      exampleQueries: queries,
    };
  }
  return result;
}

// ---- Build a friendly description from the subfolder README ----
function extractSection(md, headingRegex) {
  if (!md) return "";
  // Capture from the "## Heading" line up to the next "## " heading or the end
  // of the document. No "m" flag, so `$` anchors to end-of-string (a previous
  // version used `\Z`, which JS treats as a literal "Z" and truncated sections
  // containing Zulu timestamps such as 2026-05-25T00:00Z).
  const re = new RegExp(
    `(?:^|\\n)##\\s+${headingRegex}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`
  );
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

// ---- Parse the subfolder README "## Example queries" section ----
function parseExampleItem(text) {
  const line = text.trim();
  if (!line) return null;
  let label = "";
  const bold = line.match(/^\*\*(.+?)\*\*/);
  if (bold) label = bold[1].trim();

  // The actual prompt to send is the text after the em/en dash; the bold title
  // and parenthetical (which agents/MCPs) are descriptive metadata.
  let query;
  const dash = line.search(/[—–]/);
  if (dash !== -1) {
    query = line.slice(dash + 1).trim();
  } else {
    query = line
      .replace(/^\*\*.+?\*\*\s*/, "")
      .replace(/^\([^)]*\)\s*/, "")
      .trim();
  }
  // Strip markdown so the inserted message is plain text.
  query = query
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!query) return null;
  if (!label) label = query.length > 64 ? `${query.slice(0, 61)}…` : query;
  return { label, query };
}

function extractExampleQueries(readme) {
  const section = extractSection(readme, "Example queries");
  if (!section) return [];

  const items = [];
  let current = null;
  for (const raw of section.split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*\d+\.\s+(.*)$/);
    if (m) {
      if (current !== null) items.push(current);
      current = m[1];
    } else if (current !== null && line.trim()) {
      current += ` ${line.trim()}`; // wrapped continuation line
    } else if (current !== null) {
      items.push(current);
      current = null;
    }
  }
  if (current !== null) items.push(current);

  return items.map(parseExampleItem).filter(Boolean);
}

// ---- New-format (mule-he) README parsers --------------------------------
// These brokers are documented per-folder (not in the curated top README) and
// carry an extra "Rolled-up MuleSoft applications per MCP" section listing the
// upstream APIs each MCP server fronts.

// Title from the "# <Title> — `broker-name`" heading.
function parseFolderTitle(readme) {
  const m = (readme || "").match(/^#\s+(.+?)\s+[—–]\s+`/m);
  return m ? m[1].trim() : "";
}

function parsePrimaryPersona(readme) {
  const m = (readme || "").match(/\*\*Primary persona:\*\*\s*(.+)/);
  return m ? m[1].trim() : "";
}

// Plain numbered list under "## Top 5 user queries" -> {label, query}[].
function extractTop5Queries(readme) {
  const section = extractSection(readme, "Top 5 user queries");
  if (!section) return [];
  const items = [];
  let current = null;
  for (const raw of section.split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*\d+\.\s+(.*)$/);
    if (m) {
      if (current !== null) items.push(current);
      current = m[1];
    } else if (current !== null && line.trim()) {
      current += ` ${line.trim()}`;
    } else if (current !== null) {
      items.push(current);
      current = null;
    }
  }
  if (current !== null) items.push(current);
  return items
    .map((q) => {
      const query = q
        .replace(/`/g, "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!query) return null;
      return {
        label: query.length > 64 ? `${query.slice(0, 61)}…` : query,
        query,
      };
    })
    .filter(Boolean);
}

// Strip leading "he-" / "abb-" prefixes from upstream API names for display.
function cleanApiName(name) {
  return (name || "").trim().replace(/^(?:he-|abb-)+/i, "");
}

// Strip "he-"/"abb-" prefixes from the backticked API bullet names inside the
// raw README's "Rolled-up MuleSoft applications per MCP" section only, so the
// rendered Overview matches the cleaned structured api lists. Broker/agent/MCP
// identifiers in other sections (which may also start with "he-") are untouched.
function cleanReadmeApiNames(readme) {
  if (!readme) return readme || "";
  const heading = "## Rolled-up MuleSoft applications per MCP";
  const start = readme.indexOf(heading);
  if (start === -1) return readme;
  const rest = readme.slice(start);
  const nextHeading = rest.slice(heading.length).search(/\n##\s/);
  const end =
    nextHeading === -1 ? readme.length : start + heading.length + nextHeading;
  const section = readme.slice(start, end);
  const cleaned = section.replace(
    /^([-*]\s+`)(?:he-|abb-)+/gim,
    "$1"
  );
  return readme.slice(0, start) + cleaned + readme.slice(end);
}

// "## Rolled-up MuleSoft applications per MCP" -> { mcpName: { apis, total } }.
// Each MCP block is a "### `mcp-name` — subtitle" heading followed by
// "Rolls up **N** APIs ..." and a bullet list of `api-name`s (often truncated
// in the README with a "… and N more" line, hence the separate total).
function parseUpstreamApis(readme) {
  const section = extractSection(
    readme,
    "Rolled-up MuleSoft applications per MCP"
  );
  if (!section) return {};
  const result = {};
  const blockRe = /###\s+`([^`]+)`[^\n]*\n([\s\S]*?)(?=\n###\s|$)/g;
  let m;
  while ((m = blockRe.exec(section))) {
    const name = m[1].trim();
    const body = m[2];
    const totalM = body.match(/Rolls up\s+\*\*(\d+)\*\*/);
    const apis = [];
    const apiRe = /^[-*]\s+`([^`]+)`/gm;
    let a;
    while ((a = apiRe.exec(body))) apis.push(cleanApiName(a[1]));
    result[name] = {
      apis,
      total: totalM ? parseInt(totalM[1], 10) : apis.length,
    };
  }
  return result;
}

// Ordered slugs from the top README "| N | [slug](./slug/) | ... |" tables, so
// table-only use cases keep their intended sequence after the curated 24.
function parseTableSlugs(md) {
  if (!md) return [];
  const re = /^\|\s*\d+\s*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|/gm;
  const out = [];
  let m;
  while ((m = re.exec(md))) out.push(m[1].trim());
  return out;
}

function parseAgentNetwork(yamlText) {
  if (!yamlText) return null;
  let doc;
  try {
    doc = YAML.parse(yamlText);
  } catch (e) {
    console.warn("YAML parse failed:", e.message);
    return null;
  }

  const brokersObj = doc.brokers || {};
  const brokerKey = Object.keys(brokersObj)[0];
  const broker = brokersObj[brokerKey] || {};
  const card = broker.card || {};
  const spec = broker.spec || {};

  const model =
    spec.llm?.configuration?.model ||
    spec.llm?.ref?.name ||
    "";

  const agents = Object.entries(doc.agents || {}).map(([name, v]) => ({
    name,
    label: v?.label || name,
    platform: v?.metadata?.platform || "",
    protocol: v?.metadata?.protocol || "a2a",
  }));

  const mcpServers = Object.entries(doc.mcpServers || {}).map(([name, v]) => ({
    name,
    label: v?.label || name,
    transport: v?.metadata?.transport?.kind || "",
  }));

  const skills = (card.skills || []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "",
    examples: s.examples || [],
    tags: s.tags || [],
  }));

  return {
    brokerName: brokerKey || card.name || "",
    brokerLabel: doc.label || "",
    brokerDescription: card.description || "",
    brokerUrlTemplate: card.url || "",
    provider: card.provider || {},
    model,
    instructions: spec.instructions || [],
    skills,
    agents,
    mcpServers,
  };
}

function loadTagConfig() {
  const raw = readFileSafe(path.join(projectRoot, "lib", "use-case-tags.json"));
  if (!raw) return { default: ["general"], overrides: {} };
  try {
    const parsed = JSON.parse(raw);
    return {
      default: parsed.default || ["general"],
      overrides: parsed.overrides || {},
    };
  } catch {
    return { default: ["general"], overrides: {} };
  }
}

function main() {
  const topReadme = readFileSafe(path.join(repoRoot, "README.md"));
  const cardMeta = parseTopReadme(topReadme);
  const tagConfig = loadTagConfig();

  const entries = fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== SELF_DIR && !name.startsWith("."))
    .filter((name) => {
      const yamlPath = path.join(repoRoot, name, "agent-network.yaml");
      return fs.existsSync(yamlPath);
    })
    .sort();

  // On deploy targets (e.g. Railway) the sibling use-case folders are not
  // present — only this project is. In that case keep the committed JSON
  // instead of overwriting it with an empty payload.
  if (entries.length === 0) {
    if (fs.existsSync(outFile)) {
      console.log(
        "No source use-case folders found; keeping existing lib/use-cases.json."
      );
      return;
    }
    console.warn(
      "No source use-case folders found and no committed data exists; writing empty payload."
    );
  }

  // Preserve the curated ordering from the top README when available: first the
  // 24 detailed "#### N." blocks, then any table-only use cases (the mule-he
  // wave) in their table order, then anything else alphabetically.
  const orderedSlugs = Object.keys(cardMeta).filter((s) =>
    entries.includes(s)
  );
  for (const s of parseTableSlugs(topReadme)) {
    if (entries.includes(s) && !orderedSlugs.includes(s)) orderedSlugs.push(s);
  }
  for (const e of entries) if (!orderedSlugs.includes(e)) orderedSlugs.push(e);

  const useCases = [];
  for (const slug of orderedSlugs) {
    const dir = path.join(repoRoot, slug);
    const readme = readFileSafe(path.join(dir, "README.md"));
    const yamlText = readFileSafe(path.join(dir, "agent-network.yaml"));
    const network = parseAgentNetwork(yamlText);

    const top = cardMeta[slug];
    // mule-he use cases are documented per-folder and roll up upstream APIs.
    const isMule = /(?:^|\n)##\s+Rolled-up MuleSoft applications per MCP/.test(
      readme || ""
    );

    const description = extractSection(readme, "Description");
    const purpose = extractSection(readme, "Purpose");

    const title =
      top?.title || parseFolderTitle(readme) || network?.brokerLabel || slug;
    const persona = top?.persona || parsePrimaryPersona(readme) || "";
    const businessPain = top?.businessPain || "";
    const orchestration =
      top?.orchestration ||
      extractSection(readme, "Orchestration narrative")
        .replace(/\s+/g, " ")
        .trim() ||
      "";

    // Example queries: curated "## Example queries" (24), else the new-format
    // "## Top 5 user queries" (mule-he), else the top-README numbered list.
    const readmeExamples = extractExampleQueries(readme);
    const exampleQueries = readmeExamples.length
      ? readmeExamples
      : extractTop5Queries(readme).length
        ? extractTop5Queries(readme)
        : (top?.exampleQueries || []).map((q) => ({
            label: q.length > 64 ? `${q.slice(0, 61)}…` : q,
            query: q,
          }));

    // Attach the per-MCP upstream API rollups (mule-he only); general use cases
    // get empty lists so the typed shape is consistent.
    const upstream = isMule ? parseUpstreamApis(readme) : {};
    if (network) {
      network.mcpServers = network.mcpServers.map((m) => ({
        ...m,
        apis: upstream[m.name]?.apis || [],
        apiCount: upstream[m.name]?.total || 0,
      }));
    }

    // Tags: explicit overrides win; otherwise auto-tag mule-api, else default.
    const tags =
      tagConfig.overrides[slug] || (isMule ? ["mule-api"] : tagConfig.default);

    // Card short description preference: README description, else pain, else broker desc.
    const shortSource =
      description || businessPain || network?.brokerDescription || "";

    useCases.push({
      slug,
      title,
      shortDescription: shortSource,
      persona,
      businessPain,
      orchestration,
      exampleQueries,
      description,
      purpose,
      readme: cleanReadmeApiNames(readme || ""),
      network: network || null,
      tags,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    count: useCases.length,
    useCases,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(
    `Generated ${useCases.length} use cases -> ${path.relative(
      projectRoot,
      outFile
    )}`
  );
}

main();
