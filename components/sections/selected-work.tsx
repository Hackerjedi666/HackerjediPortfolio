import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { isPlaceholder } from "@/lib/utils";
import { ScrambleText } from "@/components/scramble-text";
import { TypeOut } from "@/components/type-out";
import { Redacted } from "@/components/redacted";
import { MarginObject } from "@/components/margin-object";

export function SelectedWork() {
  const total = PORTFOLIO_DATA.achievements.length;
  const eyebrowText = `Case Files / 001–${String(total).padStart(3, "0")}`;
  // Surface the first publication as a section-level disclosure exhibit.
  // Mapping a specific CVE to a single case isn't certain from existing
  // case text, so it sits at section scope rather than being forced into one.
  const disclosure = PORTFOLIO_DATA.publications[0];

  return (
    <section
      id="selected-work"
      aria-labelledby="selected-work-heading"
      className="relative px-3u py-12u md:px-8u md:py-18u"
    >
      {/* Floating wireframe satellite — sits in the empty right band of
          the section. Rotates slowly + tilts toward cursor. */}
      <div className="pointer-events-none absolute right-8u top-18u hidden md:block">
        <MarginObject shape="cube" size={200} />
      </div>
      {/* Section header — same grammar as hero: mono eyebrow + serif h2. */}
      <div className="grid grid-cols-12 gap-x-3u">
        <header className="col-span-12 md:col-span-9 md:col-start-3">
          <p className="font-mono text-caption uppercase text-ink-mute">
            <TypeOut>{eyebrowText}</TypeOut>
          </p>
          <h2
            id="selected-work-heading"
            data-cursor-magnet
            className="mt-3u font-serif text-h2 text-balance text-ink"
          >
            <Redacted>Selected Work</Redacted>
          </h2>

          {/* Section-level disclosure exhibit. Independent research credential,
              not case-specific metadata. Renders as substance, not just an id:
              mono label → CVE id (linked to the canonical write-up when
              writeupUrl resolves) → title → one-line summary → auxiliary
              NVD link (rendered only when advisoryUrl is no longer a
              placeholder; gated on `!isPlaceholder()`, NOT on truthiness,
              because "TODO: confirm" is a truthy string). Zero accent —
              ink-strength + the left rule carry the visual weight. */}
          {disclosure ? (
            <div className="mt-5u border-l border-rule pl-3u">
              <p className="font-mono text-caption uppercase text-ink-mute">Disclosure</p>

              {!isPlaceholder(disclosure.writeupUrl) ? (
                <a
                  href={disclosure.writeupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1u inline-block font-serif text-lede text-ink underline decoration-rule underline-offset-4 hover:decoration-accent"
                >
                  {disclosure.cve}
                </a>
              ) : (
                <p className="mt-1u font-serif text-lede text-ink">{disclosure.cve}</p>
              )}

              {!isPlaceholder(disclosure.title) ? (
                <p className="mt-2u font-serif text-body text-ink">{disclosure.title}</p>
              ) : null}

              {!isPlaceholder(disclosure.summary) ? (
                <p className="mt-1u max-w-[48ch] font-serif text-body text-ink-soft">
                  {disclosure.summary}
                </p>
              ) : null}

              {/* Auxiliary NVD link — appears only when advisoryUrl is no
                  longer a placeholder. No code change needed to enable. */}
              {!isPlaceholder(disclosure.advisoryUrl) ? (
                <p className="mt-3u font-mono text-caption uppercase">
                  <a
                    href={disclosure.advisoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-mute underline decoration-rule underline-offset-4 hover:decoration-accent hover:text-ink"
                  >
                    NVD
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
        </header>
      </div>

      {/* Cases — asymmetric two-column dossier. Meta left (sticky at md+),
          narrative right. Hairline rule separates cases 2–4. */}
      <div className="mt-12u md:mt-18u">
        {PORTFOLIO_DATA.achievements.map((engagement, index) => (
          <article
            key={engagement.id}
            aria-labelledby={`${engagement.id}-heading`}
            className={
              "grid grid-cols-12 items-start gap-x-3u py-8u md:py-12u" +
              (index > 0 ? " border-t border-rule" : "")
            }
          >
            {/* Meta column — pins while the narrative scrolls past (md+).
                `self-start` ensures the meta div sizes to content (not
                stretched by grid), giving sticky room to engage. The article
                itself is the containing block, so sticky releases at the
                case boundary — never bleeds into the next case. Mobile keeps
                this as `static` (no md: prefix on sticky/top). */}
            <div className="col-span-12 md:col-span-3 md:col-start-3 md:self-start md:sticky md:top-8u">
              <p className="font-mono text-caption uppercase text-ink-mute">
                Case&nbsp;{String(index + 1).padStart(3, "0")}
              </p>
              <p className="mt-3u font-mono text-caption uppercase text-ink-soft">
                {engagement.date}
                <span className="text-ink-mute">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
                <Redacted>{engagement.client}</Redacted>
              </p>
              {engagement.tags.length > 0 ? (
                <p className="mt-2u font-mono text-caption uppercase text-ink-mute">
                  {engagement.tags.join(" · ")}
                </p>
              ) : null}

              {/* Anchor — the exhibit. Visually the column's center of
                  gravity. The VALUE is a STATEMENT (serif), not metadata —
                  matches the editorial system where serif = voice and
                  mono = data/labels. Distinction signals (no oxblood, that
                  belongs to the impact climax):
                    1. left hairline rule in --color-rule (border-l + pl-3u)
                    2. value type: font-serif (statement) vs label font-mono
                    3. value size: text-lede (21 px) vs label text-caption (11 px)
                    4. value color: text-ink full vs label text-ink-mute.
                  Anchor-absent OR placeholder-valued renders nothing — no
                  empty exhibit slot, no "TODO" text leaking to the page.
                  Gated on `!isPlaceholder()` of the VALUE, not just truthiness,
                  because "TODO: confirm" is a truthy string (same pattern the
                  disclosure block uses for advisoryUrl above). */}
              {engagement.anchor && !isPlaceholder(engagement.anchor.value) ? (
                <div className="mt-8u border-l border-rule pl-3u">
                  <p className="font-mono text-caption uppercase text-ink-mute">
                    {engagement.anchor.label}
                  </p>
                  <p className="mt-1u font-serif text-lede text-ink">
                    <Redacted delay={150}>{engagement.anchor.value}</Redacted>
                  </p>
                  {engagement.anchor.note ? (
                    <p className="mt-2u font-mono text-caption uppercase text-ink-mute">
                      {engagement.anchor.note}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Narrative — title, arc, impact climax. */}
            <div className="col-span-12 mt-5u md:col-span-5 md:col-start-7 md:mt-0">
              <h3
                id={`${engagement.id}-heading`}
                className="font-serif text-h2 text-balance text-ink"
              >
                <Redacted>{engagement.title}</Redacted>
              </h3>
              <p className="mt-5u font-serif text-body text-ink-soft">
                {engagement.problem}
              </p>
              <p className="mt-3u font-serif text-body text-ink-soft">
                {engagement.approach}
              </p>
              <p className="mt-3u font-serif text-body text-ink-soft">
                {engagement.outcome}
              </p>
              {/* Impact — the climax. Size + color + oxblood mark, same as
                  the hero's stance pull-quote. Anchor in the left column
                  does NOT compete with this — it uses ink-strength contrast,
                  not oxblood. */}
              <div className="mt-5u">
                <span aria-hidden="true" className="mb-3u block h-px w-8u bg-accent" />
                <p className="glitch-hover font-serif text-lede text-ink">{engagement.impact}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
