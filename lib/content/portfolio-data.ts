/**
 * Single source of truth for portfolio content.
 * Pure data — no React, no Next.js, no UI imports.
 * Section components should consume this object instead of hardcoding copy.
 */

export type VentureStatus = "active" | "building" | "launching" | "launched";

export type Venture = {
  id: string;
  name: string;
  description: string;
  status: VentureStatus;
  url?: string;
  /** True when the venture is a product available for purchase. */
  purchasable?: boolean;
  /** Checkout/buy link. Placeholder "TODO: confirm" until the storefront resolves;
   *  renderers should gate the buy CTA on `!isPlaceholder(buyUrl)`. */
  buyUrl?: string;
};

export type CapabilityZone = "left" | "center" | "right" | "back";

export type Capability = {
  id: string;
  label: string;
  title: string;
  description: string;
  keyPoints: string[];
  zone: CapabilityZone;
};

export type AchievementAnchor = {
  /** Short mono micro-label (e.g. "ACCESS", "SCALE", "DISCLOSURE"). */
  label: string;
  /** The hard artifact (e.g. "Full domain admin", "80+ apps", "CVE-2025-56459"). */
  value: string;
  /** Optional one-line context for the anchor. */
  note?: string;
};

export type Achievement = {
  id: string;
  title: string;
  client: string;
  date: string;
  tags: string[];
  problem: string;
  approach: string;
  outcome: string;
  impact: string;
  /** Optional exhibit pinned in the meta column. Absent = the meta column
   *  renders without an exhibit slot (no empty placeholder rendered). */
  anchor?: AchievementAnchor;
};

export type ToolCategoryId = "offensive" | "assessment" | "reverse" | "other";

export type Tools = Record<ToolCategoryId, string[]>;

export type Certification = {
  id: string;
  name: string;
  issuer?: string;
  year?: string;
};

export type ProjectType = "tool" | "automation" | "research" | "library";

export type Project = {
  id: string;
  name: string;
  description: string;
  url: string;
  type: ProjectType;
};

export type Article = {
  /** URL-safe slug (e.g. "teedotfail-panic"). Stable id, not displayed. */
  id: string;
  /** Canonical X status URL the card links out to. */
  url: string;
  /** ISO date (YYYY-MM-DD). Used to sort newest-first at render time. */
  date: string;
  /** Headline. Populated by `scripts/fetch-article.mjs` from X's og:description
   *  (X swaps the OG fields for status URLs — see the script for context). */
  title: string;
  /** Author's one-sentence hook. Manual — X doesn't serve a summary. The
   *  renderer gates this on `isPlaceholder()`, so "TODO: confirm" stays
   *  invisible in the DOM until the real hook is written. */
  blurb: string;
};

export type Publication = {
  id: string;
  cve: string;
  /** Short headline. Placeholder "TODO: confirm" if unverified. */
  title?: string;
  /** One-line substance / impact description. Placeholder "TODO: confirm" if unverified. */
  summary?: string;
  /** Canonical self-published disclosure write-up (author's article). */
  writeupUrl?: string;
  /** NVD/MITRE advisory link. Placeholder "TODO: confirm" until the advisory resolves. */
  advisoryUrl?: string;
};

export type SocialLinks = {
  twitter: string;
  github: string;
  linkedin: string;
};

export type Meta = {
  name: string;
  title: string;
  /** Editorial masthead line — the short, voiced claim the hero leads with.
   *  Falls back to `title` when this is a placeholder. */
  masthead: string;
  location: string;
  email: string;
  socials: SocialLinks;
};

