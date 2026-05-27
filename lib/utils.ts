import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "TODO: confirm" is a truthy string, so truthiness alone can't gate it out
// of the rendered DOM. This treats any value that's empty or starts with
// "todo" (case-insensitive) as not-yet-real. Shared across sections so the
// gate is one definition, not several.
export const isPlaceholder = (value: string | undefined): boolean =>
  !value || value.trim().toLowerCase().startsWith("todo");
