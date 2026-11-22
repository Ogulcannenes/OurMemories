import "server-only";
import { PHOTO_BUCKET } from "@/lib/env";
import type { AppContext } from "./context";

const SELECT =
  "id, title, quote, story, occurred_on, created_at, author_id, category_id, memory_photos(path, position), memory_tags(tags(id, name)), favorites(user_id)";

export type Memory = {
  id: string;
  title: string;
  quote: string;
  story: string | null;
  occurredOn: string;
  createdAt: string;
  authorId: string | null;
  categoryId: string | null;
  /** Every photo of the memory, in order; the first one is the cover. */
  photos: { path: string; url: string }[];
  tags: { id: string; name: string }[];
  favoritedBy: string[];
};

export type MemoryFilters = {
  q?: string;
  category?: string;
  tag?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
  favoritesOf?: string | "anyone";
  limit?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
export const isIsoDate = (v: unknown): v is string => typeof v === "string" && DATE.test(v);

type Row = {
  id: string;
  title: string;
  quote: string;
  story: string | null;
  occurred_on: string;
  created_at: string;
  author_id: string | null;
  category_id: string | null;
  memory_tags: { tags: { id: string; name: string } | null }[];
  memory_photos: { path: string; position: number }[];
  favorites: { user_id: string }[];
};

async function toMemories(ctx: AppContext, rows: Row[]): Promise<Memory[]> {
  const urls = await signPhotos(ctx, rows.flatMap((r) => r.memory_photos.map((p) => p.path)));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    quote: r.quote,
    story: r.story,
    occurredOn: r.occurred_on,
    createdAt: r.created_at,
    authorId: r.author_id,
    categoryId: r.category_id,
    photos: [...r.memory_photos]
      .sort((a, b) => a.position - b.position)
      .flatMap((p) => {
        const url = urls.get(p.path);
        return url ? [{ path: p.path, url }] : [];
      }),
    tags: r.memory_tags
      .flatMap((mt) => (mt.tags ? [mt.tags] : []))
      .sort((a, b) => a.name.localeCompare(b.name)),
    favoritedBy: r.favorites.map((f) => f.user_id),
  }));
}

/** Short-lived signed URLs for private photos (bucket is never public). */
async function signPhotos(ctx: AppContext, paths: string[]) {
  const unique = [...new Set(paths)];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data } = await ctx.supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, 60 * 60);
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  });
  return map;
}

function escapeLike(s: string) {
  // LIKE wildcards and the escape character itself must be matched literally.
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

export async function listMemories(ctx: AppContext, f: MemoryFilters = {}) {
  const limit = Math.min(Math.max(f.limit ?? 30, 1), 1000);
  let query = ctx.supabase
    .from("memories")
    .select(SELECT, { count: "exact" })
    .eq("space_id", ctx.space.id);

  const q = f.q?.trim().slice(0, 100);
  if (q) query = query.ilike("search_text", `%${escapeLike(q)}%`);
  if (isUuid(f.category)) query = query.eq("category_id", f.category);
  if (isIsoDate(f.from)) query = query.gte("occurred_on", f.from);
  if (isIsoDate(f.to)) query = query.lte("occurred_on", f.to);

  if (isUuid(f.tag)) {
    const { data } = await ctx.supabase.from("memory_tags").select("memory_id").eq("tag_id", f.tag);
    query = query.in("id", (data ?? []).map((r) => r.memory_id));
  }
  if (f.favoritesOf) {
    let fav = ctx.supabase.from("favorites").select("memory_id");
    if (f.favoritesOf !== "anyone") fav = fav.eq("user_id", f.favoritesOf);
    const { data } = await fav;
    query = query.in("id", [...new Set((data ?? []).map((r) => r.memory_id))]);
  }

  const ascending = f.sort === "oldest";
  const { data, count, error } = await query
    .order("occurred_on", { ascending })
    .order("created_at", { ascending })
    .limit(limit);
  if (error) throw error;

  return { memories: await toMemories(ctx, (data ?? []) as Row[]), total: count ?? 0, limit };
}

export async function getMemory(ctx: AppContext, id: string): Promise<Memory | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await ctx.supabase.from("memories").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [memory] = await toMemories(ctx, [data as Row]);
  return memory;
}

export async function getStats(ctx: AppContext) {
  const { data, error } = await ctx.supabase.rpc("space_stats");
  if (error) throw error;
  return data as {
    total: number;
    this_month: number;
    favorites: number;
    first_date: string | null;
    top_categories: { category_id: string; count: number }[];
  };
}

export async function listTagNames(ctx: AppContext) {
  const { data } = await ctx.supabase.from("tags").select("id, name").order("name");
  return data ?? [];
}
