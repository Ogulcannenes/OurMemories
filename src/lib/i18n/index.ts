import { en, type Dictionary, type PluralForms } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";
import { tr } from "./dictionaries/tr";

export type { Dictionary };

export const LOCALES = ["ru", "en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "locale";

export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", en: "English", tr: "Türkçe" };

/** BCP-47 tags used for Intl formatting. */
const INTL_TAG: Record<Locale, string> = { ru: "ru-RU", en: "en-GB", tr: "tr-TR" };

const dictionaries: Record<Locale, Dictionary> = { ru, en, tr };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** "Hello, {name}" + { name: "Ana" } → "Hello, Ana" */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function plural(locale: Locale, forms: PluralForms, n: number): string {
  const rule = new Intl.PluralRules(INTL_TAG[locale]).select(n);
  return fmt(forms[rule] ?? forms.other, { n });
}

/** Formats a Postgres `date` (YYYY-MM-DD) without timezone drift. */
export function formatDate(
  locale: Locale,
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(INTL_TAG[locale], { ...options, timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "ноябрь 2026" — month heading for the timeline (standalone form where the locale has one). */
export function formatMonth(locale: Locale, isoDate: string): string {
  const s = formatDate(locale, isoDate, { month: "long", year: "numeric" }).replace(/\s*г\.$/, "");
  return s.charAt(0).toLocaleUpperCase(INTL_TAG[locale]) + s.slice(1);
}

export function formatRelative(locale: Locale, isoDate: string, today = new Date()): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const then = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((then - now) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(INTL_TAG[locale], { numeric: "auto" });
  const abs = Math.abs(days);
  if (abs < 7) return rtf.format(days, "day");
  if (abs < 30) return rtf.format(Math.sign(days) * Math.max(1, Math.floor(abs / 7)), "week");
  // Whole calendar months, rounded toward zero (at least 1): 1 year 11 months ago is
  // "last year", not "2 years ago"; exactly two years ago is "2 years ago".
  const [later, earlier] = days < 0 ? [[today.getFullYear(), today.getMonth() + 1, today.getDate()], [y, m, d]] : [[y, m, d], [today.getFullYear(), today.getMonth() + 1, today.getDate()]];
  const months = Math.max(1, (later[0] - earlier[0]) * 12 + (later[1] - earlier[1]) - (later[2] < earlier[2] ? 1 : 0));
  const sign = Math.sign(days);
  if (months < 12) return rtf.format(sign * months, "month");
  return rtf.format(sign * Math.floor(months / 12), "year");
}

/** Built-in categories are stored by key and translated; custom ones keep the name the couple gave them. */
export function categoryLabel(t: Dictionary, category: { key: string | null; name: string | null }) {
  if (category.key && category.key in t.categories) return t.categories[category.key as keyof Dictionary["categories"]];
  return category.name ?? "";
}

export function intlTag(locale: Locale) {
  return INTL_TAG[locale];
}
