import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import type { Database } from "@/lib/supabase/database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Space = Database["public"]["Tables"]["spaces"]["Row"];
export type Author = { id: string; name: string; isMe: boolean; order: 0 | 1 };

/** Who is signed in, without requiring a book. Redirects to /login when signed out. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
});

/**
 * Everything a signed-in page needs: user, book, both authors, categories, i18n.
 * Redirects to /onboarding when the user has no book yet.
 */
export const getAppContext = cache(async () => {
  const user = await getUser();
  const supabase = await createClient();

  const [{ data: space }, { data: members }, { data: profiles }, { data: categories }, i18n] = await Promise.all([
    supabase.from("spaces").select("*").maybeSingle(),
    supabase.from("space_members").select("user_id, joined_at").order("joined_at"),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("categories").select("*").order("position").order("created_at"),
    getI18n(),
  ]);
  if (!space) redirect("/onboarding");

  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const authors: Author[] = (members ?? []).map((m, i) => ({
    id: m.user_id,
    name: nameOf.get(m.user_id) ?? "",
    isMe: m.user_id === user.id,
    order: i === 0 ? 0 : 1,
  }));
  const me = authors.find((a) => a.isMe)!;
  const partner = authors.find((a) => !a.isMe) ?? null;

  return { supabase, user, space, me, partner, authors, categories: categories ?? [], ...i18n };
});

export type AppContext = Awaited<ReturnType<typeof getAppContext>>;
