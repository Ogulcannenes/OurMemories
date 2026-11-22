"use client";

import { useI18n } from "@/lib/i18n/client";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="page">
      <EmptyState
        title={t.errors.errorTitle}
        body={t.errors.errorBody}
        action={<Button onClick={() => retry()}>{t.common.tryAgain}</Button>}
      />
    </div>
  );
}
