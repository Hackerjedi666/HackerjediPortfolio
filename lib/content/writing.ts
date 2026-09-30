/**
 * Writing and tools, pulled from overwatchlabs.ai.
 *
 * These are real published pages on the practice's own site, read from its
 * docs index rather than invented. Each carries a one-line description
 * because the cursor card shows it on hover — a list of ten near-identical
 * security titles tells a reader nothing without it.
 */

const BASE = "https://www.overwatchlabs.ai";

export type Entry = { title: string; href: string; topic: string; blurb: string };

export const WRITING: Entry[] = [
  {
    title: "Assumed-breach assessments",
    href: `${BASE}/blog-assumed-breach`,
    topic: "Method",
    blurb:
      "Why starting from a foothold finds what a perimeter scan structurally cannot.",
  },
  {
    title: "Choose a pentest or red team",
    href: `${BASE}/blog-pentest-vs-redteam`,
    topic: "Scoping",
    blurb:
      "Two different questions, two different engagements. Picking the wrong one wastes the budget.",
  },
  {
    title: "Active Directory Certificate Services",
    href: `${BASE}/blog-adcs`,
    topic: "Active Directory",
    blurb:
      "Certificate templates as a privilege-escalation path, and the misconfigurations that open it.",
  },
  {
    title: "Endpoint detection limitations",
    href: `${BASE}/blog-edr-evasion`,
    topic: "Defence evasion",
    blurb:
      "What EDR sees, what it does not, and why a passing agent is not a passing control.",
  },
  {
    title: "Antivirus and layered defenses",
    href: `${BASE}/blog-antivirus-bypass`,
    topic: "Defence evasion",
    blurb:
      "Signature and heuristic gaps, and why layering matters more than any single product.",
  },
  {
    title: "IDOR & access control",
    href: `${BASE}/blog-idor`,
    topic: "AppSec",
    blurb:
      "Object-level authorisation, the bug class scanners find least and attackers find first.",
  },
  {
    title: "Business logic flaws",
    href: `${BASE}/blog-business-logic`,
    topic: "AppSec",
    blurb:
      "Vulnerabilities where every request is valid and the sequence is the problem.",
  },
  {
    title: "Sessions, tokens & account access",
    href: `${BASE}/blog-beyond-passwords`,
    topic: "Identity",
    blurb:
      "What actually protects an account once the password stops being the control.",
  },
  {
    title: "A policy that holds",
    href: `${BASE}/blog-csp-that-holds`,
    topic: "AppSec",
    blurb:
      "Writing a Content Security Policy strict enough to matter and loose enough to ship.",
  },
  {
    title: "Using SAST in code review",
    href: `${BASE}/blog-sast-floor`,
    topic: "Code review",
    blurb:
      "Static analysis as a floor, not a verdict. Where it helps and where it misleads.",
  },
];

export const TOOLS: Entry[] = [
  {
    title: "checkYourDomainSec",
    href: `${BASE}/tools/check-your-domain-sec`,
    topic: "Free tool",
    blurb: "Check domain exposure, DNS and email security posture.",
  },
  {
    title: "Phishing & email analyzer",
    href: `${BASE}/tools/phishing-analyzer`,
    topic: "Free tool",
    blurb: "Inspect suspicious emails, links and headers.",
  },
  {
    title: "Web response analyzer",
    href: `${BASE}/tools/web-response`,
    topic: "Free tool",
    blurb: "Review security headers, CSP and certificate configuration.",
  },
  {
    title: "Static file analysis",
    href: `${BASE}/tools/file-hash`,
    topic: "Free tool",
    blurb: "Inspect file signatures, metadata and hashes.",
  },
  {
    title: "Decoder & token inspector",
    href: `${BASE}/tools/decoder`,
    topic: "Free tool",
    blurb: "Decode data and inspect JWTs without pasting them into a stranger's site.",
  },
];

export const DOCS_URL = `${BASE}/docs`;
