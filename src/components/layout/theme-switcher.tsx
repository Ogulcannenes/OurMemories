"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/*
  Theme = the user's choice (light / dark / system), kept on this device in localStorage.
  The class on <html> is set before first paint by THEME_SCRIPT (see app/layout.tsx), so
  there is no flash; this module keeps it in sync afterwards.
*/

type Theme = "light" | "dark" | "system";
const KEY = "adelya:theme";
const listeners = new Set<() => void>();

/** Inline, render-blocking: applies the saved theme before the page is painted. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function readTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  listeners.forEach((l) => l());
}

function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  apply(theme);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // another tab changed the choice
  const onStorage = (e: StorageEvent) => e.key === KEY && apply(readTheme());
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const isDark = () => document.documentElement.classList.contains("dark");

function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  // "System" follows the OS live (e.g. automatic dark mode at sunset).
  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, dark };
}

/** Light · Dark · System — in settings. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const options = [
    { value: "light", label: t.settings.themeLight, icon: Sun },
    { value: "dark", label: t.settings.themeDark, icon: Moon },
    { value: "system", label: t.settings.themeSystem, icon: Monitor },
  ] as const;

  return (
    <div role="group" aria-label={t.settings.appearance} className={cn("flex flex-wrap gap-1", className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-sm px-3 text-[0.8125rem] font-semibold transition-colors",
            theme === value ? "bg-rose-wash text-wine ring-1 ring-wine/25" : "text-ink-soft hover:bg-paper-deep hover:text-ink",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

/** One-tap light/dark switch for the top bar. */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const { dark } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={t.settings.themeToggle}
      aria-pressed={dark}
      title={t.settings.themeToggle}
      className={cn(
        "inline-flex size-10 cursor-pointer items-center justify-center rounded-sm text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink",
        className,
      )}
    >
      {dark ? <Sun className="size-[1.1rem]" aria-hidden /> : <Moon className="size-[1.1rem]" aria-hidden />}
    </button>
  );
}
