/** Page-turn placeholder: the shape of a journal page while it loads. */
export default function Loading() {
  return (
    <div className="page pt-8 sm:pt-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">…</span>
      <div className="animate-pulse">
        <div className="h-3 w-24 rounded-sm bg-paper-deep" />
        <div className="mt-4 h-10 w-2/3 max-w-md rounded-sm bg-paper-deep sm:h-12" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-sm border border-rule bg-card p-6">
              <div className="h-2.5 w-28 rounded-sm bg-paper-deep" />
              <div className="mt-5 space-y-2.5">
                <div className="h-5 w-full rounded-sm bg-paper-deep" />
                <div className="h-5 w-4/5 rounded-sm bg-paper-deep" />
                <div className="h-5 w-3/5 rounded-sm bg-paper-deep" />
              </div>
              <div className="mt-6 h-3 w-36 rounded-sm bg-paper-deep" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
