"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCases } from "@/lib/use-cases";
import type { UseCase } from "@/lib/types";
import { platformBrand, MCP_LOGO, BROKER_LOGO } from "@/lib/platform-logos";
import { cn } from "@/lib/utils";
import {
  Bot,
  Server,
  Star,
  Search,
  Filter,
  Info,
  Plus,
  Minus,
  Maximize2,
  X,
  ExternalLink,
  Network,
  Rows3,
  LayoutGrid,
  Workflow,
  Square,
  Columns2,
} from "lucide-react";

// ---- Layout constants (world coordinates, in px before scaling) ----
const CARD_W = 210;
const CARD_H = 62;
const H_GAP = 26;
const V_BAND = 250; // vertical distance between successive broker rows
const BROKER_CHILD_GAP = 118; // broker bottom -> children top
const PAD = 140;

// Tree layout (broker on the left, children stacked to the right)
const TREE_H_GAP = 170; // broker right edge -> children column
const TREE_V_GAP = 22; // gap between stacked children
const TREE_BLOCK_GAP = 80; // gap between successive broker blocks

// Group layout (each broker as a two-column composite card)
const GROUP_W = 560;
const GROUP_PAD = 18;
const GROUP_HEADER_H = 58;
const GROUP_COL_HEADER_H = 30;
const GROUP_ROW_H = 60;
const GROUP_ROW_GAP = 12;
const GROUP_BLOCK_GAP = 56;

const LANE_GAP = 100; // horizontal gap between broker columns when columns = 2

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.2;

type NodeKind = "broker" | "agent" | "mcp";
type LayoutMode = "stack" | "group" | "tree";

interface VizNode {
  id: string;
  kind: NodeKind;
  slug: string;
  x: number; // top-left world x
  y: number; // top-left world y
  title: string;
  badge: "Agent" | "MCP";
  sublabel: string;
  logo: string | null;
}

interface VizEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface VizGroup {
  slug: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  mode: LayoutMode;
  nodes: VizNode[];
  edges: VizEdge[];
  groups: VizGroup[];
  nodeById: Map<string, VizNode>;
  useCaseBySlug: Map<string, UseCase>;
  worldWidth: number;
  worldHeight: number;
}

interface ChildMeta {
  id: string;
  kind: "agent" | "mcp";
  title: string;
  badge: "Agent" | "MCP";
  sublabel: string;
  logo: string | null;
}

function brokerChildren(u: UseCase): ChildMeta[] {
  const net = u.network!;
  return [
    ...net.agents.map((a) => ({
      id: `${u.slug}:agent:${a.name}`,
      kind: "agent" as const,
      title: a.label,
      badge: "Agent" as const,
      sublabel: platformBrand(a.platform).label,
      logo: platformBrand(a.platform).logo,
    })),
    ...net.mcpServers.map((m) => ({
      id: `${u.slug}:mcp:${m.name}`,
      kind: "mcp" as const,
      title: m.label,
      badge: "MCP" as const,
      sublabel: m.apiCount ? upstreamApisLabel(m.apiCount) : "Servidor MCP",
      logo: MCP_LOGO,
    })),
  ];
}

function groupCardHeight(u: UseCase): number {
  const net = u.network!;
  const rows = Math.max(1, net.agents.length, net.mcpServers.length);
  const colBodyH = rows * GROUP_ROW_H + Math.max(0, rows - 1) * GROUP_ROW_GAP;
  // GROUP_PAD (card) + header + mt-4 gap + column padding/header + rows + GROUP_PAD,
  // with a small buffer so the fixed-height card never clips its content.
  return (
    GROUP_PAD +
    GROUP_HEADER_H +
    16 +
    24 + // dashed column inner padding (p-3 top/bottom)
    GROUP_COL_HEADER_H +
    colBodyH +
    GROUP_PAD +
    8
  );
}

