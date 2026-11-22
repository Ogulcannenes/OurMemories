"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { setFavorite } from "@/lib/actions/memories";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Favourite = a bookmark. "icon" is a square button for toolbars;
 * "ribbon" hangs from the top edge of a book page when set, and is a fine bookmark outline when not.
 * Constant accessible name + aria-pressed (no "remove from favourites, pressed" double negative).
 */
export function FavoriteButton({
  memoryId,
  initial,
  variant = "icon",
}: {
  memoryId: string;
  initial: boolean;
  variant?: "icon" | "ribbon";
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(initial);
  const label = t.memory.favoriteToggle;

  const toggle = () => {
    if (pending) return; // aria-disabled, not disabled: keeps keyboard focus on the button
    const next = !on;
    start(async () => {
      setOn(next);
      try {
        await setFavorite(memoryId, next); // on failure the optimistic state simply falls back
      } catch {
        /* network / server error: keep the book usable, state reverts */
      }
    });
  };

  const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 focus-visible:ring-offset-card";

  if (variant === "ribbon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-disabled={pending || undefined}
        aria-label={label}
        title={label}
        className={cn("group relative flex h-16 w-11 cursor-pointer justify-center rounded-b-sm", focusRing)}
      >
        {on ? (
          <motion.span
            aria-hidden
            initial={reduce ? false : { height: 18 }}
            animate={{ height: 56 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18 }}
            className="ribbon block w-5 bg-wine shadow-[0_2px_4px_-2px_rgba(64,52,47,0.5)]"
          />
        ) : (
          <Bookmark
            aria-hidden
            strokeWidth={1.6}
            className="mt-2.5 size-[1.15rem] text-ink-soft transition-colors group-hover:text-wine"
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-disabled={pending || undefined}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-sm border transition-colors sm:size-10",
        on ? "border-wine/30 bg-rose-wash text-wine" : "border-input text-ink-soft hover:border-ink/40 hover:text-ink",
        focusRing,
      )}
    >
      <motion.span
        key={String(on)}
        initial={reduce ? false : { y: on ? -5 : 0, opacity: on ? 0.4 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="flex"
      >
        <Bookmark className={cn("size-[1.1rem]", on && "fill-wine")} aria-hidden />
      </motion.span>
    </button>
  );
}
