"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "./state";

function authError(t: Dictionary, code?: string): string {
  switch (code) {
    case "invalid_credentials":
      return t.auth.invalidCredentials;
    case "user_already_exists":
    case "email_exists":
      return t.auth.userExists;
    case "weak_password":
      return t.auth.weakPassword;
    case "email_address_invalid":
    case "validation_failed":
      return t.auth.invalidEmail;
    case "email_not_confirmed":
      return t.auth.checkEmail;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return t.auth.rateLimited;
    default:
      return t.common.genericError;
  }
}

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(200) })
    .safeParse({ email: String(form.get("email") ?? "").trim().toLowerCase(), password: form.get("password") });
  if (!parsed.success) return { error: t.auth.invalidCredentials };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authError(t, error.code) };
  redirect("/");
}

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const input = {
    name: String(form.get("name") ?? "").trim(),
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
  };

  const fieldErrors: Record<string, string> = {};
  if (!input.name || input.name.length > 40) fieldErrors.name = t.auth.nameRequired;
  if (!z.email().max(254).safeParse(input.email).success) fieldErrors.email = t.auth.invalidEmail;
  if (input.password.length < 8 || input.password.length > 200) fieldErrors.password = t.auth.weakPassword;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { display_name: input.name },
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  });
  if (error) return { error: authError(t, error.code) };
  // With confirmations on, Supabase hides existing accounts behind a user without identities.
  if (data.user && data.user.identities?.length === 0) return { error: t.auth.userExists };
  if (!data.session) return { ok: true, message: t.auth.checkEmail };
  redirect("/onboarding");
}

/** Sends a password-reset link. Always answers the same way so it never reveals which emails exist. */
export async function requestPasswordReset(_: ActionState, form: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.email().max(254).safeParse(email).success) return { fieldErrors: { email: t.auth.invalidEmail } };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/confirm?next=reset` : undefined,
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { error: t.auth.rateLimited };
  }
  return { ok: true, message: t.auth.resetSent };
}

/** Sets a new password for the recovery session opened by the reset link. */
export async function updatePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 200) return { fieldErrors: { password: t.auth.weakPassword } };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { error: t.auth.resetExpired };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authError(t, error.code) };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
