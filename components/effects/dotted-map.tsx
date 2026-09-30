import { createMap } from "svg-dotted-map";
import { cn } from "@/lib/utils";

export type Marker = { lat: number; lng: number; size?: number };

type Props = {
  className?: string;
  width?: number;
  height?: number;
  /** Dot count across the whole map. Higher is denser and costs more nodes. */
  mapSamples?: number;
  markers?: Marker[];
  dotRadius?: number;
};

/**
 * A dotted world map, rendered at build time.
 *
 * Ported from MagicUI's `dotted-map` rather than installed through shadcn.
 * That component is one of the few in the registry with no shadcn coupling
 * — no token scheme, no Button, no second icon set — so the only thing
 * actually needed was its `svg-dotted-map` dependency. What changed:
 *
 *   - Colours come from the design tokens instead of a hardcoded `#FF6900`,
 *     so the map follows the accent like every other effect here.
 *   - It is a SERVER component. `createMap` samples several thousand points;
 *     doing that in the browser on every mount is work the client never
 *     needs to repeat, and this way the dots arrive in the HTML.
 *   - The stagger/pulse machinery is dropped. A pulsing marker is decoration
 *     on a card that already has a live number next to it.
 *
 * Markers are the regions the intel sources actually cover, not decoration.
 */
export function DottedMap({
  className,
  width = 150,
  height = 75,
  mapSamples = 4200,
  markers = [],
  dotRadius = 0.28,
}: Props) {
  const { points, addMarkers } = createMap({ width, height, mapSamples });
  const placed = addMarkers(markers);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-full w-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={dotRadius} />
        ))}
      </g>
      <g>
        {placed.map((m, i) => (
          <circle
            key={`m-${i}`}
            cx={m.x}
            cy={m.y}
            r={(m as { size?: number }).size ?? dotRadius * 2.6}
            fill="var(--color-acid)"
          />
        ))}
      </g>
    </svg>
  );
}
