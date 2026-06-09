import { ScrambleText } from "@/components/scramble-text";
import { TypeOut } from "@/components/type-out";

/**
 * Interlude — viewport-height pull-quote between Capabilities and Ventures.
 * Single sentence of stance in display serif, treated as a editorial pull-
 * quote with marker rule + attribution. Pulled verbatim from the bio's
 * closing clause. Transparent background.
 */
export function StanceInterlude() {
  return (
    <section
      aria-label="Stance"
      className="relative flex min-h-screen items-center justify-center px-3u md:px-8u"
    >
      <div className="grid grid-cols-12 gap-x-3u">
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          {/* Eyebrow */}
          <div className="mb-12u flex items-center gap-3u">
            <span aria-hidden="true" className="block h-px w-12u bg-accent" />
            <p className="font-mono text-caption uppercase text-ink-mute">
              <TypeOut>Stance / Verbatim</TypeOut>
            </p>
          </div>

          {/* The quote — display serif, two lines. The opening quotation
              mark hangs into the left margin so the prose left-edge aligns
              cleanly with the eyebrow above. */}
          <blockquote
            data-cursor-magnet
            className="relative font-serif text-balance text-ink"
          >
            <span
              aria-hidden="true"
              className="absolute -left-2u top-0 text-sub-display text-ink-mute md:-left-8u md:text-display"
            >
              &ldquo;
            </span>
            <p className="text-sub-display leading-[1.05] md:text-display">
              <ScrambleText delay={120}>
                Outcomes that change executive decisions.
              </ScrambleText>
            </p>
            <p className="mt-3u text-sub-display leading-[1.05] text-ink-soft md:text-display">
              <ScrambleText delay={420}>Not finding lists.</ScrambleText>
            </p>
          </blockquote>

          {/* Attribution + accent close */}
          <div className="mt-12u flex items-center gap-3u">
            <span aria-hidden="true" className="block h-px w-8u bg-rule" />
            <p className="font-mono text-caption uppercase tracking-wider text-ink-mute">
              Manifesto / Authored
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
