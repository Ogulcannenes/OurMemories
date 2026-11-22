import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import { signOut } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Ornament } from "@/components/ui/empty-state";
import { Wordmark } from "@/components/layout/wordmark";
import { CreateSpaceForm, JoinSpaceForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.onboarding.title };
}

export default async function OnboardingPage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("space_members").select("space_id").eq("user_id", user.id).maybeSingle();
  if (membership) redirect("/");

  const { t } = await getI18n();

  return (
    <main className="page flex min-h-dvh flex-col py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Wordmark className="text-[1.4rem]" />
        <LocaleSwitcher />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-12">
        <header className="text-center">
          <Ornament className="mx-auto" />
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] font-medium text-balance italic sm:text-[3.25rem]">
            {t.onboarding.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg leading-relaxed text-ink-soft">{t.onboarding.intro}</p>
        </header>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <section aria-labelledby="create-title" className="rounded-sm border border-rule bg-card p-6 sm:p-8">
            <h2 id="create-title" className="font-display text-2xl font-medium">
              {t.onboarding.createTitle}
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">{t.onboarding.createHint}</p>
            <CreateSpaceForm />
          </section>

          <div className="flex items-center gap-4 md:flex-col" aria-hidden>
            <span className="h-px flex-1 bg-rule md:h-auto md:w-px" />
            <span className="font-display text-lg text-ink-soft italic">{t.onboarding.or}</span>
            <span className="h-px flex-1 bg-rule md:h-auto md:w-px" />
          </div>

          <section aria-labelledby="join-title" className="rounded-sm border border-rule bg-card p-6 sm:p-8">
            <h2 id="join-title" className="font-display text-2xl font-medium">
              {t.onboarding.joinTitle}
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">{t.onboarding.joinHint}</p>
            <JoinSpaceForm />
          </section>
        </div>
      </div>

      <form action={signOut} className="text-center">
        <button type="submit" className="min-h-11 cursor-pointer text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          {t.settings.signOut} · {user.email}
        </button>
      </form>
    </main>
  );
}
