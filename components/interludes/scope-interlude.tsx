import { ScrambleText } from "@/components/scramble-text";
import { TypeOut } from "@/components/type-out";

/**
 * Interlude — viewport-height visual breath between Selected Work and Open
 * Source. One dominant stat (years in adversary mode) with a thin mono
 * breakdown line below. No section heading, no body copy — purely a "data
 * slip" the reader passes through. Transparent background so the site-wide
 * OGL ambient shows through.
 *
 * Numbers are sourced from real bio + case data — no fabrication.
 */
export function ScopeInterlude() {
  return (
    <section
      aria-label="Scope at a glance"
      className="relative flex min-h-screen items-center justify-center px-3u md:px-8u"
    >
      <div className="grid grid-cols-12 gap-x-3u">
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          {/* Eyebrow + accent rule */}
          <div className="mb-12u flex items-center gap-3u">
            <span aria-hidden="true" className="block h-px w-12u bg-accent" />
            <p className="font-mono text-caption uppercase text-ink-mute">
              <TypeOut>Evidence / Scope</TypeOut>
            </p>
          </div>

          {/* Dominant stat */}
          <p
            data-cursor-magnet
            className="font-serif text-display leading-[0.95] text-ink md:text-[12rem]"
          >
            <ScrambleText>4+</ScrambleText>
          </p>
          <p className="mt-3u font-serif text-h2 text-balance text-ink-soft">
            years in adversary mode.
          </p>

          {/* Breakdown — mono, single horizontal line */}
          <div className="mt-12u flex items-center gap-3u">
            <span aria-hidden="true" className="block h-px w-8u bg-rule" />
            <p className="font-mono text-caption uppercase tracking-wider text-ink-mute">
              4 industries · 4 dossier cases · 80+ apps in scope · 1 CVE disclosed
            </p>
            <span
              aria-hidden="true"
              className="block h-px flex-1 bg-rule opacity-50"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
