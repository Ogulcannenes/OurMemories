"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import { getAppContext, getUser } from "@/lib/data/context";
import { LOCALE_COOKIE, fmt, isLocale } from "@/lib/i18n";
import { isUuid } from "@/lib/data/memories";
import type { ActionState } from "./state";

const JOIN_ERRORS = ["invalid_code", "space_full", "already_member"] as const;

export async function createSpace(_: ActionState, form: FormData): Promise<ActionState> {
  await getUser();
  const { t } = await getI18n();
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 60) return { fieldErrors: { name: t.onboarding.errors.name_required } };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_space", { p_name: name });
  if (error && !error.message.includes("already_member")) return { error: t.common.genericError };
  redirect("/");
}

export async function joinSpace(_: ActionState, form: FormData): Promise<ActionState> {
  await getUser();
  const { t } = await getI18n();
  const code = String(form.get("code") ?? "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
  if (code.length !== 8) return { fieldErrors: { code: t.onboarding.errors.invalid_code } };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_space", { p_code: code });
  if (error) {
    const known = JOIN_ERRORS.find((k) => error.message.includes(k));
    if (known !== "already_member") {
      return { fieldErrors: { code: known ? t.onboarding.errors[known] : t.common.genericError } };
    }
  }
  redirect("/");
}

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  refresh();
}

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const name = String(form.get("display_name") ?? "").trim();
  if (!name) return { fieldErrors: { display_name: ctx.t.form.required } };
  if (name.length > 40) return { fieldErrors: { display_name: fmt(ctx.t.form.tooLong, { max: 40 }) } };

  const { error } = await ctx.supabase.from("profiles").update({ display_name: name }).eq("id", ctx.user.id);
  if (error) return { error: ctx.t.common.genericError };
  refresh();
  return { ok: true, message: ctx.t.settings.saved };
}

export async function updateSpace(_: ActionState, form: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(60),
      together_since: z.union([z.literal(""), z.iso.date()]),
    })
    .safeParse({ name: form.get("name"), together_since: form.get("together_since") ?? "" });
  if (!parsed.success) return { fieldErrors: { name: ctx.t.onboarding.errors.name_required } };

  const { error } = await ctx.supabase
    .from("spaces")
    .update({ name: parsed.data.name, together_since: parsed.data.together_since || null })
    .eq("id", ctx.space.id);
  if (error) return { error: ctx.t.common.genericError };
  refresh();
  return { ok: true, message: ctx.t.settings.saved };
}

export async function addCategory(_: ActionState, form: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { fieldErrors: { name: ctx.t.form.required } };
  if (name.length > 32) return { fieldErrors: { name: fmt(ctx.t.form.tooLong, { max: 32 }) } };

  const { error } = await ctx.supabase.from("categories").insert({ space_id: ctx.space.id, name, position: 1000 });
  if (error) {
    return error.code === "23505"
      ? { fieldErrors: { name: ctx.t.settings.categoryExists } }
      : { error: ctx.t.common.genericError };
  }
  refresh();
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<ActionState> {
  const ctx = await getAppContext();
  const clean = name.trim();
  if (!isUuid(id) || !clean || clean.length > 32) return { error: ctx.t.common.genericError };
  const { error } = await ctx.supabase.from("categories").update({ name: clean }).eq("id", id);
  if (error) return { error: error.code === "23505" ? ctx.t.settings.categoryExists : ctx.t.common.genericError };
  refresh();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const ctx = await getAppContext();
  if (!isUuid(id)) return { error: ctx.t.common.genericError };
  const { error } = await ctx.supabase.from("categories").delete().eq("id", id);
  if (error) return { error: ctx.t.common.genericError };
  refresh();
  return { ok: true };
}
