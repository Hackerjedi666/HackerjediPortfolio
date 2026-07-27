import { VENTURES, FORENSIA_URL, OVERWATCH_URL } from "@/lib/content/site";
import { GlowCard } from "@/components/chrome/glow-card";
import { MagneticLink } from "@/components/chrome/magnetic-link";
import { SectionHead } from "@/components/sections/section-head";

const { practice, product } = VENTURES;

export function Ventures() {
  return (
    <section
      id="forensia"
      aria-labelledby="ventures-title"
      className="section relative border-t border-hairline"
    >
      <div className="shell shell-wide relative z-[1] tilt-scene">
        <SectionHead index="04" label="WHAT I'M BUILDING">
          <span id="ventures-title">
            Two ventures.
            <br />
            <span className="text-acid">
              One sells hours,
              <br />
              one sells software.
            </span>
          </span>
        </SectionHead>

        <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-5">
          {/* The practice — neutral surface, quieter light. */}
          <GlowCard
            as="article"
            size={400}
            intensity={0.05}
            neutral
            shader
            className="reveal border border-line-hi bg-[linear-gradient(150deg,#0b0b0b,#050505)] px-7 py-8 transition-colors duration-300 hover:border-ink-body"
          >
            <p className="flex items-center gap-2.5 text-micro text-ink-label">
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-acid" />
              {practice.status}
            </p>
            <h3 className="mt-7 mb-3.5 font-display text-venture font-bold">
              {practice.name}
              <span className="text-ink-label">{practice.suffix}</span>
            </h3>
            <p className="mb-6 max-w-[44ch] text-body text-ink-body">{practice.body}</p>
            <MagneticLink href={OVERWATCH_URL} external className="btn btn-ghost">
              {practice.cta} →
            </MagneticLink>
          </GlowCard>

          {/* The product — acid-tinted surface, the page's loudest card. */}
          <GlowCard
            as="article"
            size={400}
            intensity={0.16}
            shader
            className="reveal border border-acid/25 bg-[linear-gradient(150deg,rgba(194,255,69,0.07),#060606_62%)] px-7 py-8 transition-colors duration-300 hover:border-acid"
          >
            <p className="flex items-center gap-2.5 text-micro text-acid">
              <span
                aria-hidden="true"
                className="h-[7px] w-[7px] rounded-full bg-acid animate-[pulse-dot_1.6s_infinite]"
              />
              {product.status}
            </p>
            <h3 className="mt-7 mb-3.5 font-display text-venture font-bold">
              {product.name}
            </h3>
            <p className="mb-5 max-w-[44ch] text-body text-ink-soft">{product.body}</p>
            <ul className="mb-6 grid gap-2 text-chip tracking-[0.06em] text-ink-body">
              {product.points.map((p) => (
                <li key={p}>
                  <span aria-hidden="true">→ </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <MagneticLink href={FORENSIA_URL} external className="btn btn-acid">
                {product.cta}
              </MagneticLink>
              <MagneticLink href="#shell" className="btn btn-ghost">
                RUN&nbsp;<span className="text-acid">forensia</span>&nbsp;IN THE SHELL
              </MagneticLink>
            </div>
          </GlowCard>
        </div>
      </div>
    </section>
  );
}
