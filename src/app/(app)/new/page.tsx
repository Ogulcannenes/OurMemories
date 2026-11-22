import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAppContext } from "@/lib/data/context";
import { listTagNames } from "@/lib/data/memories";
import { categoryLabel } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { MemoryForm } from "@/components/memory/memory-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.form.newTitle };
}

export default async function NewMemoryPage() {
  const ctx = await getAppContext();
  const { t, categories, space } = ctx;
  const tags = await listTagNames(ctx);

  return (
    <div className="page max-w-2xl pt-6 sm:pt-10">
      <Link
        href="/book"
        className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t.common.back}
      </Link>
      <header className="mt-6 mb-10">
        <h1 className="font-display text-[2.75rem] leading-none font-medium tracking-tight sm:text-[3.25rem]">
          {t.form.newTitle}
        </h1>
        <p className="mt-3 font-display text-lg text-ink-soft italic">{t.form.newSubtitle}</p>
      </header>
      <MemoryForm
        spaceId={space.id}
        categories={categories.map((c) => ({ id: c.id, label: categoryLabel(t, c) }))}
        tagSuggestions={tags.map((x) => x.name)}
      />
    </div>
  );
}
