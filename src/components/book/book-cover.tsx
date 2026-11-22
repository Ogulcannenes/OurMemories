"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BRAND, SLOGAN } from "@/lib/brand";
import { useI18n } from "@/lib/i18n/client";

/** The closed book. Opening swings the cover on its spine, then hands over to the reader. */
export function BookCover({
  bookName,
  authorNames,
  onOpened,
}: {
  bookName: string;
  authorNames: string;
  onOpened: () => void;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [opening, setOpening] = useState(false);

  const open = () => {
    if (opening) return;
    if (reduce) onOpened();
    else setOpening(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[min(100%,24rem,calc((100dvh-15rem)*0.7))] [perspective:1800px]">
        {/* page block behind the cover */}
        <div aria-hidden className="book-paper book-block absolute inset-[3%_0_1%_2%] rounded-r-[3px]" />
        <motion.div
          initial={false}
          animate={opening ? { rotateY: -165, opacity: 0.2 } : { rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.95, ease: [0.645, 0.045, 0.355, 1] }}
          onAnimationComplete={() => opening && onOpened()}
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
          className="relative aspect-[0.7] rounded-[3px_6px_6px_3px] bg-book-cloth text-[#f8f5ef] shadow-[0_30px_50px_-24px_rgba(64,52,47,0.7),0_10px_18px_-10px_rgba(64,52,47,0.4)]"
        >
          {/* cloth weave + spine hinge */}
          <span aria-hidden className="cover-cloth absolute inset-0 rounded-[inherit]" />
          <span aria-hidden className="absolute inset-y-0 left-[5%] w-px bg-black/20 shadow-[1px_0_0_rgba(255,255,255,0.08)]" />
          {/* blind-embossed frame */}
          <span aria-hidden className="absolute inset-[7%_7%_7%_10%] rounded-[2px] border border-[#f8f5ef]/25" />
          <span aria-hidden className="absolute inset-[8.5%_8.5%_8.5%_11.5%] rounded-[1px] border border-[#f8f5ef]/12" />

          {/* three bands inside the embossed frame: line · title · names */}
          <div className="relative grid h-full grid-rows-[auto_1fr_auto] items-center px-[15%] pt-[15%] pr-[13%] pb-[13%] text-center [container-type:inline-size]">
            <p className="font-display text-[clamp(0.68rem,3.7cqw,0.85rem)] tracking-[0.2em] text-[#f8f5ef]/90 uppercase">
              {t.reader.coverLine}
            </p>
            <div className="flex flex-col items-center">
              <h1 className="font-display text-[clamp(2rem,14cqw,3.4rem)] leading-none font-medium tracking-[0.28em] text-[#f8f5ef] [text-shadow:0_1px_0_rgba(0,0,0,0.25)] [margin-right:-0.28em]">
                {BRAND}
              </h1>
              <span aria-hidden className="mt-[8cqw] h-px w-14 bg-[#e9d5d2]/60" />
              <p className="mt-[8cqw] font-display text-[clamp(1rem,5.6cqw,1.3rem)] text-[#f8f5ef]/90 italic">{SLOGAN}</p>
            </div>
            <div>
              <p className="font-display text-[clamp(0.95rem,5cqw,1.1rem)] text-[#e9d5d2]">{authorNames}</p>
              <p className="mt-1 text-[0.75rem] text-[#f8f5ef]/90">{bookName}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={open}
        aria-disabled={opening || undefined}
        className="mt-8 inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-sm bg-wine px-7 text-[0.9375rem] font-semibold text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_oklch,var(--primary),black_12%)] active:translate-y-px"
        autoFocus
      >
        <BookOpen className="size-[1.1rem]" aria-hidden />
        {t.reader.open}
      </button>
    </div>
  );
}
