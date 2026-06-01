import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { CryptoObject } from "@/components/crypto-object";
import { TypeOut } from "@/components/type-out";
import { SelectedWork } from "@/components/sections/selected-work";
import { OpenSource } from "@/components/sections/open-source";
import { Capabilities } from "@/components/sections/capabilities";
import { Ventures } from "@/components/sections/ventures";
import { Articles } from "@/components/sections/articles";
import { Contact } from "@/components/sections/contact";
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
      <article id="top" className="relative px-3u py-12u md:px-8u md:py-18u">
        {/* Intro overlay — first thing the user sees. `> whoami` types in,
            then `abhimanyu_gupta` types under it. Fixed inset-0 so it stays
            in viewport during the hero pin. GSAP fades + lifts + scrambles
            it out as scroll progresses, revealing the masthead behind.
            aria-hidden because the masthead h1 already announces identity
            to screen readers. */}
        <div
          data-choreograph="hero-intro"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center font-mono"
        >
          <p
            className="font-mono text-h2 text-ink-mute"
            data-intro-prompt
          >
            <TypeOut speed={45} delay={350}>{`> whoami`}</TypeOut>
          </p>
          <p
            className="mt-3u font-mono text-sub-display text-ink md:text-display"
            data-intro-identity
          >
            <TypeOut speed={50} delay={1050}>abhimanyu_gupta</TypeOut>
          </p>
        </div>

        {/* Wireframe cryptographic seal — sits in the empty right band of
            the hero on desktop. Where a portrait would go in a magazine. */}
        <div className="pointer-events-none absolute right-12u top-1/2 hidden -translate-y-1/2 md:block">
          <CryptoObject />
        </div>
        {/* Dateline — publication mark, pinned top-left. */}
        <header>
          <p className="font-mono text-caption uppercase text-ink-mute">
            Profile&nbsp;001
            <br />
            <span className="text-ink-soft">2026</span>
          </p>
        </header>

        {/* Masthead. <h1> = the short editorial claim — `meta.masthead` when
            real, falling back to `meta.title` when masthead is a placeholder.
            Case is preserved exactly (no text-transform utility on this h1),
            so the editorial lowercase second clause survives to the DOM. The
            grid column itself caps the width to ~50% of viewport — the right
            band is deliberately blank paper, where a portrait would sit in a
            magazine. */}
        <div className="mt-12u grid grid-cols-12 gap-x-3u md:mt-18u">
          <h1
            data-choreograph="hero-masthead"
            className="col-span-12 font-serif text-sub-display text-balance text-ink md:col-span-7 md:col-start-3 md:text-display"
          >
            {/* Word-split for the Phase 2 scroll-tied reveal. Each word is its
                own inline-block so GSAP can transform it independently. Spaces
                preserved as raw text nodes (not spans) so wrap behavior +
                text-balance work exactly as before. */}
            {mastheadText.split(/(\s+)/).map((token, i) =>
              /^\s+$/.test(token) ? (
                token
              ) : (
                <span
                  key={i}
                  data-word
                  className="inline-block will-change-transform"
                >
                  {token}
                </span>
              )
            )}
          </h1>

          {/* Lede block — scope (factual sentence with the title prefix stripped)
              + stance. Single oxblood hairline marks the transition from heading
              to body voice. */}
          <div
            data-choreograph="hero-lede"
            className="col-span-12 mt-5u md:col-span-7 md:col-start-3 md:mt-8u"
          >
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

        {/* Signature — name as byline, aligned to the masthead column. Spaced
            from the lede by a single declared rhythm unit (mt-18u). No flex
            stretching, no min-h-screen on the hero block. */}
        <footer
          data-choreograph="hero-signature"
          className="mt-18u grid grid-cols-12 gap-x-3u"
        >
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
      <OpenSource />
      <Capabilities />
      <Ventures />
      <Articles />
      <Contact />
    </main>
  );
}
