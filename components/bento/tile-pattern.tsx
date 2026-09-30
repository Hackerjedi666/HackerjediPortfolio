import { cn } from "@/lib/utils";

export type PatternName =
  | "grid"
  | "radar"
  | "scan"
  | "hatch"
  | "matrix"
  | "topo"
  | "ports"
  | "trace";

/**
 * The texture behind a tile.
 *
 * These are deliberately not generic wallpaper. The craft rule is that a
 * background is a surface, textured only from the subject's world — a grid
 * overlay with nothing under it is decoration. Every pattern here is drawn
 * from the work the tile is about:
 *
 *   grid   — network segments, the thing an operator draws first
 *   radar  — a sweep, for the tile about finding things
 *   scan   — terminal scanlines, for the shell
 *   hatch  — the annotation hatch on a marked-up report
 *   matrix — a dot matrix, the shape of scan output
 *   topo   — concentric reach, for blast radius
 *   ports  — a port-range ruler, for surface enumeration
 *
 * All are pure CSS gradients or inline SVG at very low alpha, masked toward
 * the top so copy at the bottom of a tile keeps its contrast. No raster
 * assets, no `feTurbulence` grain.
 */

const PATTERNS: Record<PatternName, React.CSSProperties> = {
  grid: {
    backgroundImage:
      "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
    backgroundSize: "44px 44px",
  },
  radar: {
    backgroundImage:
      "repeating-radial-gradient(circle at 78% 16%, currentColor 0 1px, transparent 1px 34px)",
  },
  scan: {
    backgroundImage:
      "repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 6px)",
  },
  hatch: {
    backgroundImage:
      "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 11px)",
  },
  matrix: {
    backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.1px)",
    backgroundSize: "18px 18px",
  },
  topo: {
    backgroundImage:
      "repeating-radial-gradient(circle at 50% 120%, currentColor 0 1px, transparent 1px 26px)",
  },
  // A signal trace stepping across the card — for the tile about a career.
  trace: {
    backgroundImage:
      "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 60px), repeating-linear-gradient(0deg, currentColor 0 1px, transparent 1px 60px)",
    backgroundSize: "60px 60px",
    transform: "skewY(-8deg)",
  },
  ports: {
    backgroundImage:
      "repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 9px), repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 45px)",
    backgroundSize: "100% 14px, 100% 26px",
    backgroundPosition: "0 22px, 0 22px",
    backgroundRepeat: "no-repeat",
  },
};

export function TilePattern({
  name,
  className,
}: {
  name: PatternName;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={PATTERNS[name]}
      className={cn("tile-pattern", className)}
    />
  );
}
