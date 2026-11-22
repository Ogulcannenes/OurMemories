"use client";

import { useSyncExternalStore } from "react";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

const noop = () => () => {};

/** Time-of-day greeting in the reader's own timezone (the server renders the daytime form). */
export function Greeting({ name }: { name: string }) {
  const { t } = useI18n();
  const hour = useSyncExternalStore(noop, () => new Date().getHours(), () => 12);
  const template =
    hour < 5 ? t.home.greetingNight : hour < 12 ? t.home.greetingMorning : hour < 18 ? t.home.greetingDay : t.home.greetingEvening;
  return <>{fmt(template, { name })}</>;
}
