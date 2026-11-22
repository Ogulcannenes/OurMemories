import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { ResetForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.newPasswordTitle };
}

/** Landing of the password-reset link (after /auth/confirm opened a recovery session). */
export default function ResetPasswordPage() {
  return (
    <main className="book-paper flex min-h-dvh flex-col px-6 py-10 sm:px-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <ResetForm />
      </div>
    </main>
  );
}
