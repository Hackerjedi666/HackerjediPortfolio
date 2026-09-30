import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Highlighter } from "@/components/chrome/highlighter";
import { CVE_CHAIN } from "@/lib/content/site";

/**
 * CVE-2025-56459 — the disclosure, on this site.
 *
 * The tile used to link straight out to Medium. This keeps the reader here
 * and gives them the shape of the finding in about ninety seconds, with the
 * full write-up available at the end for anyone who wants the detail.
 *
 * WHAT IS DELIBERATELY NOT HERE: vendor, product version, CVSS vector, the
 * payload, and timeline dates. Those are in the published write-up and are
 * not mine to paraphrase from memory — a security page that gets a version
 * range wrong is worse than one that stays general. Everything below comes
 * from the verified summary in `portfolio-data.ts` plus standard Electron
 * hardening guidance, which is public and uncontroversial.
 *
 * The advisory URL stays off the page entirely: `advisoryUrl` is still a
 * TODO placeholder because the NVD record does not resolve yet, and a 404
 * on a security disclosure is the worst possible link.
 */


const FIXES = [
  {
    k: "Encode on output",
    v: "Treat stored tag metadata as untrusted at render time, not only at write time. The value was already in the database before anyone looked at it.",
  },
  {
    k: "Isolate the context",
    v: "contextIsolation on, nodeIntegration off, and the sandbox enabled. A renderer that displays operator-controlled data should not be able to reach the platform at all.",
  },
  {
    k: "Add a content security policy",
    v: "A policy that refuses inline script turns the same injection into an error in the console instead of execution.",
  },
  {
    k: "Separate the privilege",
    v: "Keep privileged operations behind a narrow, explicitly exposed IPC surface rather than granting the whole renderer the capability.",
  },
];

const WRITEUP = "https://medium.com/@hackerjedi2812/cve-2025-56459-f814005f607a";

export function Cve() {
  return (
    <section id="published" aria-labelledby="cve-title" className="section shell">
      <p className="flex items-center gap-3">
        <span aria-hidden="true" className="h-[5px] w-[5px] rounded-pill bg-acid" />
        <span className="text-label text-ink-label">Published disclosure</span>
      </p>
      <h2 id="cve-title" className="mt-5 text-h2 font-bold text-acid">
        CVE-2025-56459
      </h2>
      <p className="mt-6 max-w-[62ch] text-lead leading-relaxed text-ink-soft">
        An unsanitised tag field in a privileged Electron renderer escalates
        stored cross-site scripting to{" "}
        <Highlighter action="highlight">native code execution</Highlighter> on
        OT and SCADA workstations.
      </p>

      <div className="mt-14 grid gap-3 lg:grid-cols-2">
        {CVE_CHAIN.map((c) => (
          <article
            key={c.step}
            className="relative isolate overflow-hidden rounded-cell border border-hairline bg-panel-hi p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-5 right-3 -z-10 select-none font-display text-[7rem] font-bold leading-none text-ink/[0.05]"
            >
              {c.step}
            </span>
            <h3 className="text-h4 font-bold text-ink">{c.title}</h3>
            <p className="mt-4 max-w-[52ch] text-body text-ink-body">{c.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-14 border-t border-hairline pt-10">
        <p className="text-label text-ink-label">What fixes it</p>
        <dl className="mt-6 grid gap-3 md:grid-cols-2">
          {FIXES.map((f) => (
            <div key={f.k} className="rounded-cell bg-cell-hi p-6">
              <dt className="text-lead font-semibold text-ink">{f.k}</dt>
              <dd className="mt-3 text-body text-ink-body">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <a
          href={WRITEUP}
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex min-h-12 items-center gap-3 rounded-pill bg-acid px-6 text-label text-acid-ink"
        >
          Full technical write-up
          <ArrowUpRight
            size={14}
            weight="bold"
            aria-hidden="true"
            className="transition-transform duration-400 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </a>
        <p className="text-chip text-ink-dim">
          Reported and disclosed under coordinated disclosure. Version details,
          proof of concept and timeline are in the write-up.
        </p>
      </div>
    </section>
  );
}
