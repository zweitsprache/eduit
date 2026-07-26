import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-xs", "display-sm", "display-md", "display-lg", "display-xl", "display-2xl"],
    },
  },
});

/**
 * Wrapper around tailwind-merge used to merge/override className strings
 * so later classes win over earlier conflicting ones.
 */
export const cx = twMerge;

/**
 * Identity helper that lets us keep Tailwind IntelliSense sorting on
 * nested style objects (mirrors Untitled UI's `sortCx`).
 */
export function sortCx<T extends Record<string, string | Record<string, string>>>(classes: T): T {
  return classes;
}
