import { CAREER, TOOLKIT } from "@/lib/content/site";

/**
 * The two tile animations that need no JavaScript at all.
 *
 * Both are pure CSS, so they stay SERVER components: no `"use client"`, no
 * hydration, nothing added to the bundle. Given the page has been heavy
 * once already, "can this be done without shipping JavaScript" is the
 * first question worth asking, and for a marquee and a drawn rule the
 * answer is yes.
 *
 * Both respect `prefers-reduced-motion` in the stylesheet, where the
 * animations are declared.
 */

/**
 * Capability: every tool, drifting.
 *
 * The tile asserts "four disciplines, one toolkit" and then shows nothing,
 * which is a claim with no evidence attached. This is the evidence: all
 * twenty-two tools from the panel behind it, drifting past.
 *
 * The list is rendered TWICE and the track translates by exactly -50%,
 * which is what makes the loop seamless — at the wrap point the second
 * copy is sitting precisely where the first one started. The duplicate is
 * aria-hidden, so a screen reader hears the toolkit once.
 *
 * ONE ROW, NOT TWO. Two rows drifting in opposite directions looked
 * better in isolation and did not fit: this tile is four columns wide in
 * a short row, which leaves about 70px of clear space above the copy, and
 * the second row ran straight through "Four disciplines." A marquee that
 * collides with the heading it is illustrating is worse than a plainer
 * one that does not. All twenty-two tools still pass.
 */
export function ToolMarquee() {
  return (
    <div className="tile-marquee">
      <div className="tile-marquee-row">
        <div className="tile-marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
              {TOOLKIT.map((t) => (
                <span key={t} className="tile-marquee-chip">
                  {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * About: the arc, drawn.
 *
 * The About tile runs the full twelve columns now, and the right two
 * thirds of it were empty. A timeline is the honest thing to put there —
 * it is the one piece of About that has a shape, and the band is wide
 * enough to give it room. The rule draws itself once on entry via
 * scroll-driven CSS; the nodes are static so the dates are readable from
 * the first frame whether or not the animation runs.
 */
export function CareerRule() {
  return (
    <div className="tile-arc" aria-hidden="true">
      <span className="tile-arc-rule" />
      <div className="tile-arc-points">
        {CAREER.map((c) => (
          <div key={c.what} className="tile-arc-point">
            <span className="tile-arc-dot" />
            <span className="tile-arc-when">{c.when}</span>
            <span className="tile-arc-what">{c.what}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
