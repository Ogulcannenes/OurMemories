import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAppContext } from "@/lib/data/context";
import { getMemory, listTagNames } from "@/lib/data/memories";
import { categoryLabel } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { MemoryForm } from "@/components/memory/memory-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.form.editTitle };
}

export default async function EditMemoryPage({ params }: PageProps<"/m/[id]/edit">) {
  const ctx = await getAppContext();
  const { t, categories, space } = ctx;
  const [memory, tags] = await Promise.all([getMemory(ctx, (await params).id), listTagNames(ctx)]);
  if (!memory) notFound();

  return (
    <div className="page max-w-2xl pt-6 sm:pt-10">
      <Link
        href={`/m/${memory.id}`}
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t.common.back}
      </Link>
      <h1 className="mt-6 mb-10 font-display text-[2.5rem] leading-none font-medium tracking-tight sm:text-[3rem]">
        {t.form.editTitle}
      </h1>
      <MemoryForm
        spaceId={space.id}
        categories={categories.map((c) => ({ id: c.id, label: categoryLabel(t, c) }))}
        tagSuggestions={tags.map((x) => x.name)}
        initial={{
          id: memory.id,
          title: memory.title,
          quote: memory.quote,
          story: memory.story ?? "",
          occurredOn: memory.occurredOn,
          categoryId: memory.categoryId ?? "",
          tags: memory.tags.map((x) => x.name),
          photos: memory.photos,
        }}
      />
    </div>
  );
}
