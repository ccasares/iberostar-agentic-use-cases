import { connection } from "next/server";
import { PortalGate } from "@/components/portal-gate";
import { PortalHeader } from "@/components/portal-header";
import { ALLOWED_DOMAINS } from "@/lib/email-domains";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render per request so ALLOWED_EMAIL_DOMAINS is read at runtime (a Heroku
  // config change restarts the dyno without rebuilding).
  await connection();
  return (
    <PortalGate allowedDomains={ALLOWED_DOMAINS}>
      <div className="min-h-screen bg-background">
        <PortalHeader />
        {children}
      </div>
    </PortalGate>
  );
}
