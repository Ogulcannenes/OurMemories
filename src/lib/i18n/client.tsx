"use client";

import { createContext, useContext } from "react";
import { MotionConfig } from "motion/react";
import type { Dictionary, Locale } from ".";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  // MotionConfig: every Motion animation honours the OS "reduce motion" setting by default.
  return (
    <I18nContext value={{ locale, t }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nContext>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
