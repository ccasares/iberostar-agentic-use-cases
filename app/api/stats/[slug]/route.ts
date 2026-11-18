import { NextRequest, NextResponse } from "next/server";
import { getStats, incrementView, setLike } from "@/lib/stats";
import { getUseCase } from "@/lib/use-cases";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return NextResponse.json({ slug, stats: getStats(slug) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!getUseCase(slug)) {
    return NextResponse.json({ error: "Caso de uso desconocido" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;

  let stats;
  if (action === "view") {
    stats = incrementView(slug);
  } else if (action === "like") {
    stats = setLike(slug, true);
  } else if (action === "unlike") {
    stats = setLike(slug, false);
  } else {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  return NextResponse.json({ slug, stats });
}
