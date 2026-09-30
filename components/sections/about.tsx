import { Highlighter } from "@/components/chrome/highlighter";
import { CAREER, META } from "@/lib/content/site";

/**
 * About — the case for hiring this person, as a card grid.
 *
 * Built rather than installed. The three nearest VengeanceUI components all
 * needed `framer-motion`, two imported files their own manifests did not
 * declare, and none of them had a content model for a person.
 *
 * The oversized ghost numeral behind each card is structural, not decorative:
 * it is the only thing separating otherwise identical dark rectangles at a
 * glance, and it gives the eye somewhere to land in a grid with no imagery.
 * Cards deliberately vary in span and height — an even grid of equal cards is
 * what a page looks like when nothing has been decided.
 */

type Card = {
  n: string;
  title: string;
  body: React.ReactNode;
  /** Columns out of 12 at lg. */
  span: number;
};

const CARDS: Card[] = [
  {
    n: "01",
    title: "Assumed breach,\nnot a scan",
    body: "Operations start from a foothold an attacker would realistically already have, then map what that actually reaches. A clean external scan has never been the same thing as a safe network.",
    span: 7,
  },
  {
    n: "02",
    title: "Proof, or it\ndidn't happen",
    body: (
      <>
        Every finding ships with reproduction steps, affected components, risk
        context and a fix.{" "}
        <Highlighter action="underline">
          A report nobody can act on is a report nobody reads.
        </Highlighter>
      </>
    ),
    span: 5,
  },
  {
    n: "03",
    title: "Four sectors,\nregulated ones",
    body: "Financial services, healthcare, insurance and government. 500+ public-sector applications and 30+ enterprise applications, all under authorisation and scope.",
    span: 5,
  },
  {
    n: "04",
    title: "I build the\ntooling too",
    body: "Threat-intelligence ingestion, indicator normalisation, correlation logic and the analyst-facing product on top. The testing finds it; the engineering is what catches it next time.",
    span: 4,
  },
  {
    n: "05",
    title: "OSCP,\nand the rest",
    body: "OSCP, eCPPT, eJPT and Certified Network Defender, alongside a B.Tech in Computer Science with a cybersecurity major.",
    span: 3,
  },
];


export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section shell">
      <p className="flex items-center gap-3">
        <span aria-hidden="true" className="h-[5px] w-[5px] rounded-pill bg-acid" />
        <span className="text-label text-ink-label">Why me</span>
      </p>
      <h2 id="about-title" className="mt-5 text-h2 font-bold">
        Mostly inside
        <br />
        other people&apos;s
        <br />
        networks.
      </h2>

      <div className="mt-14 grid gap-3 lg:grid-cols-12">
        {CARDS.map((c) => (
          <article
            key={c.n}
            style={{ gridColumn: `span ${c.span} / span ${c.span}` }}
            className="relative isolate flex min-h-[15rem] flex-col overflow-hidden rounded-cell border border-hairline bg-panel-hi p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] max-lg:!col-span-full"
          >
            {/* Structure, not ornament — and aria-hidden, because a screen
                reader announcing "zero three" before the heading is noise. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-6 right-2 -z-10 select-none font-display text-[9rem] font-bold leading-none text-ink/[0.045]"
            >
              {c.n}
            </span>

            <h3 className="whitespace-pre-line text-h4 font-bold text-ink">
              {c.title}
            </h3>
            <p className="mt-5 max-w-[46ch] text-body text-ink-body">{c.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {CAREER.map((a) => (
          <div
            key={a.what}
            className="rounded-cell bg-cell-hi p-6"
          >
            <p className="text-label text-acid">{a.when}</p>
            <p className="mt-3 text-lead font-semibold text-ink">{a.what}</p>
            <p className="mt-2 text-label text-ink-label">{a.role}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-body text-ink-body">
        Reachable at{" "}
        <a href={`mailto:${META.email}`} className="text-acid hover:text-ink">
          {META.email}
        </a>
        .
      </p>
    </section>
  );
}
