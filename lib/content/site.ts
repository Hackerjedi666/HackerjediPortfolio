/**
 * Presentation copy for the terminal redesign.
 *
 * Hard facts (email, socials, article URLs, CVE) still come from
 * `portfolio-data.ts` — that stays the single source of truth for anything
 * verifiable. This module holds the *voice*: the shortened, anonymised
 * client framing the new design leads with ("clients stay anonymous, the
 * tradecraft doesn't"), plus the section-level copy that only exists here.
 */
import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";

export const META = PORTFOLIO_DATA.meta;
export const EMAIL = META.email;
export const SOCIALS = META.socials;

/** Every Forensia call-to-action points here — the product's own site. */
export const FORENSIA_URL = "https://forensia.ai";

/** The practice's own site, behind the OverwatchLabs engagement CTA. */
export const OVERWATCH_URL = "https://overwatchlabs.ai";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const HERO = {
  handle: "abhimanyu_gupta",
  org: "OVERWATCHLABS.AI",
  role: "FOUNDER // OFFENSIVE SECURITY",
  headline: ["I break in", "before they do."] as const,
  lede: "Red teamer turned founder. Four years of assumed-breach ops against banks, insurers and state platforms — now building Forensia so companies can see their attack surface the way I do.",
  stats: [
    { value: "4+", label: "YEARS RED TEAM", accent: false },
    { value: "130+", label: "APPS & APIS BROKEN", accent: false },
    { value: "1", label: "CVE PUBLISHED", accent: true },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* 01 — Selected ops                                                   */
/* ------------------------------------------------------------------ */

export type Op = {
  index: string;
  client: string;
  year: string;
  title: string;
  anchor: { label: string; value: string; note: string };
  tags: string[];
  detail: { label: string; body: string }[];
};

export const OPS: Op[] = [
  {
    index: "01",
    client: "NON-BANKING FINANCIAL INSTITUTION",
    year: "2024",
    title: "Internal red team, assumed breach",
    anchor: {
      label: "ACCESS",
      value: "Full Active Directory compromise",
      note: "Custom-payload EDR bypass + privilege chain",
    },
    tags: ["EDR BYPASS", "ACTIVE DIRECTORY", "INFRASTRUCTURE"],
    detail: [
      {
        label: "PROBLEM",
        body: "Assumed-breach scenario inside a large NBFC with CrowdStrike deployed fleet-wide and almost no visibility into lateral-movement gaps.",
      },
      {
        label: "APPROACH",
        body: "Built custom payloads to walk past CrowdStrike, abused a weak domain-controller path, then chained misconfigurations to escalate.",
      },
      {
        label: "OUTCOME",
        body: "Full Active Directory compromise across the internal network, with every business-impact scenario demonstrated end to end.",
      },
      {
        label: "IMPACT",
        body: "Exposed critical gaps in endpoint protection and AD hardening, and moved real budget into identity and EDR guardrails.",
      },
    ],
  },
  {
    index: "02",
    client: "STATE GOVERNMENT SERVICES PLATFORM",
    year: "2023",
    title: "Web & mobile exposure review at scale",
    anchor: {
      label: "SCALE",
      value: "80+ web apps & mobile APKs",
      note: "Multiple internal teams and vendor codebases",
    },
    tags: ["WEB APPS", "MOBILE APKS", "SOURCE DISCLOSURE", "PII"],
    detail: [
      {
        label: "PROBLEM",
        body: "Eighty-plus web applications and mobile APKs, built by a dozen teams and vendors, all on inconsistent security baselines.",
      },
      {
        label: "APPROACH",
        body: "Large-scale application and API testing paired with configuration review — surfacing source-code disclosure, PII exposure and RCE paths.",
      },
      {
        label: "OUTCOME",
        body: "Externally exposed critical issues closed, and secure defaults normalised across the whole portfolio.",
      },
      {
        label: "IMPACT",
        body: "Leadership got a clear map of exposure drift over time plus a repeatable baseline every new release is measured against.",
      },
    ],
  },
  {
    index: "03",
    client: "FINANCIAL INSURANCE ENTERPRISE",
    year: "2023",
    title: "Red team & phishing campaign",
    anchor: {
      label: "REACH",
      value: "85% of endpoints under C2",
      note: "One targeted campaign, assumed-breach simulation",
    },
    tags: ["PHISHING", "AV EVASION", "API SECURITY", "WEB APPSEC"],
    detail: [
      {
        label: "PROBLEM",
        body: "The insurer needed to know whether its people and its online application stack held up against realistic attacker behaviour.",
      },
      {
        label: "APPROACH",
        body: "Tailored phishing campaigns with AV evasion, alongside ten-plus focused API and web application assessments.",
      },
      {
        label: "OUTCOME",
        body: "Critical weaknesses exposed across customer-facing journeys and the back-end controls behind them.",
      },
      {
        label: "IMPACT",
        body: "Drove changes to mail filtering, user awareness and app-layer defences — with a measurable drop in click-through.",
      },
    ],
  },
  {
    index: "04",
    client: "HEALTHCARE & ENTERPRISE CLIENTS",
    year: "2022",
    title: "Application portfolio audit",
    anchor: {
      label: "PORTFOLIO",
      value: "30+ web apps & 20+ APIs",
      note: "Mixed maturity and monitoring states",
    },
    tags: ["WEB APPSEC", "API SECURITY", "INFRASTRUCTURE", "CODE REVIEW"],
    detail: [
      {
        label: "PROBLEM",
        body: "Products that had grown organically: thirty-plus web apps and twenty-plus APIs at wildly different maturity, monitored inconsistently.",
      },
      {
        label: "APPROACH",
        body: "Infrastructure review with Nessus and Nipper, combined with SonarQube-assisted manual source-code analysis across the portfolio.",
      },
      {
        label: "OUTCOME",
        body: "High-risk defects closed with proof-of-concept-backed fixes, and monitoring tightened around the critical paths.",
      },
      {
        label: "IMPACT",
        body: "Left behind a repeatable security playbook for future releases and a lower rate of re-introduced defects.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* 02 — Anatomy of one op                                              */
/* ------------------------------------------------------------------ */

export type KillChainStep = {
  step: string;
  phase: string;
  title: string;
  body: string;
  /** Optional acid callout pinned under the step. */
  flag?: string;
};

export const KILL_CHAIN: KillChainStep[] = [
  {
    step: "STEP 01",
    phase: "RECON",
    title: "Map the internal, quietly",
    body: "One low-privilege workstation to start. Enumerated the domain with living-off-the-land tooling only — nothing dropped to disk, no telemetry worth an alert.",
  },
  {
    step: "STEP 02",
    phase: "EVASION",
    title: "Write a payload the EDR likes",
    body: "Off-the-shelf loaders died instantly. Built a custom one — fresh syscalls, no known signatures, sleep obfuscation — and got a beacon that survived a full working day.",
  },
  {
    step: "STEP 03",
    phase: "IDENTITY",
    title: "Follow the trust, not the CVEs",
    body: "BloodHound turned a flat network into a graph. Weak delegation on a forgotten service account was the shortest path to a domain controller — three hops, zero exploits.",
  },
  {
    step: "STEP 04",
    phase: "DOMAIN ADMIN",
    title: "Own everything, break nothing",
    body: "Domain admin without disrupting a single production service. The point was never the ticket — it was proving which business processes I could have stopped.",
    flag: "ACCESS ACHIEVED — full AD compromise via custom EDR bypass + delegation chain",
  },
  {
    step: "STEP 05",
    phase: "THE PART THAT MATTERS",
    title: "Report blast radius, not findings",
    body: "Nobody in a boardroom cares about a Kerberos flag. They care that loan disbursement could have been halted for a day. That framing is what moved real budget.",
  },
];

/* ------------------------------------------------------------------ */
/* 03 — What I actually do                                             */
/* ------------------------------------------------------------------ */

export type Capability = {
  index: string;
  title: string;
  body: string;
  points: string[];
};

export const CAPABILITIES: Capability[] = [
  {
    index: "01",
    title: "Red team & adversary simulation",
    body: "Full-scope and assumed-breach ops that copy real tradecraft — not a scanner report with a logo on it.",
    points: [
      "EDR/AV evasion & payload dev",
      "AD and identity abuse to DA",
      "Campaign-grade phishing",
      "Blast-radius reporting",
    ],
  },
  {
    index: "02",
    title: "Threat intel & surface mapping",
    body: "Everything of yours that's on the internet, ranked by what an attacker would reach for first.",
    points: [
      "Continuous asset discovery",
      "Misconfig + weak-auth correlation",
      "Attack-path modelling",
      "Summaries execs actually read",
    ],
  },
  {
    index: "03",
    title: "TEE research & platform hardening",
    body: "Enclaves, confidential workloads, and whether the hardware promise survives contact with reality.",
    points: [
      "Enclave & side-channel review",
      "Threat models for TEE services",
      "Firmware / runtime test plans",
      "Research → deployable controls",
    ],
  },
  {
    index: "04",
    title: "Application & API security",
    body: "Auth, session and business logic — the class of bug a scanner structurally cannot find.",
    points: [
      "Auth & business-logic deep dives",
      "Source review + manual triage",
      "IDOR & mass data exposure",
      "Infrastructure baselining",
    ],
  },
];

export const TOOLBELT = [
  "Cobalt Strike",
  "Custom C2",
  "BloodHound",
  "Impacket",
  "Ghidra",
  "Burp Suite",
  "Python",
  "OSCP · eCPPT · eJPT · CND",
];

/* ------------------------------------------------------------------ */
/* 04 — Ventures                                                       */
/* ------------------------------------------------------------------ */

export const VENTURES = {
  practice: {
    status: "ACTIVE",
    name: "OverwatchLabs",
    suffix: ".ai",
    body: "My offensive security practice. Red-team operations, application and API assessments, and TEE-aware platform hardening for teams that can't afford to guess.",
    cta: "BOOK AN ENGAGEMENT",
  },
  product: {
    status: "LAUNCHING",
    name: "Forensia",
    body: "Threat intelligence that doesn't drown you. Forensia takes your noisy external exposure and returns a short, ranked list of what's actually going to hurt — in language a board understands.",
    points: [
      "continuous external discovery",
      "attack paths, not finding lists",
      "executive-ready risk signal",
    ],
    cta: "GET EARLY ACCESS",
  },
} as const;

/* ------------------------------------------------------------------ */
/* 06 — Research wall                                                  */
/* ------------------------------------------------------------------ */

export type WallPost = { date: string; title: string; url: string };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "2026-05-19" → "19 MAY 26". Parsed by field, not by `new Date`, so the
 *  wall renders the same string on the server and the client regardless of
 *  the viewer's timezone (a Date parse would shift the day across UTC±). */
function wallDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
}

/** Real posts, real links — newest first, straight off portfolio-data. */
export const WALL_POSTS: WallPost[] = [...PORTFOLIO_DATA.articles]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((a) => ({ date: wallDate(a.date), title: a.title, url: a.url }));

export const POST_COUNT = WALL_POSTS.length;
