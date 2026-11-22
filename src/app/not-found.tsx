import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="page flex min-h-[70dvh] items-center justify-center">
      <EmptyState
        title={t.errors.notFoundTitle}
        body={t.errors.notFoundBody}
        action={
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            {t.errors.goHome}
          </Link>
        }
      />
    </main>
  );
}
