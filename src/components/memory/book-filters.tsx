"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Search, category chips, order and date range — all kept in the URL so views are shareable and back-button friendly. */
export function BookFilters({
  categories,
  activeTag,
}: {
  categories: { id: string; label: string }[];
  activeTag: { id: string; name: string } | null;
}) {
  const { t } = useI18n();
  const uid = useId();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [showDates, setShowDates] = useState(Boolean(params.get("from") || params.get("to")));
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("limit"); // a new query starts from the first page
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  useEffect(() => () => clearTimeout(debounce.current), []);

  const onSearch = (value: string) => {
    setQ(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: value.trim() || null }), 300);
  };

  const category = params.get("category") ?? "";
  const sort = params.get("sort") === "oldest" ? "oldest" : "newest";
  const hasFilters = Boolean(params.get("q") || category || params.get("tag") || params.get("from") || params.get("to"));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor={`${uid}-q`} className="sr-only">
            {t.book.searchLabel}
          </label>
          {pending ? (
            <Loader2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin text-ink-soft" aria-hidden />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          )}
          <input
            id={`${uid}-q`}
            type="search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t.book.searchPlaceholder}
            enterKeyHint="search"
            className="field h-11 pl-10"
          />
        </div>
        <label htmlFor={`${uid}-sort`} className="sr-only">
          {t.book.sort}
        </label>
        <select
          id={`${uid}-sort`}
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "oldest" ? "oldest" : null })}
          className="field h-11 w-auto cursor-pointer py-0 pr-8 text-sm"
        >
          <option value="newest">{t.book.newest}</option>
          <option value="oldest">{t.book.oldest}</option>
        </select>
        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          aria-expanded={showDates}
          aria-controls={`${uid}-dates`}
          aria-label={t.book.filters}
          title={t.book.filters}
          className={cn(
            "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors",
            showDates ? "border-wine bg-rose-wash text-wine" : "border-input text-ink-soft hover:text-ink",
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
        </button>
      </div>

      {showDates && (
        <div id={`${uid}-dates`} className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <label htmlFor={`${uid}-from`} className="eyebrow">
              {t.book.from}
            </label>
            <input
              id={`${uid}-from`}
              type="date"
              defaultValue={params.get("from") ?? ""}
              onChange={(e) => update({ from: e.target.value || null })}
              className="field mt-1.5 h-11 py-0"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-to`} className="eyebrow">
              {t.book.to}
            </label>
            <input
              id={`${uid}-to`}
              type="date"
              defaultValue={params.get("to") ?? ""}
              onChange={(e) => update({ to: e.target.value || null })}
              className="field mt-1.5 h-11 py-0"
            />
          </div>
        </div>
      )}

      {/* Category chips scroll sideways on phones instead of wrapping into a wall. */}
      <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap" role="group" aria-label={t.form.category}>
          {[{ id: "", label: t.book.allCategories }, ...categories].map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => update({ category: c.id || null })}
                className={cn(
                  "inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded-sm border px-3.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-button bg-button text-button-foreground"
                    : "border-input text-ink-soft hover:border-ink/40 hover:text-ink",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {(activeTag || hasFilters) && (
        <div className="flex flex-wrap items-center gap-2">
          {activeTag && (
            <button
              type="button"
              onClick={() => update({ tag: null })}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-sm bg-paper-deep px-3 text-[0.8125rem] text-ink"
            >
              #{activeTag.name}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">{t.book.clear}</span>
            </button>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                start(() => router.replace(pathname, { scroll: false }));
              }}
              className="min-h-9 cursor-pointer px-1 text-[0.8125rem] font-semibold text-wine underline-offset-4 hover:underline"
            >
              {t.book.clear}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
