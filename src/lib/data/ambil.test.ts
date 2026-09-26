import { describe, expect, it } from "vitest";
import { ambilAman } from "@/lib/data/ambil";

describe("ambilAman", () => {
  it("membungkus hasil yang berhasil sebagai ok", async () => {
    const hasil = await ambilAman(async () => [1, 2, 3]);
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.data).toEqual([1, 2, 3]);
  });

  it("menangkap galat dan memuat pesannya", async () => {
    const hasil = await ambilAman(async () => {
      throw new Error("koneksi ke Supabase gagal");
    });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.pesan).toBe("koneksi ke Supabase gagal");
  });

  it("memberi pesan umum bila yang dilempar bukan Error", async () => {
    const hasil = await ambilAman(async () => {
      throw "bukan error";
    });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.pesan).toBe("kesalahan tidak dikenal");
  });
});