export const PORTFOLIO_DATA = {
  meta: {
    name: "Abhimanyu Gupta",
    title: "Offensive Security Engineer",
    masthead: "Offensive security, end to end.",
    location: "India",
    email: "abhimanyu.gupta@overwatchlabs.ai",
    socials: {
      twitter: "https://x.com/hackerjedi666",
      github: "https://github.com/Hackerjedi666",
      linkedin: "https://www.linkedin.com/in/hackerjedi666/",
    },
  },

  manifesto:
    "Security should be invisible in operation, unmistakable in strength.",

  bio: "Offensive security engineer with 4+ years across red teaming, penetration testing, and vulnerability assessment for financial, government, healthcare, and insurance environments. Focused on assumed-breach operations, attack-path realism, and outcomes that change executive decisions — not finding lists.",

  ventures: [
    {
      id: "overwatch-labs",
      name: "OverwatchLabs",
      description:
        "Independent offensive security practice delivering red-team operations, application/API assessments, and TEE-aware platform hardening for high-stakes environments.",
      status: "active",
    },
    {
      id: "forensia",
      name: "Forensia Threat Intelligence",
      description:
        "Threat-intelligence platform converting noisy external exposure into prioritized, executive-ready risk signals.",
      status: "launching",
      purchasable: true,
      // PLACEHOLDER — storefront not live yet. Renderers must gate the buy
      // CTA on `!isPlaceholder(buyUrl)` so the link only appears once real.
      buyUrl: "TODO: confirm",
    },
  ] as Venture[],

  capabilities: [
    {
      id: "red-team",
      label: "MONITOR 01",
      title: "Red Team & Adversary Simulation",
      description:
        "Assumed-breach and full-scope engagements that mirror real attacker tradecraft against modern EDR and identity controls.",
      keyPoints: [
        "EDR/AV evasion, payload development, initial foothold",
        "Active Directory and identity abuse for domain dominance",
        "Campaign-style phishing and social engineering",
        "Blast-radius reporting, not just access proof",
      ],
      zone: "left",
    },
    {
      id: "threat-intel",
      label: "MONITOR 02",
      title: "Threat Intel & Surface Mapping",
      description:
        "External exposure mapping and signal aggregation for high-risk environments, surfaced as prioritized attack paths.",
      keyPoints: [
        "Continuous discovery of internet-facing assets",
        "Correlation of misconfigurations, weak auth, and legacy exposure",
        "Attack-path modeling instead of flat findings lists",
        "Executive-ready impact summaries",
      ],
      zone: "back",
    },
    {
      id: "tee-research",
      label: "MONITOR 03",
      title: "TEE Research & Platform Hardening",
      description:
        "Trusted execution analysis for enclaves, secure workloads, and the platform controls around them.",
      keyPoints: [
        "Enclave design review and side-channel exposure assessment",
        "Threat modeling for TEE-backed services and infrastructure",
        "Test plans validating hardware, firmware, and runtime assumptions",
        "Bridges between TEE research and practical deployment",
      ],
      zone: "center",
    },
    {
      id: "app-api-security",
      label: "MONITOR 04",
      title: "Application & API Security",
      description:
        "Security reviews for web, mobile, and API-heavy platforms, combining manual triage with source-code analysis.",
      keyPoints: [
        "Deep dives into auth, session management, and business logic",
        "Source code review with SonarQube and manual triage",
        "API abuse cases, mass data exposure, and IDOR detection",
        "Infrastructure baselining with Nessus, Nipper, and cloud-native tools",
      ],
      zone: "right",
    },
  ] as Capability[],

  achievements: [
    {
      id: "nbfc-red-team",
      title: "NBFC Internal Red Team Operation",
      client: "Electronica Finance Limited (EFL)",
      date: "2024",
      tags: ["EDR Bypass", "Active Directory", "Infrastructure"],
      problem:
        "Assumed-breach scenario inside a large NBFC with CrowdStrike EDR deployed and limited visibility into lateral-movement gaps.",
      approach:
        "Developed custom payloads to bypass CrowdStrike, abused weak domain-controller paths, and chained misconfigurations to escalate privileges.",
      outcome:
        "Achieved full Active Directory compromise across the internal network and demonstrated end-to-end business-impact scenarios.",
      impact:
        "Exposed critical defense gaps in endpoint protection and AD hardening; drove prioritized identity and EDR guardrails.",
      anchor: {
        label: "ACCESS",
        value: "Full Active Directory compromise",
        note: "Custom-payload EDR bypass + privilege chain",
      },
    },
    {
      id: "state-gov-assessment",
      title: "State Government Web & Mobile Exposure Review",
      client: "State Government Services Platform",
      date: "2023",
      tags: ["Web Apps", "Mobile APKs", "Source Code Disclosure", "PII"],
      problem:
        "80+ web applications and mobile APKs across teams and vendors with inconsistent security baselines.",
      approach:
        "Large-scale application and API testing combined with configuration reviews; uncovered source-code disclosure, PII exposure, and RCE paths.",
      outcome:
        "Closed externally exposed critical issues and normalized secure defaults across the portfolio.",
      impact:
        "Gave leadership a clear map of exposure drift over time and a repeatable baseline for new releases.",
      anchor: {
        label: "SCALE",
        value: "80+ web apps / mobile APKs",
        note: "Multiple teams + vendor codebases",
      },
    },
    {
      id: "insurance-red-team",
      title: "Insurance Enterprise Red Team & Phishing Campaign",
      client: "Financial Insurance Enterprise",
      date: "2023",
      tags: ["Phishing", "AV Evasion", "API Security", "Web AppSec"],
      problem:
        "Insurer needed to validate phishing resilience and its online application stack against realistic attacker behavior.",
      approach:
        "Ran tailored phishing campaigns with AV evasion, paired with 10+ focused API and web application assessments.",
      outcome:
        "Exposed critical weaknesses in user journeys and back-end controls across customer-facing services.",
      impact:
        "Drove changes in mail filtering, user awareness, and app-layer defenses; measurable drop in phish click-through.",
      anchor: {
        label: "ACCESS",
        value: "85% of endpoints under C2",
        note: "Single targeted phishing campaign, assumed-breach simulation",
      },
    },
    {
      id: "healthcare-enterprise-portfolio",
      title: "Healthcare & Enterprise Application Portfolio Audit",
      client: "Healthcare & Enterprise Clients",
      date: "2022",
      tags: ["Web AppSec", "API Security", "Infrastructure", "Code Review"],
      problem:
        "Multiple products grew organically — 30+ web apps and 20+ APIs sitting at different maturity states with inconsistent monitoring.",
      approach:
        "Combined Nessus/Nipper infrastructure reviews with SonarQube-assisted manual source code analysis across the portfolio.",
      outcome:
        "Closed high-risk defects with PoC-backed fixes and improved monitoring around critical paths.",
      impact:
        "Created a repeatable security playbook for future releases and reduced re-introduced defect rate.",
      anchor: {
        label: "PORTFOLIO",
        value: "30+ web apps / 20+ APIs",
        note: "Mixed maturity + monitoring states",
      },
    },
  ] as Achievement[],

  publications: [
    {
      id: "cve-2025-56459",
      cve: "CVE-2025-56459",
      // Author's own framing of the disclosure (Medium write-up). Truthful.
      title: "RCE via stored XSS in Electron OPC client",
      // One-line substance derived from the write-up's threat model — no
      // invented metrics. The OT/SCADA workstation impact is what stops a
      // reader scrolling, and is the substance the article describes.
      summary:
        "Unsanitized tag field in a privileged Electron renderer escalates stored XSS to native code execution on OT/SCADA workstations.",
      // VERIFIED LIVE — the canonical self-published disclosure.
      writeupUrl: "https://medium.com/@hackerjedi2812/cve-2025-56459-f814005f607a",
      // PLACEHOLDER — NVD/MITRE advisory does not yet resolve. Do NOT replace
      // with an NVD URL until nvd.nist.gov/vuln/detail/CVE-2025-56459 returns
      // a real record; a 404 on a security site is the worst possible link.
      advisoryUrl: "TODO: confirm",
    },
  ] satisfies Publication[],

  tools: {
    offensive: [
      "Burp Suite",
      "Metasploit",
      "PowerShell Empire",
      "Cobalt Strike",
      "Custom C2",
      "Phishing Tooling",
      "Impacket",
      "BloodHound",
    ],
    assessment: [
      "Nessus",
      "Nipper",
      "SonarQube",
      "OWASP ZAP",
      "Nuclei",
      "Nmap",
    ],
    reverse: [
      "Ghidra",
      "IDA Pro",
      "x64dbg",
      "OllyDbg",
      "Cuckoo Sandbox",
      "Any.run",
    ],
    other: [
      "Wireshark",
      "Python",
      "Java",
      "JavaScript",
      "Solidity",
      "AWS",
      "Docker",
      "Linux",
    ],
  } satisfies Tools,

  certifications: [
    {
      id: "oscp",
      name: "Offensive Security Certified Professional",
      issuer: "Offensive Security",
    },
    {
      id: "ecppt",
      name: "eLearnSecurity Certified Professional Penetration Tester",
      issuer: "INE / eLearnSecurity",
    },
    {
      id: "ejpt",
      name: "eLearnSecurity Junior Penetration Tester",
      issuer: "INE / eLearnSecurity",
    },
    {
      id: "cnd",
      name: "Certified Network Defender",
      issuer: "EC-Council",
    },
  ] as Certification[],

  projects: [
    {
      id: "network-scanner",
      name: "NetworkScanner",
      description: "Network reconnaissance and enumeration tool.",
      url: "https://github.com/Hackerjedi666/NetworkScanner",
      type: "tool",
    },
    {
      id: "recon-automated",
      name: "ReconAutomated",
      description: "Automated company recon for penetration tests.",
      url: "https://github.com/Hackerjedi666/ReconAutomated",
      type: "automation",
    },
    {
      id: "mev-gladiator",
      name: "MEV Gladiator",
      description:
        "MEV bots competing via parallel execution on the Monad blockchain.",
      url: "https://github.com/Hackerjedi666/MEV-Gladiator",
      type: "research",
    },
    {
      id: "cybersecurity-everyday-tools",
      name: "CyberSecurityEverydayTools",
      description: "Everyday pentester automation scripts.",
      url: "https://github.com/Hackerjedi666/CyberSecurityEverydayTools",
      type: "automation",
    },
    {
      id: "what-is-my-file",
      name: "whatIsMyFile",
      description: "Forensic static file analyzer.",
      url: "https://github.com/Hackerjedi666/whatIsMyFile",
      type: "tool",
    },
    {
      id: "port-scanner",
      name: "PortScanner",
      description: "Fast port scanner.",
      url: "https://github.com/Hackerjedi666/PortScanner",
      type: "tool",
    },
  ] as Project[],

  articles: [
    // 38 entries, newest-first. Titles populated by scripts/fetch-article.mjs
    // from og:description (X serves the author profile in og:title — see the
    // script + scripts/og-probe.mjs for the field-swap finding). All blurbs
    // are placeholder; the Articles renderer gates each on !isPlaceholder(),
    // so "TODO: confirm" stays out of the DOM until the owner writes real
    // hooks (separate manual debt). Slugs are unique React keys.
    {
      id: "formal-verification-how-to-prove",
      url: "https://x.com/hackerjedi666/status/2056724216041664803",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-05-19",
      title:
        "Formal Verification — How to Prove Code Won't Betray You?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "is-a-sandbox-really-safe",
      url: "https://x.com/hackerjedi666/status/2055227675367850289",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-05-15",
      title:
        "Is a sandbox really safe? Advanced Malware Sandbox evasions",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "firewalls-what-they-actually-do",
      url: "https://x.com/hackerjedi666/status/2055232185062592994",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-05-15",
      title:
        "Firewalls; What They Actually Do, and Why Attackers Get Through Anyway :/",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "but-what-the-hell-is",
      url: "https://x.com/hackerjedi666/status/2055274615463891432",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-05-15",
      title:
        "But what the hell is EVM? (Ethereum Virtual Machine)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "but-do-you-really-know",
      url: "https://x.com/hackerjedi666/status/2046668682802401613",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-21",
      title:
        "But do you really know what is an IAM?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "malware-analysis-part2-why-file",
      url: "https://x.com/hackerjedi666/status/2045491091802394666",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-18",
      title:
        "Malware analysis part2: Why File Signatures are the DNA of malware analysis :)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "just-what-the-hell-is",
      url: "https://x.com/hackerjedi666/status/2045526067222585754",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-18",
      title:
        "Just what the hell is ZCASH?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "trail-of-bits-beating-googles",
      url: "https://x.com/hackerjedi666/status/2045138540858925443",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-17",
      title:
        "Trail of Bits: Beating Google’s zero-knowledge proof of quantum cryptanalysis",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "what-the-hell-is-quantum",
      url: "https://x.com/hackerjedi666/status/2043679383756636217",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-13",
      title:
        "What the hell is Quantum Safe Bitcoin (QSB)?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "but-how-exactly-does-uniswap",
      url: "https://x.com/hackerjedi666/status/2043709130679165281",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-13",
      title:
        "But How Exactly does UniSwap work?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "return-oriented-programming-rop-anatomy",
      url: "https://x.com/hackerjedi666/status/2041158343444791451",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-06",
      title:
        "Return-Oriented Programming (ROP) Anatomy",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "opsec-guide-respective-to-drift",
      url: "https://x.com/hackerjedi666/status/2041216947132719126",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-06",
      title:
        "OPSEC Guide (Respective To Drift protocol incident)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "phrack-cool-issues-part1-quantum",
      url: "https://x.com/hackerjedi666/status/2040758415417557409",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-05",
      title:
        "Phrack Cool issues part1: Quantum ROP",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "cool-attacks-drift-protocol",
      url: "https://x.com/hackerjedi666/status/2040767123317039489",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-05",
      title:
        "Cool attacks -> Drift protocol Incident on April 1st",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "hacking-zero-knowledge-protocol-cuz-why",
      url: "https://x.com/hackerjedi666/status/2040021525580128729",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-03",
      title:
        "Hacking Zero-Knowledge protocol cuz why not",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "is-npm-cooked-anyone-confirmed",
      url: "https://x.com/hackerjedi666/status/2040182265356091399",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-03",
      title:
        "Is npm cooked? Anyone confirmed? (npm axios attack)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "web-3-part-3-tornado",
      url: "https://x.com/hackerjedi666/status/2039737338423857200",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-02",
      title:
        "Web 3 part 3: Tornado Cash (Zero knowledge Proofs intro...)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "learning-zero-knowledge-proofs-makes",
      url: "https://x.com/hackerjedi666/status/2039747342908408309",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-04-02",
      title:
        "Learning Zero Knowledge Proofs makes me feel smart so you learn it too",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "web3-series-part-2-tokenization",
      url: "https://x.com/hackerjedi666/status/2035048897807360433",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-03-20",
      title:
        "Web3 series part 2: Tokenization of Real-World Assets (RWAs)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "lets-talk-about-micropayments",
      url: "https://x.com/hackerjedi666/status/2035087702111236191",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-03-20",
      title:
        "Let's talk about MicroPayments",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "quantum-series-part-3-quantum",
      url: "https://x.com/hackerjedi666/status/2034201219401478247",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-03-18",
      title:
        "Quantum series part 3: Quantum Networking and How it will look like in the future",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "you-know-web-scraping-but",
      url: "https://x.com/hackerjedi666/status/2033785379699232887",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-03-17",
      title:
        "You know web scraping, but do you know Darkweb scraping?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "web3-security-series-part1-erc-4337",
      url: "https://x.com/hackerjedi666/status/2031743206174666920",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-03-11",
      title:
        "Web3 Security Series part1: ERC-4337",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "malware-analysis-part-1-jvm",
      url: "https://x.com/hackerjedi666/status/2027303969270464703",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-02-27",
      title:
        "Malware Analysis part 1: JVM Reverse Engineering",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "breaking-sandboxes-in-mcp-agents",
      url: "https://x.com/hackerjedi666/status/2021548591060529291",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-02-11",
      title:
        "Breaking Sandboxes In MCP agents",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "threat-modeling-mcp-ai-agents",
      url: "https://x.com/hackerjedi666/status/2020822494274629986",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-02-09",
      title:
        "Threat modeling MCP + AI agents",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "what-the-hell-is-mcp",
      url: "https://x.com/hackerjedi666/status/2016615195729396216",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-01-28",
      title:
        "What the hell is MCP (Model Context Protocol) anyway?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "theories-theories-and-wait-for",
      url: "https://x.com/hackerjedi666/status/2013672558038859897",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-01-20",
      title:
        "Theories, Theories and wait for it... THEORIES",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "how-the-hell-does-tees-amd",
      url: "https://x.com/hackerjedi666/status/2012640213747798034",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-01-17",
      title:
        "How the hell does TEEs work? (AMD version)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "how-the-hell-does-tees-intel",
      url: "https://x.com/hackerjedi666/status/2010975170157297829",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2026-01-13",
      title:
        "How the hell does TEEs work with respect to different architectures?(INTEL version)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "how-the-hell-does-tees-exactly",
      url: "https://x.com/hackerjedi666/status/2005945974821363801",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-12-30",
      title:
        "How the hell does TEEs work exactly?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "cool-attacks-part-1-what",
      url: "https://x.com/hackerjedi666/status/1997564624980644328",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-12-07",
      title:
        "Cool attacks part 1: What the hell are Side Channel Attacks ?>",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "cool-exploits-part-1-react2shell",
      url: "https://x.com/hackerjedi666/status/1997732531215700013",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-12-07",
      title:
        "Cool exploits part 1: React2Shell",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "quantum-series-part-2-what",
      url: "https://x.com/hackerjedi666/status/1995892659668574514",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-12-02",
      title:
        "Quantum series part 2: What the hell is Quantum Cryptography !?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "what-the-hell-is-wasm",
      url: "https://x.com/hackerjedi666/status/1995385765371756617",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-12-01",
      title:
        "What the hell is WASM!?",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "quantum-computing-in-simple-terms",
      url: "https://x.com/hackerjedi666/status/1993723141924040953",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-11-26",
      title:
        "Quantum Computing in simple terms (just kidding)",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "wiretap-why-this-physical-attack",
      url: "https://x.com/hackerjedi666/status/1992148715084321202",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-11-22",
      title:
        "WireTap: Why This Physical Attack Doesn't Break TEEs – And How They're Getting Even Better",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
    {
      id: "teedotfail-panic",
      url: "https://x.com/hackerjedi666/status/1990891573257925109",
      // Snowflake-derived (UTC); owner: confirm if local publish date differs.
      date: "2025-11-18",
      title:
        "Debunking the TeeDotFail Panic: Why TEEs Are Still Viable for Secure Computing",
      // PLACEHOLDER — gated by isPlaceholder(); never reaches DOM.
      blurb: "TODO: confirm",
    },
  ] satisfies Article[],
} as const;

export type PortfolioData = typeof PORTFOLIO_DATA;
