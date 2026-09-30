import { SectionHead } from "@/components/sections/section-head";
import { DISCIPLINES } from "@/lib/content/site";

/**
 * Capability — the resume's full technical surface, not a shortlist.
 *
 * This section used to show four capability tiles, which read as though the
 * work stopped at four things. The resume carries four distinct technical
 * disciplines, three delivery competencies and four certifications, and the
 * breadth IS the argument for a security engineer: a buyer is checking
 * whether one person covers app, infra, adversary simulation and the
 * engineering to automate all of it.
 *
 * Presented as disciplines with their real tooling rather than a tag cloud,
 * because "Burp Suite" next to "OSINT" next to "Next.js" with no grouping
 * tells a reader nothing about what this person is actually for.
 */

/** How the work is actually delivered — the half buyers ask about second. */
const DELIVERY = [
  {
    name: "Security testing",
    items:
      "Web, APIs, mobile, internal and external networks, Active Directory, source code, configuration",
  },
  {
    name: "Offensive operations",
    items:
      "Assumed-breach testing, attack-path analysis, phishing simulation, defence-evasion validation, controlled exploitation, privilege escalation",
  },
  {
    name: "Delivery",
    items:
      "Scoping, rules of engagement, risk validation, proof-of-concept development, technical reporting, stakeholder debriefs, remediation and retesting",
  },
];

const CERTS = ["OSCP", "eCPPT", "eJPT", "Certified Network Defender"];

const CARD =
  "flex flex-col rounded-cell border border-hairline bg-panel-hi p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

export function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="section shell">
      <SectionHead label="CAPABILITY" tone="ink">
        <span id="stack-title">
          Four disciplines.
          <br />
          One toolkit.
        </span>
      </SectionHead>

      <div className="mt-14 grid gap-3 lg:grid-cols-2">
        {DISCIPLINES.map((d) => (
          <article key={d.name} className={CARD}>
            <h3 className="text-h4 font-bold text-ink">{d.name}</h3>
            <p className="mt-4 max-w-[52ch] text-body text-ink-body">{d.blurb}</p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-8">
              {d.tools.map((t) => (
                <li
                  key={t}
                  className="rounded-pill border border-hairline px-4 py-2.5 text-chip text-ink"
                >
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {DELIVERY.map((d) => (
          <div key={d.name} className="rounded-cell bg-cell-hi p-6">
            <h3 className="text-label text-acid">{d.name}</h3>
            <p className="mt-4 text-chip leading-relaxed text-ink-body">{d.items}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-hairline pt-10">
        <p className="text-label text-ink-label">Certified</p>
        <ul className="flex flex-wrap gap-2">
          {CERTS.map((c) => (
            <li
              key={c}
              className="rounded-pill border border-acid/25 px-4 py-2.5 text-label text-acid"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
