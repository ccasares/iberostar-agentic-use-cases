"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCases } from "@/lib/use-cases";
import type { UseCaseStats } from "@/lib/types";
import { UseCaseCard } from "@/components/use-case-card";
import { Input } from "@/components/ui/input";
import { getLikedSet, setLiked as persistLiked } from "@/lib/liked";
import { cn } from "@/lib/utils";
import { Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  AgentsMcpCatalog,
  CollapsibleSection,
  catalogCounts,
} from "@/components/landing-catalog";

export default function PortalLandingPage() {
  const [statsMap, setStatsMap] = useState<Record<string, UseCaseStats>>({});
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [brokerSet, setBrokerSet] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of useCases) {
      for (const t of u.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return counts;
  }, []);
  const allTags = useMemo(
    () => [...tagCounts.keys()].sort((a, b) => a.localeCompare(b)),
    [tagCounts]
  );

  useEffect(() => {
    setLikedSet(getLikedSet());
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStatsMap(d.stats || {}))
      .catch(() => {});
    fetch("/api/broker-config")
      .then((r) => r.json())
      .then((d) => setBrokerSet(new Set<string>(d.configuredSlugs || [])))
      .catch(() => {});
  }, []);

  const handleToggleLike = async (slug: string, nextLiked: boolean) => {
    // Optimistic update
    setLikedSet((prev) => {
      const next = new Set(prev);
      if (nextLiked) next.add(slug);
      else next.delete(slug);
      return next;
    });
    setStatsMap((prev) => {
      const cur = prev[slug] || { views: 0, likes: 0 };
      return {
        ...prev,
        [slug]: { ...cur, likes: Math.max(0, cur.likes + (nextLiked ? 1 : -1)) },
      };
    });
    persistLiked(slug, nextLiked);

    try {
      const res = await fetch(`/api/stats/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextLiked ? "like" : "unlike" }),
      });
      const data = await res.json();
      if (data.stats) {
        setStatsMap((prev) => ({ ...prev, [slug]: data.stats }));
      }
    } catch {
      toast.error("No se ha podido guardar el «me gusta». Inténtalo de nuevo.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return useCases.filter((u) => {
      if (activeTag && !(u.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return [
        u.title,
        u.shortDescription,
        u.persona,
        u.businessPain,
        u.slug,
        ...(u.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, activeTag]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section
        className="relative isolate mb-8 overflow-hidden bg-[var(--brand-surface)] p-8 text-white sm:p-12"
      >
        {/* Background: Iberostar resort photo (grupoiberostar.com) under a navy
            overlay that is darkest behind the text, so it stays legible. */}
        <Image
          src="/images/hero-iberostar-resort.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="-z-20 object-cover object-[center_40%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0,26,56,0.94) 0%, rgba(0,32,68,0.86) 45%, rgba(0,40,85,0.45) 80%, rgba(0,40,85,0.25) 100%)",
          }}
        />
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70">
          <Sparkles className="size-4" />
          Grupo Iberostar · MuleSoft Agent Fabric
        </div>
        <h1 className="font-brand-serif mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
          Impulsamos un turismo responsable, también con IA agéntica
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">
          Descubre {useCases.length} casos de uso de IA agéntica para Grupo
          Iberostar: del huésped de nuestros resorts a Wave of Change, W2M y la
          expansión. Cada broker orquesta agentes A2A y servidores MCP para
          resolver un reto real del negocio; abre una tarjeta para ver la red
          de agentes y conversar con el broker.
        </p>
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca casos de uso, perfiles, palabras clave…"
            className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/50 focus-visible:border-white/40"
          />
        </div>
      </section>

      <CollapsibleSection
        id="use-cases"
        title="Casos de Uso"
        summary={(open) =>
          open
            ? `${useCases.length} casos de uso. Pulsa para plegar.`
            : `${useCases.length} casos de uso. Pulsa para desplegar.`
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {query || activeTag
              ? `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`
              : "Todos los casos de uso"}
          </h3>
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">
                Etiqueta:
              </span>
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                  activeTag === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary"
                )}
              >
                Todos ({useCases.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                    activeTag === tag
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {tag} ({tagCounts.get(tag) ?? 0})
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            Ningún caso de uso coincide con
            {query ? ` “${query}”` : ""}
            {query && activeTag ? " en" : ""}
            {activeTag ? ` la etiqueta “${activeTag}”` : ""}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((useCase) => {
              const idx = useCases.indexOf(useCase);
              return (
                <UseCaseCard
                  key={useCase.slug}
                  useCase={useCase}
                  index={idx}
                  stats={statsMap[useCase.slug] || { views: 0, likes: 0 }}
                  liked={likedSet.has(useCase.slug)}
                  hasBroker={brokerSet.has(useCase.slug)}
                  onToggleLike={handleToggleLike}
                />
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="agents-mcp"
        title="Agentes y servidores MCP de los Casos de Uso"
        summary={() =>
          `${catalogCounts.agents} agentes A2A y ${catalogCounts.mcpServers} servidores MCP en ${catalogCounts.useCases} casos de uso. Pulsa uno para ver su detalle en el caso de uso.`
        }
      >
        <AgentsMcpCatalog />
      </CollapsibleSection>

      <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Grupo Iberostar — Portal de demostración: casos de uso de IA agéntica · Con la tecnología de MuleSoft Agent Fabric
      </footer>
    </main>
  );
}
