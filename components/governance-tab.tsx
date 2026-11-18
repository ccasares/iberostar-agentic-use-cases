"use client";

import type { UseCase } from "@/lib/types";

// Deterministic "random" number seeded from a string so data looks real but
// stays stable across re-renders.
function seededInt(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const pos = (h >>> 0) / 0xffffffff;
  return Math.floor(pos * (max - min + 1)) + min;
}

interface Policy {
  // Stable seed for the demo numbers, independent of the displayed name.
  seed: string;
  name: string;
  type: string;
  scope: string;
  status: "Active" | "Warning" | "Disabled";
  violations: number;
}

function buildPolicies(slug: string): Policy[] {
  const base: Omit<Policy, "violations" | "status">[] = [
    { seed: "PII Detection & Masking", name: "Detección y enmascaramiento de datos personales", type: "Privacidad de datos", scope: "Entrada + salida" },
    { seed: "Prompt Injection Guard", name: "Protección frente a inyección de prompts", type: "Seguridad", scope: "Entrada" },
    { seed: "Hallucination Scorer", name: "Puntuación de alucinaciones", type: "Calidad", scope: "Salida" },
    { seed: "Toxicity Filter", name: "Filtro de toxicidad", type: "Protección", scope: "Entrada + salida" },
    { seed: "Rate Limiter", name: "Limitación de peticiones", type: "Disponibilidad", scope: "Por agente" },
    { seed: "Anonimización de datos personales (RGPD)", name: "Anonimización de datos personales (RGPD)", type: "Cumplimiento", scope: "Salida" },
  ];
  const statuses: Policy["status"][] = ["Active", "Active", "Active", "Warning", "Active", "Active"];
  return base.map((p, i) => ({
    ...p,
    status: statuses[i],
    violations: seededInt(slug + p.seed, 0, i === 1 ? 3 : 12),
  }));
}

interface LogEntry {
  ts: string;
  msg: string;
  level: "info" | "warn" | "block";
}

const LOG_TEMPLATES: { msg: string; level: LogEntry["level"] }[] = [
  { msg: "Datos personales detectados en la solicitud: 2 campos enmascarados (correo, DNI)", level: "block" },
  { msg: "Intento de inyección de prompt bloqueado (puntuación: 0,94)", level: "block" },
  { msg: "Puntuación de alucinación: 0,12; dentro del umbral", level: "info" },
  { msg: "Límite de peticiones: 42/60 pet./min consumidas", level: "info" },
  { msg: "Análisis de datos personales completado: 0 campos enmascarados", level: "info" },
  { msg: "Filtro de toxicidad: sin incidencias (puntuación 0,03)", level: "info" },
  { msg: "Anonimización RGPD aplicada a la respuesta", level: "warn" },
  { msg: "Puntuación de alucinación: 0,31; marcada para revisión", level: "warn" },
];

function buildLog(slug: string): LogEntry[] {
  const hours = [14, 13, 12, 11, 10, 9, 8, 7];
  const minutes = [32, 55, 14, 7, 48, 23, 59, 11];
  return LOG_TEMPLATES.map((t, i) => {
    const hOff = seededInt(slug + i, 0, 2);
    const mOff = seededInt(slug + i + "m", 0, 59);
    return {
      ts: `2026-08-10 ${String(hours[i] - hOff).padStart(2, "0")}:${String((minutes[i] + mOff) % 60).padStart(2, "0")}`,
      msg: t.msg,
      level: t.level,
    };
  });
}

interface ComplianceItem {
  label: string;
  score: number;
  color: string;
}

// Deliberately four widely recognised frameworks and no jurisdiction-specific
// act. A named local law is either right for one customer and wrong for the
// rest, or right for none — and the portal is a template. The rebrand phase
// swaps these for whatever the account brief found the customer is actually
// held to.
function buildCompliance(slug: string): ComplianceItem[] {
  return [
    { label: "RGPD / LOPDGDD", score: seededInt(slug + "rgpd-lopdgdd", 80, 100), color: "bg-emerald-500" },
    { label: "PCI DSS v4.0.1", score: seededInt(slug + "pcidss", 78, 100), color: "bg-emerald-500" },
    { label: "CSRD / ESRS", score: seededInt(slug + "csrd-esrs", 70, 95), color: "bg-amber-500" },
    { label: "Reglamento IA (UE) 2024/1689", score: seededInt(slug + "ai-act", 60, 90), color: "bg-amber-500" },
  ];
}

const STATUS_BADGE: Record<Policy["status"], string> = {
  Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Disabled: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<Policy["status"], string> = {
  Active: "Activa",
  Warning: "Advertencia",
  Disabled: "Desactivada",
};

const LOG_COLOR: Record<LogEntry["level"], string> = {
  info: "text-muted-foreground",
  warn: "text-amber-500",
  block: "text-red-500",
};

export function GovernanceTab({ useCase }: { useCase: UseCase }) {
  const slug = useCase.slug;
  const policies = buildPolicies(slug);
  const log = buildLog(slug);
  const compliance = buildCompliance(slug);

  const totalPolicies = policies.filter((p) => p.status !== "Disabled").length;
  const totalViolations = policies.reduce((s, p) => s + p.violations, 0);
  const inspected = seededInt(slug + "insp", 1200, 8400);
  const latency = seededInt(slug + "lat", 4, 18);

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Políticas activas", value: totalPolicies },
          { label: "Infracciones bloqueadas (30 d)", value: totalViolations },
          { label: "Solicitudes inspeccionadas (30 d)", value: inspected.toLocaleString("es-ES") },
          { label: "Latencia media de las políticas", value: `${latency} ms` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Policies table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold">
          Políticas activas: {useCase.title}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Política</th>
                <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                <th className="hidden px-5 py-2.5 text-left font-medium sm:table-cell">Ámbito</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-right font-medium">Infracciones (30 d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {policies.map((p) => (
                <tr key={p.name} className="hover:bg-secondary/50">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{p.type}</td>
                  <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{p.scope}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {p.violations > 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{p.violations}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Policy event log */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">
            Eventos recientes de las políticas
          </div>
          <div className="max-h-64 overflow-y-auto p-4 font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="shrink-0 text-muted-foreground">[{entry.ts}]</span>
                <span className={LOG_COLOR[entry.level]}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance posture */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">
            Estado de cumplimiento
          </div>
          <div className="space-y-4 p-5">
            {compliance.map((c) => (
              <div key={c.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="tabular-nums text-muted-foreground">{c.score}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full ${c.color}`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Las puntuaciones son orientativas y se basan en la cobertura y el grado de aplicación de las políticas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
