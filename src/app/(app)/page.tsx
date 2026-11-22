import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { getAppContext } from "@/lib/data/context";
import { getMemory, getStats, listMemories } from "@/lib/data/memories";
import { categoryLabel, fmt, formatDate, plural } from "@/lib/i18n";
import { Greeting } from "@/components/layout/greeting";
import { AuthorMark } from "@/components/memory/author-mark";
import { InviteCode } from "@/components/memory/invite-code";
import { MemoryCard } from "@/components/memory/memory-card";
import { RememberThis } from "@/components/memory/remember-this";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const ctx = await getAppContext();
  const { t, locale, me, partner, space, authors, categories } = ctx;
  const [{ memories }, stats, drawn] = await Promise.all([
    listMemories(ctx, { limit: 4 }),
    getStats(ctx),
    ctx.supabase.rpc("random_memory", {}),
  ]);
  const firstDraw = drawn.data ? await getMemory(ctx, drawn.data) : null;
  const cardCtx = { t, locale, meId: me.id, authors, categories };

  return (
    <div className="page pt-8 sm:pt-12">
      {/* Masthead */}
      <header className="border-b border-rule pb-8 sm:pb-10">
        <p className="eyebrow">{space.name}</p>
        <h1 className="mt-3 font-display text-[2.5rem] leading-[1.02] font-medium tracking-tight text-balance sm:text-[3.5rem]">
          <Greeting name={me.name} />
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5">
            {authors.map((a) => (
              <AuthorMark key={a.id} name={a.name} order={a.order} />
            ))}
          </span>
          <span className="font-medium text-ink">{authors.map((a) => a.name).join(" & ")}</span>
          {space.together_since && (
            <>
              <span aria-hidden className="text-rule">
                ·
              </span>
              <span>{fmt(t.home.stats.since, { date: formatDate(locale, space.together_since) })}</span>
            </>
          )}
        </div>
      </header>

      {!partner && (
        <section className="mt-8 flex flex-col gap-4 rounded-sm border border-wine/25 bg-rose-wash/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-display text-xl font-medium">{t.home.waitingTitle}</h2>
            <p className="mt-1 text-sm text-ink-soft">{t.home.waitingBody}</p>
          </div>
          <InviteCode code={space.invite_code} />
        </section>
      )}

      {stats.total === 0 ? (
        <EmptyState
          title={t.home.emptyTitle}
          body={t.home.emptyBody}
          action={
            <Link href="/new" className={buttonVariants({ size: "lg" })}>
              <PenLine aria-hidden />
              {t.home.addFirst}
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <RememberThis initial={firstDraw} meId={me.id} authors={authors} categories={categories} />
            </div>

            {/* Numbers, set like a colophon — small and quiet. */}
            <aside aria-labelledby="stats-title" className="lg:col-span-5 lg:pt-2">
              <h2 id="stats-title" className="eyebrow">
                {t.home.stats.title}
              </h2>
              <dl className="mt-4 grid grid-cols-3 border-y border-rule">
                {[
                  { n: stats.total, label: plural(locale, t.home.stats.memories, stats.total).replace(/^\d+\s*/, "") },
                  { n: stats.this_month, label: t.home.stats.thisMonth },
                  { n: stats.favorites, label: plural(locale, t.home.stats.favorites, stats.favorites).replace(/^\d+\s*/, "") },
                ].map((s, i) => (
                  <div key={i} className="border-rule py-5 not-first:border-l not-first:pl-4 sm:not-first:pl-5">
                    <dd className="font-display text-[2.5rem] leading-none font-medium tabular-nums lining-nums">{s.n}</dd>
                    <dt className="mt-2 text-xs leading-tight text-ink-soft">{s.label}</dt>
                  </div>
                ))}
              </dl>

              {stats.top_categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="eyebrow">{t.home.stats.mostOften}</h3>
                  <ol className="mt-3 space-y-2.5">
                    {stats.top_categories.map((c) => {
                      const cat = categories.find((x) => x.id === c.category_id);
                      if (!cat) return null;
                      const share = Math.round((c.count / stats.total) * 100);
                      return (
                        <li key={c.category_id}>
                          <Link
                            href={`/book/contents?category=${c.category_id}`}
                            className="group flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span className="font-medium text-ink group-hover:text-wine">{categoryLabel(t, cat)}</span>
                            <span className="tabular-nums lining-nums text-ink-soft">{c.count}</span>
                          </Link>
                          <div className="mt-1.5 h-px bg-rule" aria-hidden>
                            <div className="h-px bg-wine/70" style={{ width: `${share}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {stats.first_date && (
                <p className="mt-6 font-display text-lg text-ink-soft italic">
                  {fmt(t.home.stats.firstPage, { date: formatDate(locale, stats.first_date) })}
                </p>
              )}
            </aside>
          </div>

          <section aria-labelledby="recent-title" className="mt-16 sm:mt-20">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-rule pb-3">
              <h2 id="recent-title" className="font-display text-[1.75rem] leading-none font-medium">
                {t.home.recent}
              </h2>
              <Link
                href="/book"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wine underline-offset-4 hover:underline"
              >
                {t.home.seeAll}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {memories.map((m) => (
                <MemoryCard key={m.id} memory={m} ctx={cardCtx} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
