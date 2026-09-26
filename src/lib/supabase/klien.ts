import { createBrowserClient } from "@supabase/ssr";

let klien: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Klien browser tunggal untuk seluruh aplikasi.
 *
 * Klien dibuat sekali lalu dipakai ulang, supaya langganan realtime berada di
 * klien yang sama dengan pemanggilan lain. Beberapa klien sekaligus membuat
 * koneksi realtime terpisah dan sesi tidak selalu terbawa ke langganan.
 */
export function klienBrowser() {
  if (!klien) {
    klien = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return klien;
}
