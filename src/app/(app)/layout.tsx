import { getAppContext } from "@/lib/data/context";
import { AppNav } from "@/components/layout/app-nav";

/** Shell for everything inside the book: requires a session and a book. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { space, t } = await getAppContext();
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-sm bg-wine px-4 py-3 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t.common.skip}
      </a>
      <AppNav bookName={space.name} />
      <main id="content" tabIndex={-1} className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] outline-none md:pb-20">
        {children}
      </main>
    </>
  );
}
