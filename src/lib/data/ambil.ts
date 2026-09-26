/**
 * Pembungkus pengambilan data untuk Server Component.
 *
 * Alasannya bukan kerapian belaka: JSX tidak boleh disusun di dalam blok
 * try/catch, karena React baru merendernya setelah fungsi ini selesai. Jadi
 * yang dibungkus try/catch adalah pengambilan datanya saja, dan komponen
 * merender berdasarkan nilai yang dikembalikan.
 */
export type Hasil<T> = { ok: true; data: T } | { ok: false; pesan: string };

export async function ambilAman<T>(kerjakan: () => Promise<T>): Promise<Hasil<T>> {
  try {
    return { ok: true, data: await kerjakan() };
  } catch (galat) {
    return {
      ok: false,
      pesan: galat instanceof Error ? galat.message : "kesalahan tidak dikenal",
    };
  }
}
