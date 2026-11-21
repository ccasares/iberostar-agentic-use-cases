"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/components/portal-gate";
import { cn } from "@/lib/utils";
import type { ExampleQuery, UseCase } from "@/lib/types";
import { SIMULATED_CONVERSATIONS } from "@/lib/simulated-conversations";
import {
  Bot,
  Send,
  Settings2,
  User,
  Loader2,
  Sparkles,
  ChevronDown,
  Play,
  ArrowRight,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "broker";
  text: string;
}

interface BrokerConfig {
  url: string;
}

function defaultConfig(): BrokerConfig {
  return { url: "" };
}

export function BrokerChat({ useCase }: { useCase: UseCase }) {
  const { verifiedEmail } = usePortal();
  // Only the users listed in BROKER_CONFIG_ADMIN_EMAIL (server env var) may
  // view/edit the broker configuration; the server tells us via the GET below.
  // The configured URL is stored server-side, so it applies globally for every
  // visitor of the use case.
  const [canConfigure, setCanConfigure] = useState(false);
  const [config, setConfig] = useState<BrokerConfig>(defaultConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [contextId, setContextId] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);
  // True once the admin starts editing, so a late-arriving GET can't clobber
  // their in-progress input.
  const editedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scripted conversation replay ("Simular conversación").
  const simTurns = SIMULATED_CONVERSATIONS[useCase.slug];
  // Index of the next turn to play; null when no simulation is running.
  const [simNext, setSimNext] = useState<number | null>(null);
  const [simPlaying, setSimPlaying] = useState(false);
  // Bumped on every (re)start/unmount so stale timers from a previous run stop.
  const simRunRef = useRef(0);

  useEffect(() => () => void simRunRef.current++, []);

  const wait = (ms: number, run: number) =>
    new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(simRunRef.current === run), ms)
    );

  const playTurn = async (idx: number, run: number) => {
    const turn = simTurns?.[idx];
    if (!turn) return;
    setSimPlaying(true);
    setInput("");
    // Type the prompt into the message box, then "send" it.
    const charMs = Math.max(8, Math.min(35, 3500 / turn.prompt.length));
    for (let i = 1; i <= turn.prompt.length; i++) {
      if (!(await wait(charMs, run))) return;
      setInput(turn.prompt.slice(0, i));
    }
    if (!(await wait(450, run))) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: turn.prompt }]);
    setSending(true);
    if (!(await wait(turn.thinkMs, run))) return;
    setSending(false);
    setMessages((prev) => [...prev, { role: "broker", text: turn.reply }]);
    setSimPlaying(false);
    setSimNext(idx + 1 < simTurns.length ? idx + 1 : null);
  };

  const startSimulation = () => {
    const run = ++simRunRef.current;
    setMessages([]);
    setInput("");
    setSending(false);
    setContextId(null);
    setSimNext(null);
    playTurn(0, run);
  };

  const continueSimulation = () => {
    if (simNext === null) return;
    const idx = simNext;
    setSimNext(null);
    playTurn(idx, simRunRef.current);
  };

  // Load the globally-configured broker URL for this use case (set by the
  // admin) so every visitor can chat with the same broker.
  useEffect(() => {
    let cancelled = false;
    const qs = verifiedEmail
      ? `?email=${encodeURIComponent(verifiedEmail)}`
      : "";
    fetch(`/api/broker-config/${useCase.slug}${qs}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const admin = d?.canConfigure === true;
        setCanConfigure(admin);
        if (editedRef.current) return;
        const url = d?.config?.url || "";
        setConfig({ url });
        if (!url && admin) setShowConfig(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [useCase.slug, verifiedEmail]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  // Close the examples dropdown when clicking outside of it.
  useEffect(() => {
    if (!showExamples) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!examplesRef.current?.contains(e.target as Node)) {
        setShowExamples(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showExamples]);

  // Admin-only: persist the broker URL globally for this use case. Debounced so
  // we don't POST on every keystroke.
  const saveConfig = (next: BrokerConfig) => {
    editedRef.current = true;
    setConfig(next);
    if (!canConfigure) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/broker-config/${useCase.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next.url, email: verifiedEmail }),
      }).catch(() => {});
    }, 400);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || simPlaying) return;
    // Typing a real message ends any scripted replay.
    simRunRef.current++;
    setSimNext(null);
    if (!config.url) {
      if (canConfigure) {
        setShowConfig(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "broker",
            text: "⚠️ Este broker todavía no está configurado. Vuelve a intentarlo más tarde.",
          },
        ]);
      }
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerUrl: config.url,
          text: trimmed,
          contextId,
        }),
      });
      const data = await res.json();
      // Long broker calls are streamed with a 200 status, so failures arrive
      // as an `error` field in the body.
      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "broker",
            text: `⚠️ ${data.error || "La solicitud ha fallado"}${
              data.detail ? `\n\n\`\`\`\n${data.detail}\n\`\`\`` : ""
            }`,
          },
        ]);
      } else {
        if (data.contextId) setContextId(data.contextId);
        setMessages((prev) => [...prev, { role: "broker", text: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "broker", text: "⚠️ No se ha podido conectar con el broker." },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Prefer the curated "## Example queries" from the use-case README; fall back
  // to the agent-network skill examples when none are defined.
  const examples: ExampleQuery[] = (
    useCase.exampleQueries?.length
      ? useCase.exampleQueries
      : (useCase.network?.skills.flatMap((s) => s.examples) || []).map((q) => ({
          label: q,
          query: q,
        }))
  ).slice(0, 6);

  // While the broker orchestrates (a 60-90s round trip), cycle through messages
  // built from this broker's agents and MCP servers so the wait feels alive.
  // These are illustrative — the portal proxies a single A2A message/send and
  // does not receive per-agent progress events.
  const orchestrationSteps = useMemo(() => {
    const net = useCase.network;
    const steps: string[] = [];
    net?.agents.forEach((a) => steps.push(`Consultando ${a.label}…`));
    net?.mcpServers.forEach((m) => steps.push(`Consultando ${m.label} (MCP)…`));
    return steps.length
      ? ["Enviando tu solicitud al broker…", ...steps, "Componiendo la respuesta…"]
      : ["Trabajando en ello…"];
  }, [useCase.network]);

  useEffect(() => {
    if (!sending) return;
    setStepIdx(0);
    const id = setInterval(
      () => setStepIdx((i) => (i + 1) % orchestrationSteps.length),
      simPlaying ? 2500 : 8000
    );
    return () => clearInterval(id);
  }, [sending, simPlaying, orchestrationSteps.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Config bar — visible only to the broker config admin */}
      {canConfigure && (
      <div className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowConfig((s) => !s)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        >
          <span className="inline-flex items-center gap-2">
            <Settings2 className="size-4 text-primary" />
            Configuración del broker
            {config.url ? (
              <span className="ml-1 truncate text-xs font-normal text-muted-foreground">
                {config.url}
              </span>
            ) : (
              <span className="ml-1 text-xs font-normal text-destructive">
                sin configurar
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              showConfig && "rotate-180"
            )}
          />
        </button>
        {showConfig && (
          <div className="space-y-3 border-t border-border p-4">
            <div className="space-y-1.5">
              <Label htmlFor="broker-url">URL del broker</Label>
              <Input
                id="broker-url"
                placeholder="https://agent-network-ingress-gw-xxxx.cloudhub.io/tu-broker/"
                value={config.url}
                onChange={(e) => saveConfig({ ...config, url: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Esta URL del broker se guarda de forma global para este caso de uso:
              todos los visitantes chatean con el broker que configures aquí. Las
              solicitudes pasan por el servidor del portal (A2A <code>message/send</code>).
            </p>
          </div>
        )}
      </div>
      )}

      {simTurns?.length ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={startSimulation}
            disabled={simPlaying}
          >
            <Play className="size-4 text-primary" />
            Simular conversación
          </Button>
        </div>
      ) : null}

      {/* Chat window */}
      <div className="flex h-[460px] flex-col rounded-xl border border-border bg-card">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="size-6 text-primary" />
              </div>
              <p className="text-sm font-medium">
                Chatea con el broker de {useCase.title}
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Haz una pregunta y el broker orquestará sus agentes y servidores MCP
                para responderte.
              </p>
              {examples.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground/80">
                  ¿Necesitas ideas? Usa el menú{" "}
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Sparkles className="size-3 text-primary" />
                    Ejemplos
                  </span>{" "}
                  del cuadro de mensaje de abajo.
                </p>
              )}
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "broker" && (
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="size-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {m.role === "broker" ? (
                    <div className="prose-brand max-w-none [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}

          {sending && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  El broker está orquestando…
                </span>
                <span
                  key={stepIdx}
                  className="animate-in fade-in pl-6 text-xs text-muted-foreground/80"
                >
                  {orchestrationSteps[stepIdx]}
                </span>
              </div>
            </div>
          )}

          {simNext !== null && !simPlaying && (
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={continueSimulation}>
                Continuar
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            {examples.length > 0 && (
              <div ref={examplesRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  onClick={() => setShowExamples((s) => !s)}
                  title="Consultas de ejemplo"
                  aria-label="Consultas de ejemplo"
                  aria-expanded={showExamples}
                >
                  <Sparkles className="size-4 text-primary" />
                </Button>
                {showExamples && (
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-[min(28rem,80vw)] overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                    <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                      Consultas de ejemplo
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {examples.map((ex, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setInput(ex.query);
                            setShowExamples(false);
                            textareaRef.current?.focus();
                          }}
                          className="block w-full px-3 py-2 text-left transition-colors hover:bg-secondary"
                          title={ex.query}
                        >
                          <span className="block text-xs font-medium text-foreground">
                            {ex.label}
                          </span>
                          {ex.label !== ex.query && (
                            <span className="mt-0.5 line-clamp-2 block text-[11px] text-muted-foreground">
                              {ex.query}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              readOnly={simPlaying}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Escribe al broker…  (Intro para enviar, Mayús+Intro para nueva línea)"
              className="max-h-32 min-h-[44px] flex-1 resize-none"
              rows={1}
            />
            <Button
              onClick={() => send(input)}
              disabled={!input.trim() || sending || simPlaying}
              size="icon-lg"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
