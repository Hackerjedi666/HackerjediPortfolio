import { EMAIL, SOCIALS, META } from "@/lib/content/site";
import { MagneticLink } from "@/components/chrome/magnetic-link";
import { CopyEmail } from "@/components/chrome/copy-email";
import { ModuloText } from "@/components/effects/modulo-text";

const LINKS = [
  { href: SOCIALS.twitter, label: "X / TWITTER" },
  { href: SOCIALS.github, label: "GITHUB" },
  { href: SOCIALS.linkedin, label: "LINKEDIN" },
];

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative z-[1] border-t border-hairline bg-[linear-gradient(rgba(0,0,0,0.4),#060606)] px-gutter pb-10 pt-35"
    >
      <div className="mx-auto w-full max-w-[77.5rem]">
        <p className="mb-5 text-label tracking-[0.26em] text-acid">LET&apos;S TALK</p>

        {/* The address, rendered as a live ASCII cell grid that scatters
            away from the cursor. No longer a mailto link — it reads as an
            artefact to play with rather than a button to click. */}
        <ModuloText
          text={EMAIL}
          fontSize={68}
          className="mb-9 w-full select-none"
        />

        {/* Because the address above is drawn on a canvas it can't be
            selected, so this is the way to actually take it away. */}
        <CopyEmail email={EMAIL} />

        {/* Socials take the strongest magnetic pull on the page — this is
            the pack's own use case, and at this size the elastic settle is
            the whole effect. */}
        <div className="flex flex-wrap items-center gap-6 border-t border-line-hi pt-6 text-micro tracking-[0.16em] text-ink-label">
          {LINKS.map((l) => (
            <MagneticLink
              key={l.label}
              href={l.href}
              external
              strength={26}
              className="inline-block transition-colors hover:text-acid"
            >
              {l.label}
            </MagneticLink>
          ))}
          <span className="ml-auto">{META.location.toUpperCase()} · UTC+5:30</span>
          <span>© 2026 {META.name.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  );
}
