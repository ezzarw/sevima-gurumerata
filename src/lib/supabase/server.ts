import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function buatKlienServer() {
  const penyimpanan = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return penyimpanan.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              penyimpanan.set(name, value, options),
            );
          } catch {
            // Server Component tidak boleh menulis cookie. Penyegaran sesi
            // ditangani proxy.ts, jadi kegagalan di sini aman diabaikan.
          }
        },
      },
    },
  );
}
