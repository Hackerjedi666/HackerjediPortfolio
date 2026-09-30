import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** `baseFrequency` — higher is finer grain. */
  frequency?: number;
  /** `numOctaves` — more octaves add detail at smaller scales. */
  octaves?: number;
  /** Linear slope per channel after desaturation; this is the contrast. */
  slope?: number;
  /** Opacity of the noise rect itself. */
  noiseOpacity?: number;
};

/**
 * Film grain over a surface.
 *
 * MagicUI's `noise-texture`, near enough intact — it has zero dependencies
 * and is pure SVG, which makes it one of the few registry components with
 * nothing to strip. Three changes:
 *
 *   - It is a server component now. `useId` was only there to keep the
 *     filter id unique across instances; a module-level counter cannot be
 *     used safely in RSC, so the id is derived from the props that actually
 *     define the filter. Two grains with identical settings can share one
 *     filter, which is correct and cheaper.
 *   - `opacity-50 dark:opacity-[0.75]` collapsed to a single value. This
 *     site has one committed theme, so the light branch was dead.
 *   - Defaults retuned much finer and fainter. At 0.4/0.6 it reads as static
 *     on a video call; grain should be felt rather than seen.
 */
export function NoiseTexture({
  className,
  frequency = 0.85,
  octaves = 4,
  slope = 0.12,
  noiseOpacity = 0.42,
}: Props) {
  const id = `grain-${String(frequency).replace(".", "")}-${octaves}-${String(slope).replace(".", "")}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute inset-0 size-full select-none",
        className
      )}
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={frequency}
          numOctaves={octaves}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={slope} />
          <feFuncG type="linear" slope={slope} />
          <feFuncB type="linear" slope={slope} />
        </feComponentTransfer>
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${id})`}
        opacity={noiseOpacity}
      />
    </svg>
  );
}
