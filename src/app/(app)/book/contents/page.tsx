import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getAppContext } from "@/lib/data/context";
import { isUuid, listMemories } from "@/lib/data/memories";
import { categoryLabel, plural } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { BookFilters } from "@/components/memory/book-filters";
import { Timeline } from "@/components/memory/timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

const PAGE = 30;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.contents.title };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ContentsPage({ searchParams }: PageProps<"/book/contents">) {
  const ctx = await getAppContext();
  const { t, locale, me, authors, categories } = ctx;
  const sp = await searchParams;

  const filters = {
    q: one(sp.q),
    category: one(sp.category),
    tag: one(sp.tag),
    from: one(sp.from),
    to: one(sp.to),
    sort: one(sp.sort) === "oldest" ? ("oldest" as const) : ("newest" as const),
    limit: Math.min(Number(one(sp.limit)) || PAGE, 300),
  };
  const filtered = Boolean(filters.q || filters.category || filters.tag || filters.from || filters.to);

  const [{ memories, total, limit }, tagRow] = await Promise.all([
    listMemories(ctx, filters),
    isUuid(filters.tag)
      ? ctx.supabase.from("tags").select("id, name").eq("id", filters.tag).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const more = new URLSearchParams();
  for (const k of ["q", "category", "tag", "from", "to"] as const) if (filters[k]) more.set(k, filters[k]!);
  if (filters.sort === "oldest") more.set("sort", "oldest");
  more.set("limit", String(limit + PAGE));

  return (
    <div className="page pt-8 sm:pt-12">
      <header className="mb-8 border-b border-rule pb-8">
        <h1 className="font-display text-[2.75rem] leading-none font-medium tracking-tight sm:text-[3.5rem]">
          {t.contents.title}
        </h1>
        <p className="mt-3 text-ink-soft">{t.contents.subtitle}</p>
        <Link
          href="/book"
          className="mt-4 -ml-2 inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-semibold text-wine underline-offset-4 hover:underline"
        >
          <BookOpen className="size-4" aria-hidden />
          {t.contents.backToBook}
        </Link>
      </header>

      <BookFilters
        categories={categories.map((c) => ({ id: c.id, label: categoryLabel(t, c) }))}
        activeTag={tagRow.data}
      />

      <p className="eyebrow mt-8 mb-6" aria-live="polite">
        {plural(locale, t.book.results, total)}
      </p>

      {memories.length === 0 ? (
        filtered ? (
          <EmptyState title={t.book.noResultsTitle} body={t.book.noResultsBody} />
        ) : (
          <EmptyState
            title={t.book.emptyTitle}
            body={t.book.emptyBody}
            action={
              <Link href="/new" className={buttonVariants({ size: "lg" })}>
                {t.home.addFirst}
              </Link>
            }
          />
        )
      ) : (
        <>
          <Timeline memories={memories} ctx={{ t, locale, meId: me.id, authors, categories }} />
          {total > memories.length && (
            <div className="mt-12 flex justify-center">
              <Link href={`/book/contents?${more}`} scroll={false} className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t.book.showMore}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
