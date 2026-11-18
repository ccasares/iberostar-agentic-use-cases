"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCases } from "@/lib/use-cases";
import { platformBrand, MCP_LOGO } from "@/lib/platform-logos";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, ChevronDown, ChevronRight, Search, Server } from "lucide-react";

// ---------------------------------------------------------------------------
// Collapsible section (open/closed state remembered per section in localStorage)
// ---------------------------------------------------------------------------

export function CollapsibleSection({
  id,
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  summary: (open: boolean) => ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const storageKey = `landing-section:${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved !== null) setOpen(saved === "1");
  }, [storageKey]);

  const toggle = () => {
    setOpen((prev) => {
      window.localStorage.setItem(storageKey, prev ? "0" : "1");
      return !prev;
    });
  };

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`section-${id}`}
        className="flex w-full flex-col gap-1 px-5 py-5 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
      >
        <span className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          )}
          <span className="text-lg font-semibold sm:text-xl">{title}</span>
        </span>
        <span className="pl-8 text-xs text-muted-foreground sm:pl-0 sm:text-right sm:text-sm">
          {summary(open)}
        </span>
      </button>
      {open && (
        <div id={`section-${id}`} className="px-5 pb-6 sm:px-6">
          {children}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Filter chip (same look as the use-case tag chips)
// ---------------------------------------------------------------------------

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Flattened catalogue of agents and MCP servers across all use cases
// ---------------------------------------------------------------------------

interface CatalogItem {
  key: string;
  name: string;
  label: string;
  logo: string | null;
  group: string; // platform label (agents) or transport (MCP)
  useCaseSlug: string;
  useCaseTitle: string;
}

const agentItems: CatalogItem[] = useCases.flatMap((u) =>
  (u.network?.agents ?? []).map((a) => {
    const brand = platformBrand(a.platform);
    return {
      key: `${u.slug}:${a.name}`,
      name: a.name,
      label: a.label || a.name,
      logo: brand.logo,
      group: brand.label,
      useCaseSlug: u.slug,
      useCaseTitle: u.title,
    };
  })
);

const mcpItems: CatalogItem[] = useCases.flatMap((u) =>
  (u.network?.mcpServers ?? []).map((m) => ({
    key: `${u.slug}:${m.name}`,
    name: m.name,
    label: m.label || m.name,
    logo: MCP_LOGO,
    group: "MCP",
    useCaseSlug: u.slug,
    useCaseTitle: u.title,
  }))
);

export const catalogCounts = {
  agents: agentItems.length,
  mcpServers: mcpItems.length,
  useCases: useCases.filter((u) => u.network).length,
};

function countBy<T>(items: T[], keyOf: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = keyOf(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // Most frequent first, then alphabetical.
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
}

const agentPlatforms = countBy(agentItems, (i) => i.group);
const mcpUseCases = countBy(mcpItems, (i) => i.useCaseTitle);

function CatalogCard({ item, kind }: { item: CatalogItem; kind: "agent" | "mcp" }) {
  const Fallback = kind === "agent" ? Bot : Server;
  const subtitle =
    kind === "agent" ? `${item.group} · ${item.useCaseTitle}` : item.useCaseTitle;
  return (
    <Link
      href={`/use-case/${item.useCaseSlug}?tab=overview#${encodeURIComponent(item.name)}`}
      title={`${item.label} — ${item.useCaseTitle}`}
      className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex size-8 shrink-0 items-center justify-center">
        {item.logo ? (
          <Image
            src={item.logo}
            alt={item.group}
            width={32}
            height={32}
            className="size-8 object-contain"
          />
        ) : (
          <Fallback className="size-6 text-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
          {item.label}
        </div>
        <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
        <div className="truncate font-mono text-[11px] text-muted-foreground/80">
          {item.name}
        </div>
      </div>
    </Link>
  );
}

export function AgentsMcpCatalog() {
  const [kind, setKind] = useState<"agent" | "mcp">("agent");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<string | null>(null);
  const [mcpUseCase, setMcpUseCase] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = kind === "agent" ? agentItems : mcpItems;
    return source.filter((i) => {
      if (kind === "agent" && platform && i.group !== platform) return false;
      if (kind === "mcp" && mcpUseCase && i.useCaseTitle !== mcpUseCase) return false;
      if (!q) return true;
      return [i.label, i.name, i.group, i.useCaseTitle]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [kind, query, platform, mcpUseCase]);

  const kindButton = (value: "agent" | "mcp", Icon: typeof Bot, label: string) => (
    <button
      type="button"
      onClick={() => setKind(value)}
      aria-pressed={kind === value}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        kind === value
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit gap-1 rounded-xl border border-border bg-background p-1">
          {kindButton("agent", Bot, `Agentes A2A (${agentItems.length})`)}
          {kindButton("mcp", Server, `Servidores MCP (${mcpItems.length})`)}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === "agent" ? "Busca agentes…" : "Busca servidores MCP…"}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          {kind === "agent" ? "Plataforma:" : "Caso de uso:"}
        </span>
        {kind === "agent" ? (
          <>
            <FilterChip active={platform === null} onClick={() => setPlatform(null)}>
              Todos
            </FilterChip>
            {agentPlatforms.map(([p, n]) => (
              <FilterChip key={p} active={platform === p} onClick={() => setPlatform(p)}>
                {p} ({n})
              </FilterChip>
            ))}
          </>
        ) : (
          <>
            <FilterChip active={mcpUseCase === null} onClick={() => setMcpUseCase(null)}>
              Todos
            </FilterChip>
            {mcpUseCases.map(([t, n]) => (
              <FilterChip key={t} active={mcpUseCase === t} onClick={() => setMcpUseCase(t)}>
                {t} ({n})
              </FilterChip>
            ))}
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Ningún {kind === "agent" ? "agente" : "servidor MCP"} coincide con los
          filtros{query ? ` y la búsqueda “${query}”` : ""}.
        </div>
      ) : (
        <div className="max-h-[640px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <CatalogCard key={item.key} item={item} kind={kind} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
