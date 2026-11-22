"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/actions/auth";
import { useFormAction } from "@/lib/use-form-action";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

export function LoginForm({ confirmFailed }: { confirmFailed: boolean }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return mode === "signin" ? (
    <AuthForm key="in" mode="signin" onSwitch={() => setMode("signup")} notice={confirmFailed ? t.auth.confirmFailed : undefined} />
  ) : (
    <AuthForm key="up" mode="signup" onSwitch={() => setMode("signin")} />
  );
}

function AuthForm({ mode, onSwitch, notice }: { mode: "signin" | "signup"; onSwitch: () => void; notice?: string }) {
  const { t } = useI18n();
  const uid = useId();
  const { state, onSubmit, pending } = useFormAction(mode === "signin" ? signIn : signUp);
  const errors = state.fieldErrors ?? {};
  const signup = mode === "signup";

  if (signup && state.ok && state.message) {
    return (
      <div role="status" className="space-y-4">
        <h2 className="font-display text-[2.25rem] leading-tight font-medium italic">{t.auth.signUpTitle}</h2>
        <p className="leading-relaxed text-ink-soft">{state.message}</p>
        <Button variant="link" onClick={onSwitch}>
          {t.auth.toSignIn}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <h2 className="font-display text-[2.25rem] leading-tight font-medium italic">
        {signup ? t.auth.signUpTitle : t.auth.signInTitle}
      </h2>

      {(state.error || notice) && (
        <p role="alert" className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error ?? notice}
        </p>
      )}

      {signup && (
        <Field id={`${uid}-name`} label={t.auth.name} error={errors.name}>
          <input
            id={`${uid}-name`}
            name="name"
            autoComplete="nickname"
            maxLength={40}
            required
            placeholder={t.auth.namePlaceholder}
            aria-invalid={Boolean(errors.name) || undefined}
            className="field"
          />
        </Field>
      )}

      <Field id={`${uid}-email`} label={t.auth.email} error={errors.email}>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          aria-invalid={Boolean(errors.email) || undefined}
          className="field"
        />
      </Field>

      <Field id={`${uid}-password`} label={t.auth.password} error={errors.password} hint={signup ? t.auth.passwordHint : undefined}>
        <input
          id={`${uid}-password`}
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          required
          aria-invalid={Boolean(errors.password) || undefined}
          className="field"
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {signup ? t.auth.signUp : t.auth.signIn}
      </Button>

      <div className="border-t border-rule pt-5 text-center">
        <button
          type="button"
          onClick={onSwitch}
          className="min-h-11 cursor-pointer text-sm font-semibold text-wine underline-offset-4 hover:underline"
        >
          {signup ? t.auth.toSignIn : t.auth.toSignUp}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      )}
    </div>
  );
}
