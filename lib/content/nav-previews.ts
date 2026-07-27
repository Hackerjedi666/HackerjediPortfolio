/**
 * What each nav link reveals on hover.
 *
 * The HoverGrid effect wants three tiles per section at asymmetric grid
 * positions. Rather than invent decorative content for them, each tile is a
 * real fact already on the page — the numbers from `site.ts`, restated as a
 * preview. Hovering the nav becomes a way to read the site, not just a
 * flourish over it.
 *
 * `area` values are `row-start / col-start / row-end / col-end` on the 10×10
 * grid, carried over from the source pack's layouts so the compositions keep
 * their deliberate off-balance rhythm.
 */

export type PreviewTile = {
  eyebrow: string;
  value: string;
  note: string;
  /** Direction the clip-path wipe travels from. */
  dir: "left" | "right" | "top" | "bottom";
  area: string;
};

export type NavPreview = {
  /** Matches the nav link's target hash without the "#". */
  id: string;
  title: string;
  tiles: PreviewTile[];
};

export const NAV_PREVIEWS: NavPreview[] = [
  {
    id: "ops",
    title: "Selected ops",
    tiles: [
      {
        eyebrow: "2024 // NBFC",
        value: "Full AD compromise",
        note: "CUSTOM EDR BYPASS",
        dir: "right",
        area: "1 / 1 / 5 / 5",
      },
      {
        eyebrow: "2023 // INSURER",
        value: "85% of endpoints under C2",
        note: "PHISHING + AV EVASION",
        dir: "left",
        area: "5 / 8 / 10 / 11",
      },
      {
        eyebrow: "2023 // STATE GOV",
        value: "80+ apps & APKs",
        note: "SOURCE DISCLOSURE · PII",
        dir: "top",
        area: "8 / 3 / 11 / 5",
      },
    ],
  },
  {
    id: "anatomy",
    title: "Anatomy",
    tiles: [
      {
        eyebrow: "STEP 02 // EVASION",
        value: "A beacon that survived a full working day",
        note: "FRESH SYSCALLS · SLEEP OBFUSCATION",
        dir: "bottom",
        area: "3 / 5 / 8 / 10",
      },
      {
        eyebrow: "STEP 03 // IDENTITY",
        value: "3 hops, 0 exploits",
        note: "WEAK DELEGATION PATH",
        dir: "left",
        area: "7 / 4 / 10 / 7",
      },
      {
        eyebrow: "STEP 05",
        value: "Blast radius, not findings",
        note: "WHAT MOVED THE BUDGET",
        dir: "right",
        area: "2 / 2 / 4 / 4",
      },
    ],
  },
  {
    id: "stack",
    title: "The stack",
    tiles: [
      {
        eyebrow: "01",
        value: "Red team & adversary simulation",
        note: "EDR EVASION · AD · PAYLOAD DEV",
        dir: "top",
        area: "8 / 2 / 11 / 5",
      },
      {
        eyebrow: "03",
        value: "TEE research & platform hardening",
        note: "ENCLAVES · SIDE CHANNELS",
        dir: "left",
        area: "2 / 8 / 8 / 11",
      },
      {
        eyebrow: "CERTIFIED",
        value: "OSCP · eCPPT · eJPT · CND",
        note: "COBALT STRIKE · BLOODHOUND · GHIDRA",
        dir: "right",
        area: "3 / 3 / 6 / 6",
      },
    ],
  },
  {
    id: "forensia",
    title: "Labs",
    tiles: [
      {
        eyebrow: "ACTIVE",
        value: "OverwatchLabs.ai",
        note: "OFFENSIVE SECURITY PRACTICE",
        dir: "bottom",
        area: "7 / 7 / 10 / 9",
      },
      {
        eyebrow: "LAUNCHING",
        value: "Forensia",
        note: "THREAT INTEL THAT DOESN'T DROWN YOU",
        dir: "right",
        area: "4 / 1 / 10 / 4",
      },
      {
        eyebrow: "SIGNAL",
        value: "Attack paths, not finding lists",
        note: "EXECUTIVE-READY RISK",
        dir: "top",
        area: "2 / 5 / 6 / 9",
      },
    ],
  },
  {
    id: "shell",
    title: "The shell",
    tiles: [
      {
        eyebrow: "INTERACTIVE",
        value: "A real shell, not a screenshot",
        note: "TYPE 'HELP' TO START",
        dir: "left",
        area: "3 / 8 / 8 / 11",
      },
      {
        eyebrow: "EASTER EGG",
        value: "↑ ↑ ↓ ↓ ← → ← → B A",
        note: "KONAMI STILL WORKS",
        dir: "bottom",
        area: "1 / 5 / 5 / 7",
      },
      {
        eyebrow: "HIDDEN",
        value: "There's a flag in here",
        note: "TRY sudo su · nmap · flag",
        dir: "right",
        area: "6 / 2 / 11 / 5",
      },
    ],
  },
  {
    id: "research",
    title: "Research",
    tiles: [
      {
        eyebrow: "38 POSTS",
        value: "TEEs, quantum, malware internals",
        note: "AND WEB3 SECURITY",
        dir: "right",
        area: "1 / 1 / 5 / 5",
      },
      {
        eyebrow: "CVE-2025-56459",
        value: "Stored XSS to RCE",
        note: "ELECTRON OPC UA CLIENT",
        dir: "left",
        area: "5 / 8 / 10 / 11",
      },
      {
        eyebrow: "LATEST",
        value: "Formal verification",
        note: "PROVING CODE WON'T BETRAY YOU",
        dir: "top",
        area: "8 / 3 / 11 / 5",
      },
    ],
  },
];
