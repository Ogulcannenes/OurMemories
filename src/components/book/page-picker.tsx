"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ListFilter, Search } from "lucide-react";
import type { Memory } from "@/lib/data/memories";
import { fmt, formatDate } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** "All pages": miniature pages with a quick filter; choosing one jumps there. */
export function PagePicker({
  open,
  onOpenChange,
  memories,
  currentNumbers,
  meId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memories: Memory[];
  /** Page numbers (1-based) currently visible, to highlight them. */
  currentNumbers: number[];
  meId: string;
  onPick: (pageNumber: number) => void;
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLocaleLowerCase(locale));
  const items = memories
    .map((m, i) => ({ m, n: i + 1 }))
    .filter(({ m }) => !query || `${m.title} ${m.quote} ${m.story ?? ""}`.toLocaleLowerCase(locale).includes(query));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" closeLabel={t.common.close} className="gap-0 bg-paper p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-rule px-5 pt-5 pb-4">
          <SheetTitle className="font-display text-2xl font-medium">{t.reader.pages}</SheetTitle>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.reader.findPage}
              aria-label={t.reader.findPage}
              className="field h-11 pl-10"
            />
          </div>
          <Link
            href="/book/contents"
            className="mt-2 inline-flex min-h-10 items-center gap-2 self-start text-sm font-semibold text-wine underline-offset-4 hover:underline"
          >
            <ListFilter className="size-4" aria-hidden />
            {t.reader.contents}
          </Link>
        </SheetHeader>

        <p role="status" className="sr-only">
          {fmt(t.reader.found, { n: items.length, total: memories.length })}
        </p>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <p className="py-10 text-center font-display text-lg text-ink-soft italic">{t.reader.noMatch}</p>
          ) : (
            <ol className="grid grid-cols-2 gap-3">
              {items.map(({ m, n }) => {
                const current = currentNumbers.includes(n);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onPick(n)}
                      aria-current={current ? "page" : undefined}
                      aria-label={`${fmt(t.reader.goTo, { n })}: ${m.title}`}
                      className={cn(
                        "book-paper group relative flex aspect-[0.72] w-full cursor-pointer flex-col overflow-hidden rounded-[2px] border p-3 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5",
                        current ? "border-wine ring-1 ring-wine" : "border-rule hover:border-ink/30",
                      )}
                    >
                      <span className="eyebrow text-[0.6rem]">{formatDate(locale, m.occurredOn, { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="mt-1.5 line-clamp-2 shrink-0 font-display text-[1.05rem] leading-tight font-medium">{m.title}</span>
                      <span className={cn("mt-1.5 shrink-0 font-display text-[0.85rem] leading-snug text-ink-soft italic", m.photos[0] ? "line-clamp-2" : "line-clamp-4")}>“{m.quote}”</span>
                      {m.photos[0] && (
                        // eslint-disable-next-line @next/next/no-img-element -- private signed URL
                        <img src={m.photos[0].url} alt="" loading="lazy" className="mt-2 mb-3 min-h-0 w-full flex-1 rounded-[1px] object-cover" />
                      )}
                      <span className="absolute right-2 bottom-1.5 font-display text-xs text-ink-soft tabular-nums lining-nums">{n}</span>
                      {m.favoritedBy.includes(meId) && <span aria-hidden className="ribbon absolute top-0 right-3 h-5 w-2.5 bg-wine" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