function buildLayout(
  mode: LayoutMode,
  columns: number,
  activeTag: string | null
): Layout {
  const cases = useCases.filter(
    (u) => u.network && (!activeTag || (u.tags ?? []).includes(activeTag))
  );
  const cols = Math.max(1, columns);

  const nodes: VizNode[] = [];
  const edges: VizEdge[] = [];
  const groups: VizGroup[] = [];
  const useCaseBySlug = new Map<string, UseCase>();
  cases.forEach((u) => useCaseBySlug.set(u.slug, u));

  let worldWidth = CARD_W + PAD * 2;
  let worldHeight = CARD_H + PAD * 2;

  const pushBroker = (u: UseCase, x: number, y: number) => {
    nodes.push({
      id: `${u.slug}:broker`,
      kind: "broker",
      slug: u.slug,
      x,
      y,
      title: u.network!.brokerName || u.title,
      badge: "Agent",
      sublabel: "MuleSoft",
      logo: BROKER_LOGO,
    });
  };

  const pushChild = (u: UseCase, c: ChildMeta, x: number, y: number) => {
    nodes.push({
      id: c.id,
      kind: c.kind,
      slug: u.slug,
      x,
      y,
      title: c.title,
      badge: c.badge,
      sublabel: c.sublabel,
      logo: c.logo,
    });
  };

  if (mode === "stack") {
    const rowWidths = cases.map((u) => {
      const n = u.network!.agents.length + u.network!.mcpServers.length;
      return Math.max(1, n) * CARD_W + Math.max(0, n - 1) * H_GAP;
    });
    const laneWidth = Math.max(CARD_W, ...rowWidths);
    worldWidth = cols * laneWidth + (cols - 1) * LANE_GAP + PAD * 2;
    const laneCenterX = (col: number) =>
      PAD + col * (laneWidth + LANE_GAP) + laneWidth / 2;

    const colY = new Array(cols).fill(PAD);
    cases.forEach((u, i) => {
      const col = i % cols;
      const centerX = laneCenterX(col);
      const children = brokerChildren(u);
      const brokerY = colY[col];
      const brokerX = centerX - CARD_W / 2;
      const brokerId = `${u.slug}:broker`;
      pushBroker(u, brokerX, brokerY);

      const rowWidth =
        children.length * CARD_W + Math.max(0, children.length - 1) * H_GAP;
      const startX = centerX - rowWidth / 2;
      const childY = brokerY + BROKER_CHILD_GAP;

      children.forEach((c, j) => {
        const cx = startX + j * (CARD_W + H_GAP);
        pushChild(u, c, cx, childY);
        edges.push({
          id: `${brokerId}->${c.id}`,
          x1: brokerX + CARD_W / 2,
          y1: brokerY + CARD_H,
          x2: cx + CARD_W / 2,
          y2: childY,
        });
      });

      colY[col] = brokerY + V_BAND;
    });

    worldHeight =
      Math.max(...colY) - V_BAND + BROKER_CHILD_GAP + CARD_H + PAD;
  } else if (mode === "tree") {
    const laneWidth = CARD_W + TREE_H_GAP + CARD_W;
    worldWidth = cols * laneWidth + (cols - 1) * LANE_GAP + PAD * 2;
    const laneBaseX = (col: number) => PAD + col * (laneWidth + LANE_GAP);

    const colY = new Array(cols).fill(PAD);
    cases.forEach((u, i) => {
      const col = i % cols;
      const brokerX = laneBaseX(col);
      const childX = brokerX + CARD_W + TREE_H_GAP;
      const children = brokerChildren(u);
      const count = Math.max(1, children.length);
      const blockH = count * CARD_H + Math.max(0, count - 1) * TREE_V_GAP;
      const brokerY = colY[col] + (blockH - CARD_H) / 2;
      const brokerId = `${u.slug}:broker`;
      pushBroker(u, brokerX, brokerY);

      children.forEach((c, j) => {
        const cy = colY[col] + j * (CARD_H + TREE_V_GAP);
        pushChild(u, c, childX, cy);
        edges.push({
          id: `${brokerId}->${c.id}`,
          x1: brokerX + CARD_W,
          y1: brokerY + CARD_H / 2,
          x2: childX,
          y2: cy + CARD_H / 2,
        });
      });

      colY[col] += blockH + TREE_BLOCK_GAP;
    });

    worldHeight = Math.max(...colY) - TREE_BLOCK_GAP + PAD;
  } else {
    // group: composite two-column card per broker, arranged in columns
    worldWidth = cols * GROUP_W + (cols - 1) * LANE_GAP + PAD * 2;
    const laneBaseX = (col: number) => PAD + col * (GROUP_W + LANE_GAP);

    const colY = new Array(cols).fill(PAD);
    cases.forEach((u, i) => {
      const col = i % cols;
      const x = laneBaseX(col);
      const h = groupCardHeight(u);
      groups.push({ slug: u.slug, x, y: colY[col], w: GROUP_W, h });

      // Metadata-only nodes (no geometry needed) so the detail panel,
      // search, and filters keep working uniformly.
      pushBroker(u, x, colY[col]);
      brokerChildren(u).forEach((c) => pushChild(u, c, x, colY[col]));

      colY[col] += h + GROUP_BLOCK_GAP;
    });

    worldHeight = Math.max(...colY) - GROUP_BLOCK_GAP + PAD;
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

  return {
    mode,
    nodes,
    edges,
    groups,
    nodeById,
    useCaseBySlug,
    worldWidth,
    worldHeight,
  };
}

// Display labels for the node badge; the badge values themselves stay as-is.
const BADGE_LABEL: Record<"Agent" | "MCP", string> = {
  Agent: "Agente",
  MCP: "MCP",
};

// Display labels for the node-type filter.
const KIND_LABEL: Record<NodeKind, string> = {
  broker: "Brokers",
  agent: "Agentes",
  mcp: "Servidores MCP",
};

function upstreamApisLabel(count: number): string {
  return `${count} API${count === 1 ? "" : "s"} de origen`;
}

function badgeClasses(badge: "Agent" | "MCP") {
  return badge === "Agent"
    ? "bg-[#e7edff] text-[#3b5bdb]"
    : "bg-[#f3e8ff] text-[#9333ea]";
}

function NodeIcon({
  logo,
  kind,
  size = 18,
}: {
  logo: string | null;
  kind: NodeKind;
  size?: number;
}) {
  const Fallback = kind === "mcp" ? Server : Bot;
  return (
    <span className="flex size-7 shrink-0 items-center justify-center">
      {kind === "broker" && (
        <Star className="size-3.5 fill-[#f4b400] text-[#f4b400]" />
      )}
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="object-contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <Fallback className="size-4 text-slate-500" />
      )}
    </span>
  );
}

