"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SIGNED = "/storage/v1/object/sign/";
const MIN_GAP_MS = 60_000;

/**
 * Photo URLs are signed for one hour. When a page stays open longer, the images start failing:
 * on the first failed signed image, re-render the server components once to get fresh URLs.
 * One capture-phase listener covers every <img> in the app.
 */
export function PhotoUrlRefresher() {
  const router = useRouter();
  useEffect(() => {
    let last = 0;
    const onError = (e: Event) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.currentSrc.includes(SIGNED)) return;
      const now = Date.now();
      if (now - last < MIN_GAP_MS) return;
      last = now;
      router.refresh();
    };
    document.addEventListener("error", onError, true);
    return () => document.removeEventListener("error", onError, true);
  }, [router]);
  return null;
}
