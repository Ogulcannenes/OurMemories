// Public Supabase config. Both values are safe for the browser (RLS protects data).
// The service-role key is intentionally never read anywhere in this app.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase now calls the anon key the "publishable" key; accept either name.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseEnv() {
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }
  return { url, anonKey };
}

export const PHOTO_BUCKET = "memory-photos";
