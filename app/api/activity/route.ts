import { NextRequest, NextResponse } from "next/server";
import {
  recordLogin,
  recordView,
  getLogins,
  getViewersForSlug,
  getViewerCountsBySlug,
} from "@/lib/activity";
import { isAdminEmail, isAllowedEmail } from "@/lib/email-domains";

export const dynamic = "force-dynamic";

// Domain whose engagement is surfaced to admins.
const TRACKED_DOMAIN = (
  process.env.TRACKED_EMAIL_DOMAIN || "iberostar.com"
)
  .trim()
  .toLowerCase();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body?.email as string) || "";
  const action = body?.action as string;

  if (!isAllowedEmail(email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (action === "login") {
    recordLogin(email);
  } else if (action === "view") {
    const slug = body?.slug as string;
    if (!slug) {
      return NextResponse.json({ error: "El parámetro slug es obligatorio" }, { status: 400 });
    }
    recordView(email, slug);
  } else {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const viewer = req.nextUrl.searchParams.get("viewer") || "";
  const slug = req.nextUrl.searchParams.get("slug");

  // Only admin-domain users may see who logged in / viewed use cases.
  if (!isAdminEmail(viewer)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  if (slug) {
    return NextResponse.json({
      slug,
      viewers: getViewersForSlug(slug, TRACKED_DOMAIN),
    });
  }

  return NextResponse.json({
    // Portal sign-ins surface every user who logged in (any allowed domain).
    logins: getLogins(),
    viewerCounts: getViewerCountsBySlug(TRACKED_DOMAIN),
  });
}
