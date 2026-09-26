export type Jenjang = "SD" | "SMP" | "SMA" | "SMK";
export type StatusKepegawaian = "PNS" | "PPPK" | "Honorer";
export type Peran = "admin_dinas" | "operator_sekolah" | "guru";
export type StatusMutasi = "diajukan" | "disetujui" | "ditolak" | "dibatalkan";

/** Ambang wajib tatap muka bagi guru bersertifikasi — syarat TPG tidak hangus. */
export const AMBANG_JAM_TPG = 24;
/** Batas maksimal jam tatap muka per guru per minggu. */
export const JAM_MAKSIMAL_PER_GURU = 40;

export interface KebutuhanMapel {
  mapel: string;
  jumlahButuh: number;
  jumlahAda: number;
}

export type StatusKecukupan = "kekurangan" | "cukup" | "kelebihan";

export interface HasilKekurangan extends KebutuhanMapel {
  kurang: number;
  lebih: number;
  status: StatusKecukupan;
}

export interface Koordinat {
  lat: number;
  lon: number;
}

export interface HasilTPG {
  /** true hanya bila guru bersertifikasi dan jam tatap mukanya memenuhi ambang. */
  aman: boolean;
  status: "aman" | "rawan" | "tidak_berlaku";
  jamNgajar: number;
  ambang: number;
  alasan: string;
}

export interface DampakPsikologis {
  skor: number;
  kategori: "ringan" | "sedang" | "berat";
  faktor: string[];
}

export interface HasilSimulasi {
  jamNgajarLama: number;
  jamNgajarBaru: number;
  selisihJam: number;
  kebutuhan: HasilKekurangan;
  tpg: HasilTPG;
  jarakDariDomisiliKm: number | null;
  jarakDariSekolahAsalKm: number | null;
  psikologis: DampakPsikologis;
  sekolahAsal: {
    jumlahGuruSetelah: number;
    jamRataRataSetelah: number;
    peringatan: string | null;
  };
  rekomendasi: {
    tingkat: "aman" | "perhatian" | "berisiko";
    judul: string;
    alasan: string[];
    saran: string[];
  };
}
