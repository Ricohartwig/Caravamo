const placeholderHost = "your-project.supabase.co";
const placeholderKey = "your-anon-key";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  return !url.includes(placeholderHost) && anonKey !== placeholderKey;
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || !isSupabaseConfigured()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY müssen gesetzt sein.",
    );
  }

  return { url, anonKey };
}
