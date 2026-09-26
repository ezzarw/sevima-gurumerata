import { hitungJamNgajar } from "@/lib/domain/logika";
import type { Jenjang } from "@/lib/domain/tipe";
import { buatKlienServer } from "@/lib/supabase/server";

/**
 * Eksekusi mutasi yang disetujui. Ini yang membedakan aplikasi dari sekadar
 * simulasi: setelah dinas menyetujui, data guru dan kebutuhan sekolah ikut
 * diperbarui supaya angka di dashboard mencerminkan keadaan terbaru.
 *
 * Langkahnya mengikuti alur yang sama dengan hitungan di simulator:
 *   1. guru pindah sekolah, jam mengajarnya dihitung ulang di sekolah tujuan
 *   2. jumlah_ada di sekolah asal turun satu, di sekolah tujuan naik satu
 *   3. jam mengajar seluruh guru mapel yang sama di kedua sekolah dihitung ulang
 */
export interface HasilEksekusi {
  jamNgajarBaru: number;
  jumlahGuruAsal: number;
  jumlahGuruTujuan: number;
}

export async function eksekusiMutasi(mutasiId: string): Promise<HasilEksekusi> {
  const supabase = await buatKlienServer();

  const { data: mutasi, error: galatMutasi } = await supabase
    .from("mutasi")
    .select("id, guru_id, sekolah_asal_id, sekolah_tujuan_id, mapel")
    .eq("id", mutasiId)
    .maybeSingle();
  if (galatMutasi) throw new Error(galatMutasi.message);
  if (!mutasi) throw new Error("Pengajuan mutasi tidak ditemukan.");

  const { data: tujuan, error: galatTujuan } = await supabase
    .from("sekolah")
    .select("id, jenjang, jumlah_rombel")
    .eq("id", mutasi.sekolah_tujuan_id)
    .maybeSingle();
  if (galatTujuan) throw new Error(galatTujuan.message);
  if (!tujuan) throw new Error("Sekolah tujuan tidak ditemukan.");

  const jenjang = tujuan.jenjang as Jenjang;

  const { data: guru, error: galatGuru } = await supabase
    .from("guru")
    .select("id, sekolah_id")
    .eq("id", mutasi.guru_id)
    .maybeSingle();
  if (galatGuru) throw new Error(galatGuru.message);
  if (!guru) throw new Error("Data guru tidak ditemukan.");

  // Hitung ulang jumlah guru mapel di sekolah tujuan setelah guru ini masuk.
  const { count: jumlahTujuan } = await supabase
    .from("guru")
    .select("id", { count: "exact", head: true })
    .eq("sekolah_id", tujuan.id)
    .eq("mapel", mutasi.mapel);
  const jumlahGuruTujuan = (jumlahTujuan ?? 0) + 1;

  const jamNgajarBaru = hitungJamNgajar(tujuan.jumlah_rombel, jenjang, mutasi.mapel, jumlahGuruTujuan);

  const { error: galatPindah } = await supabase
    .from("guru")
    .update({ sekolah_id: tujuan.id, jam_ngajar: jamNgajarBaru })
    .eq("id", guru.id);
  if (galatPindah) throw new Error(galatPindah.message);

  // Sekolah asal: jumlah_ada turun satu, sisa guru menanggung beban lebih besar.
  const { data: guruAsal } = await supabase
    .from("guru")
    .select("id")
    .eq("sekolah_id", mutasi.sekolah_asal_id)
    .eq("mapel", mutasi.mapel);
  const jumlahGuruAsal = guruAsal?.length ?? 0;

  await perbaruiKebutuhan(supabase, mutasi.sekolah_asal_id, mutasi.mapel, jumlahGuruAsal);
  await perbaruiKebutuhan(supabase, tujuan.id, mutasi.mapel, jumlahGuruTujuan);
  await sebarJamNgajar(supabase, mutasi.sekolah_asal_id, mutasi.mapel);
  await sebarJamNgajar(supabase, tujuan.id, mutasi.mapel);

  return { jamNgajarBaru, jumlahGuruAsal, jumlahGuruTujuan };
}

type Klien = Awaited<ReturnType<typeof buatKlienServer>>;

async function perbaruiKebutuhan(
  supabase: Klien,
  sekolahId: string,
  mapel: string,
  jumlahAda: number,
) {
  const { error } = await supabase
    .from("kebutuhan_guru")
    .update({ jumlah_ada: jumlahAda })
    .eq("sekolah_id", sekolahId)
    .eq("mapel", mapel);
  if (error) throw new Error(error.message);
}

/** Setelah komposisi guru berubah, jam mengajar semua guru mapel itu berubah. */
async function sebarJamNgajar(supabase: Klien, sekolahId: string, mapel: string) {
  const { data: sekolah } = await supabase
    .from("sekolah")
    .select("jenjang, jumlah_rombel")
    .eq("id", sekolahId)
    .maybeSingle();
  if (!sekolah) return;

  const { data: guru } = await supabase
    .from("guru")
    .select("id")
    .eq("sekolah_id", sekolahId)
    .eq("mapel", mapel);
  const jumlah = guru?.length ?? 0;
  if (jumlah === 0) return;

  const jam = hitungJamNgajar(sekolah.jumlah_rombel, sekolah.jenjang as Jenjang, mapel, jumlah);
  await supabase
    .from("guru")
    .update({ jam_ngajar: jam })
    .eq("sekolah_id", sekolahId)
    .eq("mapel", mapel);
}
