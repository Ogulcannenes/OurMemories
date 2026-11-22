"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Shuffle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { drawMemory } from "@/lib/actions/memories";
import type { Memory } from "@/lib/data/memories";
import type { Author, Category } from "@/lib/data/context";
import { formatRelative } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { AuthorMark } from "./author-mark";
import { memoryMeta } from "./memory-card";

/** "Remember this?" — an envelope that gives back a page from somewhere in the story. */
export function RememberThis({
  initial,
  meId,
  authors,
  categories,
}: {
  meId: string;
  /** A page drawn on the server, so the block is never empty on arrival. */
  initial?: Memory | null;
  authors: Author[];
  categories: Category[];
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [memory, setMemory] = useState<Memory | null>(initial ?? null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const draw = () =>
    start(async () => {
      setFailed(false);
      try {
        const next = await drawMemory(memory?.id);
        if (next) setMemory(next);
        else if (!memory) setFailed(true);
      } catch {
        setFailed(true);
      }
    });

  const meta = memory ? memoryMeta(memory, { t, locale, meId, authors, categories }) : null;

  return (
    <section aria-labelledby="remember-title" className="relative">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="remember-title" className="font-display text-[2rem] leading-none font-medium text-ink italic sm:text-[2.5rem]">
            {t.home.remember.title}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">{t.home.remember.hint}</p>
        </div>
      </div>

      <div
        className="book-paper relative mt-6 min-h-[15rem] overflow-hidden rounded-[3px] shadow-[0_1px_0_var(--book-edge),0_18px_40px_-24px_rgba(64,52,47,0.4)]"
        aria-live="polite"
      >
        <AnimatePresence mode="wait" initial={false}>
          {!memory ? (
            <motion.div
              key="envelope"
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-[17rem] flex-col items-center justify-center gap-6 p-8 text-center"
            >
              <Envelope opening={pending} />
              {failed ? (
                <p className="max-w-xs text-sm text-ink-soft">{t.home.remember.empty}</p>
              ) : (
                <Button onClick={draw} disabled={pending} size="lg">
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Shuffle aria-hidden />}
                  {t.home.remember.draw}
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.article
              key={memory.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, rotate: -0.6 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, rotate: 0.5 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[17rem] flex-col p-6 sm:p-9"
            >
              <p className="eyebrow">
                <span className="text-wine">{formatRelative(locale, memory.occurredOn)}</span>
                <span aria-hidden className="mx-1.5 text-rule">
                  ·
                </span>
                <time dateTime={memory.occurredOn}>{meta!.date}</time>
                {meta!.category && (
                  <>
                    <span aria-hidden className="mx-1.5 text-rule">
                      ·
                    </span>
                    {meta!.category}
                  </>
                )}
              </p>

              <blockquote className="quote relative mt-5 text-[1.75rem] leading-[1.22] sm:text-[2.35rem]">
                <span aria-hidden className="absolute -left-[0.45em] text-wine/70 select-none">
                  “
                </span>
                {memory.quote}
              </blockquote>

              <div className="mt-5 flex items-center gap-2.5 text-sm text-ink-soft">
                {meta!.author && <AuthorMark name={meta!.author.name} order={meta!.author.order} />}
                <span className="font-semibold text-ink">{memory.title}</span>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={draw} disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Shuffle aria-hidden />}
                  {t.home.remember.another}
                </Button>
                <Link
                  href={`/book?m=${memory.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-wine underline-offset-4 hover:underline"
                >
                  {t.home.remember.open}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Envelope({ opening }: { opening: boolean }) {
  const reduce = useReducedMotion();
  return (
    <svg aria-hidden viewBox="0 0 120 84" className="h-20 w-28 text-wine" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="4" y="18" width="112" height="62" rx="2" className="fill-paper" />
      {/* the letter peeking out */}
      <motion.g animate={opening && !reduce ? { y: -10 } : { y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <rect x="16" y="10" width="88" height="44" rx="1" className="fill-card" stroke="var(--border)" />
        <path d="M28 24h64M28 32h52M28 40h40" stroke="var(--rose)" />
      </motion.g>
      <path d="M4 80 52 44a12 12 0 0 1 16 0l48 36" className="fill-paper" />
      <motion.path
        d="M4 18 60 54l56-36"
        className="fill-paper"
        style={{ transformOrigin: "60px 18px", transformBox: "view-box" }}
        animate={opening && !reduce ? { scaleY: -1 } : { scaleY: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
