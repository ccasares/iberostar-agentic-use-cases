import { NextResponse } from "next/server";
import { getAllStats } from "@/lib/stats";
import { getAllSlugs } from "@/lib/use-cases";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = getAllStats(getAllSlugs());
  return NextResponse.json({ stats });
}
