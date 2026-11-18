import { notFound } from "next/navigation";
import { getUseCase, getAllSlugs } from "@/lib/use-cases";
import { UseCaseDetail } from "@/components/use-case-detail";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();
  return <UseCaseDetail useCase={useCase} />;
}
