"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, truncate } from "@/lib/utils";
import type { UseCase, UseCaseStats } from "@/lib/types";
import {
  Eye,
  Heart,
  ArrowUpRight,
  Bot,
  Server,
  MessagesSquare,
} from "lucide-react";

interface UseCaseCardProps {
  useCase: UseCase;
  index: number;
  stats: UseCaseStats;
  liked: boolean;
  hasBroker?: boolean;
  onToggleLike: (slug: string, nextLiked: boolean) => void;
}

export function UseCaseCard({
  useCase,
  index,
  stats,
  liked,
  hasBroker = false,
  onToggleLike,
}: UseCaseCardProps) {
  const agentCount = useCase.network?.agents.length ?? 0;
  const mcpCount = useCase.network?.mcpServers.length ?? 0;
  // mule-api (MuleSoft API-portfolio) brokers get a MuleSoft-blue accent;
  // other brokers use the customer brand-primary accent.
  const isMuleApi = useCase.tags?.includes("mule-api");

  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r",
          isMuleApi
            ? "from-[#00a0df] to-[#0073b1]"
            : "from-primary to-primary/40"
        )}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono text-[10px]">
              #{String(index + 1).padStart(2, "0")}
            </Badge>
            {useCase.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] capitalize text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
          {useCase.network?.model && (
            <Badge variant="outline" className="text-[10px]">
              {useCase.network.model}
            </Badge>
          )}
        </div>

        <Link
          href={`/use-case/${useCase.slug}`}
          className="group/title inline-flex items-start gap-1"
        >
          <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover/title:text-primary">
            {useCase.title}
          </h3>
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100" />
        </Link>

        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          {truncate(useCase.shortDescription || useCase.businessPain, 100)}
        </p>

        {useCase.persona && (
          <p className="mt-3 text-xs text-muted-foreground/80">
            <span className="font-medium text-foreground/70">Perfil:</span>{" "}
            {useCase.persona.replace(/\.$/, "")}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1" title="Agentes">
              <Bot className="size-3.5" />
              {agentCount}
            </span>
            <span className="inline-flex items-center gap-1" title="Servidores MCP">
              <Server className="size-3.5" />
              {mcpCount}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasBroker && (
              <Link
                href={`/use-case/${useCase.slug}?tab=chat`}
                onClick={(e) => e.stopPropagation()}
                title="Chatea con este broker"
                aria-label="Chatea con este broker"
                className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <MessagesSquare className="size-3.5" />
              </Link>
            )}
            <span
              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
              title="Visualizaciones"
            >
              <Eye className="size-4" />
              {stats.views}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleLike(useCase.slug, !liked);
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-secondary",
                liked ? "text-primary" : "text-muted-foreground"
              )}
              title={liked ? "Ya no me gusta" : "Me gusta"}
              aria-pressed={liked}
            >
              <Heart className={cn("size-4", liked && "fill-current")} />
              {stats.likes}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
