"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteMemory } from "@/lib/actions/memories";
import { useI18n } from "@/lib/i18n/client";

export function DeleteMemoryButton({ memoryId }: { memoryId: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirm = () =>
    start(async () => {
      setError(null);
      const res = await deleteMemory(memoryId); // redirects on success
      if (res?.error) setError(res.error);
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label={t.common.delete} title={t.common.delete}>
            <Trash2 aria-hidden />
          </Button>
        }
      />
      <AlertDialogContent className="rounded-[3px] bg-paper p-7 ring-rule sm:max-w-[26rem]">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="font-display text-[1.75rem] leading-tight font-medium italic">{t.memory.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-left text-[0.9375rem] leading-relaxed">
            {t.memory.deleteBody}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter className="mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2">
          <AlertDialogCancel disabled={pending}>{t.common.cancel}</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? t.common.deleting : t.common.delete}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
