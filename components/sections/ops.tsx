import { OPS } from "@/lib/content/site";
import { GlowCard } from "@/components/chrome/glow-card";
import { SectionHead } from "@/components/sections/section-head";

export function Ops() {
  return (
    <section id="ops" aria-labelledby="ops-title" className="section shell">
      <SectionHead
        index="01"
        label="SELECTED OPS"
        lede="Clients stay anonymous. The tradecraft doesn't."
      >
        <span id="ops-title">
          Four engagements.
          <br />
          <span className="text-ink-ghost">No names, all detail.</span>
        </span>
      </SectionHead>

      <div className="tilt-scene mt-16 grid gap-6">
        {OPS.map((op) => (
          <GlowCard
            key={op.index}
            as="article"
            /* Ops cards are tall; a 5° tilt on a 600px-high card keystones
               the body copy badly, so these get a shallow 2°. */
            tilt={2}
            lift={4}
            className="group/op reveal border border-line bg-panel/86 p-6 transition-colors duration-300 hover:border-line-lift sm:p-10"
          >
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2.5 text-micro text-ink-label">
              <span className="text-acid">{op.index}</span>
              <span>{op.client}</span>
              <span className="ml-auto">{op.year}</span>
            </div>

            <h3 className="wipe-title mt-6 mb-7 inline-block max-w-[22ch] py-0.5 pr-2.5 font-display text-card font-bold">
              {op.title}
            </h3>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] items-start gap-10">
              <div className="grid gap-6">
                {/* The one number that survives the room — pulled out of the
                    prose and pinned under an acid rule. */}
                <div className="border-l border-acid bg-acid/4 p-5">
                  <p className="text-micro text-acid">{op.anchor.label}</p>
                  <p className="mt-2.5 font-display text-h4 font-bold text-ink">
                    {op.anchor.value}
                  </p>
                  <p className="mt-2 text-chip leading-relaxed tracking-normal text-ink-dim">
                    {op.anchor.note}
                  </p>
                </div>

                <ul className="flex flex-wrap gap-[7px]">
                  {op.tags.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="grid gap-[22px]">
                {op.detail.map((d) => (
                  <div key={d.label} className="grid gap-[7px]">
                    <dt className="text-micro text-ink-label">{d.label}</dt>
                    <dd className="text-sm text-ink-body">{d.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </GlowCard>
        ))}
      </div>
    </section>
  );
}
