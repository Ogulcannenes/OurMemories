import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Only the link types this app actually sends.
const OTP_TYPES = new Set<EmailOtpType>(["signup", "email", "recovery", "email_change"]);

/** Email link landing (sign-up confirmation and password reset): PKCE (`code`) and OTP (`token_hash`). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = rawType && OTP_TYPES.has(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null;
  const reset = searchParams.get("next") === "reset" || type === "recovery";
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  // Fixed internal paths only — never redirect to a URL taken from the query string.
  const to = reset ? (ok ? "/auth/reset" : "/login?error=reset") : ok ? "/onboarding" : "/login?error=confirm";
  return NextResponse.redirect(new URL(to, origin));
}