function NodeCard({
  node,
  selected,
  dimmed,
  onSelect,
}: {
  node: VizNode;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={cn(
        "absolute flex items-center gap-2 rounded-lg border bg-white px-3 text-left shadow-sm transition-colors",
        "hover:border-[#3b5bdb]/60 hover:shadow-md",
        selected
          ? "border-[#3b5bdb] ring-2 ring-[#3b5bdb]/40"
          : "border-slate-200",
        dimmed && "opacity-30"
      )}
      style={{ left: node.x, top: node.y, width: CARD_W, height: CARD_H }}
    >
      {node.kind === "broker" ? (
        <span className="flex size-7 shrink-0 items-center justify-center">
          <Image
            src="/brand-logo.svg"
            alt=""
            width={20}
            height={20}
            unoptimized
            className="object-contain"
            style={{ width: 20, height: 20 }}
          />
        </span>
      ) : (
        <NodeIcon logo={node.logo} kind={node.kind} />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[12px] font-semibold text-slate-800">
            {node.title}
          </span>
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold",
              badgeClasses(node.badge)
            )}
          >
            {BADGE_LABEL[node.badge]}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
          {node.sublabel}
        </span>
      </span>
    </button>
  );
}

function GroupLogoCircle({
  logo,
  fallback: Fallback,
}: {
  logo: string | null;
  fallback: typeof Bot;
}) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="object-contain"
          style={{ width: 20, height: 20 }}
        />
      ) : (
        <Fallback className="size-4 text-slate-500" />
      )}
    </span>
  );
}

