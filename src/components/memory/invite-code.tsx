"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

/** The pairing code, set like a stamp, with a copy button. */
export function InviteCode({ code }: { code: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the code stays selectable.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="rounded-sm border border-dashed border-wine/40 bg-rose-wash px-4 py-2.5 font-mono text-xl font-semibold tracking-[0.3em] text-wine select-all sm:text-2xl">
        {code.slice(0, 4)}
        <span className="text-wine/40">-</span>
        {code.slice(4)}
      </code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-input px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
      >
        {copied ? <Check className="size-4 text-wine" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span aria-live="polite">{copied ? t.settings.copied : t.settings.copy}</span>
      </button>
    </div>
  );
}
