"use client";

import { useState } from "react";
import Link from "next/link";
import { usePortal } from "@/components/portal-gate";
import { BrandLogo } from "@/components/brand";
import { PortalActivityButton } from "@/components/viewer-activity";
import { AgentFabricVisualizer } from "@/components/agent-fabric-visualizer";
import { Button } from "@/components/ui/button";
import { LogOut, Workflow } from "lucide-react";

export function PortalHeader() {
  const { verifiedEmail, signOut } = usePortal();
  const [vizOpen, setVizOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {verifiedEmail}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setVizOpen(true)}
            aria-label="Abrir el visualizador de Agent Fabric"
            title="Visualizador"
          >
            <Workflow className="size-4" />
          </Button>
          <PortalActivityButton />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={signOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
      {vizOpen && <AgentFabricVisualizer onClose={() => setVizOpen(false)} />}
    </header>
  );
}
