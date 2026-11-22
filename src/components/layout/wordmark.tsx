import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** ADELYA set in spaced capitals of the display face — the brand's only logotype. */
export function Wordmark({ className }: { className?: string }) {
  return (
    // negative right margin cancels the tracking after the last letter, so it centres/aligns truly
    <span className={cn("font-display leading-none font-medium tracking-[0.3em] text-ink [margin-right:-0.3em]", className)}>
      {BRAND}
    </span>
  );
}
