"use client";

import { useId } from "react";
import { Loader2 } from "lucide-react";
import { createSpace, joinSpace } from "@/lib/actions/space";
import { useFormAction } from "@/lib/use-form-action";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

export function CreateSpaceForm() {
  const { t } = useI18n();
  const uid = useId();
  const { state, onSubmit, pending } = useFormAction(createSpace);
  const error = state.fieldErrors?.name ?? state.error;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      <div>
        <label htmlFor={`${uid}-name`} className="eyebrow">
          {t.onboarding.bookName}
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          required
          maxLength={60}
          defaultValue={t.onboarding.bookNamePlaceholder}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${uid}-err` : undefined}
          className="field mt-2"
        />
        {error && (
          <p id={`${uid}-err`} role="alert" className="mt-1.5 text-[0.8125rem] text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {t.onboarding.create}
      </Button>
    </form>
  );
}

export function JoinSpaceForm() {
  const { t } = useI18n();
  const uid = useId();
  const { state, onSubmit, pending } = useFormAction(joinSpace);
  const error = state.fieldErrors?.code ?? state.error;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      <div>
        <label htmlFor={`${uid}-code`} className="eyebrow">
          {t.onboarding.code}
        </label>
        <input
          id={`${uid}-code`}
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          placeholder="ABCD-EFGH"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${uid}-err` : undefined}
          className="field mt-2 font-mono text-lg tracking-[0.25em] uppercase placeholder:tracking-[0.25em]"
        />
        {error && (
          <p id={`${uid}-err`} role="alert" className="mt-1.5 text-[0.8125rem] text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {t.onboarding.join}
      </Button>
    </form>
  );
}
