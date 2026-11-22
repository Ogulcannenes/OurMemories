import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getAppContext } from "@/lib/data/context";
import { getMemory } from "@/lib/data/memories";
import { fmt } from "@/lib/i18n";
import { AuthorMark } from "@/components/memory/author-mark";
import { DeleteMemoryButton } from "@/components/memory/delete-memory-button";
import { FavoriteButton } from "@/components/memory/favorite-button";
import { memoryMeta } from "@/components/memory/memory-card";
import { Ornament } from "@/components/ui/empty-state";
import { PhotoGallery } from "@/components/book/photo-gallery";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/m/[id]">): Promise<Metadata> {
  const ctx = await getAppContext();
  const memory = await getMemory(ctx, (await params).id);
  return { title: memory?.title ?? ctx.t.memory.notFoundTitle };
}

export default async function MemoryPage({ params }: PageProps<"/m/[id]">) {
  const ctx = await getAppContext();
  const { t, locale, me, authors, categories } = ctx;
  const memory = await getMemory(ctx, (await params).id);
  if (!memory) notFound();

  const meta = memoryMeta(memory, { t, locale, meId: me.id, authors, categories });
  const lovedBy = authors.filter((a) => memory.favoritedBy.includes(a.id));

  return (
    <article className="page max-w-3xl pt-6 sm:pt-10">
      <nav className="flex items-center justify-between gap-3">
        <Link
          href={`/book?m=${memory.id}`}
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.memory.backToBook}
        </Link>
        <div className="flex gap-2">
          <FavoriteButton memoryId={memory.id} initial={meta.isFavorite} />
          <Link
            href={`/m/${memory.id}/edit`}
            aria-label={t.common.edit}
            title={t.common.edit}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <Pencil aria-hidden />
          </Link>
          <DeleteMemoryButton memoryId={memory.id} />
        </div>
      </nav>

      <header className="mt-10 sm:mt-14">
        <p className="eyebrow">
          <time dateTime={memory.occurredOn}>{meta.date}</time>
          {meta.category && (
            <>
              <span aria-hidden className="mx-2 text-rule">
                ·
              </span>
              {meta.category}
            </>
          )}
        </p>
        <h1 className="mt-3 font-display text-[1.75rem] leading-tight font-medium text-balance text-ink sm:text-[2.1rem]">{memory.title}</h1>
      </header>

      <blockquote className="quote relative mt-8 border-l border-wine/40 pl-6 text-[2.1rem] leading-[1.18] sm:mt-10 sm:pl-10 sm:text-[3rem] lg:text-[3.4rem]">
        <span
          aria-hidden
          className="absolute -top-5 left-2 font-display text-7xl leading-none text-wine/25 not-italic select-none sm:-top-8 sm:left-4 sm:text-8xl"
        >
          “
        </span>
        <p className="relative whitespace-pre-line">{memory.quote}</p>
      </blockquote>

      <p className="mt-6 flex items-center gap-2.5 pl-6 text-sm text-ink-soft sm:pl-10">
        {meta.author && <AuthorMark name={meta.author.name} order={meta.author.order} />}
        {fmt(t.memory.writtenBy, { name: meta.author?.name ?? t.memory.unknownAuthor })}
      </p>

      {memory.photos.length > 0 && (
        <div className="mt-12">
          <PhotoGallery photos={memory.photos} title={memory.title} />
        </div>
      )}

      {memory.story && (
        <section className="mt-12">
          <Ornament className="mb-8" />
          <div className="max-w-prose text-[1.0625rem] leading-[1.8] whitespace-pre-line text-ink first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-display first-letter:text-[3.4rem] first-letter:leading-[0.8] first-letter:text-wine">
            {memory.story}
          </div>
        </section>
      )}

      {(memory.tags.length > 0 || lovedBy.length > 0) && (
        <footer className="mt-14 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          {memory.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={t.form.tags}>
              {memory.tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`/book/contents?tag=${tag.id}`}
                    className="inline-flex min-h-9 items-center rounded-sm bg-paper-deep px-3 text-[0.8125rem] text-ink transition-colors hover:bg-rose-wash hover:text-wine"
                  >
                    #{tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {lovedBy.length > 0 && (
            <p className="text-sm text-ink-soft">
              {fmt(t.memory.lovedBy, { names: lovedBy.map((a) => a.name).join(` ${t.memory.and} `) })}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
