"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/space";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** RU · EN · TR — compact, used on the login page and in settings. */
export function LocaleSwitcher({ className, full = false }: { className?: string; full?: boolean }) {
  const { locale, t } = useI18n();
  const [pending, start] = useTransition();

  return (
    <div role="group" aria-label={t.settings.language} className={cn("flex gap-1", className)} aria-busy={pending}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() => start(() => setLocale(l))}
          className={cn(
            "min-h-10 cursor-pointer rounded-sm px-3 text-[0.8125rem] font-semibold transition-colors",
            l === locale ? "bg-rose-wash text-wine ring-1 ring-wine/25" : "text-ink-soft hover:bg-paper-deep hover:text-ink",
          )}
        >
          {full ? LOCALE_NAMES[l] : l.toUpperCase()}
          {!full && <span className="sr-only"> — {LOCALE_NAMES[l]}</span>}
        </button>
      ))}
    </div>
  );
}
