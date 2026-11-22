"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { Memory } from "@/lib/data/memories";
import type { Author, Category } from "@/lib/data/context";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { BlankPage, EndPage, MemoryPage, TitlePage, type Side } from "./book-page";
import { BookCover } from "./book-cover";
import { PagePicker } from "./page-picker";
import { PhotoLightbox } from "./photo-lightbox";

type Page = { kind: "title" } | { kind: "memory"; memory: Memory; number: number } | { kind: "end" };
/** `spread` records the layout a turn was started in; a turn from the other layout is void. */
type Turn = { dir: 1 | -1; from: number; to: number; spread: boolean };

const TURN_SECONDS = 0.85;
const TURN_EASE = [0.645, 0.045, 0.355, 1] as const;
const OPENED_KEY = "adelya:book-opened-at";
const LAST_PAGE_KEY = "adelya:book-last-page";
const COVER_TTL_MS = 12 * 60 * 60 * 1000; // the cover greets you again after 12 hours

// localStorage can throw (Safari private mode, blocked storage): never let that break the book.
function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

const noopSubscribe = () => () => {};
/** false during SSR and hydration, true afterwards — lets the first client render read the device. */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function BookReader({
  memories,
  authors,
  categories,
  meId,
  bookName,
  togetherSince,
  startId,
  added,
  truncatedFrom,
}: {
  memories: Memory[];
  authors: Author[];
  categories: Category[];
  meId: string;
  bookName: string;
  togetherSince: string | null;
  startId?: string;
  added?: boolean;
  /** Set when the book has more memories than were loaded (total count). */
  truncatedFrom?: number;
}) {
  const hydrated = useHydrated();
  // Server and hydration render a quiet placeholder of the same size, so reading the device
  // (layout, last page, cover) never causes a mismatch or a flash of the wrong page.
  if (!hydrated) return <BookPlaceholder />;
  return (
    <Reader
      memories={memories}
      authors={authors}
      categories={categories}
      meId={meId}
      bookName={bookName}
      togetherSince={togetherSince}
      startId={startId}
      added={added}
      truncatedFrom={truncatedFrom}
    />
  );
}

function BookPlaceholder() {
  return (
    <div className="flex flex-col items-center" aria-busy="true">
      <div className="book-paper aspect-[0.7] w-[min(100%,30rem,calc((100dvh-16.5rem)*0.7))] rounded-[3px] opacity-60 lg:aspect-[1.42] lg:w-[min(100%,72rem,calc((100dvh-17rem)*1.42))]" />
    </div>
  );
}

