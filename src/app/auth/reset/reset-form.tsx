"use client";

import { useId } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { updatePassword } from "@/lib/actions/auth";
import { useFormAction } from "@/lib/use-form-action";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

export function ResetForm() {
  const { t } = useI18n();
  const uid = useId();
  const { state, onSubmit, pending } = useFormAction(updatePassword);
  const error = state.fieldErrors?.password;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <h1 className="font-display text-[2.25rem] leading-tight font-medium italic">{t.auth.newPasswordTitle}</h1>
      {state.error && (
        <div role="alert" className="space-y-2 border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <p>{state.error}</p>
          <Link href="/login?error=reset" className="font-semibold underline underline-offset-4">
            {t.auth.forgotTitle}
          </Link>
        </div>
      )}
      <div>
        <label htmlFor={`${uid}-password`} className="eyebrow">
          {t.auth.newPassword}
        </label>
        <input
          id={`${uid}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${uid}-hint`}
          className="field mt-2"
        />
        <p
          id={`${uid}-hint`}
          role={error ? "alert" : undefined}
          className={error ? "mt-1.5 text-[0.8125rem] text-destructive" : "mt-1.5 text-xs text-ink-soft"}
        >
          {error ?? t.auth.passwordHint}
        </p>
      </div>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {t.auth.savePassword}
      </Button>
    </form>
  );
}
