"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";

/** Full-screen photo viewer. Base UI handles focus trap, Esc and scroll lock. */
export function PhotoLightbox({
  photos,
  index,
  title,
  onIndexChange,
  onClose,
}: {
  photos: { url: string }[];
  index: number | null;
  title: string;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const open = index !== null;
  const current = open ? photos[index] : null;
  const many = photos.length > 1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-[#2a211d]/85 backdrop-blur-sm transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none transition-[opacity,transform] duration-300 ease-page data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 sm:p-10"
          onKeyDown={(e) => {
            if (!many || index === null) return;
            if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
            if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
          }}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {many && index !== null && (
            <p role="status" className="sr-only">
              {fmt(t.reader.photoOf, { n: index + 1, total: photos.length })}
            </p>
          )}
          {current && (
            // eslint-disable-next-line @next/next/no-img-element -- private signed URL
            <img
              src={current.url}
              alt={many && index !== null ? `${title} — ${fmt(t.reader.photoOf, { n: index + 1, total: photos.length })}` : title}
              className="max-h-full max-w-full rounded-[2px] bg-card object-contain p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-2"
            />
          )}
          <DialogPrimitive.Close
            aria-label={t.reader.closePhoto}
            className="absolute top-3 right-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/60 transition-colors hover:bg-black/85 sm:top-5 sm:right-5"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
          {many && index !== null && (
            <>
              <button
                type="button"
                aria-label={t.reader.prev}
                onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
                className="absolute left-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/60 hover:bg-black/85"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={t.reader.next}
                onClick={() => onIndexChange((index + 1) % photos.length)}
                className="absolute right-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/60 hover:bg-black/85"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
