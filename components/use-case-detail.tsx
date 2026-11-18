"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UseCase, UseCaseStats } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLikedSet, setLiked as persistLiked } from "@/lib/liked";
import { OverviewTab } from "@/components/overview-tab";
import { UseCaseSummaryPanel } from "@/components/use-case-summary-panel";
import { getUseCaseOverview } from "@/lib/use-case-overviews";
import { AgentNetworkViz } from "@/components/agent-network-viz";
import { BrokerChat } from "@/components/broker-chat";
import { GovernanceTab } from "@/components/governance-tab";
import { LlmGatewayTab } from "@/components/llm-gateway-tab";
import { PORTAL_TABS } from "@/lib/portal-tabs";
import { usePortal, isAdminEmail } from "@/components/portal-gate";
import { ViewerActivityButton } from "@/components/viewer-activity";
import {
  ArrowLeft,
  Eye,
  Heart,
  FileText,
  Network,
  MessagesSquare,
  User,
  AlertTriangle,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

export function UseCaseDetail({ useCase }: { useCase: UseCase }) {
  const router = useRouter();
  const { verifiedEmail } = usePortal();
  const isAdmin = isAdminEmail(verifiedEmail);
  const [stats, setStats] = useState<UseCaseStats>({ views: 0, likes: 0 });
  const [liked, setLikedState] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Allow deep-linking straight to a tab, e.g. /use-case/slug?tab=chat from the
  // chat shortcut on the landing-page cards. A link to a disabled tab is ignored
  // rather than honoured, so an old bookmark cannot select a tab with no trigger
  // and leave the page showing nothing.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    const allowed = [
      "overview",
      "chat",
      "network",
      ...(PORTAL_TABS.governance ? ["governance"] : []),
      ...(PORTAL_TABS.llmGateway ? ["llm-gateway"] : []),
    ];
    if (tab && allowed.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    setLikedState(getLikedSet().has(useCase.slug));
    // Increment view once per mount.
    fetch(`/api/stats/${useCase.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    })
      .then((r) => r.json())
      .then((d) => d.stats && setStats(d.stats))
      .catch(() => {
        fetch(`/api/stats/${useCase.slug}`)
          .then((r) => r.json())
          .then((d) => d.stats && setStats(d.stats))
          .catch(() => {});
      });
  }, [useCase.slug]);

  // Record the identified viewer so admins can see who looked at this use case.
  useEffect(() => {
    if (!verifiedEmail) return;
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "view",
        email: verifiedEmail,
        slug: useCase.slug,
      }),
    }).catch(() => {});
  }, [useCase.slug, verifiedEmail]);

  const toggleLike = async () => {
    const next = !liked;
    setLikedState(next);
    setStats((s) => ({ ...s, likes: Math.max(0, s.likes + (next ? 1 : -1)) }));
    persistLiked(useCase.slug, next);
    try {
      const res = await fetch(`/api/stats/${useCase.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "like" : "unlike" }),
      });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch {
      toast.error("No se ha podido actualizar el «Me gusta».");
    }
  };

  const summary = getUseCaseOverview(useCase.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" />
          Volver a todos los casos de uso
        </Button>
        <div className="flex items-center gap-2">
          {isAdmin && <ViewerActivityButton slug={useCase.slug} />}
          <Badge variant="outline" className="gap-1.5" title={`${stats.views} ${stats.views === 1 ? "visualización" : "visualizaciones"}`}>
            <Eye className="size-3.5" />
            {stats.views}
          </Badge>
          <Button
            variant={liked ? "default" : "outline"}
            size="sm"
            onClick={toggleLike}
            aria-pressed={liked}
          >
            <Heart className={cn("size-4", liked && "fill-current")} />
            {stats.likes}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          {useCase.network?.model && (
            <Badge variant="secondary">{useCase.network.model}</Badge>
          )}
          <Badge variant="outline" className="font-mono text-[11px]">
            {useCase.slug}
          </Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{useCase.title}</h1>
        {useCase.shortDescription && (
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {useCase.shortDescription}
          </p>
        )}

        {summary ? (
          <UseCaseSummaryPanel title={useCase.title} overview={summary} />
        ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {useCase.persona && (
            <div className="flex gap-3 rounded-xl bg-secondary p-4">
              <User className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Perfil
                </div>
                <div className="mt-0.5 text-sm">{useCase.persona}</div>
              </div>
            </div>
          )}
          {useCase.businessPain && (
            <div className="flex gap-3 rounded-xl bg-secondary p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Problema de negocio
                </div>
                <div className="mt-0.5 text-sm">{useCase.businessPain}</div>
              </div>
            </div>
          )}
          {useCase.orchestration && (
            <div className="flex gap-3 rounded-xl bg-secondary p-4 sm:col-span-2">
              <Network className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cómo funciona la orquestación
                </div>
                <div className="mt-0.5 text-sm">{useCase.orchestration}</div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <FileText className="size-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-1.5">
            <Network className="size-4" />
            Red de agentes
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <MessagesSquare className="size-4" />
            Chat con el broker
          </TabsTrigger>
          {PORTAL_TABS.governance && (
            <TabsTrigger value="governance" className="gap-1.5">
              <ShieldCheck className="size-4" />
              Gobernanza de la IA
            </TabsTrigger>
          )}
          {PORTAL_TABS.llmGateway && (
            <TabsTrigger value="llm-gateway" className="gap-1.5">
              <Cpu className="size-4" />
              LLM Gateway
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab useCase={useCase} />
        </TabsContent>
        <TabsContent value="network" className="mt-5">
          <AgentNetworkViz network={useCase.network} />
        </TabsContent>
        <TabsContent
          value="chat"
          className="mt-5 data-[state=inactive]:hidden"
          forceMount
        >
          <BrokerChat useCase={useCase} />
        </TabsContent>
        {PORTAL_TABS.governance && (
          <TabsContent value="governance" className="mt-5">
            <GovernanceTab useCase={useCase} />
          </TabsContent>
        )}
        {PORTAL_TABS.llmGateway && (
          <TabsContent value="llm-gateway" className="mt-5">
            <LlmGatewayTab useCase={useCase} />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}
