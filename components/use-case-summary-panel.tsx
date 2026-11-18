"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Maximize2, Minimize2, ShieldCheck, Target, Users } from "lucide-react";
import type { UseCaseOverview } from "@/lib/use-case-overviews";
import { cn } from "@/lib/utils";

function CardHeading({ icon: Icon, children }: { icon: typeof Users; children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
      <Icon className="size-4" />
      {children}
    </div>
  );
}

const cardClass =
  "rounded-xl border border-border border-t-4 border-t-primary bg-card p-5 shadow-sm";

export function UseCaseSummaryPanel({
  title,
  overview,
}: {
  title: string;
  overview: UseCaseOverview;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const HeroIcon = overview.heroIcon;

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Maximize2 className="size-3.5" />
          Pantalla completa
        </button>
      </div>

      <div
        className={cn(
          fullscreen &&
            "fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 backdrop-blur-sm sm:p-8"
        )}
      >
        {fullscreen && (
          <div className="mx-auto mb-3 flex max-w-6xl justify-end">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Minimize2 className="size-3.5" />
              Salir de pantalla completa
            </button>
          </div>
        )}

        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-border bg-secondary/40",
            fullscreen && "mx-auto max-w-6xl"
          )}
        >
          {/* Hero banner */}
          <div
            className="relative flex items-start justify-between gap-4 px-6 py-6 text-white sm:px-10"
            style={{
              backgroundColor: "var(--brand-primary, #002855)",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 sm:text-xs">
                {overview.eyebrow}
              </div>
              <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">{title}</h2>
            </div>
            <HeroIcon className="size-10 shrink-0 text-white/80 sm:size-12" strokeWidth={1.5} />
          </div>

          <div className="space-y-4 p-4 sm:p-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.3fr]">
              {/* Persona y propósito */}
              <div className={cardClass}>
                <CardHeading icon={Users}>Persona y propósito</CardHeading>
                <div className="text-lg font-semibold leading-snug">{overview.personaTitle}</div>
                <p className="mt-2 text-sm text-muted-foreground">{overview.personaText}</p>
                {overview.stakeholders.length > 0 && (
                  <p className="mt-4 text-xs text-muted-foreground/80">
                    {overview.stakeholders.join(" · ")}
                  </p>
                )}
              </div>

              {/* Business pain */}
              <div className={cardClass}>
                <CardHeading icon={AlertTriangle}>Business pain</CardHeading>
                <ul className="space-y-3">
                  {overview.pains.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Objetivos (máx. 4) */}
              <div className={cardClass}>
                <CardHeading icon={Target}>Objetivos</CardHeading>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {overview.objectives.slice(0, 4).map(({ icon: Icon, title: t, text }) => (
                    <div key={t} className="rounded-lg border border-border bg-background p-3">
                      <Icon className="size-5 text-primary" />
                      <div className="mt-1.5 text-sm font-semibold leading-tight">{t}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent flow */}
            {overview.flow.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
                {overview.flow.map(({ icon: Icon, label }, i) => (
                  <Fragment key={label}>
                    {i > 0 && (
                      <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                    )}
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-semibold leading-tight">{label}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
            )}

            {overview.footnote && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                {overview.footnote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
