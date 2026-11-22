"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, PenLine } from "lucide-react";
import type { Memory } from "@/lib/data/memories";
import type { Author, Category } from "@/lib/data/context";
import { categoryLabel, fmt, formatDate, plural } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { BRAND, SLOGAN } from "@/lib/brand";
import { AuthorMark } from "@/components/memory/author-mark";
import { FavoriteButton } from "@/components/memory/favorite-button";
import { Ornament } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type Side = "left" | "right" | "single";

/** Where the 2nd and 3rd photos peek out from under the cover photo (offset + tilt). */
const STACK = [
  { "--x": "13%", "--y": "-6%", "--r": "8.5deg" },
  { "--x": "-12%", "--y": "3%", "--r": "-7deg" },
] as unknown as React.CSSProperties[];

/** The paper itself: texture, inner gutter shading and the page number. */
export function Paper({
  side,
  number,
  children,
  className,
}: {
  side: Side;
  number?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "book-paper relative size-full overflow-hidden bg-card [container-type:size]",
        side === "left" && "rounded-l-[3px]",
        side === "right" && "rounded-r-[3px]",
        side === "single" && "rounded-r-[3px] rounded-l-[2px]",
        className,
      )}
    >
      {/* gutter shading: darker towards the spine */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 w-[14%]",
          side === "left" && "right-0 bg-gradient-to-l from-[#40342f]/[0.13] via-[#40342f]/[0.04] to-transparent",
          (side === "right" || side === "single") &&
            "left-0 bg-gradient-to-r from-[#40342f]/[0.13] via-[#40342f]/[0.04] to-transparent",
        )}
      />
      <div className="relative flex size-full flex-col px-[8cqw] pt-[7cqh] pb-[5.5cqh]">
        {children}
        {number !== undefined && (
          <span
            aria-hidden
            className={cn(
              "absolute bottom-[2.6cqh] font-display text-[clamp(0.75rem,3.2cqw,0.95rem)] text-ink-soft tabular-nums lining-nums",
              side === "left" ? "left-[8cqw]" : "right-[8cqw]",
            )}
          >
            {number}
          </span>
        )}
      </div>
    </div>
  );
}

