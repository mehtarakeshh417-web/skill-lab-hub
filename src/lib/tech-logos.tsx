import { GraduationCap, Sparkles } from "lucide-react";
import { TECH_ICON_PATHS } from "./tech-icon-paths";
import { cn } from "./utils";

type TechLogoMeta = {
  /** Simple Icons slug -> official single-path mark */
  slug?: keyof typeof TECH_ICON_PATHS;
  /** Official brand colour (hex) */
  brand: string;
  /** Tailwind gradient used behind the mark */
  gradient: string;
};

/**
 * Every technology name used across the portal maps to an official brand mark.
 * Names must stay identical to ASSIGNMENT_TECHNOLOGIES / project templates so
 * existing records keep matching.
 */
export const TECH_LOGOS: Record<string, TechLogoMeta> = {
  "Scratch Junior": { slug: "scratch", brand: "#4D97FF", gradient: "from-sky-400 to-blue-500" },
  "Scratch Jr": { slug: "scratch", brand: "#4D97FF", gradient: "from-sky-400 to-blue-500" },
  Scratch: { slug: "scratch", brand: "#4D97FF", gradient: "from-blue-500 to-indigo-500" },
  HTML: { slug: "html5", brand: "#E34F26", gradient: "from-orange-500 to-red-500" },
  Python: { slug: "python", brand: "#3776AB", gradient: "from-sky-500 to-amber-400" },
  Java: { slug: "openjdk", brand: "#F89820", gradient: "from-rose-500 to-orange-500" },
  MySQL: { slug: "mysql", brand: "#4479A1", gradient: "from-teal-500 to-sky-600" },
  Paint: { slug: "gimp", brand: "#5C5543", gradient: "from-amber-500 to-stone-500" },
  Editor: { slug: "libreofficewriter", brand: "#083FA6", gradient: "from-blue-600 to-indigo-600" },
  Spreadsheet: { slug: "libreofficecalc", brand: "#007C3C", gradient: "from-emerald-500 to-green-600" },
  Presentation: { slug: "libreofficeimpress", brand: "#D0120D", gradient: "from-amber-500 to-red-500" },
  "General Computer Science": { brand: "#0d7a5f", gradient: "from-emerald-500 to-teal-600" },
  Other: { brand: "#64748b", gradient: "from-slate-400 to-slate-600" },
};

export function getTechMeta(name: string): TechLogoMeta {
  return TECH_LOGOS[name] ?? TECH_LOGOS.Other;
}

export function getTechGradient(name: string) {
  return getTechMeta(name).gradient;
}

/**
 * Renders the official brand mark for a technology.
 * `tone="brand"` paints the official brand colour, `tone="current"` inherits
 * the surrounding text colour (used on coloured gradient tiles).
 */
export function TechLogo({
  name,
  className,
  tone = "current",
}: {
  name: string;
  className?: string;
  tone?: "brand" | "current";
}) {
  const meta = getTechMeta(name);

  if (!meta.slug) {
    const Fallback = name === "Other" ? Sparkles : GraduationCap;
    return (
      <Fallback
        className={cn("h-5 w-5", className)}
        style={tone === "brand" ? { color: meta.brand } : undefined}
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={`${name} logo`}
      className={cn("h-5 w-5", className)}
      fill={tone === "brand" ? meta.brand : "currentColor"}
    >
      <path d={TECH_ICON_PATHS[meta.slug]} />
    </svg>
  );
}