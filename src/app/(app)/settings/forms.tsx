"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { addCategory, deleteCategory, renameCategory, updateProfile, updateSpace } from "@/lib/actions/space";
import { useFormAction } from "@/lib/use-form-action";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Status({ message, error }: { message?: string; error?: string }) {
  if (error) return <p role="alert" className="text-[0.8125rem] text-destructive">{error}</p>;
  if (message)
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-[0.8125rem] text-wine">
        <Check className="size-3.5" aria-hidden />
        {message}
      </p>
    );
  return null;
}

export function ProfileForm({ name }: { name: string }) {
  const { t } = useI18n();
  const uid = useId();
  const { state, onSubmit, pending } = useFormAction(updateProfile);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <label htmlFor={`${uid}-name`} className="eyebrow">
        {t.settings.displayName}
      </label>
      <div className="flex gap-2">
        <input
          id={`${uid}-name`}
          name="display_name"
          defaultValue={name}
          maxLength={40}
          required
          aria-invalid={Boolean(state.fieldErrors?.display_name) || undefined}
          className="field"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : t.common.save}
        </Button>
      </div>
      <Status message={state.message} error={state.fieldErrors?.display_name ?? state.error} />
    </form>
  );
}

export function SpaceForm({ name, togetherSince }: { name: string; togetherSince: string }) {
  const { t } = useI18n();
  const uid = useId();
  const { state, onSubmit, pending } = useFormAction(updateSpace);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor={`${uid}-name`} className="eyebrow">
          {t.settings.bookName}
        </label>
        <input id={`${uid}-name`} name="name" defaultValue={name} maxLength={60} required className="field mt-2" />
      </div>
      <div>
        <label htmlFor={`${uid}-since`} className="eyebrow">
          {t.settings.togetherSince} <span className="tracking-normal normal-case">· {t.common.optional}</span>
        </label>
        <input id={`${uid}-since`} name="together_since" type="date" defaultValue={togetherSince} className="field mt-2 sm:max-w-56" />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {t.common.save}
        </Button>
        <Status message={state.message} error={state.fieldErrors?.name ?? state.error} />
      </div>
    </form>
  );
}

type Cat = { id: string; label: string; custom: boolean };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const { t } = useI18n();
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const { state, onSubmit, pending } = useFormAction(async (prev, form) => {
    const result = await addCategory(prev, form);
    if (result.ok) formRef.current?.reset(); // clear the input after a successful add
    return result;
  });

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-rule border-y border-rule">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </ul>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-2">
        <label htmlFor={`${uid}-new`} className="eyebrow">
          {t.settings.newCategory}
        </label>
        <div className="flex gap-2">
          <input
            id={`${uid}-new`}
            name="name"
            maxLength={32}
            required
            aria-invalid={Boolean(state.fieldErrors?.name) || undefined}
            className="field"
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
            {t.settings.addCategory}
          </Button>
        </div>
        <Status error={state.fieldErrors?.name ?? state.error} />
      </form>
    </div>
  );
}

function CategoryRow({ category }: { category: Cat }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.label);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const res = await renameCategory(category.id, value);
      if (res.error) setError(res.error);
      else {
        setError(undefined);
        setEditing(false);
      }
    });

  const remove = () =>
    start(async () => {
      const res = await deleteCategory(category.id);
      if (res.error) setError(res.error);
      setConfirming(false);
    });

  return (
    <li className="py-2">
      <div className="flex min-h-11 items-center gap-2">
        {editing ? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              maxLength={32}
              autoFocus
              aria-label={fmt(t.settings.rename, { name: category.label })}
              className="field h-10 py-0"
            />
            <Button size="icon-sm" variant="ghost" onClick={save} disabled={pending} aria-label={t.common.save}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)} aria-label={t.common.cancel}>
              <X aria-hidden />
            </Button>
          </>
        ) : (
          <>
            <span className="flex-1 text-[0.9375rem]">{category.label}</span>
            {category.custom && (
              <>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  aria-label={fmt(t.settings.rename, { name: category.label })}
                >
                  <Pencil aria-hidden />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setConfirming(true)}
                  aria-label={fmt(t.settings.deleteCategory, { name: category.label })}
                  className="text-ink-soft hover:text-destructive"
                >
                  <Trash2 aria-hidden />
                </Button>
              </>
            )}
          </>
        )}
      </div>
      {error && <p role="alert" className="text-[0.8125rem] text-destructive">{error}</p>}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-[3px] bg-paper p-7 ring-rule sm:max-w-[26rem]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="font-display text-[1.75rem] leading-tight font-medium italic">
              {fmt(t.settings.deleteCategoryTitle, { name: category.label })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-[0.9375rem]">{t.settings.deleteCategoryBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2">
            <AlertDialogCancel disabled={pending}>{t.common.cancel}</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? t.common.deleting : t.common.delete}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