export function MemoryPage({
  memory,
  side,
  number,
  meId,
  authors,
  categories,
  onOpenPhoto,
  interactive = true,
}: {
  memory: Memory;
  side: Side;
  number: number;
  meId: string;
  authors: Author[];
  categories: Category[];
  onOpenPhoto?: (i: number) => void;
  /** Faces drawn on a turning leaf are not interactive (they are aria-hidden copies). */
  interactive?: boolean;
}) {
  const { t, locale } = useI18n();
  const category = categories.find((c) => c.id === memory.categoryId);
  const author = authors.find((a) => a.id === memory.authorId) ?? null;
  const favorite = memory.favoritedBy.includes(meId);
  const storyRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  // Long stories are clipped with a fade (measured before paint so a fresh leaf face is right).
  useLayoutEffect(() => {
    const el = storyRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [memory.story]);

  const photo = memory.photos[0];
  // A quote-only page gets the quote set larger, as a printed book sets a short poem.
  const sparse = !memory.story && !photo;

  return (
    <Paper side={side} number={number}>
      {/* bookmark ribbon = favourite */}
      <div className="absolute top-0 right-[7cqw] z-10">
        {interactive ? (
          <FavoriteButton memoryId={memory.id} initial={favorite} variant="ribbon" />
        ) : (
          <RibbonStatic on={favorite} />
        )}
      </div>

      <p className="eyebrow pr-[10cqw] text-[clamp(0.7rem,2.6cqw,0.74rem)]">
        <time dateTime={memory.occurredOn} className="whitespace-nowrap">
          {formatDate(locale, memory.occurredOn)}
        </time>
        {category && (
          <>
            <span aria-hidden className="mx-1.5 text-ink-soft/60">
              ·
            </span>
            {categoryLabel(t, category)}
          </>
        )}
      </p>

      <h2 className="mt-[2.2cqh] pr-[8cqw] font-display text-[clamp(1.35rem,7.4cqw,2.35rem)] leading-[1.05] font-medium text-balance text-ink">
        {memory.title}
      </h2>

      <blockquote
        className={cn(
          "quote relative mt-[3cqh] border-l border-wine/35 pl-[4.5cqw] leading-[1.28]",
          sparse ? "mt-[6cqh] text-[clamp(1.3rem,7.6cqw,2.3rem)] leading-[1.2]" : "text-[clamp(1.05rem,5.4cqw,1.6rem)]",
        )}
      >
        <p className={cn("whitespace-pre-line", sparse ? "line-clamp-[9]" : "line-clamp-5")}>{memory.quote}</p>
      </blockquote>

      {photo && (
        <figure className="mt-[5cqh] flex min-h-0 shrink justify-center">
          <button
            type="button"
            tabIndex={interactive ? 0 : -1}
            onClick={() => onOpenPhoto?.(0)}
            aria-label={
              memory.photos.length > 1
                ? `${t.reader.openPhoto} (${fmt(t.reader.photoOf, { n: 1, total: memory.photos.length })})`
                : t.reader.openPhoto
            }
            className="group relative isolate max-h-[30cqh] cursor-zoom-in"
          >
            {/* the next photos peek out from under the cover photo, each at its own angle */}
            {memory.photos.slice(1, 3).map((ph, j) => (
              <span
                key={ph.path}
                aria-hidden
                style={STACK[j]}
                className="polaroid absolute inset-0 -z-10 p-[1.6cqw] pb-[2.6cqw] shadow-[0_5px_14px_-8px_rgba(30,22,18,0.5)] transition-transform duration-500 ease-page [transform:translate(var(--x),var(--y))_rotate(var(--r))] group-hover:[transform:translate(calc(var(--x)*1.45),var(--y))_rotate(calc(var(--r)*1.4))]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, resized on upload */}
                <img src={ph.url} alt="" decoding="async" className="block size-full object-cover" />
              </span>
            ))}
            <span className="taped-photo polaroid relative block rotate-[-1.2deg] p-[1.6cqw] pb-[2.6cqw] shadow-[0_6px_18px_-8px_rgba(30,22,18,0.5)] transition-transform duration-300 ease-page group-hover:rotate-0 group-hover:scale-[1.015]">
              {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, resized on upload */}
              <img
                src={photo.url}
                alt={fmt(t.reader.photoAlt, { title: memory.title })}
                decoding="async"
                className="block max-h-[calc(30cqh-4cqw)] w-auto max-w-full object-cover"
              />
              {memory.photos.length > 1 && (
                <span className="absolute -right-2 -bottom-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-wine px-1.5 text-[0.72rem] font-semibold text-primary-foreground tabular-nums shadow-sm">
                  +{memory.photos.length - 1}
                </span>
              )}
            </span>
          </button>
        </figure>
      )}

      {memory.story ? (
        <div className="mt-[3cqh] flex min-h-0 flex-1 flex-col">
          <div
            ref={storyRef}
            className={cn(
              "min-h-0 max-w-[34em] flex-1 overflow-hidden text-[clamp(0.8rem,3.5cqw,0.98rem)] leading-[1.7] whitespace-pre-line text-ink/90",
              // fade the words themselves (no overlay box over the paper texture)
              overflows && "[mask-image:linear-gradient(to_bottom,black_65%,transparent)]",
            )}
          >
            {memory.story}
          </div>
          <ReadMore id={memory.id} label={overflows ? t.reader.readMore : t.reader.openPage} interactive={interactive} />
        </div>
      ) : (
        <div className="flex flex-1 items-end justify-end">
          <ReadMore id={memory.id} label={t.reader.openPage} interactive={interactive} />
        </div>
      )}

      <footer className="mt-[2cqh] min-w-0 pb-[2.4cqh]">
        {memory.tags.length > 0 && (
          <p className="mb-1.5 truncate text-[clamp(0.65rem,2.8cqw,0.78rem)] text-wine/90">
            {memory.tags
              .slice(0, 4)
              .map((tag) => `#${tag.name}`)
              .join("  ")}
          </p>
        )}
        <p className="flex items-center gap-2 text-[clamp(0.68rem,2.9cqw,0.8rem)] text-ink-soft">
          {author && <AuthorMark name={author.name} order={author.order} className="size-5 text-[0.8rem]" />}
          <span className="truncate">{fmt(t.memory.writtenBy, { name: author?.name ?? t.memory.unknownAuthor })}</span>
        </p>
      </footer>
    </Paper>
  );
}

/** Link to the full page (story, all photos, edit, delete). The leaf copy renders the same box, inert. */
function ReadMore({ id, label, interactive }: { id: string; label: string; interactive: boolean }) {
  const className =
    "-mb-1 inline-flex min-h-11 shrink-0 items-center gap-1 self-end text-[clamp(0.7rem,3cqw,0.82rem)] font-semibold text-wine underline-offset-4 hover:underline";
  const content = (
    <>
      {label}
      <ArrowRight className="size-3.5" aria-hidden />
    </>
  );
  if (!interactive) return <span className={className}>{content}</span>;
  return (
    <Link href={`/m/${id}`} className={className}>
      {content}
    </Link>
  );
}

/** Non-interactive twin of the ribbon button (same 44×64 box), used on the turning leaf. */
function RibbonStatic({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="relative flex h-16 w-11 justify-center">
      {on ? (
        <span className="ribbon block h-14 w-5 bg-wine" />
      ) : (
        <Bookmark className="mt-2.5 size-[1.15rem] text-ink-soft" strokeWidth={1.6} />
      )}
    </span>
  );
}

/** First page inside the cover: whose book this is. */
export function TitlePage({
  side,
  bookName,
  authors,
  togetherSince,
  count,
}: {
  side: Side;
  bookName: string;
  authors: Author[];
  togetherSince: string | null;
  count: number;
}) {
  const { t, locale } = useI18n();
  return (
    <Paper side={side}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="eyebrow text-[clamp(0.7rem,2.6cqw,0.74rem)]">{t.reader.titlePage}</p>
        <p className="mt-[3cqh] font-display text-[clamp(1.6rem,9cqw,2.9rem)] leading-[1.05] font-medium text-balance italic">
          {authors.map((a) => a.name).join(" & ")}
        </p>
        <Ornament className="mt-[4cqh] w-[34cqw]" />
        <p className="mt-[4cqh] font-display text-[clamp(1rem,5cqw,1.45rem)] text-ink">{bookName}</p>
        {togetherSince && (
          <p className="mt-[1cqh] text-[clamp(0.72rem,3.1cqw,0.85rem)] text-ink-soft">
            {fmt(t.home.stats.since, { date: formatDate(locale, togetherSince) })}
          </p>
        )}
        <p className="mt-[6cqh] text-[clamp(0.7rem,3cqw,0.82rem)] text-ink-soft">{plural(locale, t.reader.count, count)}</p>
      </div>
      <p className="pb-[1cqh] text-center font-display text-[clamp(0.85rem,3.8cqw,1.05rem)] text-wine italic">
        {BRAND} · {SLOGAN}
      </p>
    </Paper>
  );
}

/** After the last memory: an invitation to keep writing. */
export function EndPage({
  side,
  number,
  empty,
  interactive = true,
}: {
  side: Side;
  number?: number;
  empty?: boolean;
  interactive?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Paper side={side} number={number}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Ornament className="w-[30cqw]" />
        <p className="mt-[4cqh] font-display text-[clamp(1.3rem,6.6cqw,2.1rem)] leading-tight font-medium text-balance italic">
          {empty ? t.reader.emptyTitle : t.reader.nextWaiting}
        </p>
        {empty && <p className="mt-[2cqh] max-w-[30ch] text-[clamp(0.78rem,3.3cqw,0.92rem)] text-ink-soft">{t.reader.emptyBody}</p>}
        <Link
          href="/new"
          tabIndex={interactive ? undefined : -1}
          className="mt-[5cqh] inline-flex min-h-11 items-center gap-2 rounded-sm bg-wine px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_12%)]"
        >
          <PenLine className="size-4" aria-hidden />
          {t.reader.writeNext}
        </Link>
      </div>
    </Paper>
  );
}

/** Reverse side of a leaf in single-page mode: just paper. */
export function BlankPage({ side }: { side: Side }) {
  return <Paper side={side} className="[--page-top:var(--page-blank)] [--page-bottom:var(--page-blank)]" />;
}
