import { NextRequest, NextResponse } from "next/server";
import { getBrokerConfig, setBrokerConfig } from "@/lib/broker-config";
import { getUseCase } from "@/lib/use-cases";
import { isBrokerConfigAdmin } from "@/lib/email-domains";

export const dynamic = "force-dynamic";

// Public read: any visitor can fetch the globally-configured broker URL so they
// can chat with the broker the admin set up. `?email=` also reports whether that
// user may edit it (BROKER_CONFIG_ADMIN_EMAIL is server-only, so the client
// cannot check it itself). The POST below re-checks before saving.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const email = req.nextUrl.searchParams.get("email") || "";
  return NextResponse.json(
    { slug, config: getBrokerConfig(slug), canConfigure: isBrokerConfigAdmin(email) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Write: only the broker config admin may set the broker URL.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!getUseCase(slug)) {
    return NextResponse.json({ error: "Caso de uso desconocido" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const email = (body?.email as string) || "";
  if (!isBrokerConfigAdmin(email)) {
    return NextResponse.json(
      { error: "No tienes autorización para configurar este broker." },
      { status: 403 }
    );
  }

  const url = typeof body?.url === "string" ? body.url : "";
  const config = setBrokerConfig(slug, url);
  return NextResponse.json({ slug, config });
}
