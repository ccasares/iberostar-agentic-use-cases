import data from "./use-cases.json";
import tagConfig from "./use-case-tags.json";
import type { UseCase, UseCasesPayload } from "./types";

const payload = data as unknown as UseCasesPayload;

const DEFAULT_TAGS: string[] =
  (tagConfig as { default?: string[] }).default ?? ["general"];
const TAG_OVERRIDES: Record<string, string[]> =
  (tagConfig as { overrides?: Record<string, string[]> }).overrides ?? {};

// Tags hidden from the portal for now. Flip by setting
// NEXT_PUBLIC_SHOW_MULE_API=true to surface the mule-api use cases again.
const HIDDEN_TAGS = new Set<string>(["mule-api"]);
const SHOW_HIDDEN = process.env.NEXT_PUBLIC_SHOW_MULE_API === "true";

// Tag resolution order: hand-maintained overrides (lib/use-case-tags.json) win,
// then the tags produced at generation time (lib/use-cases.json, e.g. auto
// "mule-api" tagging), then the global default.
export const useCases: UseCase[] = payload.useCases
  .map((u) => ({
    ...u,
    tags:
      TAG_OVERRIDES[u.slug] ?? (u.tags && u.tags.length ? u.tags : DEFAULT_TAGS),
  }))
  .filter(
    (u) => SHOW_HIDDEN || !(u.tags ?? []).some((t) => HIDDEN_TAGS.has(t))
  );

export function getUseCase(slug: string): UseCase | undefined {
  return useCases.find((u) => u.slug === slug);
}

export function getAllSlugs(): string[] {
  return useCases.map((u) => u.slug);
}
