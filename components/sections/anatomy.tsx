import { KILL_CHAIN } from "@/lib/content/site";
import { ScrollExpand } from "@/components/effects/scroll-expand";
import { AttackPath } from "@/components/effects/attack-path";

export function Anatomy() {
  return (
    <section
      id="anatomy"
      aria-labelledby="anatomy-title"
      className="section shell relative !pt-10"
    >
      <header className="relative z-[1]">
        <p className="eyebrow reveal-sm text-label tracking-[0.26em] text-acid">
          02 {"//"} ANATOMY OF ONE OP
        </p>

        {/* The diagram opens inside the headline: the panel sits between the
            two clauses and wipes open as you scroll, and the trailing clause
            shears as it goes. The panel's box is reserved at all times, so
            the headline never moves while it opens. */}
        <h2 id="anatomy-title" className="mt-7 text-h2 uppercase">
          <ScrollExpand
            before="How a domain"
            after={<span className="text-ink-ghost">falls in five moves.</span>}
          >
            <AttackPath />
          </ScrollExpand>
        </h2>

        <p className="reveal-fade mt-5 max-w-[56ch] text-body text-ink-body">
          The 2024 NBFC operation, step by step. Assumed breach, EDR
          everywhere, nobody expecting me.
        </p>
      </header>

      {/* No parallax on this block. A yPercent shift on a column this tall
          pulled it up over the headline above and left the two overlapping. */}
      <div className="relative z-[1] mt-20 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] items-start gap-14">
        {/* Sticky progress column — the bar fills as the reader scrubs the
            five steps. Pure scroll-timeline, no listener. */}
        <div className="top-25 max-w-[300px] lg:sticky">
          <p className="text-micro text-ink-label">KILL CHAIN PROGRESS</p>
          <div className="relative mt-3.5 h-0.5 bg-line">
            <div aria-hidden="true" className="view-grow absolute inset-0 bg-acid" />
          </div>
          <p className="mt-6 text-chip leading-[1.8] tracking-normal text-ink-dim">
            Five steps. Under a week. Not one production service disrupted.
          </p>
        </div>

        {/* 1px gap over a hairline background draws the dividers between
            steps without a border on each child. */}
        <ol className="grid gap-px bg-hairline">
          {KILL_CHAIN.map((s) => (
            <li key={s.step} className="reveal-slide bg-void py-8 pl-0 sm:pl-8">
              <div className="flex justify-between gap-4 text-micro text-ink-label">
                <span className="text-acid">{s.step}</span>
                <span>{s.phase}</span>
              </div>
              <h3 className="mt-4 mb-3 font-display text-h3 font-bold">{s.title}</h3>
              <p className="max-w-[56ch] text-sm text-ink-body">{s.body}</p>
              {s.flag ? (
                <p className="mt-5 border-l border-acid bg-acid/5 px-4 py-3.5 text-chip tracking-[0.08em] text-acid">
                  {s.flag}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
