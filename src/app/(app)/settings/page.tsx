import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { getAppContext } from "@/lib/data/context";
import { categoryLabel, fmt } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { signOut } from "@/lib/actions/auth";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { AuthorMark } from "@/components/memory/author-mark";
import { InviteCode } from "@/components/memory/invite-code";
import { Button } from "@/components/ui/button";
import { CategoryManager, ProfileForm, SpaceForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.title };
}

export default async function SettingsPage() {
  const { t, me, partner, space, authors, categories, user } = await getAppContext();

  return (
    <div className="page max-w-2xl pt-8 sm:pt-12">
      <h1 className="mb-6 font-display text-[2.75rem] leading-none font-medium tracking-tight sm:text-[3.5rem]">
        {t.settings.title}
      </h1>

      <div className="divide-y divide-rule border-y border-rule">
        <Section title={t.settings.profile}>
          <ProfileForm name={me.name} />
        </Section>

        <Section title={t.settings.language}>
          <LocaleSwitcher full className="flex-wrap" />
        </Section>

        <Section title={t.settings.appearance}>
          <ThemeSwitcher />
        </Section>

        <Section title={t.settings.book}>
          <SpaceForm name={space.name} togetherSince={space.together_since ?? ""} />
        </Section>

        <Section title={t.settings.members}>
          <ul className="space-y-3">
            {authors.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-[0.9375rem]">
                <AuthorMark name={a.name} order={a.order} className="size-8 text-lg" />
                <span className="font-medium">{a.name}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <h3 className="eyebrow">{t.settings.invite}</h3>
            {partner ? (
              <p className="mt-2 text-sm text-ink-soft">{t.settings.inviteFull}</p>
            ) : (
              <div className="mt-3 space-y-3">
                <InviteCode code={space.invite_code} />
                <p className="text-sm text-ink-soft">{t.settings.inviteHint}</p>
              </div>
            )}
          </div>
        </Section>

        <Section title={t.settings.categories} hint={t.settings.categoriesHint}>
          <CategoryManager
            categories={categories.map((c) => ({ id: c.id, label: categoryLabel(t, c), custom: c.key === null }))}
          />
        </Section>

        <Section title={t.settings.account}>
          <p className="text-sm break-all text-ink-soft">{fmt(t.settings.signedInAs, { email: user.email })}</p>
          <form action={signOut} className="mt-4">
            <Button type="submit" variant="outline">
              <LogOut aria-hidden />
              {t.settings.signOut}
            </Button>
          </form>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 py-8 sm:grid-cols-[11rem_1fr] sm:gap-8">
      <div>
        <h2 className="font-display text-xl leading-tight font-medium">{title}</h2>
        {hint && <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
