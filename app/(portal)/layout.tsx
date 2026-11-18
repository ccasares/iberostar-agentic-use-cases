import { PortalGate } from "@/components/portal-gate";
import { PortalHeader } from "@/components/portal-header";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGate>
      <div className="min-h-screen bg-background">
        <PortalHeader />
        {children}
      </div>
    </PortalGate>
  );
}
