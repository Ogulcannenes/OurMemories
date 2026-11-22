"use client";

import { useState } from "react";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { PhotoLightbox } from "./photo-lightbox";

/** Photos on the memory detail page; any of them opens the full-screen viewer. Grid adapts to 1–n photos. */
export function PhotoGallery({ photos, title }: { photos: { url: string }[]; title: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return null;

  return (
    <>
      <div className={cn("grid gap-2 sm:gap-3", photos.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {photos.map((p, i) => (
          <button
            key={p.url}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={t.reader.openPhoto}
            className={cn(
              "group cursor-zoom-in overflow-hidden rounded-sm border border-rule bg-card p-2 transition-colors hover:border-ink/25 sm:p-3",
              photos.length === 3 && i === 0 && "col-span-2",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- private signed URL, resized on upload */}
            <img
              src={p.url}
              alt={fmt(t.reader.photoAlt, { title })}
              className={cn(
                "w-full rounded-[2px] transition-transform duration-500 ease-page group-hover:scale-[1.01]",
                photos.length === 1 ? "max-h-[70vh] object-contain" : "aspect-[4/3] object-cover",
              )}
            />
          </button>
        ))}
      </div>
      <PhotoLightbox photos={photos} index={open} title={title} onIndexChange={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
