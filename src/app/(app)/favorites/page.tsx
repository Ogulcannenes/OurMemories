import type { Metadata } from "next";
import Link from "next/link";
import { getAppContext } from "@/lib/data/context";
import { listMemories } from "@/lib/data/memories";
import { getI18n } from "@/lib/i18n/server";
import { MemoryCard } from "@/components/memory/memory-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.favorites.title };
}

export default async function FavoritesPage({ searchParams }: PageProps<"/favorites">) {
  const ctx = await getAppContext();
  const { t, locale, me, partner, authors, categories } = ctx;
  const everyone = (await searchParams).who === "all";
  const { memories } = await listMemories(ctx, { favoritesOf: everyone ? "anyone" : me.id, limit: 300 });

  const tabs = [
    { href: "/favorites", label: t.favorites.mine, active: !everyone },
    { href: "/favorites?who=all", label: t.favorites.everyone, active: everyone },
  ];

  return (
    <div className="page pt-8 sm:pt-12">
      <header className="mb-8 flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[2.75rem] leading-none font-medium tracking-tight sm:text-[3.5rem]">
            {t.favorites.title}
          </h1>
          <p className="mt-3 text-ink-soft">{t.favorites.subtitle}</p>
        </div>
        {partner && (
          <nav className="flex gap-1 self-start rounded-sm border border-rule p-1 sm:self-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-[2px] px-4 text-sm font-semibold transition-colors",
                  tab.active ? "bg-rose-wash text-wine" : "text-ink-soft hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {memories.length === 0 ? (
        <EmptyState title={t.favorites.emptyTitle} body={t.favorites.emptyBody} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} ctx={{ t, locale, meId: me.id, authors, categories }} />
          ))}
        </div>
      )}
    </div>
  );
}