function GroupChildRow({
  id,
  title,
  sublabel,
  logo,
  badge,
  selected,
  onSelect,
}: {
  id: string;
  title: string;
  sublabel: string;
  logo: string | null;
  badge: "Agent" | "MCP";
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 text-left transition-colors hover:border-[#3b5bdb]/60 hover:shadow-sm",
        selected ? "border-[#3b5bdb] ring-2 ring-[#3b5bdb]/40" : "border-slate-200"
      )}
      style={{ height: GROUP_ROW_H }}
    >
      <GroupLogoCircle logo={logo} fallback={badge === "MCP" ? Server : Bot} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
          {sublabel}
        </span>
      </span>
    </button>
  );
}

function BrokerGroupCard({
  group,
  useCase,
  filters,
  selectedId,
  dimmed,
  onSelect,
}: {
  group: VizGroup;
  useCase: UseCase;
  filters: { broker: boolean; agent: boolean; mcp: boolean };
  selectedId: string | null;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const net = useCase.network!;
  const brokerId = `${useCase.slug}:broker`;
  return (
    <div
      className={cn(
        "absolute flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity",
        dimmed && "opacity-30"
      )}
      style={{
        left: group.x,
        top: group.y,
        width: group.w,
        height: group.h,
        padding: GROUP_PAD,
      }}
    >
      {/* Broker header */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(brokerId);
        }}
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-slate-50 px-3 text-left transition-colors hover:border-[#3b5bdb]/60",
          selectedId === brokerId
            ? "border-[#3b5bdb] ring-2 ring-[#3b5bdb]/40"
            : "border-slate-200"
        )}
        style={{ height: GROUP_HEADER_H }}
      >
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
          <Image
            src="/brand-logo.svg"
            alt=""
            width={20}
            height={20}
            unoptimized
            className="object-contain"
            style={{ width: 20, height: 20 }}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Broker · MuleSoft
          </span>
          <span className="block truncate text-sm font-semibold text-slate-800">
            {net.brokerName || useCase.title}
          </span>
        </span>
        {net.model && (
          <span className="shrink-0 rounded-full bg-[#e7edff] px-2.5 py-1 text-[11px] font-medium text-[#3b5bdb]">
            {net.model}
          </span>
        )}
      </button>

      {/* Two columns */}
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-4">
        {filters.agent && (
          <div className="rounded-xl border border-dashed border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <Network className="size-3.5" />
              Agentes
            </div>
            <div className="flex flex-col gap-3">
              {net.agents.map((a) => {
                const brand = platformBrand(a.platform);
                const id = `${useCase.slug}:agent:${a.name}`;
                return (
                  <GroupChildRow
                    key={a.name}
                    id={id}
                    title={a.label}
                    sublabel={brand.label}
                    logo={brand.logo}
                    badge="Agent"
                    selected={selectedId === id}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          </div>
        )}
        {filters.mcp && (
          <div className="rounded-xl border border-dashed border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <Server className="size-3.5" />
              Servidores MCP
            </div>
            <div className="flex flex-col gap-3">
              {net.mcpServers.map((m) => {
                const id = `${useCase.slug}:mcp:${m.name}`;
                return (
                  <GroupChildRow
                    key={m.name}
                    id={id}
                    title={m.label}
                    sublabel={
                      m.apiCount ? upstreamApisLabel(m.apiCount) : "Servidor MCP"
                    }
                    logo={MCP_LOGO}
                    badge="MCP"
                    selected={selectedId === id}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 px-5 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-1.5 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function DetailPanel({
  node,
  useCase,
  onClose,
  onSelect,
  nodeById,
}: {
  node: VizNode;
  useCase: UseCase;
  onClose: () => void;
  onSelect: (id: string) => void;
  nodeById: Map<string, VizNode>;
}) {
  const net = useCase.network;
  const isBroker = node.kind === "broker";
  const mcp =
    node.kind === "mcp"
      ? net?.mcpServers.find((m) => `${useCase.slug}:mcp:${m.name}` === node.id)
      : undefined;
  const subtitle =
    node.kind === "broker"
      ? "Agente, activo v1.0.0 (más reciente)"
      : node.kind === "mcp"
        ? "Servidor MCP, activo v1.1.0 (más reciente)"
        : "Agente, activo v1.0.0 (más reciente)";

  const llm = net?.model ? platformBrand(net.model) : null;

  return (
    <div className="pointer-events-auto absolute left-0 top-0 z-20 flex h-full w-[300px] max-w-[85vw] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pb-3 pt-4">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
          {node.logo ? (
            <Image
              src={node.logo}
              alt=""
              width={24}
              height={24}
              unoptimized
              className="size-6 object-contain"
            />
          ) : (
            <Bot className="size-5 text-slate-500" />
          )}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <Link
            href={`/use-case/${useCase.slug}`}
            onClick={onClose}
            className="block truncate text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
            title={node.title}
          >
            {node.title}
          </Link>
          <div className="mt-0.5 text-[11px] text-slate-400">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles"
          className="flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <Section title="Descripción">
          <div className="flex items-start justify-between gap-3">
            <p className="flex-1 text-[13px] leading-relaxed text-slate-600">
              {isBroker
                ? net?.brokerDescription || useCase.shortDescription || "—"
                : `${node.badge === "MCP" ? "Servidor MCP" : "Agente"} de la red ${net?.brokerName || useCase.title}.`}
            </p>
            <Link
              href={`/use-case/${useCase.slug}`}
              onClick={onClose}
              className="shrink-0 whitespace-nowrap text-[12px] font-medium text-[#3b5bdb] hover:underline"
            >
              Ver activo
            </Link>
          </div>
        </Section>

        {isBroker && net?.provider?.organization && (
          <Section title="Proveedor">{net.provider.organization}</Section>
        )}

        <Section title="Plataforma">
          {node.kind === "broker"
            ? "MuleSoft"
            : node.kind === "mcp"
              ? "Otra"
              : node.sublabel}
        </Section>

        {isBroker && llm && (
          <Section title="Proxies de LLM">
            <span className="inline-flex items-center gap-1.5">
              {llm.logo && (
                <Image
                  src={llm.logo}
                  alt=""
                  width={14}
                  height={14}
                  unoptimized
                  className="size-3.5 object-contain"
                />
              )}
              {llm.label}
              <span className="text-slate-400">· {net?.model}</span>
            </span>
          </Section>
        )}

        {mcp && mcp.apiCount > 0 && (
          <Section
            title={`APIs de origen (${mcp.apiCount})`}
          >
            <div className="flex flex-wrap gap-1.5">
              {mcp.apis.map((api) => (
                <span
                  key={api}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600"
                >
                  {api}
                </span>
              ))}
              {mcp.apiCount > mcp.apis.length && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  +{mcp.apiCount - mcp.apis.length} más
                </span>
              )}
            </div>
          </Section>
        )}

        {isBroker && net && net.skills.length > 0 && (
          <Section title="Habilidades">
            <div className="flex flex-wrap gap-1.5">
              {net.skills.map((s) => (
                <span
                  key={s.id || s.name}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {isBroker && net && net.agents.length > 0 && (
          <Section title="Agentes vinculados">
            <ul className="space-y-1">
              {net.agents.map((a) => {
                const id = `${useCase.slug}:agent:${a.name}`;
                return (
                  <li key={a.name}>
                    <button
                      type="button"
                      onClick={() => nodeById.has(id) && onSelect(id)}
                      className="text-left text-[12px] font-medium text-[#3b5bdb] hover:underline"
                    >
                      {a.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {isBroker && net && net.mcpServers.length > 0 && (
          <Section title="Servidores MCP y herramientas">
            <ul className="space-y-1">
              {net.mcpServers.map((m) => {
                const id = `${useCase.slug}:mcp:${m.name}`;
                return (
                  <li key={m.name}>
                    <button
                      type="button"
                      onClick={() => nodeById.has(id) && onSelect(id)}
                      className="text-left text-[12px] font-medium text-[#3b5bdb] hover:underline"
                    >
                      {m.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {!isBroker && net && (
          <Section title="Forma parte de">
            <button
              type="button"
              onClick={() => onSelect(`${useCase.slug}:broker`)}
              className="inline-flex items-center gap-1 text-left text-[12px] font-medium text-[#3b5bdb] hover:underline"
            >
              {net.brokerName}
              <ExternalLink className="size-3" />
            </button>
          </Section>
        )}
      </div>
    </div>
  );
}

function CircleButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50",
        active ? "border-[#3b5bdb] text-[#3b5bdb]" : "border-slate-200"
      )}
    >
      {children}
    </button>
  );
}

export function AgentFabricVisualizer({ onClose }: { onClose: () => void }) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("stack");
  const [columns, setColumns] = useState<1 | 2>(1);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const layout = useMemo(
    () => buildLayout(layoutMode, columns, activeTag),
    [layoutMode, columns, activeTag]
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Tags available across brokers (use cases with a network), with counts.
  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of useCases) {
      if (!u.network) continue;
      for (const t of u.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);
  const brokerCount = useMemo(
    () => useCases.filter((u) => u.network).length,
    []
  );

  // Single atomic view state so wheel/drag updates never nest setState calls.
  const [view, setView] = useState({ scale: 0.7, x: 0, y: 0 });
  const scale = view.scale;
  const offset = { x: view.x, y: view.y };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [filters, setFilters] = useState({
    broker: true,
    agent: true,
    mcp: true,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock background scroll while the overlay is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const fitView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const fit = Math.min(width / layout.worldWidth, 1);
    const s = Math.max(MIN_SCALE, Math.min(fit, 0.85));
    setView({
      scale: s,
      x: (width - layout.worldWidth * s) / 2,
      y: Math.min(40, height * 0.04),
    });
  }, [layout.worldWidth]);

  // Initial fit: center horizontally, anchor near the top. Runs once the portal
  // container is actually in the DOM (mounted) and again when the layout changes.
  useEffect(() => {
    if (mounted) fitView();
  }, [mounted, fitView, layoutMode, columns, activeTag]);

  // Escape to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedId) setSelectedId(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selectedId]);

  // Non-passive wheel zoom toward cursor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      setView((v) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
        const k = next / v.scale;
        return {
          scale: next,
          x: px - (px - v.x) * k,
          y: py - (py - v.y) * k,
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mounted]);

  const zoomBy = useCallback((factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;
    setView((v) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
      const k = next / v.scale;
      return {
        scale: next,
        x: px - (px - v.x) * k,
        y: py - (py - v.y) * k,
      };
    });
  }, []);

  const resetView = fitView;

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setView((v) => ({ ...v, x: d.originX + dx, y: d.originY + dy }));
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const onBackgroundClick = () => {
    if (!dragRef.current.moved) setSelectedId(null);
  };

  const matchSet = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const set = new Set<string>();
    for (const u of layout.useCaseBySlug.values()) {
      const net = u.network!;
      const hay = [
        u.title,
        u.slug,
        net.brokerName,
        ...net.agents.map((a) => a.label + " " + a.platform),
        ...net.mcpServers.map((m) => m.label),
      ]
        .join(" ")
        .toLowerCase();
      if (hay.includes(q)) {
        set.add(`${u.slug}:broker`);
        net.agents.forEach((a) => set.add(`${u.slug}:agent:${a.name}`));
        net.mcpServers.forEach((m) => set.add(`${u.slug}:mcp:${m.name}`));
      }
    }
    return set;
  }, [query, layout.useCaseBySlug]);

  const isHidden = useCallback(
    (kind: NodeKind) => !filters[kind],
    [filters]
  );

  const selectedNode = selectedId ? layout.nodeById.get(selectedId) : null;
  const selectedUseCase = selectedNode
    ? layout.useCaseBySlug.get(selectedNode.slug)
    : null;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#f4f6fa]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-[var(--brand-surface)] text-white">
            <Star className="size-3.5 fill-current" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-800">
              Visualizador de Agent Fabric
            </div>
            <div className="text-[11px] text-slate-400">
              {layout.useCaseBySlug.size} brokers · agentes y servidores MCP
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(
              [
                { id: "stack", label: "Pila", Icon: Rows3 },
                { id: "group", label: "Grupos", Icon: LayoutGrid },
                { id: "tree", label: "Árbol", Icon: Workflow },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayoutMode(id)}
                aria-pressed={layoutMode === id}
                title={`Vista: ${label}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  layoutMode === id
                    ? "bg-[#3b5bdb] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setColumns(n)}
                aria-pressed={columns === n}
                title={`${n} broker${n > 1 ? "s" : ""} por fila`}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  columns === n
                    ? "bg-[#3b5bdb] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {n === 1 ? (
                  <Square className="size-4" />
                ) : (
                  <Columns2 className="size-4" />
                )}
                <span className="hidden sm:inline">{n} por fila</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <X className="size-4" />
          Cerrar
        </button>
      </div>

      {/* Canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onBackgroundClick}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(100,116,139,0.18) 1px, transparent 1px)",
            backgroundSize: `${24 * scale}px ${24 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              width: layout.worldWidth,
              height: layout.worldHeight,
            }}
          >
            {layout.mode === "group" ? (
              /* Group cards (one composite per broker) */
              layout.groups.map((g) => {
                if (!filters.broker) return null;
                const useCase = layout.useCaseBySlug.get(g.slug);
                if (!useCase) return null;
                const dimmed = matchSet
                  ? !matchSet.has(`${g.slug}:broker`)
                  : false;
                return (
                  <BrokerGroupCard
                    key={g.slug}
                    group={g}
                    useCase={useCase}
                    filters={filters}
                    selectedId={selectedId}
                    dimmed={dimmed}
                    onSelect={setSelectedId}
                  />
                );
              })
            ) : (
              <>
                {/* Edges */}
                <svg
                  className="pointer-events-none absolute left-0 top-0 overflow-visible"
                  width={layout.worldWidth}
                  height={layout.worldHeight}
                >
                  {layout.edges.map((e) => {
                    const fromNode = layout.nodeById.get(e.id.split("->")[0]);
                    const toNode = layout.nodeById.get(e.id.split("->")[1]);
                    const hide =
                      (fromNode && isHidden(fromNode.kind)) ||
                      (toNode && isHidden(toNode.kind));
                    if (hide) return null;
                    const d =
                      layout.mode === "tree"
                        ? `M ${e.x1} ${e.y1} C ${(e.x1 + e.x2) / 2} ${e.y1}, ${(e.x1 + e.x2) / 2} ${e.y2}, ${e.x2} ${e.y2}`
                        : `M ${e.x1} ${e.y1} C ${e.x1} ${(e.y1 + e.y2) / 2}, ${e.x2} ${(e.y1 + e.y2) / 2}, ${e.x2} ${e.y2}`;
                    return (
                      <path
                        key={e.id}
                        d={d}
                        fill="none"
                        stroke="rgba(100,116,139,0.45)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>

                {/* Nodes */}
                {layout.nodes.map((n) => {
                  if (isHidden(n.kind)) return null;
                  const dimmed = matchSet ? !matchSet.has(n.id) : false;
                  return (
                    <NodeCard
                      key={n.id}
                      node={n}
                      selected={selectedId === n.id}
                      dimmed={dimmed}
                      onSelect={setSelectedId}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && selectedUseCase && (
          <DetailPanel
            node={selectedNode}
            useCase={selectedUseCase}
            onClose={() => setSelectedId(null)}
            onSelect={setSelectedId}
            nodeById={layout.nodeById}
          />
        )}

        {/* Top-right controls */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          {searchOpen && (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca brokers, agentes…"
              className="h-9 w-56 rounded-full border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-[#3b5bdb]"
            />
          )}
          <CircleButton
            label="Buscar"
            active={searchOpen}
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setQuery("");
            }}
          >
            <Search className="size-4" />
          </CircleButton>
          <div className="relative">
            <CircleButton
              label="Filtrar por tipo de nodo y etiqueta"
              active={filterOpen || activeTag !== null}
              onClick={() => {
                setFilterOpen((v) => !v);
                setShowLegend(false);
              }}
            >
              <Filter className="size-4" />
            </CircleButton>
            {filterOpen && (
              <div className="absolute right-0 top-11 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Tipos de nodo
                </div>
                {(["broker", "agent", "mcp"] as const).map((k) => (
                  <label
                    key={k}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={filters[k]}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, [k]: e.target.checked }))
                      }
                    />
                    {KIND_LABEL[k]}
                  </label>
                ))}
                {tagOptions.length > 0 && (
                  <>
                    <div className="mt-1.5 border-t border-slate-100 pt-1.5" />
                    <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Etiqueta
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTag(null);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm capitalize hover:bg-slate-50",
                        activeTag === null
                          ? "font-semibold text-[#3b5bdb]"
                          : "text-slate-700"
                      )}
                    >
                      <span>Todas</span>
                      <span className="text-[11px] text-slate-400">
                        {brokerCount}
                      </span>
                    </button>
                    {tagOptions.map(([tag, count]) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setActiveTag(tag);
                          setSelectedId(null);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm capitalize hover:bg-slate-50",
                          activeTag === tag
                            ? "font-semibold text-[#3b5bdb]"
                            : "text-slate-700"
                        )}
                      >
                        <span className="truncate">{tag}</span>
                        <span className="text-[11px] text-slate-400">
                          {count}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <CircleButton
              label="Leyenda"
              active={showLegend}
              onClick={() => {
                setShowLegend((v) => !v);
                setFilterOpen(false);
              }}
            >
              <Info className="size-4" />
            </CircleButton>
            {showLegend && (
              <div className="absolute right-0 top-11 w-60 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
                <div className="mb-2 font-semibold text-slate-700">Leyenda</div>
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Star className="size-3.5 fill-[#f4b400] text-[#f4b400]" />
                    Broker (orquestador de MuleSoft)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#e7edff] px-1.5 py-0.5 text-[9px] font-semibold text-[#3b5bdb]">
                      Agente
                    </span>
                    Subagente A2A
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#f3e8ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#9333ea]">
                      MCP
                    </span>
                    Servidor MCP / herramientas
                  </div>
                </div>
                <p className="mt-3 border-t border-slate-100 pt-2 text-[12px] text-slate-400">
                  Arrastra para desplazarte · usa la rueda para hacer zoom · haz clic en un nodo para ver los detalles.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom-right zoom controls */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
          <CircleButton label="Alejar" onClick={() => zoomBy(1 / 1.2)}>
            <Minus className="size-4" />
          </CircleButton>
          <button
            type="button"
            onClick={resetView}
            title="Restablecer vista"
            aria-label="Restablecer vista"
            className="flex size-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50"
          >
            <Maximize2 className="size-4" />
          </button>
          <CircleButton label="Acercar" onClick={() => zoomBy(1.2)}>
            <Plus className="size-4" />
          </CircleButton>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 left-4 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          {Math.round(scale * 100)} %
        </div>
      </div>
    </div>,
    document.body
  );
}
