import { PORTFOLIO_DATA, type ProjectType } from "@/lib/content/portfolio-data";
import { TypeOut } from "@/components/type-out";
import { Redacted } from "@/components/redacted";

// Mono tag labels — keep punctuation-clean since they're rendered uppercase
// with letter-spacing via the caption type-token. Record over the union so
// a new ProjectType added in data forces an entry here at compile time.
const TYPE_LABEL: Record<ProjectType, string> = {
  tool: "Tool",
  automation: "Automation",
  research: "Research",
  library: "Library",
};

export function OpenSource() {
  const projects = PORTFOLIO_DATA.projects;
  const total = projects.length;
  // Eyebrow grammar parallels Selected Work ("Case Files / 001–004") but
  // uses "Index" — the journal back-matter word for a numbered catalogue,
  // signalling this section is a register, not feature articles.
  const eyebrow = `Index / 001–${String(total).padStart(3, "0")}`;
  // Surface the type range as a single mono line under the lede — it
  // quantifies the breadth (one experimental MEV project alongside the
  // security tooling) without color-coding individual rows.
  const typeRange = Array.from(new Set(projects.map((p) => p.type)))
    .map((t) => TYPE_LABEL[t].toLowerCase())
    .join(" · ");

  return (
    <section
      id="open-source"
      aria-labelledby="open-source-heading"
      className="px-3u py-12u md:px-8u md:py-18u"
    >
      {/* Section header — same grammar as Selected Work: mono eyebrow + serif
          h2 + lede paragraph, then a mono data-line that quantifies the
          register beneath. */}
      <div className="grid grid-cols-12 gap-x-3u">
        <header className="col-span-12 md:col-span-9 md:col-start-3">
          <p className="font-mono text-caption uppercase text-ink-mute">
            <TypeOut>{eyebrow}</TypeOut>
          </p>
          <h2
            id="open-source-heading"
            data-cursor-magnet
            className="mt-3u font-serif text-h2 text-balance text-ink"
          >
            <Redacted>Open Source</Redacted>
          </h2>
          <p className="mt-5u max-w-[52ch] font-serif text-lede text-ink-soft">
            Public artifacts shipped alongside engagements — recon pipelines,
            scanners, a forensic analyzer, and one off-trail experiment.
          </p>
          <p className="mt-3u font-mono text-caption uppercase text-ink-mute">
            {total} repositories&nbsp;&nbsp;·&nbsp;&nbsp;{typeRange}
          </p>
        </header>
      </div>

      {/* Ledger — six register entries, table-of-contents density. Each row
          is one tight horizontal band: [mono index][serif name + em-dash +
          one-line description] ........ [mono type tag ↗]. Top + bottom
          hairlines close the ledger; intermediate rules separate entries.
          No row hover background (would compete with the paper), no
          transitions. Hover shifts the name's underline + the trailing
          glyph to the oxblood mark — two coordinated type-only signals. */}
      <ol className="mt-12u grid grid-cols-12 gap-x-3u list-none p-0 md:mt-18u">
        {projects.map((project, index) => {
          const indexStr = String(index + 1).padStart(2, "0");
          const typeLabel = TYPE_LABEL[project.type];
          const isLast = index === projects.length - 1;
          return (
            <li
              key={project.id}
              className="col-span-12 md:col-span-9 md:col-start-3"
            >
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} — ${typeLabel} — opens GitHub repository in a new tab`}
                className={
                  "group block border-t border-rule py-3u" +
                  (isLast ? " border-b" : "")
                }
              >
                {/* Row layout. Desktop: 12-col inner grid — body (9) right-
                    column (3, text-right). Mobile: same grid collapses to
                    flow, the right column drops below as its own tight line.
                    The index number lives INLINE inside the name <h3> as a
                    mono prefix — no dead left gutter, true catalogue grammar. */}
                <div className="md:grid md:grid-cols-12 md:gap-x-3u md:items-baseline">
                  {/* Body — index prefix + name + (em-dash desktop only) +
                      description. <h3> stays for semantics; rendered at lede
                      (21 px), not h2 (36 px), since these are register entries,
                      not article titles. */}
                  <h3 className="font-serif text-lede text-ink md:col-span-9">
                    <span className="mr-2u font-mono text-caption uppercase tabular-nums text-ink-mute">
                      {indexStr}
                    </span>
                    <span className="glitch-hover underline decoration-rule underline-offset-4 group-hover:decoration-accent">
                      {project.name}
                    </span>
                    <span aria-hidden="true" className="hidden text-ink-mute md:inline">
                      &nbsp;—&nbsp;
                    </span>
                    <span className="mt-1u block font-normal text-ink-soft md:mt-0 md:inline">
                      {project.description}
                    </span>
                  </h3>

                  {/* Type tag + arrow — pinned right at desktop, on its own
                      tight line at mobile. items-baseline aligns the 11px
                      caption with the 21px serif's baseline. */}
                  <p className="mt-2u md:col-span-3 md:mt-0 md:text-right">
                    <span className="font-mono text-caption uppercase text-ink-mute">
                      {typeLabel}
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-3u font-mono text-caption text-ink-mute group-hover:text-accent"
                    >
                      ↗
                    </span>
                  </p>
                </div>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
