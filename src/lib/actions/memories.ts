"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { getAppContext } from "@/lib/data/context";
import { getMemory, isUuid, type Memory } from "@/lib/data/memories";
import { PHOTO_BUCKET } from "@/lib/env";
import { mergeEditedPhotos } from "@/lib/memory-photos";
import { fmt } from "@/lib/i18n";
import type { ActionState } from "./state";

const LIMITS = { title: 120, quote: 2000, story: 10000, tag: 32, tags: 8, photos: 10 } as const;

/** First words of the quote, without surrounding quotation marks, cut on a word boundary. */
function titleFromQuote(quote: string) {
  const plain = quote.replace(/^[\s"'«»“”„‘’]+|[\s"'«»“”„‘’]+$/g, "").replace(/\s+/g, " ");
  if (plain.length <= 60) return plain || quote.slice(0, 60);
  const cut = plain.slice(0, 60);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 30))}…`;
}

export async function saveMemory(_: ActionState, form: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const { t } = ctx;
  const photoPattern = new RegExp(`^${ctx.space.id}/[0-9a-f-]{36}\\.(webp|jpg|png)$`);

  const schema = z.object({
    id: z.union([z.literal(""), z.uuid()]),
    // Optional in the form: a memory can be saved with just the quote.
    title: z.string().trim().max(LIMITS.title, fmt(t.form.tooLong, { max: LIMITS.title })),
    quote: z.string().trim().min(1, t.form.required).max(LIMITS.quote, fmt(t.form.tooLong, { max: LIMITS.quote })),
    story: z.string().trim().max(LIMITS.story, fmt(t.form.tooLong, { max: LIMITS.story })),
    occurred_on: z.iso.date(t.form.dateInvalid),
    category_id: z.union([z.literal(""), z.uuid()]),
    photos: z
      .array(z.string().regex(photoPattern))
      .max(LIMITS.photos, fmt(t.form.photosMax, { max: LIMITS.photos }))
      .refine((p) => new Set(p).size === p.length),
    tags: z.array(z.string().trim().min(1).max(LIMITS.tag)).max(LIMITS.tags, t.form.tagsHint),
  });

  const parsed = schema.safeParse({
    id: form.get("id") ?? "",
    title: form.get("title") ?? "",
    quote: form.get("quote") ?? "",
    story: form.get("story") ?? "",
    occurred_on: form.get("occurred_on") ?? "",
    category_id: form.get("category_id") ?? "",
    photos: form.getAll("photos").map(String),
    tags: form.getAll("tags").map(String),
  });

  const storage = ctx.supabase.storage.from(PHOTO_BUCKET);
  const submitted = form.getAll("photos").map(String).filter((p) => photoPattern.test(p));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  const d = parsed.data;
  const values = {
    title: d.title || titleFromQuote(d.quote),
    quote: d.quote,
    story: d.story || null,
    occurred_on: d.occurred_on,
    category_id: d.category_id || null,
  };

  let id = d.id;
  let previous: string[] = [];
  // Files uploaded for this save that the database does not reference yet (cleaned up on failure).
  const fresh = () => submitted.filter((p) => !previous.includes(p));
  const removeFresh = async () => {
    if (fresh().length) await storage.remove(fresh());
  };

  if (id) {
    const { data: existing } = await ctx.supabase.from("memories").select("id, memory_photos(path)").eq("id", id).maybeSingle();
    if (!existing) {
      await removeFresh();
      return { error: t.memory.notFoundBody };
    }
    previous = existing.memory_photos.map((p) => p.path);
    const merged = mergeEditedPhotos(previous, form.getAll("shown_photos").map(String), d.photos);
    if (merged.photos.length > LIMITS.photos) {
      await removeFresh();
      // `error` (not fieldErrors) so the form knows its uploads were removed and re-uploads.
      return { error: fmt(t.form.photosMax, { max: LIMITS.photos }) };
    }
    d.photos = merged.photos;
    const { error } = await ctx.supabase.from("memories").update(values).eq("id", id);
    if (error) {
      await removeFresh();
      return { error: t.common.genericError };
    }
  } else {
    const { data, error } = await ctx.supabase
      .from("memories")
      .insert({ ...values, space_id: ctx.space.id })
      .select("id")
      .single();
    if (error || !data) {
      await removeFresh();
      return { error: t.common.genericError };
    }
    id = data.id;
  }

  // Photos are part of the page: if they cannot be attached, a new memory is undone (so a retry
  // does not create it twice) and an edit reports the error with its old photos intact.
  const { error: photoError } = await ctx.supabase.rpc("set_memory_photos", { p_memory: id, p_paths: d.photos });
  if (photoError) {
    console.error("set_memory_photos failed", photoError.code);
    await removeFresh();
    if (!d.id) await ctx.supabase.from("memories").delete().eq("id", id);
    return { error: t.form.photoUploadFailed };
  }

  // Tags are secondary: the memory itself is already saved, so a tag failure must not leave the
  // form in "create" mode (a retry would insert the memory twice). Continue to the saved page.
  const { error: tagError } = await ctx.supabase.rpc("set_memory_tags", { p_memory: id, p_names: d.tags });
  if (tagError) console.error("set_memory_tags failed", tagError.code);

  const dropped = previous.filter((p) => !d.photos.includes(p));
  if (dropped.length) await storage.remove(dropped);

  // Back to the book, opened at the new or edited page.
  redirect(d.id ? `/book?m=${id}` : `/book?m=${id}&added=1`);
}

export async function deleteMemory(id: string): Promise<ActionState> {
  const ctx = await getAppContext();
  if (!isUuid(id)) return { error: ctx.t.common.genericError };

  // Photo rows go with the memory (cascade); read their files first so storage is cleaned too.
  const { data: photos } = await ctx.supabase.from("memory_photos").select("path").eq("memory_id", id);
  const { error } = await ctx.supabase.from("memories").delete().eq("id", id);
  if (error) return { error: ctx.t.common.genericError };
  const paths = (photos ?? []).map((p) => p.path);
  if (paths.length) await ctx.supabase.storage.from(PHOTO_BUCKET).remove(paths);
  redirect("/book");
}

export async function setFavorite(id: string, favorite: boolean): Promise<ActionState> {
  const ctx = await getAppContext();
  if (!isUuid(id)) return { error: ctx.t.common.genericError };

  const { error } = favorite
    ? await ctx.supabase.from("favorites").upsert({ memory_id: id }, { onConflict: "user_id,memory_id", ignoreDuplicates: true })
    : await ctx.supabase.from("favorites").delete().eq("memory_id", id).eq("user_id", ctx.user.id);
  if (error) return { error: ctx.t.common.genericError };
  refresh();
  return { ok: true };
}

/** "Remember this?" — a random page, preferring ones older than a week. */
export async function drawMemory(exclude?: string): Promise<Memory | null> {
  const ctx = await getAppContext();
  const { data: id, error } = await ctx.supabase.rpc("random_memory", isUuid(exclude) ? { p_exclude: exclude } : {});
  if (error || !id) return null;
  return getMemory(ctx, id);
}
