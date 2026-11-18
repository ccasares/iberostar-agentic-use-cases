"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UseCase } from "@/lib/types";
import { Bot, Server, Cpu, Workflow, Boxes } from "lucide-react";

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bot;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

export function OverviewTab({ useCase }: { useCase: UseCase }) {
  const net = useCase.network;
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // Deep link: /use-case/<slug>?tab=overview#<agent-or-mcp-id>
  useEffect(() => {
    const focusHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlighted(id);
      window.setTimeout(() => setHighlighted((cur) => (cur === id ? null : cur)), 2500);
    };
    // Wait a frame so the tab content is laid out before scrolling.
    const raf = window.requestAnimationFrame(focusHash);
    window.addEventListener("hashchange", focusHash);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", focusHash);
    };
  }, []);

  const rowClass = (id: string) =>
    `scroll-mt-24 border-t border-border transition-colors duration-700 ${
      highlighted === id ? "bg-primary/15" : ""
    }`;

  return (
    <div className="space-y-6">
      {/* At-a-glance summary */}
      {net && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            icon={Workflow}
            label="Orquestador (broker)"
            value={net.brokerName}
          />
          <SummaryStat icon={Cpu} label="Modelo LLM" value={net.model || "—"} />
          <SummaryStat
            icon={Bot}
            label="Agentes A2A"
            value={String(net.agents.length)}
          />
          <SummaryStat
            icon={Server}
            label="Servidores MCP"
            value={String(net.mcpServers.length)}
          />
        </div>
      )}

      {/* Agents + MCP tables */}
      {net && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Bot className="size-4 text-primary" />
              Agentes disponibles
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Agente</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Plataforma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {net.agents.map((a) => (
                    <tr key={a.name} id={a.name} className={rowClass(a.name)}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{a.label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {a.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">
                        {a.platform || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Server className="size-4 text-primary" />
              Servidores MCP disponibles
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Servidor MCP
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Transporte
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {net.mcpServers.map((m) => (
                    <tr key={m.name} id={m.name} className={rowClass(m.name)}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{m.label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {m.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {m.transport || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Orchestration instructions */}
      {net && net.instructions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Boxes className="size-4 text-primary" />
            Cómo funciona la orquestación
          </h3>
          <ul className="space-y-2">
            {net.instructions.map((ins, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full README */}
      {useCase.readme && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="prose-brand max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {useCase.readme}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
