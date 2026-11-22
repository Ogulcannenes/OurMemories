import { formatMonth, plural } from "@/lib/i18n";
import type { Memory } from "@/lib/data/memories";
import { MemoryCard, type CardContext } from "./memory-card";

/** Memories grouped under month headings, like dated entries in a diary. */
export function Timeline({ memories, ctx }: { memories: Memory[]; ctx: CardContext }) {
  const groups: { key: string; items: Memory[] }[] = [];
  for (const m of memories) {
    const key = m.occurredOn.slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(m);
    else groups.push({ key, items: [m] });
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`month-${g.key}`} className="relative md:pl-10">
          {/* the spine */}
          <span aria-hidden className="absolute top-3 bottom-0 left-[5px] hidden w-px bg-rule md:block" />
          <span
            aria-hidden
            className="absolute top-[0.6rem] left-0 hidden size-[11px] rotate-45 border border-wine/60 bg-paper md:block"
          />
          <header className="mb-5 flex items-baseline gap-4">
            <h2 id={`month-${g.key}`} className="font-display text-[1.65rem] leading-none font-medium text-ink sm:text-3xl">
              {formatMonth(ctx.locale, `${g.key}-01`)}
            </h2>
            <span className="h-px flex-1 translate-y-[-0.3rem] bg-rule" aria-hidden />
            <span className="eyebrow shrink-0">{plural(ctx.locale, ctx.t.book.results, g.items.length)}</span>
          </header>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {g.items.map((m) => (
              <MemoryCard key={m.id} memory={m} ctx={ctx} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
