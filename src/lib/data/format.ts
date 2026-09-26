/**
 * Pemformatan angka, tanggal, dan istilah domain. Dipakai bersama oleh
 * halaman server dan komponen klien supaya satu nilai tidak pernah
 * ditampilkan dengan dua cara berbeda.
 */

const pemformatAngka = new Intl.NumberFormat("id-ID");

export function formatAngka(nilai: number): string {
  return pemformatAngka.format(nilai);
}

export function formatTanggal(waktu: string | null | undefined): string {
  if (!waktu) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(waktu));
}

export function formatWaktuLengkap(waktu: string | null | undefined): string {
  if (!waktu) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(waktu),
  );
}

export const LABEL_ALASAN_MUTASI: Record<string, string> = {
  keluarga: "Alasan keluarga",
  kesehatan: "Alasan kesehatan",
  karir: "Pengembangan karier",
  lainnya: "Alasan lainnya",
};

export const LABEL_STATUS_MUTASI: Record<string, string> = {
  diajukan: "Menunggu review dinas",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan guru",
};

/**
 * Motif identitas aplikasi: setiap angka sebaran ditulis dengan pola yang sama,
 * "kurang N · lebih N", di kartu statistik, tabel, jawaban asisten, dan
 * rekomendasi simulasi.
 */
export function ringkasSebaran(kurang: number, lebih: number): string {
  return `kurang ${formatAngka(kurang)} · lebih ${formatAngka(lebih)}`;
}
