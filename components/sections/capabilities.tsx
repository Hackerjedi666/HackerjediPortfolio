import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { TypeOut } from "@/components/type-out";
import { Redacted } from "@/components/redacted";
import { MarginObject } from "@/components/margin-object";

export function Capabilities() {
  const capabilities = PORTFOLIO_DATA.capabilities;
  const total = capabilities.length;
  // Eyebrow grammar — "Atlas" is the publication word for a collection of
  // charts that map a territory. Fits the 2×2 parallel-blocks composition
  // and signals this is the map the case-file evidence sits on, not more
  // case files. Pads to three digits to match Selected Work / Open Source.
  const eyebrow = `Atlas / 001–${String(total).padStart(3, "0")}`;

  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="relative px-3u py-18u md:px-8u"
    >
      {/* Floating wireframe satellite — octahedron for the 4-quadrant
          atlas register. */}
      <div className="pointer-events-none absolute right-8u top-18u hidden md:block">
        <MarginObject shape="octahedron" size={200} />
      </div>
      {/* Section header — same grammar as Selected Work and Open Source.
          Lede frames the altitude explicitly so the section announces its
          role: the standing competence the engagements draw from, not a
          re-narration of those engagements. */}
      <div className="grid grid-cols-12 gap-x-3u">
        <header className="col-span-12 md:col-span-9 md:col-start-3">
          <p className="font-mono text-caption uppercase text-ink-mute">
            <TypeOut>{eyebrow}</TypeOut>
          </p>
          <h2
            id="capabilities-heading"
            data-cursor-magnet
            className="mt-3u font-serif text-h2 text-balance text-ink"
          >
            <Redacted>Capabilities</Redacted>
          </h2>
          <p className="mt-5u max-w-[52ch] font-serif text-lede text-ink-soft">
            Four standing domains the engagements draw from. The cases prove
            specific instances; this is the territory they sit on.
          </p>
        </header>
      </div>

      {/* Atlas — four equal-weight blocks held in parallel. 2×2 on desktop,
          stacked column on mobile. NO internal rules between cells: pure
          negative space (gap-y-12u, gap-x-8u) carries the parallel-block
          composition. That's the rhythmic break from Selected Work (rule-
          separated dossier rows) and Open Source (rule-separated index rows)
          — neither of those is a composition; this is. The 2×2 grid hangs
          one outer-grid column wider than the header (col-start-2 col-span-10
          vs the header's col-start-3 col-span-9) to give the cells room to
          read without feeling cramped against the article column. */}
      <div className="mt-12u grid grid-cols-12 gap-x-3u md:mt-18u">
        {/* Aligned with the header's col-start-3 col-span-9 — preserves the
            editorial column rhythm (was col-start-2 col-span-10 to give
            cells extra breathing room; visually broke the section margin).
            gap-x reduced from 8u → 5u to compensate for the tighter span. */}
        <ul className="col-span-12 flex list-none flex-col gap-y-12u p-0 md:col-span-9 md:col-start-3 md:grid md:grid-cols-2 md:gap-x-5u md:gap-y-12u">
          {capabilities.map((capability) => (
            <li key={capability.id} className="flex flex-col">
              {/* Header pair — mono station label + serif domain title. Title
                  at text-lede (21 px), not text-h2 (36 px): these are domain
                  statements, not article headlines. Size hierarchy keeps cells
                  from competing with the section h2 above. */}
              <p className="font-mono text-caption uppercase text-ink-mute">
                {capability.label}
              </p>
              <h3 className="mt-3u font-serif text-lede text-balance text-ink">
                {capability.title}
              </h3>

              {/* Domain description — one sentence at category altitude. */}
              <p className="mt-3u font-serif text-body text-ink-soft">
                {capability.description}
              </p>

              {/* Marker rule — same w-8u h-px shape as Selected Work's impact
                  marker, but in --color-rule rather than --color-accent. The
                  page's oxblood/steel-cyan accent stays reserved for hover
                  and impact climaxes; here a quiet hairline carries the
                  prose → keypoint-cluster transition. */}
              <span
                aria-hidden="true"
                className="mt-5u block h-px w-8u bg-rule"
              />

              {/* Keypoint cluster — supporting texture for the domain. Drops
                  to text-body-sm (14 px) so it sits beneath the description
                  in the hierarchy: title (lede) → description (body) →
                  keypoints (body-sm). No bullet markers — line rhythm + the
                  hairline above signals this is a list. */}
              <ul className="mt-3u list-none p-0">
                {capability.keyPoints.map((point) => (
                  <li
                    key={point}
                    className="mt-2u font-serif text-body-sm text-ink-soft first:mt-0"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
