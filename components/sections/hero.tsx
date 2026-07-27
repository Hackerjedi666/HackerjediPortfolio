import { HERO, FORENSIA_URL } from "@/lib/content/site";
import { LiveClock } from "@/components/chrome/live-clock";
import { MagneticLink } from "@/components/chrome/magnetic-link";
import { AsciiFluid } from "@/components/effects/ascii-fluid";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="top"
      aria-label="Introduction"
      className="relative z-[1] flex min-h-dvh flex-col border-b border-hairline px-gutter pb-10 pt-24 sm:pt-30"
    >
      {/* ── FLUID REGION ──────────────────────────────────────────────
          Everything above the rule. `flex-1` makes this stretch to fill
          whatever the headline doesn't use, so the tank always ends exactly
          at the divider under "BEFORE THEY DO." rather than at an arbitrary
          percentage that cuts through the middle of the headline.

          The fluid pools at the bottom of its own container under gravity —
          which is now the rule itself, so the liquid appears to rest on the
          line. Bounding it here also keeps it off the lede and buttons,
          which sit outside this region entirely. */}
      {/* pb-10 lives INSIDE this region, not as a margin on the block below,
          so the tank's floor is the rule itself — the liquid comes to rest
          on the line rather than stopping 40px short of it. */}
      <div className="relative flex flex-1 flex-col pb-10">
        <AsciiFluid className="pointer-events-none absolute inset-0 overflow-hidden" />

        {/* Status line — pushed to the top by mb-auto so the headline block
            always sits on the fold line. */}
        <div className="relative z-[1] mb-auto flex flex-wrap justify-between gap-x-5 gap-y-3 text-micro text-ink-label animate-[fade-in_900ms_200ms_both]">
          <p className="flex items-center gap-2.5 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="h-[7px] w-[7px] flex-none rounded-full bg-acid animate-[pulse-dot_1.6s_infinite]"
            />
            <span className="text-acid">SESSION LIVE</span>
            <LiveClock />
          </p>
          <p className="text-right leading-[1.9]">
            {HERO.org}
            <br />
            <span className="text-ink-body">{HERO.role}</span>
          </p>
        </div>

        <div className="relative z-[1] mx-auto w-full max-w-[77.5rem]">
          <p className="mb-[18px] text-label tracking-[0.28em] text-ink animate-[rise-sm_700ms_300ms_both]">
            &gt; whoami — {HERO.handle}
          </p>

          <h1 className="text-h1 uppercase">
            <span className="block animate-[rise_900ms_340ms_cubic-bezier(0.16,1,0.3,1)_both]">
              {HERO.headline[0]}
            </span>
            <span className="block text-acid animate-[rise_900ms_460ms_cubic-bezier(0.16,1,0.3,1)_both]">
              {HERO.headline[1]}
            </span>
          </h1>
        </div>
      </div>

      {/* ── READING REGION ───────────────────────────────────────────
          Below the rule, and outside the fluid's container, so body copy is
          never competing with the glyph field for legibility.

          Claim on the left, receipts on the right. Splitting at lg (rather
          than auto-fit) keeps the three stats on one line at every width
          they fit — an orphaned "1 / CVE PUBLISHED" reads like a mistake. */}
      <div className="relative z-[1] mx-auto w-full max-w-[77.5rem]">
        <div className="grid gap-8 border-t border-line-hi pt-7 animate-[fade-in_900ms_640ms_both] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] sm:items-end">
            <p className="max-w-[46ch] text-body text-ink-soft">
              Red teamer turned founder. Four years of assumed-breach ops against
              banks, insurers and state platforms — now building{" "}
              <a
                href={FORENSIA_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-acid hover:text-ink"
              >
                Forensia
              </a>{" "}
              so companies can see their attack surface the way I do.
            </p>

            <div className="flex flex-wrap gap-3">
              <MagneticLink href="#shell" className="btn btn-outline">
                OPEN THE SHELL
              </MagneticLink>
              <MagneticLink href="#ops" className="btn btn-ghost">
                READ THE OPS →
              </MagneticLink>
            </div>
          </div>

          <ul className="flex flex-wrap justify-start gap-6 lg:justify-end">
            {HERO.stats.map((s) => (
              <li key={s.label}>
                <span
                  className={cn(
                    "block font-display text-stat font-bold",
                    s.accent ? "text-acid" : "text-ink"
                  )}
                >
                  {s.value}
                </span>
                <span className="block text-micro text-ink-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 flex items-center gap-2.5 text-micro text-ink-label">
          <span aria-hidden="true" className="animate-[bob_1.8s_ease-in-out_infinite]">
            ↓
          </span>
          SCROLL
        </p>
      </div>
    </section>
  );
}
