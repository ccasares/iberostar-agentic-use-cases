import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Customer wordmark. On dark surfaces pass variant="light" to render the symbol
 * in white. Replace the logo file at /public/brand-logo.svg, the brand name
 * below, and the accent split-color in the rebrand step.
 */
export function BrandLogo({
  className,
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "light";
}) {
  const wordColor = variant === "light" ? "#ffffff" : "var(--brand-surface)";
  const accent = "var(--brand-accent)";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/brand-logo.svg"
        alt="Grupo Iberostar"
        width={110}
        height={33}
        priority
        unoptimized
        className="shrink-0"
        style={
          variant === "light"
            ? { filter: "brightness(0) invert(1)" }
            : undefined
        }
      />
      <span className="flex flex-col leading-none">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: wordColor }}
        >
          Grupo <span style={{ color: accent }}>Iberostar</span>
        </span>
        <span
          className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em]"
          style={{
            color: variant === "light" ? "rgba(255,255,255,0.7)" : "#64748b",
          }}
        >
          Portal de demostración
        </span>
      </span>
    </span>
  );
}
