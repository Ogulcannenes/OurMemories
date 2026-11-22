import Link from "next/link";
import { Bookmark } from "lucide-react";
import { categoryLabel, formatDate, type Dictionary, type Locale } from "@/lib/i18n";
import type { Memory } from "@/lib/data/memories";
import type { Author, Category } from "@/lib/data/context";
import { AuthorMark } from "./author-mark";
import { cn } from "@/lib/utils";

export type CardContext = {
  t: Dictionary;
  locale: Locale;
  meId: string;
  authors: Author[];
  categories: Category[];
};

export function memoryMeta(memory: Memory, ctx: CardContext) {
  const category = ctx.categories.find((c) => c.id === memory.categoryId);
  const author = ctx.authors.find((a) => a.id === memory.authorId) ?? null;
  return {
    category: category ? categoryLabel(ctx.t, category) : null,
    author,
    isFavorite: memory.favoritedBy.includes(ctx.meId),
    date: formatDate(ctx.locale, memory.occurredOn),
  };
}

/** A journal page in miniature: date, the quote in display italics, title, who wrote it down. */
export function MemoryCard({ memory, ctx, className }: { memory: Memory; ctx: CardContext; className?: string }) {
  const meta = memoryMeta(memory, ctx);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm border border-rule bg-card transition-[border-color,transform] duration-300 ease-page",
        "hover:-translate-y-0.5 hover:border-ink/25 focus-within:border-ink/30",
        className,
      )}
    >
      {memory.photos[0] && (
        <div className="relative aspect-[3/2] overflow-hidden border-b border-rule bg-paper-deep">
          {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, already resized on upload */}
          <img
            src={memory.photos[0].url}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-page group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow min-w-0">
            <time dateTime={memory.occurredOn}>{meta.date}</time>
            {meta.category && (
              <>
                <span aria-hidden className="mx-1.5 text-rule">
                  ·
                </span>
                {meta.category}
              </>
            )}
          </p>
          {meta.isFavorite && (
            <Bookmark className="size-3.5 shrink-0 fill-wine text-wine" aria-label={ctx.t.memory.unfavorite} />
          )}
        </div>

        <blockquote className="quote relative mt-4 line-clamp-6 text-[1.45rem] leading-[1.28] sm:text-[1.6rem]">
          <span aria-hidden className="absolute -left-[0.42em] text-wine/70 select-none">
            “
          </span>
          {memory.quote}
        </blockquote>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <h3 className="min-w-0 font-display text-[1.15rem] leading-snug font-medium text-ink">
            <Link
              href={`/book?m=${memory.id}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {memory.title}
            </Link>
          </h3>
          {meta.author && (
            <AuthorMark name={meta.author.name} order={meta.author.order} className="mb-px" />
          )}
        </div>
      </div>
    </article>
  );
}
