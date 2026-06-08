import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { IcosahedronTakeover } from "@/components/icosahedron-takeover";
import { TypeOut } from "@/components/type-out";
import { SelectedWork } from "@/components/sections/selected-work";
import { OpenSource } from "@/components/sections/open-source";
import { Capabilities } from "@/components/sections/capabilities";
import { Ventures } from "@/components/sections/ventures";
import { Articles } from "@/components/sections/articles";
import { Contact } from "@/components/sections/contact";
import { ScopeInterlude } from "@/components/interludes/scope-interlude";
import { StanceInterlude } from "@/components/interludes/stance-interlude";
import { Redacted } from "@/components/redacted";
import { isPlaceholder } from "@/lib/utils";

export default function Home() {
  const { name, title, masthead, location } = PORTFOLIO_DATA.meta;
  // Masthead falls back to title when the editorial line is a placeholder
  // ("TODO: confirm" or empty) — same gate the rest of the site uses.
  const mastheadText = isPlaceholder(masthead) ? title : masthead;

  // Split the bio at the sentence boundary. Strip the title prefix from the
  // first sentence so the masthead claim (title) isn't restated underneath.
  const sentences = PORTFOLIO_DATA.bio.split(/(?<=\.)\s+/);
  const factSentence = sentences[0] ?? PORTFOLIO_DATA.bio;
  const titlePrefix = `${title} with `.toLowerCase();
  const scopeRaw = factSentence.toLowerCase().startsWith(titlePrefix)
    ? factSentence.slice(titlePrefix.length)
    : factSentence;
  const scopeSentence = scopeRaw.charAt(0).toUpperCase() + scopeRaw.slice(1);
  const stanceSentence = sentences[1] ?? "";

  return (
    <main className="relative z-10 min-h-screen">
      {/* Icosahedron takeover stage — fixed-positioned, scrubbed by scroll
          between hero and Selected Work. */}
      <IcosahedronTakeover />

      {/* Intro section — viewport-tall opening, in document flow so the
          reader can scroll back up to it. Typing animation runs on mount. */}
      <section
        id="intro"
        aria-label="Identity"
        className="relative flex min-h-screen flex-col items-center justify-center px-3u md:px-8u"
      >
        <p className="font-mono text-h2 text-ink-mute">
          <TypeOut speed={45} delay={350}>{`> whoami`}</TypeOut>
        </p>
        <p className="mt-3u font-mono text-sub-display text-ink md:text-display">
          <TypeOut speed={50} delay={1050}>
            abhimanyu_gupta
          </TypeOut>
        </p>
      </section>

      <article
        id="top"
        className="relative px-3u py-12u md:px-8u md:py-18u"
      >
          {/* Wireframe icosahedron is mounted globally via
              <IcosahedronTakeover /> — fixed-positioned, scales up and takes
              over the viewport as the reader scrolls from hero into
              Selected Work. See components/icosahedron-takeover.tsx. */}
          {/* Dateline — declassification slug. Accent "DECLASSIFIED" stamp +
              document ID + release date. Reads as the front page of an
              intelligence dossier. */}
          <header className="flex flex-col gap-y-1u">
            <p className="font-mono text-caption uppercase text-accent">
              <TypeOut>{`/// DECLASSIFIED`}</TypeOut>
            </p>
            <p className="font-mono text-caption uppercase text-ink-mute">
              File&nbsp;PROFILE-001
              <br />
              <span className="text-ink-soft">Released 2026</span>
            </p>
          </header>

          {/* Masthead — one redaction bar covers the title, scan-line peels
              it off on mount (the page's first declassification moment). */}
          <div className="mt-12u grid grid-cols-12 gap-x-3u md:mt-18u">
            <h1
              data-cursor-magnet
              className="col-span-12 font-serif text-sub-display text-balance text-ink md:col-span-7 md:col-start-3 md:text-display"
            >
              {/* Per-word redaction — one bar per word so the visual reads
                  as "redacted phrase" not as a single huge block. Each word
                  has a brief stagger so the bars peel off in sequence. */}
              {mastheadText.split(/(\s+)/).map((token, i) =>
                /^\s+$/.test(token) ? (
                  token
                ) : (
                  <Redacted key={i} delay={200 + i * 90}>
                    {token}
                  </Redacted>
                )
              )}
            </h1>

            <div className="col-span-12 mt-5u md:col-span-7 md:col-start-3 md:mt-8u">
              <span aria-hidden="true" className="mb-3u block h-px w-8u bg-accent" />
              <p className="max-w-[44ch] font-serif text-lede text-ink-soft">
                {scopeSentence}
              </p>
              {stanceSentence ? (
                <p className="mt-3u max-w-[44ch] font-serif text-lede text-ink-soft">
                  {stanceSentence}
                </p>
              ) : null}
            </div>
          </div>

          <footer className="mt-18u grid grid-cols-12 gap-x-3u">
            <div className="col-span-12 md:col-span-5 md:col-start-3">
              <p className="font-mono text-caption uppercase text-ink-mute">Signed</p>
              <p className="mt-2u font-serif text-h2 text-ink">{name}</p>
              <p className="mt-1u font-mono text-caption uppercase text-ink-mute">
                {title}&nbsp;·&nbsp;{location}
              </p>
            </div>
          </footer>
        </article>

      <SelectedWork />
      <ScopeInterlude />
      <OpenSource />
      <Capabilities />
      <StanceInterlude />
      <Ventures />
      <Articles />
      <Contact />
    </main>
  );
}
