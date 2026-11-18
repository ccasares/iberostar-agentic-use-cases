"use client";

import Image from "next/image";
import type { AgentNetwork, McpNode } from "@/lib/types";
import { Bot, ChevronDown, Server, Network, Plug } from "lucide-react";
import { platformBrand, MCP_LOGO, BROKER_LOGO } from "@/lib/platform-logos";

function LogoCircle({
  logo,
  alt,
  fallback: Fallback,
}: {
  logo: string | null;
  alt: string;
  fallback: typeof Bot;
}) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[#b08bd8]">
      {logo ? (
        <Image
          src={logo}
          alt={alt}
          width={28}
          height={28}
          unoptimized
          className="size-7 object-contain"
        />
      ) : (
        <Fallback className="size-6 text-[#5a3a82]" />
      )}
    </div>
  );
}

function NodeCard({
  kind,
  label,
  sublabel,
  logo,
}: {
  kind: "agent" | "mcp";
  label: string;
  sublabel: string;
  logo: string | null;
}) {
  const Icon = kind === "agent" ? Bot : Server;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1b2735] p-4 text-center shadow-sm transition-colors hover:border-white/25">
      <div className="mx-auto mb-3 w-fit">
        <LogoCircle logo={logo} alt={label} fallback={Icon} />
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/45">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-white">{sublabel}</div>
    </div>
  );
}

// Upstream MuleSoft APIs rolled up by an MCP server (mule-he use cases). Shows
// the named APIs from the README plus a "+N more" hint when the full rollup is
// larger than the listed subset.
function McpUpstreamApis({ mcp }: { mcp: McpNode }) {
  if (!mcp.apiCount) return null;
  const remaining = mcp.apiCount - mcp.apis.length;
  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-[#16202c] p-3">
      <div className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
        <Plug className="size-3" />
        {mcp.apiCount} API{mcp.apiCount === 1 ? "" : "s"} de origen
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {mcp.apis.map((api) => (
          <span
            key={api}
            className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/70"
          >
            {api}
          </span>
        ))}
        {remaining > 0 && (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
            +{remaining} más
          </span>
        )}
      </div>
    </div>
  );
}

export function AgentNetworkViz({ network }: { network: AgentNetwork | null }) {
  if (!network) {
    return (
      <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
        No hay ninguna definición de red de agentes disponible para este caso de uso.
      </div>
    );
  }

  return (
    <div className="brand-grid-bg rounded-2xl p-5 sm:p-8">
      {/* Broker */}
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1b2735] p-4 shadow-md">
          <div className="flex min-w-0 items-center gap-3">
            <LogoCircle logo={BROKER_LOGO} alt="MuleSoft" fallback={Bot} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                Broker · MuleSoft
              </div>
              <div className="truncate text-sm font-semibold text-white">
                {network.brokerName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {network.model && (
              <span className="rounded-full bg-[#dfe9ff] px-3 py-1 text-xs font-medium text-[#3b5bdb]">
                {network.model}
              </span>
            )}
            <ChevronDown className="size-5 text-white/50" />
          </div>
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center" aria-hidden="true">
        <div className="h-6 w-px bg-white/15" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <div className="rounded-xl border border-dashed border-white/20 p-4">
          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-white/80">
            <Network className="size-4" />
            Agentes
          </div>
          <div className="space-y-4">
            {network.agents.map((a) => {
              const brand = platformBrand(a.platform);
              return (
                <NodeCard
                  key={a.name}
                  kind="agent"
                  label={brand.label}
                  sublabel={a.label}
                  logo={brand.logo}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-white/20 p-4">
          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-white/80">
            <Server className="size-4" />
            Servidores MCP
          </div>
          <div className="space-y-4">
            {network.mcpServers.map((m) => (
              <div key={m.name}>
                <NodeCard
                  kind="mcp"
                  label="Servidor MCP"
                  sublabel={m.label}
                  logo={MCP_LOGO}
                />
                <McpUpstreamApis mcp={m} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {network.provider?.organization && (
        <p className="mt-6 text-center text-xs text-white/40">
          Proveedor: {network.provider.organization}
        </p>
      )}
    </div>
  );
}
