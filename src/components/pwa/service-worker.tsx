"use client";

import { useEffect } from "react";

/** Registers the service worker in production (installability + offline page). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not fatal: the app works without it, just not offline.
    });
  }, []);
  return null;
}
