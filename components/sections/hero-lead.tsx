import { HERO } from "@/lib/content/site";
import { NoiseTexture } from "@/components/effects/noise-texture";

/**
 * The hero, out of the grid.
 *
 * It used to be tile one of nine: an 8x2 cell with a border, a fill and an
 * inner highlight, which is why the page opened on a rectangle. A cell
 * cannot be a hero — whatever is inside it, the frame says "this is one of
 * several things" before a word is read.
 *
 * So the hero is now a band. It owns the full width, paints on the page's
 * own black, and carries no card chrome at all. The grid below keeps every
 * border it had, and that contrast IS the hierarchy: one open surface, then
 * a field of cells. Nine equal cards had no hierarchy to give.
 *
 * TWO LINES, TWO WEIGHTS. The second line drops to the ghost ink, which is
 * the one place that token is allowed (large display only, 3.6:1). At this
 * size the drop reads as emphasis rather than as low contrast, and it is
 * what makes the line break look chosen instead of accidental.
 *
 * SERVER COMPONENT. The featured tweet is fetched at build and passed in as
 * already-rendered output, so the hero ships no JavaScript of its own; the
 * only client boundary is the reveal on the eyebrow.
 */
export function HeroLead({ aside }: { aside?: React.ReactNode }) {
  const [lead, rest] = HERO.headline;

  return (
    <section
      id="identity"
      aria-labelledby="hero-title"
      className="hero-lead"
    >
      {/* Grain, not geometry. Atmosphere on an otherwise empty ground, and
          aria-hidden because it carries no meaning. */}
      <span aria-hidden="true" className="hero-lead-grain">
        <NoiseTexture />
      </span>

      <div className="hero-lead-inner">
        <div className="hero-lead-copy">
          {/* Plain text, not a reveal.
              This is the first line on the page, and a reveal makes it
              depend on an observer having fired: in the preview it never
              did and the name was simply absent. CSS defaults have to be
              the visible state for anything above the fold. */}
          <p className="hero-lead-eyebrow">{HERO.name}</p>

          <h1 id="hero-title" className="hero-lead-title">
            <span className="block">{lead}</span>
            <span className="hero-lead-ghost block">{rest}</span>
          </h1>

          <p className="hero-lead-lede">{HERO.lede}</p>
        </div>

        {/* The one piece of live evidence up here. It sits ON the ground
            rather than inside a frame, which is the whole difference
            between an object on a surface and a card inside a card. */}
        {aside ? <div className="hero-lead-aside">{aside}</div> : null}
      </div>

      <p aria-hidden="true" className="hero-lead-cue">
        <span className="hero-lead-cue-rule" />
        Scroll
      </p>
    </section>
  );
}