function Reader({
  memories,
  authors,
  categories,
  meId,
  bookName,
  togetherSince,
  startId,
  added,
  truncatedFrom,
}: Parameters<typeof BookReader>[0]) {
  const { t } = useI18n();
  const reduce = useReducedMotion() ?? false;
  const spread = useMediaQuery("(min-width: 1024px)");

  const pages = useMemo<Page[]>(
    () => [
      { kind: "title" },
      ...memories.map((memory, i) => ({ kind: "memory" as const, memory, number: i + 1 })),
      { kind: "end" },
    ],
    [memories],
  );
  const total = memories.length;
  const step = spread ? 2 : 1;
  const lastIndex = spread ? Math.floor((pages.length - 1) / 2) * 2 : pages.length - 1;
  const indexOf = useCallback(
    (id: string | null | undefined) => (id ? pages.findIndex((p) => p.kind === "memory" && p.memory.id === id) : -1),
    [pages],
  );

  // Linked memory → last page read → title page. (Runs on the client only, see BookReader.)
  const [rawIndex, setIndex] = useState(() => {
    const linked = indexOf(startId);
    if (linked >= 0) return linked;
    const stored = readStore(LAST_PAGE_KEY);
    const last = indexOf(stored);
    if (last >= 0) return last;
    // the remembered page was deleted: open at the newest page rather than the title page
    return stored && pages.length > 2 ? pages.length - 2 : 0;
  });
  const [opened, setOpened] = useState(() => {
    if (startId) return true;
    const at = Number(readStore(OPENED_KEY));
    return Number.isFinite(at) && Date.now() - at < COVER_TTL_MS;
  });

  const index = Math.min(spread ? rawIndex - (rawIndex % 2) : rawIndex, lastIndex);
  const [turnState, setTurn] = useState<Turn | null>(null);
  const turn = turnState && turnState.spread === spread ? turnState : null;
  const queued = useRef<number | null>(null); // target page of at most one pending turn
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ memory: Memory; i: number } | null>(null);
  const [showAdded, setShowAdded] = useState(Boolean(added));
  const sectionRef = useRef<HTMLElement>(null);
  const focusAfterOpen = useRef(false);

  const turnTo = useCallback(
    (target: number) => {
      const to = Math.max(0, Math.min(spread ? target - (target % 2) : target, lastIndex));
      if (turn) {
        queued.current = to; // latest request wins; still at most one queued turn
        return;
      }
      if (to === index) return;
      if (reduce) {
        setIndex(to);
        return;
      }
      setTurn({ dir: to > index ? 1 : -1, from: index, to, spread });
    },
    [index, lastIndex, reduce, spread, turn],
  );
  const go = useCallback((dir: 1 | -1) => turnTo((turn ? turn.to : index) + dir * step), [index, step, turn, turnTo]);

  const finishTurn = useCallback(() => {
    if (!turn) return;
    setIndex(turn.to);
    setTurn(null);
  }, [turn]);

  // Play the queued turn once the current one has settled.
  useEffect(() => {
    if (turn || queued.current === null) return;
    const target = queued.current;
    queued.current = null;
    const id = requestAnimationFrame(() => turnTo(target));
    return () => cancelAnimationFrame(id);
  }, [turn, turnTo]);

  const visibleIds = useMemo(
    () =>
      (spread ? [index, index + 1] : [index]).flatMap((i) => {
        const p = pages[i];
        return p?.kind === "memory" ? [p.memory.id] : [];
      }),
    [index, pages, spread],
  );

  // URL + "last page read": keep pointing at the memory on screen, without a navigation.
  // If the linked memory is still visible (e.g. right page of a spread) it stays the link.
  useEffect(() => {
    if (!opened) return;
    const current = new URLSearchParams(window.location.search).get("m");
    const id = current && visibleIds.includes(current) ? current : visibleIds[0];
    const url = id ? `/book?m=${id}` : "/book";
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
    if (id) writeStore(LAST_PAGE_KEY, id);
  }, [opened, visibleIds]);

  useEffect(() => {
    if (opened) writeStore(OPENED_KEY, String(Date.now()));
  }, [opened]);

  // After the cover opens, move focus into the book so keyboard users start there.
  useEffect(() => {
    if (opened && focusAfterOpen.current) {
      focusAfterOpen.current = false;
      sectionRef.current?.focus({ preventScroll: true });
    }
  }, [opened]);

  // Preload photos of neighbouring spreads so a turn never reveals a loading image.
  useEffect(() => {
    for (let i = index - step * 2; i <= index + step * 3; i++) {
      const p = pages[i];
      if (p?.kind === "memory") p.memory.photos.forEach((ph) => (new Image().src = ph.url));
    }
  }, [index, pages, step]);

  useEffect(() => {
    if (!showAdded) return;
    const id = setTimeout(() => setShowAdded(false), 4000);
    return () => clearTimeout(id);
  }, [showAdded]);

  // Keyboard: ← → Home End — only plain keys, never while typing, in a dialog or on another widget.
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          "input, textarea, select, [contenteditable], [role=dialog], [role=menu], [role=menuitem], [role=tab], [role=slider], [role=radio], [role=listbox]",
        ) ||
        pickerOpen ||
        lightbox
      )
        return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Home") turnTo(0);
      else if (e.key === "End") turnTo(lastIndex);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, lastIndex, lightbox, opened, pickerOpen, turnTo]);

  // Touch / pen swipe (vertical scrolling stays native thanks to touch-action: pan-y).
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  };

  const renderPage = (i: number, side: Side, interactive = true) => {
    const p = pages[i];
    if (!p) return <BlankPage side={side} />;
    if (p.kind === "title")
      return <TitlePage side={side} bookName={bookName} authors={authors} togetherSince={togetherSince} count={total} />;
    if (p.kind === "end") return <EndPage side={side} empty={total === 0} interactive={interactive} />;
    return (
      <MemoryPage
        memory={p.memory}
        side={side}
        number={p.number}
        meId={meId}
        authors={authors}
        categories={categories}
        interactive={interactive}
        onOpenPhoto={(photo) => setLightbox({ memory: p.memory, i: photo })}
      />
    );
  };

  const visiblePages = (spread ? [index, index + 1] : [index]).map((i) => pages[i]).filter(Boolean);
  const visibleNumbers = visiblePages.flatMap((p) => (p.kind === "memory" ? [p.number] : []));
  const position =
    total === 0
      ? t.reader.emptyTitle
      : visibleNumbers.length === 2
        ? fmt(t.reader.spreadOf, { a: visibleNumbers[0], b: visibleNumbers[1], total })
        : visibleNumbers.length === 1
          ? fmt(t.reader.pageOf, { n: visibleNumbers[0], total })
          : index === 0
            ? t.reader.titlePageShort
            : t.reader.endPage;
  const firstVisibleMemory = visiblePages.find((p) => p.kind === "memory");
  const announcement =
    firstVisibleMemory?.kind === "memory" ? `${position}: ${firstVisibleMemory.memory.title}` : position;

  const atStart = index === 0;
  const atEnd = index >= lastIndex;

  if (!opened) {
    return (
      <BookCover
        bookName={bookName}
        authorNames={authors.map((a) => a.name).join(" & ")}
        onOpened={() => {
          focusAfterOpen.current = true;
          setOpened(true);
        }}
      />
    );
  }

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="book-title"
      className="relative flex flex-col items-center outline-none"
    >
      <h1 id="book-title" className="sr-only">
        {bookName}
      </h1>
      <p aria-live="polite" className="sr-only">
        {turn ? "" : announcement}
      </p>

      <AnimatePresence>
        {showAdded && (
          <motion.p
            role="status"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute top-2 left-1/2 z-40 -translate-x-1/2 rounded-sm border border-wine/20 bg-rose-wash px-4 py-2 text-sm whitespace-nowrap text-wine shadow-[0_8px_20px_-12px_rgba(64,52,47,0.5)]"
          >
            {t.reader.added}
          </motion.p>
        )}
      </AnimatePresence>

      {truncatedFrom !== undefined && truncatedFrom > total && (
        <p className="mb-3 text-center text-xs text-ink-soft">{fmt(t.reader.truncated, { n: total })}</p>
      )}

      {/* The book */}
      <motion.div
        initial={added && !reduce ? { opacity: 0, y: 14, scale: 0.985 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        className={cn(
          "relative touch-pan-y",
          spread
            ? "aspect-[1.42] w-[min(100%,72rem,calc((100dvh-17rem)*1.42))]"
            : "aspect-[0.7] w-[min(100%,30rem,calc((100dvh-16.5rem)*0.7))]",
        )}
        style={{ perspective: spread ? 1700 : 1150 }}
      >
        {/* hard cover peeking out around the pages */}
        <div aria-hidden className="absolute -inset-[1.4%] rounded-[5px] bg-book-cloth shadow-[0_28px_50px_-26px_rgba(64,52,47,0.75)]" />
        <div className="book-block absolute inset-0 rounded-[3px]">
          {spread ? (
            <SpreadView index={index} turn={turn} renderPage={renderPage} onDone={finishTurn} />
          ) : (
            <SingleView index={index} turn={turn} renderPage={renderPage} onDone={finishTurn} />
          )}
        </div>
      </motion.div>

      {/* Navigation */}
      <nav aria-label={t.reader.pageNav} className="mt-5 flex w-full max-w-xl items-center justify-between gap-1 sm:mt-6 sm:gap-2">
        <NavButton label={t.reader.first} onClick={() => turnTo(0)} disabled={atStart}>
          <ChevronFirst aria-hidden />
        </NavButton>
        <NavButton label={t.reader.prev} onClick={() => go(-1)} disabled={atStart}>
          <ChevronLeft aria-hidden />
        </NavButton>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${t.reader.pages} — ${position}`}
          className="inline-flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm px-2 text-sm text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink"
        >
          <LayoutGrid className="size-4 shrink-0" aria-hidden />
          <span className="truncate font-display text-[1.05rem] text-ink tabular-nums lining-nums">{position}</span>
        </button>

        <NavButton label={t.reader.next} onClick={() => go(1)} disabled={atEnd}>
          <ChevronRight aria-hidden />
        </NavButton>
        <NavButton label={t.reader.last} onClick={() => turnTo(lastIndex)} disabled={atEnd}>
          <ChevronLast aria-hidden />
        </NavButton>
      </nav>
      {!spread && total > 0 && <p className="mt-2 text-xs text-ink-soft lg:hidden">{t.reader.swipeHint}</p>}

      <PagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        memories={memories}
        currentNumbers={visibleNumbers}
        meId={meId}
        onPick={(n) => {
          setPickerOpen(false);
          turnTo(n); // page index of memory n is n (title page is 0)
        }}
      />
      <PhotoLightbox
        photos={lightbox?.memory.photos ?? []}
        index={lightbox?.i ?? null}
        title={lightbox?.memory.title ?? ""}
        onIndexChange={(i) => setLightbox((l) => (l ? { ...l, i } : l))}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}

/** aria-disabled instead of disabled: the button keeps focus when it becomes unavailable. */
function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick()}
      aria-disabled={disabled || undefined}
      aria-label={label}
      title={label}
      className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-input text-ink transition-[background-color,border-color,transform,opacity] duration-150 hover:border-ink/40 hover:bg-card active:scale-95 aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:border-input aria-disabled:hover:bg-transparent aria-disabled:active:scale-100 min-[380px]:size-11 [&_svg]:size-5"
    >
      {children}
    </button>
  );
}

// ── Views ──────────────────────────────────────────────────────────────────────

type ViewProps = {
  index: number;
  turn: Turn | null;
  renderPage: (i: number, side: Side, interactive?: boolean) => React.ReactNode;
  onDone: () => void;
};

/** Two pages side by side; a turning leaf rotates around the spine. */
function SpreadView({ index, turn, renderPage, onDone }: ViewProps) {
  const leftIdx = turn ? (turn.dir === 1 ? turn.from : turn.to) : index;
  const rightIdx = turn ? (turn.dir === 1 ? turn.to + 1 : turn.from + 1) : index + 1;
  return (
    <div className="relative size-full">
      <div className="absolute inset-0 flex">
        <div className="relative h-full w-1/2">{renderPage(leftIdx, "left")}</div>
        <div className="relative h-full w-1/2">{renderPage(rightIdx, "right")}</div>
      </div>
      {/* spine */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[3px] -translate-x-1/2 bg-gradient-to-r from-[#40342f]/10 via-[#40342f]/30 to-[#40342f]/10" />
      {turn && (
        <Leaf
          key={`${turn.from}-${turn.to}`}
          dir={turn.dir}
          mode="spread"
          front={renderPage(turn.dir === 1 ? turn.from + 1 : turn.from, turn.dir === 1 ? "right" : "left", false)}
          back={renderPage(turn.dir === 1 ? turn.to : turn.to + 1, turn.dir === 1 ? "left" : "right", false)}
          onDone={onDone}
        />
      )}
    </div>
  );
}

/** One page; the leaf turns around the left edge like a notebook. */
function SingleView({ index, turn, renderPage, onDone }: ViewProps) {
  const under = turn ? (turn.dir === 1 ? turn.to : turn.from) : index;
  return (
    <div className="relative size-full">
      <div className="absolute inset-0">{renderPage(under, "single")}</div>
      {turn && (
        <Leaf
          key={`${turn.from}-${turn.to}`}
          dir={turn.dir}
          mode="single"
          front={renderPage(turn.dir === 1 ? turn.from : turn.to, "single", false)}
          back={<BlankPage side="single" />}
          onDone={onDone}
        />
      )}
    </div>
  );
}

/**
 * The turning leaf. Front face is the page being lifted, back face the page revealed.
 * A light sheen and a cast shadow follow the angle so the paper reads as a physical sheet.
 */
function Leaf({
  dir,
  mode,
  front,
  back,
  onDone,
}: {
  dir: 1 | -1;
  mode: "spread" | "single";
  front: React.ReactNode;
  back: React.ReactNode;
  onDone: () => void;
}) {
  // spread: forward leaf is the right page swinging left (0 → -180), backward the left page swinging right (0 → 180)
  // single: forward lifts the page away (0 → -180), backward brings the previous page back (-180 → 0)
  const fromAngle = mode === "single" && dir === -1 ? -180 : 0;
  const toAngle = mode === "single" ? (dir === 1 ? -180 : 0) : dir === 1 ? -180 : 180;
  const rot = useMotionValue(fromAngle);
  const lift = useTransform(rot, (r) => Math.sin((Math.abs(r) * Math.PI) / 180)); // 0 flat → 1 upright
  // The sheet rises toward the reader and bows slightly while upright, instead of turning as a
  // rigid card: with the stronger perspective this reads as paper bending, not a page flattening.
  const z = useTransform(lift, [0, 1], [0, mode === "single" ? 36 : 54]);
  const bow = useTransform(lift, [0, 1], [1, 1.022]);

  // Safety net: if the animation never reports completion (tab hidden mid-turn, interrupted
  // frame loop), finish the turn anyway so the book can never get stuck between pages.
  const done = useRef(false);
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);
  useEffect(() => {
    const id = setTimeout(finish, TURN_SECONDS * 1000 + 600);
    return () => clearTimeout(id);
  }, [finish]);

  const origin = mode === "single" ? "left center" : dir === 1 ? "left center" : "right center";
  const position = mode === "single" ? "inset-0" : dir === 1 ? "inset-y-0 left-1/2 w-1/2" : "inset-y-0 left-0 w-1/2";
  const frontSide: Side = mode === "single" ? "single" : dir === 1 ? "right" : "left";
  const backSide: Side = mode === "single" ? "single" : dir === 1 ? "left" : "right";

  return (
    <>
      <CastShadow lift={lift} mode={mode} dir={dir} />
      <motion.div
        aria-hidden
        inert
        className={cn("pointer-events-none absolute z-30", position)}
        style={{ rotateY: rot, z, scaleY: bow, transformOrigin: origin, transformStyle: "preserve-3d" }}
        animate={{ rotateY: toAngle }}
        transition={{ duration: TURN_SECONDS, ease: TURN_EASE }}
        onAnimationComplete={finish}
      >
        <Face>
          {front}
          <Sheen lift={lift} side={frontSide} />
        </Face>
        <Face back>
          {back}
          <Sheen lift={lift} side={backSide} />
        </Face>
      </motion.div>
    </>
  );
}

function Face({ back, children }: { back?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: back ? "rotateY(180deg)" : undefined }}
    >
      {children}
    </div>
  );
}

function Sheen({ lift, side }: { lift: MotionValue<number>; side: Side }) {
  const opacity = useTransform(lift, [0, 1], [0, 0.6]);
  const curl = useTransform(lift, [0, 0.3, 1], [0, 0.55, 1]);
  // "from" = the edge at the spine/hinge; the curl band sits at the free edge of the sheet.
  const toFree = side === "left" ? "to left" : "to right";
  return (
    <>
      <motion.span
        className="pointer-events-none absolute inset-0"
        style={{
          opacity,
          background: `linear-gradient(${toFree}, rgba(64,52,47,0.38) 0%, rgba(64,52,47,0.08) 22%, transparent 45%, rgba(255,255,255,0.22) 78%, transparent 100%)`,
        }}
      />
      <motion.span
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: curl,
          background: `linear-gradient(${toFree}, transparent 70%, rgba(255,255,255,0.28) 84%, rgba(64,52,47,0.22) 93%, rgba(64,52,47,0.42) 100%)`,
        }}
      />
    </>
  );
}

function CastShadow({ lift, mode, dir }: { lift: MotionValue<number>; mode: "spread" | "single"; dir: 1 | -1 }) {
  const opacity = useTransform(lift, [0, 1], [0, 0.32]);
  const pos =
    mode === "single"
      ? "inset-0 bg-gradient-to-r from-[#40342f] to-transparent"
      : dir === 1
        ? "inset-y-0 left-1/2 w-1/2 bg-gradient-to-r from-[#40342f] via-[#40342f]/40 to-transparent"
        : "inset-y-0 left-0 w-1/2 bg-gradient-to-l from-[#40342f] via-[#40342f]/40 to-transparent";
  return <motion.span aria-hidden className={cn("pointer-events-none absolute z-20", pos)} style={{ opacity }} />;
}
