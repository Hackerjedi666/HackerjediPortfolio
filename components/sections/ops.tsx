import { Highlighter } from "@/components/chrome/highlighter";
import { CLIENT_LABELS } from "@/lib/content/site";
/**
 * Selected engagements — the canvas's Work board, built.
 *
 * Copy, ordering and anonymisation are the canvas's, which in turn matches
 * `lib/content/site.ts`: clients are named by sector, never by company. The
 * one named organisation is the employer, which is Abhimanyu's own
 * affiliation rather than a client's confidence to give away.
 *
 * Layout is the canvas's asymmetry: a 7/5 feature row, then three equal
 * cards, then the employment strip. Never all-equal cells — an even grid
 * gives the eye no first stop.
 */

type Lead = {
  index: string;
  client: string;
  /** Only the first engagement carries the delivering firm. */
  via?: string;
  title: [string, string];
  body: string;
  mark: string;
};

const FEATURE: Lead = {
  index: "01",
  client: CLIENT_LABELS[0],
  via: "BDO India",
  title: ["Internal red team,", "assumed breach."],
  body: "Mapped attack paths across the internal network. Custom payloads walked past CrowdStrike, then domain controller weaknesses gave complete access.",
  /* Marked because it is the line that separates an authorised operation
     from an incident, and it is the one a buyer is actually scanning for. */
  mark: "No production service was disrupted.",
};

const TAGS = ["EDR bypass", "Active Directory", "Payload dev"];

const SCALE = {
  index: "02",
  client: CLIENT_LABELS[1],
  title: "State digital services, at scale.",
  body: "Security testing across 500+ web applications and mobile APKs. Found source code disclosure and PII exposure, then handed back a prioritised remediation path.",
  stats: [
    { value: "500+", caption: "Apps and APKs" },
    { value: "PII", caption: "Exposure closed" },
  ],
};

const REST = [
  {
    index: "03",
    client: CLIENT_LABELS[2],
    title: "Full scope red team and phishing.",
    body: "Campaign grade phishing with custom AV evasion, alongside 10+ API and web tests.",
    anchor: "10+ API / web tests",
  },
  {
    index: "04",
    client: CLIENT_LABELS[3],
    title: "Enterprise security assessment.",
    body: "30+ web applications, three source code reviews with SonarQube, infrastructure VA.",
    anchor: "30+ apps / 3 reviews",
  },
  {
    index: "05",
    client: CLIENT_LABELS[4],
    title: "Unsafe upload to RCE.",
    body: "Testing and configuration review surfaced remote code execution and IDOR, each with reproducible proof.",
    anchor: "RCE + IDOR, PoC backed",
  },
];

const HISTORY = [
  { role: "BDO India · Red Team Specialist", when: "2024 to present" },
  { role: "Creative Brains · AppSec Tester", when: "2022 to 2024" },
  { role: "B.Tech CS, Cybersecurity", when: "Bennett University · 2021 to 2025" },
];

const CARD =
  "flex flex-col rounded-cell bg-panel p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]";
const META = "text-label text-ink";

export function Ops() {
  return (
    <section
      id="ops"
      aria-labelledby="ops-title"
      className="section section-bone shell"
    >
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div>
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-[5px] w-[5px] rounded-pill bg-ink" />
            <span className="text-label text-ink-label">Selected engagements</span>
          </p>
          <h2 id="ops-title" className="mt-5 text-h2 font-bold">
            Proof, not
            <br />a scan report.
          </h2>
        </div>
      </div>

      {/* Feature row — 7/5. */}
      <div className="mt-14 grid gap-3 lg:grid-cols-[7fr_5fr]">
        <article className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className={META}>
              {FEATURE.index} · {FEATURE.client}
            </span>
            <span className="text-label text-ink-label">{FEATURE.via}</span>
          </div>
          <h3 className="mt-5 text-card font-bold">
            {FEATURE.title[0]}
            <br />
            {FEATURE.title[1]}
          </h3>
          <p className="mt-5 max-w-[54ch] text-body text-ink-body">
            {FEATURE.body}{" "}
            <Highlighter action="highlight">{FEATURE.mark}</Highlighter>
          </p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-5 pt-8">
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="rounded-pill border border-hairline px-4 py-2.5 text-label text-ink-label"
                >
                  {t}
                </span>
              ))}
            </div>
            {/* The outcome, as a badge rather than a sentence: it is the one
                thing a reader takes from this card. */}
            <span className="flex flex-none items-center gap-3 rounded-pill bg-acid px-4 py-2.5 text-acid-ink">
              <span className="font-display text-h4 font-bold leading-none">DA</span>
              <span className="text-label">Domain admin</span>
            </span>
          </div>
        </article>

        <article className={CARD}>
          <span className={META}>
            {SCALE.index} · {SCALE.client}
          </span>
          <h3 className="mt-5 text-h3 font-bold">{SCALE.title}</h3>
          <p className="mt-5 text-body text-ink-body">{SCALE.body}</p>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
            {SCALE.stats.map((s) => (
              <div key={s.caption}>
                <p className="font-display text-stat font-bold">{s.value}</p>
                <p className="mt-3 text-label text-ink-label">{s.caption}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {REST.map((op) => (
          <article key={op.index} className={CARD}>
            <span className={META}>
              {op.index} · {op.client}
            </span>
            <h3 className="mt-5 text-h4 font-bold">{op.title}</h3>
            <p className="mt-5 text-body text-ink-body">{op.body}</p>
            <p className="mt-auto pt-6 text-label text-ink-label">{op.anchor}</p>
          </article>
        ))}
      </div>

      <div className="mt-14 grid gap-3 border-t border-hairline pt-14 md:grid-cols-3">
        {HISTORY.map((h) => (
          <div key={h.role}>
            <p className="text-lead font-semibold">{h.role}</p>
            <p className="mt-3 text-label text-ink-label">{h.when}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
