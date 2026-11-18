"use client";

import type { UseCase } from "@/lib/types";

function seededInt(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const pos = (h >>> 0) / 0xffffffff;
  return Math.floor(pos * (max - min + 1)) + min;
}

// The four models that appear in the routing map
const MODELS = [
  { id: "gpt-4o", label: "GPT-4o", color: "#10a37f" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", color: "#10a37f" },
  { id: "claude-sonnet", label: "Claude Sonnet", color: "#d97706" },
  { id: "gemini-pro", label: "Gemini Pro", color: "#4285f4" },
];

// Pick the "primary" model for this use case based on slug
function primaryModel(slug: string) {
  return MODELS[seededInt(slug + "pm", 0, MODELS.length - 1)];
}

interface DayData {
  label: string;
  gpt4o: number;
  gpt4omini: number;
  claude: number;
  gemini: number;
}

function buildChartData(slug: string): DayData[] {
  const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14"];
  return days.map((d) => ({
    label: `ago ${d}`,
    gpt4o: seededInt(slug + d + "a", 800, 3200),
    gpt4omini: seededInt(slug + d + "b", 400, 1800),
    claude: seededInt(slug + d + "c", 200, 1200),
    gemini: seededInt(slug + d + "d", 100, 800),
  }));
}

interface RoutingRule {
  agent: string;
  model: string;
  fallback: string;
  reason: string;
  avgTokens: number;
}

function buildRoutingRules(useCase: UseCase): RoutingRule[] {
  const agents = useCase.network?.agents || [];
  const slug = useCase.slug;
  const modelNames = MODELS.map((m) => m.label);
  return agents.slice(0, 5).map((a, i) => ({
    agent: a.label,
    model: modelNames[seededInt(slug + a.label + "m", 0, modelNames.length - 1)],
    fallback: modelNames[seededInt(slug + a.label + "f", 0, modelNames.length - 1)],
    reason: ["Optimizado por coste", "Optimizado por latencia", "Prioridad a la calidad", "Requisito de cumplimiento"][
      seededInt(slug + i, 0, 3)
    ],
    avgTokens: seededInt(slug + a.label + "t", 300, 2400),
  }));
}

// Paleta Iberostar (azul marino #002855) para el mapa de enrutado
const MAP_COLORS = {
  request: { fill: "#a9bfd6", stroke: "#1f4269" },
  gateway: { fill: "#002855", stroke: "#001833" },
  router:  { fill: "#6f8fb3", stroke: "#1f4269" },
  model:   { fill: "#d6e1ec", stroke: "#a9bfd6" },
  modelPrimary: { fill: "#1f4269", stroke: "#002855" },
  arrow:   "#1f4269",
  text:    "#000000",
  textGw:  "#ffffff",   // white on dark gateway box
  textPrimary: "#ffffff",
};

function RoutingMapSVG({ slug }: { slug: string }) {
  const primary = primaryModel(slug);

  const W = 680;
  const H = 280;

  const reqBox = { x: 20, y: 110, w: 90, h: 40 };
  const gwBox = { x: 160, y: 90, w: 120, h: 80 };
  const routerBox = { x: 360, y: 110, w: 80, h: 40 };

  const modelY = [40, 110, 175, 235];
  const modelX = 510;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
      <defs>
        <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={MAP_COLORS.arrow} />
        </marker>
      </defs>

      {/* Request box */}
      <rect x={reqBox.x} y={reqBox.y} width={reqBox.w} height={reqBox.h} rx="8"
        fill={MAP_COLORS.request.fill} stroke={MAP_COLORS.request.stroke} strokeWidth="1.5" />
      <text x={reqBox.x + reqBox.w / 2} y={reqBox.y + 24} textAnchor="middle"
        fontSize="11" fill={MAP_COLORS.text} fontWeight="600">Solicitud</text>

      {/* Arrow: request → gateway */}
      <line x1={reqBox.x + reqBox.w} y1={reqBox.y + 20} x2={gwBox.x} y2={gwBox.y + 40}
        stroke={MAP_COLORS.arrow} strokeWidth="1.5" markerEnd="url(#arr)" />

      {/* MuleSoft AI Gateway box */}
      <rect x={gwBox.x} y={gwBox.y} width={gwBox.w} height={gwBox.h} rx="10"
        fill={MAP_COLORS.gateway.fill} stroke={MAP_COLORS.gateway.stroke} strokeWidth="2" />
      <text x={gwBox.x + gwBox.w / 2} y={gwBox.y + 24} textAnchor="middle"
        fontSize="10" fill={MAP_COLORS.textGw} fontWeight="700">MuleSoft</text>
      <text x={gwBox.x + gwBox.w / 2} y={gwBox.y + 40} textAnchor="middle"
        fontSize="10" fill={MAP_COLORS.textGw} fontWeight="700">AI Gateway</text>
      <text x={gwBox.x + gwBox.w / 2} y={gwBox.y + 58} textAnchor="middle"
        fontSize="9" fill="#bfdbfe">Motor de políticas</text>

      {/* Arrow: gateway → router */}
      <line x1={gwBox.x + gwBox.w} y1={gwBox.y + 40} x2={routerBox.x} y2={routerBox.y + 20}
        stroke={MAP_COLORS.arrow} strokeWidth="1.5" markerEnd="url(#arr)" />

      {/* Router box */}
      <rect x={routerBox.x} y={routerBox.y} width={routerBox.w} height={routerBox.h} rx="8"
        fill={MAP_COLORS.router.fill} stroke={MAP_COLORS.router.stroke} strokeWidth="1.5" />
      <text x={routerBox.x + routerBox.w / 2} y={routerBox.y + 24} textAnchor="middle"
        fontSize="10" fill={MAP_COLORS.text} fontWeight="700">Enrutador</text>

      {/* Lines: router → each model */}
      {MODELS.map((m, i) => (
        <line
          key={m.id}
          x1={routerBox.x + routerBox.w}
          y1={routerBox.y + 20}
          x2={modelX}
          y2={modelY[i] + 16}
          stroke={MAP_COLORS.arrow}
          strokeWidth={m.id === primary.id ? 2.5 : 1.5}
          strokeDasharray={m.id === primary.id ? "0" : "5 4"}
          opacity={m.id === primary.id ? 1 : 0.45}
          markerEnd="url(#arr)"
        />
      ))}

      {/* Model nodes */}
      {MODELS.map((m, i) => {
        const isPrimary = m.id === primary.id;
        const c = isPrimary ? MAP_COLORS.modelPrimary : MAP_COLORS.model;
        return (
          <g key={m.id}>
            <rect x={modelX} y={modelY[i]} width={115} height={32} rx="8"
              fill={c.fill} stroke={c.stroke} strokeWidth={isPrimary ? 2 : 1} />
            <text x={modelX + 57} y={modelY[i] + 20} textAnchor="middle"
              fontSize="11" fill={isPrimary ? MAP_COLORS.textPrimary : MAP_COLORS.text}
              fontWeight={isPrimary ? "700" : "500"}>
              {m.label}
            </text>
            {isPrimary && (
              <text x={modelX + 119} y={modelY[i] + 20} fontSize="9"
                fill={MAP_COLORS.gateway.fill} fontWeight="600">← principal</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TokenBarChart({ data }: { data: DayData[] }) {
  const maxVal = Math.max(...data.map((d) => d.gpt4o + d.gpt4omini + d.claude + d.gemini));
  const H = 160;
  const BAR_W = 30;
  const GAP = 14;
  const CHART_W = data.length * (BAR_W + GAP);

  const colors = ["#10a37f", "#34d399", "#d97706", "#4285f4"];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${CHART_W + 40} ${H + 50}`} className="w-full" style={{ minWidth: 360 }}>
        {data.map((d, i) => {
          const segs = [d.gpt4o, d.gpt4omini, d.claude, d.gemini];
          const total = segs.reduce((a, b) => a + b, 0);
          let yOff = H;
          const x = 20 + i * (BAR_W + GAP);
          return (
            <g key={d.label}>
              {segs.map((v, si) => {
                const h = (v / maxVal) * H;
                yOff -= h;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={yOff}
                    width={BAR_W}
                    height={h}
                    fill={colors[si]}
                    opacity={0.85}
                  />
                );
              })}
              <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">
                {d.label.replace("ago ", "")}
              </text>
            </g>
          );
        })}
        {/* Y-axis label */}
        <text x="8" y="12" fontSize="8" fill="hsl(var(--muted-foreground))">Tokens</text>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 px-1">
        {["GPT-4o", "GPT-4o mini", "Claude Sonnet", "Gemini Pro"].map((lbl, i) => (
          <div key={lbl} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: colors[i] }} />
            {lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LlmGatewayTab({ useCase }: { useCase: UseCase }) {
  const slug = useCase.slug;
  const chartData = buildChartData(slug);
  const routingRules = buildRoutingRules(useCase);
  const primary = primaryModel(slug);

  const totalReqs = seededInt(slug + "reqs", 12000, 48000);
  const totalTokens = seededInt(slug + "tok", 3000000, 12000000);
  const avgCostCents = seededInt(slug + "cost", 3, 28);
  const avgCost = (avgCostCents / 100).toFixed(2);
  const totalCost = ((totalReqs * avgCostCents) / 100).toFixed(2);
  const cacheHit = seededInt(slug + "cache", 22, 61);
  const p95 = seededInt(slug + "p95", 340, 1800);

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Solicitudes totales (30 d)", value: totalReqs.toLocaleString("es-ES") },
          { label: "Tokens totales (30 d)", value: `${(totalTokens / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M` },
          { label: "Coste medio por solicitud", value: `${avgCost.replace(".", ",")} $` },
          { label: "Coste total (30 d)", value: `${Number(totalCost).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $` },
          { label: "Tasa de aciertos de caché", value: `${cacheHit} %` },
          { label: "Latencia P95", value: `${p95} ms` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Routing map + token chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">
            Mapa de enrutado dinámico de LLM
          </div>
          <div className="p-4">
            <RoutingMapSVG slug={slug} />
            <p className="mt-2 text-xs text-muted-foreground">
              Modelo principal de este caso de uso:{" "}
              <span className="font-semibold" style={{ color: primary.color }}>{primary.label}</span>.
              Las líneas discontinuas indican rutas de respaldo.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">
            Consumo de tokens: 14 días
          </div>
          <div className="p-4">
            <TokenBarChart data={chartData} />
          </div>
        </div>
      </div>

      {/* Routing rules table */}
      {routingRules.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">
            Reglas de enrutado de modelos
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Agente</th>
                  <th className="px-5 py-2.5 text-left font-medium">Modelo asignado</th>
                  <th className="hidden px-5 py-2.5 text-left font-medium sm:table-cell">Respaldo</th>
                  <th className="hidden px-5 py-2.5 text-left font-medium lg:table-cell">Motivo del enrutado</th>
                  <th className="px-5 py-2.5 text-right font-medium">Tokens medios/solicitud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {routingRules.map((r) => (
                  <tr key={r.agent} className="hover:bg-secondary/50">
                    <td className="px-5 py-3 font-medium">{r.agent}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.model}</td>
                    <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{r.fallback}</td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {r.reason}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{r.avgTokens.toLocaleString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
