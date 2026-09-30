import { cn } from "@/lib/utils";

/**
 * Letters that thicken under the pointer, and nudge their neighbours.
 *
 * MagicUI's `kinetic-text`, which is one of the few registry components with
 * genuinely zero dependencies — the whole effect is CSS. Kept almost intact.
 * Two changes:
 *
 *   - Weights retuned from 300/400/600/900 to 400/500/600/700, which is what
 *     Space Grotesk actually ships. The original range would have snapped to
 *     the nearest available weight and lost most of the gradient.
 *   - A real `sr-only` copy of the string carries the accessible text, since
 *     every visible letter is `aria-hidden`.
 *
 * The upstream `will-change: font-weight, padding` is dropped. Neither is a
 * compositable property, so the hint cannot help — it just asks for a layer
 * per character, and this renders one span per letter of an email address.
 *
 * The neighbour selectors are the good part: `has-[+span:hover]` thickens the
 * letter BEFORE the hovered one and `[:hover+&]` the one after, so the
 * pointer pushes a small wave through the word instead of lighting one glyph.
 */
export function KineticLetters({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap font-[400]", className)}>
      {[...text].map((letter, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="[-webkit-text-stroke-color:transparent] [-webkit-text-stroke-width:calc(1em*125/6000)] [transition:font-weight_0.4s,-webkit-text-stroke-color_0.4s,padding_0.4s] hover:[padding-inline:calc(1em/12)] hover:font-[700] hover:[-webkit-text-stroke-color:currentcolor] hover:[-webkit-text-stroke-width:calc(1em*250/6000)] has-[+span:hover]:[padding-inline:calc(1em/24)] has-[+span:hover]:font-[600] has-[+span+span:hover]:font-[500] [:hover+&]:[padding-inline:calc(1em/24)] [:hover+&]:font-[600] [:hover+span+&]:font-[500]"
        >
          {letter === " " ? " " : letter}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
}
