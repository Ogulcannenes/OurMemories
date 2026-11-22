import { cn } from "@/lib/utils";

/** A small initial that tells the two authors apart (wine for the first, ink for the second). */
export function AuthorMark({
  name,
  order,
  className,
}: {
  name: string;
  order: 0 | 1 | null;
  className?: string;
}) {
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase() ?? "·";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full font-display text-[0.95rem] leading-none font-semibold",
        order === 0 && "bg-rose-wash text-wine",
        order === 1 && "bg-paper-deep text-ink",
        order === null && "bg-paper-deep text-ink-soft",
        className,
      )}
    >
      {initial}
    </span>
  );
}
