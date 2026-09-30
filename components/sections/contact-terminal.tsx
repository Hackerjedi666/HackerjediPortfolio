"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A contact form wearing a terminal.
 *
 * One question at a time, Enter to advance — which is the whole reason to do
 * it this way. A three-field form asks for everything up front and reads as
 * paperwork; a prompt asks for one thing, and answering it is a smaller
 * decision than filling in a form.
 *
 * IT IS STILL A FORM. Real `<input>`, real `<label>` (visually hidden, not
 * absent), `type="email"` so a phone shows the right keyboard, and a real
 * `<form>` with onSubmit so Enter and Go both work. The terminal is the
 * costume; none of the accessibility is costume.
 *
 * `aria-live` on the transcript means a screen reader hears each answer
 * accepted and each error, which a purely visual prompt would not announce.
 */

type Step = "name" | "email" | "message";
type Status = "idle" | "sending" | "sent" | "fallback" | "error";

const PROMPTS: Record<Step, { ask: string; placeholder: string }> = {
  name: { ask: "What should I call you?", placeholder: "your name" },
  email: { ask: "Where do I reply?", placeholder: "you@company.com" },
  message: {
    ask: "What do you want to talk about?",
    placeholder: "red team, appsec, a second opinion…",
  },
};

const ORDER: Step[] = ["name", "email", "message"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactTerminal() {
  const [step, setStep] = useState<Step>("name");
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Focus follows the prompt, so answering three questions never needs the
  // mouse. Also scrolls the transcript as it grows.
  useEffect(() => {
    inputRef.current?.focus();
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [step, status]);

  const send = async (payload: typeof values) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("sent");
        return;
      }
      const data = await res.json().catch(() => ({}));
      // The relay is not configured on this deployment. Rather than pretend
      // the message was delivered, hand it to the visitor's own mail client
      // with everything already filled in.
      if (res.status === 501 || data?.configured === false) {
        setStatus("fallback");
        const subject = encodeURIComponent(`Portfolio enquiry from ${payload.name}`);
        const body = encodeURIComponent(
          `Name:  ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`
        );
        window.location.href = `mailto:abhimanyu.gupta@overwatchlabs.ai?subject=${subject}&body=${body}`;
        return;
      }
      setError(typeof data?.error === "string" ? data.error : "Send failed.");
      setStatus("error");
    } catch {
      setError("Network error. Try again, or mail me directly.");
      setStatus("error");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = draft.trim();

    if (!value) {
      setError("That one is required.");
      return;
    }
    if (step === "email" && !EMAIL.test(value)) {
      setError("That does not look like an email address.");
      return;
    }

    setError(null);
    const next = { ...values, [step]: value };
    setValues(next);
    setDraft("");

    const i = ORDER.indexOf(step);
    if (i < ORDER.length - 1) {
      setStep(ORDER[i + 1]);
      return;
    }
    void send(next);
  };

  const answered = ORDER.slice(0, ORDER.indexOf(step));
  const done = status === "sent" || status === "fallback";

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative overflow-hidden rounded-cell border border-line-hi bg-pit shadow-pit"
    >
      <div className="flex items-center gap-2 border-b border-hairline bg-panel px-4 py-3">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-pill bg-cell-hi" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-pill bg-cell-hi" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-pill bg-acid" />
        <span className="ml-2.5 text-label text-ink-label">
          contact@overwatchlabs.ai
        </span>
      </div>

      <div
        ref={bodyRef}
        className="h-[clamp(260px,52dvh,420px)] overflow-y-auto p-5 font-mono text-sm"
      >
        <p className="text-ink-dim">
          Say hello. Three questions, then it goes straight to my inbox.
        </p>
        <p className="mt-1 text-ink-dim">
          ────────────────────────────────────────
        </p>

        <div aria-live="polite" aria-atomic="false" className="mt-4 grid gap-4">
          {answered.map((s) => (
            <div key={s}>
              <p className="text-ink-body">{PROMPTS[s].ask}</p>
              <p className="mt-1 flex items-start gap-2">
                <span aria-hidden="true" className="text-acid">
                  ➜
                </span>
                <span className="whitespace-pre-wrap break-words text-ink">
                  {values[s]}
                </span>
              </p>
            </div>
          ))}

          {!done ? (
            <div>
              <p className="text-ink-body">{PROMPTS[step].ask}</p>
              {/* noValidate: `type="email"` is kept for the mobile keyboard,
                  but its native constraint check would block submit BEFORE
                  onSubmit runs — so the visitor got a browser bubble and the
                  in-terminal error never appeared. Validation is ours; the
                  input type is only a keyboard hint. */}
              <form noValidate onSubmit={submit} className="mt-1 flex items-center gap-2">
                <span aria-hidden="true" className="text-acid">
                  ➜
                </span>
                <label htmlFor="ct-input" className="sr-only">
                  {PROMPTS[step].ask}
                </label>
                <input
                  id="ct-input"
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (error) setError(null);
                  }}
                  type={step === "email" ? "email" : "text"}
                  inputMode={step === "email" ? "email" : "text"}
                  autoComplete={
                    step === "email" ? "email" : step === "name" ? "name" : "off"
                  }
                  placeholder={PROMPTS[step].placeholder}
                  disabled={status === "sending"}
                  aria-invalid={!!error}
                  aria-describedby={error ? "ct-error" : undefined}
                  spellCheck={step === "message"}
                  className="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm text-ink caret-acid outline-none placeholder:text-ink-dim disabled:opacity-50"
                />
                <button type="submit" className="sr-only">
                  Submit answer
                </button>
              </form>
              {error ? (
                <p id="ct-error" role="alert" className="mt-2 text-chip text-acid">
                  {error}
                </p>
              ) : null}
              <p className="mt-2 text-label text-ink-dim">
                Enter to continue · {ORDER.indexOf(step) + 1} of {ORDER.length}
              </p>
            </div>
          ) : null}

          {status === "sending" ? (
            <p className="text-ink-body">Sending…</p>
          ) : null}

          {status === "sent" ? (
            <div>
              <p className="text-acid">Sent. I read everything that lands here.</p>
              <p className="mt-1 text-ink-dim">
                You will get a reply at {values.email}.
              </p>
            </div>
          ) : null}

          {status === "fallback" ? (
            <div>
              <p className="text-acid">Opening your mail client…</p>
              <p className="mt-1 text-ink-dim">
                The relay is not configured on this deployment, so the message
                is prefilled in your own client rather than quietly dropped.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
