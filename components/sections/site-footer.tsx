import { EMAIL, SOCIALS, META } from "@/lib/content/site";
import { MagneticLink } from "@/components/chrome/magnetic-link";
import { CopyEmail } from "@/components/chrome/copy-email";
import { MaskReveal } from "@/components/chrome/mask-reveal";
import { KineticLetters } from "@/components/chrome/kinetic-letters";

const LINKS = [
  { href: SOCIALS.twitter, label: "X / TWITTER" },
  { href: SOCIALS.github, label: "GITHUB" },
  { href: SOCIALS.linkedin, label: "LINKEDIN" },
];

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative z-[1] border-t border-hairline bg-[linear-gradient(color-mix(in_srgb,var(--color-void)_60%,transparent),var(--color-panel))] px-gutter pb-10 pt-35"
    >
      <div className="mx-auto w-full max-w-[77.5rem]">
        <p className="mb-5 text-label text-acid">
          <MaskReveal text="LET'S TALK" by="char" stagger={28} />
        </p>

        {/* REAL TEXT, not a canvas.
            This was a <ModuloText> cell grid that scattered away from the
            cursor. It looked good when it ran — but it only ran once the
            stage tier allowed it and a frame had ticked, so when it did not,
            the page's single most important line was simply absent. It also
            could not be selected, which is the one thing a visitor wants to
            do with an address.

            The address is now a plain mailto link in display type: visible
            at first paint, selectable, keyboard reachable, and still the
            largest thing in the footer. */}
        <a
          href={`mailto:${EMAIL}`}
          className="mt-8 block break-all font-display text-venture font-bold text-ink transition-colors duration-400 ease-out-expo hover:text-acid"
        >
          {/* Letters thicken under the pointer and push their neighbours.
              The <a> still carries the real address, so this is decoration
              over a working link, never instead of one. */}
          <KineticLetters text={EMAIL} />
        </a>

        {/* Copying beats retyping an address this long. */}
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
              className="inline-flex min-h-11 items-center transition-colors hover:text-acid"
            >
              {l.label}
            </MagneticLink>
          ))}
          <span className="ml-auto">UTC+5:30</span>
          <span>© 2026 {META.name.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  );
}
