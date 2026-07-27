/**
 * The shell's command registry. Pure data + pure functions — the terminal
 * component owns state and rendering, this owns what the machine says.
 */
import { PORTFOLIO_DATA } from "@/lib/content/portfolio-data";
import { EMAIL, SOCIALS, WALL_POSTS, POST_COUNT, FORENSIA_URL } from "@/lib/content/site";

export const BANNER: string[] = [
  "overwatchlabs shell v2.1 — abhimanyu gupta",
  "type 'help' for commands. type 'flag' if you think you're clever.",
  "",
];

export const PROMPT = "➜ ~";

/** Konami: ↑ ↑ ↓ ↓ ← → ← → B A */
export const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

export const ROOT_ON: string[] = [
  "",
  "*** ROOT MODE ENGAGED ***",
  "uid=0(root) gid=0(root) groups=0(root)",
  "you found it. the whole page is yours now.",
  "",
];

export const ROOT_OFF: string[] = ["", "dropping privileges... back to normal.", ""];

const cve = PORTFOLIO_DATA.publications[0];
const writeup = cve.writeupUrl ?? "";

/** Commands offered to tab-completion and listed by `help`. */
export const COMMANDS = [
  "help",
  "whoami",
  "ops",
  "skills",
  "forensia",
  "cve",
  "writing",
  "contact",
  "nmap",
  "sudo",
  "flag",
  "clear",
  "ls",
  "cat",
] as const;

/**
 * Run one line. Returns the output lines, or `null` to signal "clear the
 * screen" — the caller distinguishes null from an empty array.
 */
export function respond(raw: string): string[] | null {
  const cmd = raw.trim();
  if (!cmd) return [];

  const lower = cmd.toLowerCase();
  const verb = lower.split(/\s+/)[0];

  switch (verb) {
    case "help":
      return [
        "AVAILABLE COMMANDS",
        "",
        "  whoami       who I am",
        "  ops          selected engagements",
        "  skills       what I do",
        "  forensia     the product I'm building",
        "  cve          my published research",
        `  writing      ${POST_COUNT} posts and counting`,
        "  contact      how to reach me",
        "  nmap         scan me",
        "  sudo su      don't",
        "  flag         ???",
        "  clear        wipe the screen",
        "",
      ];

    case "whoami":
      return [
        "abhimanyu gupta / hackerjedi",
        "founder — overwatchlabs.ai",
        "4+ years offensive security: red team, appsec, TEE research",
        "OSCP · eCPPT · eJPT · CND",
        "currently: shipping Forensia",
        "",
      ];

    case "ops":
      return [
        "clients stay anonymous. the tradecraft doesn't.",
        "",
        "[2024] NBFC ................ full AD compromise past enterprise EDR",
        "[2023] financial insurer ... 85% of endpoints under C2 (phishing + AV evasion)",
        "[2023] state government .... 80+ web apps & APKs, source disclosure + PII + RCE",
        "[2022] healthcare/ent. ..... 30+ web apps & 20+ APIs audited end to end",
        `[2025] own research ........ ${cve.cve}, stored XSS to RCE (Electron OPC)`,
        "",
      ];

    case "skills":
      return [
        "red team & adversary simulation .... EDR evasion, AD, payload dev",
        "threat intel & surface mapping ..... discovery, attack paths",
        "TEE research & hardening ........... enclaves, side channels",
        "app & API security ................. authz, logic, IDOR, source review",
        "",
      ];

    case "forensia":
      return [
        "FORENSIA — threat intel that doesn't drown you.",
        "",
        "  continuous external discovery",
        "  attack paths, not finding lists",
        "  executive-ready risk signal",
        "",
        `try it: ${FORENSIA_URL}`,
        `early access: ${EMAIL}`,
        "",
      ];

    case "cve":
      return [
        cve.cve,
        "stored XSS -> RCE in an Electron-based OPC UA client.",
        "one unsanitised tag field in a privileged renderer = native code on an OT workstation.",
        `write-up: ${writeup}`,
        "",
      ];

    case "writing":
      return [
        `${POST_COUNT} posts. most recent five:`,
        "",
        ...WALL_POSTS.slice(0, 5).map((p) => `  ${p.date}  ${p.title}`),
        "",
        `all of it: ${SOCIALS.twitter}`,
        "",
      ];

    case "contact":
      return [
        `email    ${EMAIL}`,
        "x        @hackerjedi666",
        "github   github.com/Hackerjedi666",
        "linkedin /in/hackerjedi666",
        "",
      ];

    case "nmap":
      return [
        "Starting Nmap 7.95 ( https://nmap.org )",
        "Nmap scan report for abhimanyu (127.0.0.1)",
        "",
        "PORT     STATE  SERVICE",
        "22/tcp   open   ssh        (curiosity)",
        "443/tcp  open   https      (research)",
        "1337/tcp open   waste-time (declining)",
        "",
        "Host is up. 1 host scanned, 0 vulnerabilities disclosed publicly. yet.",
        "",
      ];

    case "sudo":
      return [
        "nice try. you're not on the sudoers list — this incident has been reported.",
        "(hint: the konami code is a better idea)",
        "",
      ];

    case "flag":
      return [
        "flag{y0u_r34d_th3_wh0l3_p4g3}",
        "",
        "if you actually got here, email me the flag. I'll reply.",
        "",
      ];

    case "clear":
      return null;

    case "ls":
      return ["ops/  research/  forensia/  .secrets", ""];

    case "cat":
      return [
        lower.includes("secret")
          ? "permission denied — but try 'flag'"
          : "cat: no such file or directory",
        "",
      ];

    default:
      return [`zsh: command not found: ${cmd}`, "type 'help'", ""];
  }
}
