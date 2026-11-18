import { NextResponse } from "next/server";
import { getConfiguredSlugs } from "@/lib/broker-config";

export const dynamic = "force-dynamic";

// Public read: returns the list of use-case slugs that have a broker URL
// configured, so the landing page can show a "chat" affordance on those cards.
export async function GET() {
  return NextResponse.json(
    { configuredSlugs: getConfiguredSlugs() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
