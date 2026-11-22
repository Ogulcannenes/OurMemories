"use client";

import { useEffect, useId, useRef, useState, startTransition, useActionState } from "react";
import { ChevronDown, ImagePlus, Loader2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { saveMemory } from "@/lib/actions/memories";
import { initialState, type ActionState } from "@/lib/actions/state";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/env";
import { PhotoError, preparePhoto, type PreparedPhoto } from "@/lib/image";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MemoryFormValues = {
  id: string;
  title: string;
  quote: string;
  story: string;
  occurredOn: string;
  categoryId: string;
  tags: string[];
  photos: { path: string; url: string }[];
};

type Photo = { key: string } & (
  | { kind: "existing"; path: string; url: string }
  | { kind: "new"; prepared: PreparedPhoto; preview: string; uploadedPath: string | null }
);

const MAX_TAGS = 8;
const MAX_PHOTOS = 10;
const DRAFT_KEY = "adelya:draft:new";

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MemoryForm({
  spaceId,
  categories,
  tagSuggestions,
  initial,
}: {
  spaceId: string;
  categories: { id: string; label: string }[];
  tagSuggestions: string[];
  initial?: MemoryFormValues;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const uid = useId();
  const editing = Boolean(initial?.id);

  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [photos, setPhotos] = useState<Photo[]>(
    () => initial?.photos.map((p) => ({ key: p.path, kind: "existing" as const, ...p })) ?? [],
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [draftStory, setDraftStory] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [showMore, setShowMore] = useState(
    Boolean(initial?.story || initial?.tags.length || initial?.photos.length),
  );
  const dateRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Draft safety for new memories: a mis-tap away must not lose a half-written quote.
  const saveDraft = () => {
    const form = formRef.current;
    if (editing || !form) return;
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const draft = { quote: value("quote"), title: value("title"), story: value("story") };
    try {
      if (draft.quote || draft.title || draft.story) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage unavailable: no draft, nothing breaks */
    }
  };
  const onFormInput = () => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(saveDraft, 500);
  };
  useEffect(() => {
    if (editing || !formRef.current) return;
    let draft: Record<string, string> | null = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    } catch {
      draft = null;
    }
    if (!draft) return;
    for (const name of ["quote", "title"] as const) {
      const el = formRef.current.elements.namedItem(name) as HTMLInputElement | null;
      if (el && !el.value && draft[name]) el.value = draft[name];
    }
    // The story field lives in the collapsed section (not in the DOM yet): open it with the draft text.
    // One-time sync from localStorage (an external store) on mount — not a render cascade.
    if (draft.story) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftStory(draft.story);
      setShowMore(true);
    }
    return () => clearTimeout(draftTimer.current);
  }, [editing]);

  // New memories default to the user's local "today" (the server doesn't know their timezone).
  useEffect(() => {
    if (!initial && dateRef.current && !dateRef.current.dataset.touched) dateRef.current.value = localToday();
  }, [initial]);

  // Preview object URLs: released when a photo is removed, and all of them on unmount.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  const removePhoto = (key: string) =>
    setPhotos((list) => {
      const gone = list.find((p) => p.key === key);
      if (gone?.kind === "new") {
        URL.revokeObjectURL(gone.preview);
        previews.current.delete(gone.preview);
      }
      return list.filter((p) => p.key !== key);
    });

  const submit = async (prev: ActionState, form: FormData): Promise<ActionState> => {
    form.delete("tags");
    tags.forEach((tag) => form.append("tags", tag));

    // Upload whatever is not uploaded yet (in parallel), then send the ordered list of paths.
    const bucket = createClient().storage.from(PHOTO_BUCKET);
    const uploads = await Promise.all(
      photos.map(async (p) => {
        if (p.kind === "existing") return p.path;
        if (p.uploadedPath) return p.uploadedPath;
        const path = `${spaceId}/${crypto.randomUUID()}.${p.prepared.ext}`;
        const { error } = await bucket.upload(path, p.prepared.blob, { contentType: p.prepared.type, upsert: false });
        if (error) return null;
        setPhotos((list) => list.map((x) => (x.key === p.key && x.kind === "new" ? { ...x, uploadedPath: path } : x)));
        return path;
      }),
    );
    if (uploads.includes(null)) return { error: t.form.photoUploadFailed };
    form.delete("photos");
    uploads.forEach((path) => form.append("photos", path!));

    try {
      clearTimeout(draftTimer.current);
      if (!editing) {
        try {
          localStorage.removeItem(DRAFT_KEY); // success redirects away; on failure it is written again below
        } catch {
          /* ignore */
        }
      }
      const result = await saveMemory(prev, form); // redirects to the memory on success
      // A database failure removes the uploaded file server-side: upload again next time.
      if (result?.error) setPhotos((list) => list.map((p) => (p.kind === "new" ? { ...p, uploadedPath: null } : p)));
      if (result?.error || result?.fieldErrors) saveDraft();
      return result ?? prev;
    } catch (e) {
      // redirect() is delivered as a thrown control-flow signal — let it through.
      if (e && typeof e === "object" && "digest" in e) throw e;
      return { error: t.common.genericError };
    }
  };

  const [state, dispatch, pending] = useActionState(submit, initialState);
  const errors = state.fieldErrors ?? {};

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => dispatch(form));
  };

  const onPickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const room = MAX_PHOTOS - photos.length;
    const all = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!all.length) return;
    const files = all.slice(0, Math.max(room, 0));
    setPhotoError(all.length > files.length ? fmt(t.form.photosMax, { max: MAX_PHOTOS }) : null);
    setPreparing(true);
    try {
      const results = await Promise.allSettled(files.map(preparePhoto));
      const added: Photo[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") {
          const preview = URL.createObjectURL(r.value.blob);
          previews.current.add(preview);
          added.push({ key: crypto.randomUUID(), kind: "new", prepared: r.value, preview, uploadedPath: null });
        } else {
          setPhotoError(
            r.reason instanceof PhotoError && r.reason.reason === "too_large" ? t.form.photoTooLarge : t.form.photoUnsupported,
          );
        }
      }
      setPhotos((list) => [...list, ...added].slice(0, MAX_PHOTOS));
    } finally {
      setPreparing(false);
    }
  };

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").slice(0, 32);
    if (!tag || tags.length >= MAX_TAGS) return;
    if (tags.some((x) => x.toLocaleLowerCase() === tag.toLocaleLowerCase())) return;
    setTags([...tags, tag]);
  };

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
      setTagDraft("");
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };


  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={onFormInput} noValidate className="space-y-9">
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      {/* The photos this form was opened with: the server only removes photos from this set. */}
      {initial?.photos.map((p) => <input key={p.path} type="hidden" name="shown_photos" value={p.path} />)}

      {/* 1 — the quote is the point: first, largest, focused. */}
      <div>
        <label htmlFor={`${uid}-quote`} className="eyebrow">
          {t.form.quote}
        </label>
        <div className="relative mt-3">
          <span aria-hidden className="pointer-events-none absolute top-1 left-0 font-display text-5xl leading-none text-wine/60 select-none">
            “
          </span>
          <textarea
            id={`${uid}-quote`}
            name="quote"
            required
            autoFocus={!editing}
            maxLength={2000}
            rows={3}
            defaultValue={initial?.quote}
            placeholder={t.form.quotePlaceholder}
            aria-invalid={Boolean(errors.quote) || undefined}
            aria-describedby={errors.quote ? `${uid}-quote-err` : undefined}
            className="block min-h-28 w-full resize-none border-0 border-b border-input bg-transparent pt-2 pb-4 pl-9 font-display text-[1.65rem] leading-snug text-ink italic outline-none [field-sizing:content] placeholder:text-ink-soft focus:border-wine aria-invalid:border-destructive sm:text-[2rem]"
          />
        </div>
        <FieldError id={`${uid}-quote-err`} message={errors.quote} />
      </div>

      {/* 2 — title + date */}
      <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor={`${uid}-title`} className="eyebrow">
            {t.form.title} <span className="tracking-normal normal-case">· {t.common.optional}</span>
          </label>
          <input
            id={`${uid}-title`}
            name="title"
            maxLength={120}
            defaultValue={initial?.title}
            placeholder={t.form.titlePlaceholder}
            aria-invalid={Boolean(errors.title) || undefined}
            className="field mt-2"
          />
          <FieldError message={errors.title} />
        </div>
        <div>
          <label htmlFor={`${uid}-date`} className="eyebrow">
            {t.form.date}
          </label>
          <input
            ref={dateRef}
            id={`${uid}-date`}
            name="occurred_on"
            type="date"
            required
            defaultValue={initial?.occurredOn}
            onChange={(e) => (e.currentTarget.dataset.touched = "1")}
            aria-invalid={Boolean(errors.occurred_on) || undefined}
            className="field mt-2"
          />
          <FieldError message={errors.occurred_on} />
        </div>
      </div>

      {/* 3 — category as a row of tabs-like chips */}
      <fieldset>
        <legend className="eyebrow">{t.form.category}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[{ id: "", label: t.form.noCategory }, ...categories].map((c) => (
            <label key={c.id || "none"} className="cursor-pointer">
              <input
                type="radio"
                name="category_id"
                value={c.id}
                defaultChecked={(initial?.categoryId ?? "") === c.id}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-10 items-center rounded-sm border border-input px-3.5 text-[0.8125rem] font-medium text-ink-soft transition-colors peer-checked:border-button peer-checked:bg-button peer-checked:text-button-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-wine/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper hover:border-ink/40 hover:text-ink peer-checked:hover:text-button-foreground">
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 4 — the rest is optional and tucked away */}
      <div className="border-t border-rule pt-6">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          aria-controls={`${uid}-more`}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-ink"
        >
          {t.form.more}
          <ChevronDown className={cn("size-4 text-ink-soft transition-transform duration-300", showMore && "rotate-180")} aria-hidden />
        </button>

        <AnimatePresence initial={false}>
          {showMore && (
            <motion.div
              id={`${uid}-more`}
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-8 pt-6">
                <div>
                  <label htmlFor={`${uid}-story`} className="eyebrow">
                    {t.form.story}
                  </label>
                  <textarea
                    id={`${uid}-story`}
                    name="story"
                    rows={5}
                    maxLength={10000}
                    defaultValue={initial?.story ?? draftStory}
                    placeholder={t.form.storyPlaceholder}
                    aria-invalid={Boolean(errors.story) || undefined}
                    className="field mt-2 min-h-32 resize-y leading-relaxed [field-sizing:content]"
                  />
                  <FieldError message={errors.story} />
                </div>

                <div>
                  <span className="eyebrow" id={`${uid}-photo-label`}>
                    {t.form.photo}
                  </span>
                  <input
                    ref={fileRef}
                    id={`${uid}-photo`}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPickPhotos}
                    tabIndex={-1}
                    className="sr-only"
                    aria-labelledby={`${uid}-photo-label`}
                  />
                  {photos.length > 0 ? (
                    <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 pt-1 pr-3 sm:grid-cols-3">
                      {photos.map((p, i) => (
                        <li key={p.key} className="relative">
                          <div
                            className="polaroid p-2 pb-6 shadow-[0_8px_22px_-12px_rgba(40,30,26,0.55)]"
                            style={{ rotate: `${[-1.5, 1.2, -0.6, 1.8, -1.1][i % 5]}deg` }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- local blob / private signed URL */}
                            <img src={p.kind === "new" ? p.preview : p.url} alt="" className="aspect-[4/3] w-full object-cover" />
                            {i === 0 && (
                              <span className="polaroid-caption absolute bottom-1 left-2.5 font-display text-[0.8rem] italic">
                                {t.form.coverPhoto}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(p.key)}
                            aria-label={fmt(t.form.removePhotoN, { n: i + 1 })}
                            className="absolute -top-2.5 -right-2.5 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-rule bg-card text-ink-soft shadow-sm transition-colors hover:text-destructive"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </li>
                      ))}
                      {photos.length < MAX_PHOTOS && (
                        <li>
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={preparing}
                            className="flex h-full min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-input bg-card/50 text-center transition-colors hover:border-wine/50 hover:bg-card"
                          >
                            {preparing ? (
                              <Loader2 className="size-5 animate-spin text-ink-soft" aria-hidden />
                            ) : (
                              <ImagePlus className="size-5 text-wine" aria-hidden />
                            )}
                            <span className="text-sm font-semibold text-ink">{t.form.addMorePhotos}</span>
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={preparing}
                      className="mt-2 flex w-full cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed border-input bg-card/50 px-4 py-8 text-center transition-colors hover:border-wine/50 hover:bg-card"
                    >
                      {preparing ? (
                        <Loader2 className="size-5 animate-spin text-ink-soft" aria-hidden />
                      ) : (
                        <ImagePlus className="size-5 text-wine" aria-hidden />
                      )}
                      <span className="text-sm font-semibold text-ink">{t.form.addPhotos}</span>
                      <span className="text-xs text-ink-soft">{t.form.photoHint}</span>
                    </button>
                  )}
                  <FieldError message={photoError ?? errors.photos} />
                </div>

                <div>
                  <label htmlFor={`${uid}-tags`} className="eyebrow">
                    {t.form.tags}
                  </label>
                  <div className="field mt-2 flex flex-wrap items-center gap-1.5 py-2 focus-within:border-wine focus-within:bg-card">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-sm bg-paper-deep py-1 pr-1 pl-2 text-[0.8125rem] text-ink"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((x) => x !== tag))}
                          aria-label={fmt(t.form.removeTag, { tag })}
                          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-ink-soft hover:bg-rule hover:text-ink"
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </span>
                    ))}
                    <input
                      id={`${uid}-tags`}
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={onTagKey}
                      onBlur={() => {
                        addTag(tagDraft);
                        setTagDraft("");
                      }}
                      list={`${uid}-tag-list`}
                      maxLength={32}
                      disabled={tags.length >= MAX_TAGS}
                      placeholder={tags.length >= MAX_TAGS ? "" : t.form.tagsPlaceholder}
                      aria-describedby={`${uid}-tags-hint`}
                      className="min-h-9 min-w-[9rem] flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-ink-soft"
                    />
                    <datalist id={`${uid}-tag-list`}>
                      {tagSuggestions
                        .filter((s) => !tags.some((x) => x.toLocaleLowerCase() === s.toLocaleLowerCase()))
                        .map((s) => (
                          <option key={s} value={s} />
                        ))}
                    </datalist>
                  </div>
                  <p id={`${uid}-tags-hint`} className="mt-1.5 text-xs text-ink-soft">
                    {t.form.tagsHint}
                  </p>
                  <FieldError message={errors.tags} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 flex flex-col-reverse gap-3 border-t border-rule bg-paper/95 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:bg-transparent sm:px-0 sm:pt-6 sm:pb-0 sm:backdrop-blur-none">
        {state.error && (
          <p role="alert" className="text-sm text-destructive sm:mr-auto">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending || preparing} className="w-full sm:w-auto">
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? t.common.saving : editing ? t.form.update : t.form.create}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[0.8125rem] text-destructive">
      {message}
    </p>
  );
}
