import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { BRAND, SLOGAN } from "@/lib/brand";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signInTitle };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getI18n();
  const { error } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* The cover: burgundy book-cloth with a blind-embossed frame */}
      <section className="relative overflow-hidden bg-book-cloth text-[#f8f5ef]">
        <span aria-hidden className="cover-cloth absolute inset-0" />
        <span aria-hidden className="absolute inset-3 rounded-[2px] border border-[#f8f5ef]/20 sm:inset-5 lg:inset-8" />
        <span aria-hidden className="absolute inset-4 rounded-[1px] border border-[#f8f5ef]/10 sm:inset-6 lg:inset-10" />

        <div className="relative flex h-full flex-col px-8 pt-8 pb-10 sm:px-12 lg:px-20 lg:py-16">
          <div className="flex justify-end lg:hidden">
            <LocaleSwitcher className="[&_button[aria-pressed=false]]:text-[#f8f5ef]/75 [&_button[aria-pressed=false]:hover]:bg-white/10 [&_button[aria-pressed=false]:hover]:text-[#f8f5ef] [&_button[aria-pressed=true]]:bg-[#f8f5ef] [&_button[aria-pressed=true]]:text-ink" />
          </div>

          <div className="flex flex-1 flex-col justify-center py-8 lg:py-0">
            <h1 className="font-display text-[2.9rem] leading-none font-medium tracking-[0.28em] text-[#f8f5ef] [text-shadow:0_1px_0_rgba(0,0,0,0.25)] sm:text-[3.8rem] lg:text-[5rem]">
              {BRAND}
            </h1>
            <span aria-hidden className="mt-6 h-px w-14 bg-[#e9d5d2]/60 lg:mt-8" />
            <p className="mt-6 font-display text-[1.35rem] leading-snug text-[#f8f5ef]/95 italic sm:text-2xl lg:mt-8 lg:text-[1.9rem]">
              {SLOGAN}
            </p>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-[#f8f5ef]/70 lg:mt-6">{t.auth.tagline}</p>
          </div>
        </div>
      </section>

      {/* The first page: the form on ivory paper */}
      <section className="book-paper flex flex-col px-6 py-10 sm:px-10 lg:px-16 lg:py-12">
        <div className="hidden justify-end lg:flex">
          <LocaleSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <LoginForm confirmFailed={error === "confirm"} />
        </div>
      </section>
    </main>
  );
}
