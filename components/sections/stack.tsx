import { CAPABILITIES, TOOLBELT } from "@/lib/content/site";
import { GlowCard } from "@/components/chrome/glow-card";
import { ConnectedGrid, ConnectedItem } from "@/components/effects/connected-grid";
import { SectionHead } from "@/components/sections/section-head";

/**
 * Placement on the 8-column track. The alternating left/right rhythm is not
 * decoration — ConnectedGrid reads each card's offset against the previous
 * one to decide which edge it unfolds from, so this layout *is* the
 * animation's choreography.
 */
const PLACEMENT = [
  { col: 1, span: 4 },
  { col: 5, span: 4 },
  { col: 2, span: 4 },
  { col: 5, span: 4 },
];

export function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="section shell">
      <SectionHead index="03" label="WHAT I ACTUALLY DO" tone="ink">
        <span id="stack-title">
          Four things,
          <br />
          done properly.
        </span>
      </SectionHead>

      <ConnectedGrid className="tilt-scene mt-16">
        {CAPABILITIES.map((c, i) => (
          <ConnectedItem key={c.index} col={PLACEMENT[i].col} span={PLACEMENT[i].span}>
            {/* The hinge target is this wrapper, not the GlowCard itself:
                GlowCard's tilt already owns its own transform, and two
                animations writing the same property would fight. */}
            <div data-cg-surface>
              <GlowCard
                size={300}
                intensity={0.13}
                className="border border-line-hi bg-panel p-7 transition-colors duration-300 hover:border-acid"
              >
                <div data-cg-content>
                  <div data-cg-header className="flex items-baseline justify-between gap-4">
                    {/* Oversized ghost numeral — structure, not decoration:
                        it is the only thing separating four otherwise
                        identical tiles at a glance. */}
                    <p
                      aria-hidden="true"
                      className="font-display text-[40px] font-bold leading-none text-line-hi"
                    >
                      {c.index}
                    </p>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <h3 className="mt-7 mb-3 font-display text-h4 font-bold">{c.title}</h3>
                  <p className="mb-4 text-sm text-ink-body">{c.body}</p>
                  <ul className="grid gap-[7px] text-chip tracking-[0.06em] text-ink-label">
                    {c.points.map((p) => (
                      <li key={p}>
                        <span aria-hidden="true">→ </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlowCard>
            </div>
          </ConnectedItem>
        ))}
      </ConnectedGrid>

      <ul className="reveal-fade mt-16 flex flex-wrap gap-2.5">
        {TOOLBELT.map((t) => (
          <li
            key={t}
            className="border border-line-hi px-3.5 py-2.5 text-label tracking-[0.1em] text-ink-dim transition-colors duration-200 hover:border-acid hover:text-acid"
          >
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}
