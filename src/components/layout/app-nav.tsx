"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bookmark, House, PenLine, Settings2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-switcher";

function useIsActive(path: string) {
  return (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
}

/** Desktop: slim top bar. Mobile: brand bar on top + tab bar at the thumb. */
export function AppNav({ bookName }: { bookName: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isActive = useIsActive(pathname);

  const links = [
    { href: "/", label: t.nav.home, icon: House },
    { href: "/book", label: t.nav.book, icon: BookOpen },
    { href: "/favorites", label: t.nav.favorites, icon: Bookmark },
    { href: "/settings", label: t.nav.settings, icon: Settings2 },
  ];
  const tabs = [links[0], links[1], { href: "/new", label: t.nav.add, icon: PenLine }, links[2], links[3]];
  // While writing, the form owns the bottom of the screen (sticky save bar); the tab bar steps aside.
  const writing = pathname === "/new" || /^\/m\/[^/]+\/edit$/.test(pathname);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-rule/80 bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
        <div className="page flex h-14 items-center justify-between gap-6 sm:h-16">
          <Link href="/" className="flex min-w-0 items-baseline gap-3" aria-label={`${BRAND} — ${t.nav.home}`}>
            <Wordmark className="text-[1.35rem] sm:text-[1.5rem]" />
            <span className="hidden truncate text-xs text-ink-soft lg:inline">{bookName}</span>
          </Link>

          <div className="flex items-center gap-1">
          <nav aria-label={t.nav.mainLabel} className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
                  "after:absolute after:inset-x-3 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-wine after:transition-transform after:duration-300",
                  "aria-[current=page]:text-ink aria-[current=page]:after:scale-x-100",
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/new"
              aria-current={isActive("/new") ? "page" : undefined}
              className="ml-3 inline-flex h-10 items-center gap-2 rounded-sm bg-button px-4 text-sm font-semibold tracking-[0.02em] text-button-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--shadow-ink)/0.22)] transition-colors hover:bg-[color-mix(in_oklch,var(--button),black_10%)]"
            >
              <PenLine className="size-4" aria-hidden />
              {t.nav.add}
            </Link>
          </nav>
          <ThemeToggle className="md:order-first md:mr-1" />
          </div>
        </div>
      </header>

      <nav
        aria-label={t.nav.mainLabel}
        hidden={writing}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const primary = href === "/new";
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={primary ? label : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                    active ? "text-wine" : "text-ink-soft",
                  )}
                >
                  {primary ? (
                    <span className="flex size-11 items-center justify-center rounded-sm bg-button text-button-foreground">
                      <Icon className="size-[1.15rem]" aria-hidden />
                    </span>
                  ) : (
                    <>
                      <Icon className="size-5" strokeWidth={active ? 2.1 : 1.7} aria-hidden />
                      <span>{label}</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
