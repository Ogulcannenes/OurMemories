import { cn } from "@/lib/utils";

/** A quiet page with a small ornament — used whenever there is nothing to show yet. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center py-14 text-center sm:py-20", className)}>
      <Ornament />
      <h2 className="mt-6 font-display text-[1.75rem] leading-tight font-medium text-ink italic sm:text-[2rem]">
        {title}
      </h2>
      {body && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 12"
      className={cn("h-3 w-28 text-rose", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M0 6h48M72 6h48" />
      <path d="M60 1.5 64.5 6 60 10.5 55.5 6Z" fill="currentColor" stroke="none" />
      <circle cx="51" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="69" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
