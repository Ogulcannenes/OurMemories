import type { Metadata } from "next";
import { getAppContext } from "@/lib/data/context";
import { isUuid, listMemories } from "@/lib/data/memories";
import { getI18n } from "@/lib/i18n/server";
import { BookReader } from "@/components/book/book-reader";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.reader.label };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The book itself: every memory is a page, oldest first, like a diary. */
export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const ctx = await getAppContext();
  const sp = await searchParams;
  const startId = one(sp.m);
  // newest first from the DB, then reversed into reading order: a long book keeps its latest pages
  const { memories: newest, total } = await listMemories(ctx, { sort: "newest", limit: 1000 });
  const memories = [...newest].reverse();

  return (
    <div className="page max-w-[76rem] px-3 pt-5 sm:px-6 sm:pt-8">
      <BookReader
        // remount when the set of pages changes (add/delete) so indices stay consistent
        key={memories.map((m) => m.id).join(",")}
        memories={memories}
        authors={ctx.authors}
        categories={ctx.categories}
        meId={ctx.me.id}
        bookName={ctx.space.name}
        togetherSince={ctx.space.together_since}
        startId={isUuid(startId) ? startId : undefined}
        added={one(sp.added) === "1"}
        truncatedFrom={total > memories.length ? total : undefined}
      />
    </div>
  );
}
