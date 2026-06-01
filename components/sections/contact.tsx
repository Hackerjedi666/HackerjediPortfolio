import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { ScrambleText } from "@/components/scramble-text";

// FLAGGED FOR OWNER EDIT — the closing statement, the last voice the
// reader hears. Sized at text-h2 alongside the email; together they form
// a "statement → action" duo. Resolves the operator+founder argument by
// addressing the reader directly without solicitation grammar (no "let's
// work together," no "get in touch"). Edit this string freely; the
// composition doesn't care what's inside it.
const CLOSING_STATEMENT =
  "If you're defending something that matters, talk to me.";

export function Contact() {
  const { email, name, socials } = PORTFOLIO_DATA.meta;
  // Built at render time — auto-updates each year without a code change.
  const year = new Date().getFullYear();

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="px-3u pt-18u pb-5u md:px-8u"
    >
      <div className="grid grid-cols-12 gap-x-3u">
        <div className="col-span-12 md:col-span-9 md:col-start-3">
          {/* CLOSING STATEMENT — the section's h2 semantically and visually,
              styled as the closing voice rather than a label heading. The
              statement IS the title-equivalent here, so it earns the <h2>
              tag without needing a separate sr-only label. */}
          <h2
            id="contact-heading"
            className="font-serif text-h2 text-balance text-ink"
          >
            <ScrambleText duration={900}>{CLOSING_STATEMENT}</ScrambleText>
          </h2>

          {/* EMAIL — the single primary action, the visual anchor. Same
              text-h2 weight as the statement so they form one continuous
              "statement → action" block; the affordance signals (underline,
              trailing ↗, hover-to-accent) distinguish it as clickable. The
              @overwatchlabs.ai domain reads as the founder/operator
              credential — that's the point of putting the whole address
              here at full serif weight, not just "email me" as a label. */}
          <a
            href={`mailto:${email}`}
            className="group mt-5u inline-block break-words font-serif text-h2 text-balance text-ink"
          >
            <span className="glitch-hover underline decoration-rule underline-offset-4 group-hover:decoration-accent">
              {email}
            </span>
            <span
              aria-hidden="true"
              className="ml-2u font-mono text-caption text-ink-mute group-hover:text-accent"
            >
              ↗
            </span>
          </a>

          {/* FOOTER LAYER — quietest tier, mono caption. Settles beneath
              the statement+email with a deliberate mt-18u so the page
              closes with breath, not a thud. Real <footer> element so
              assistive tech announces this as page-level footer matter;
              nesting <footer> inside <section> is valid HTML. Socials as
              typographic links (NOT icon buttons — the whole site avoids
              icon clusters); copyright auto-years from server render. */}
          <footer className="mt-12u">
            <p className="font-mono text-caption uppercase text-ink-mute">
              <a
                href={socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-accent"
              >
                X&nbsp;↗
              </a>
              <span aria-hidden="true">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-accent"
              >
                GitHub&nbsp;↗
              </a>
              <span aria-hidden="true">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-accent"
              >
                LinkedIn&nbsp;↗
              </a>
            </p>
            <p className="mt-2u font-mono text-caption uppercase text-ink-mute">
              ©&nbsp;{year}&nbsp;&nbsp;·&nbsp;&nbsp;{name}
            </p>
          </footer>
        </div>
      </div>
    </section>
  );
}
