import jamPerRombel from "./jam-per-rombel.json";
import {
  AMBANG_JAM_TPG,
  JAM_MAKSIMAL_PER_GURU,
  type DampakPsikologis,
  type HasilKekurangan,
  type HasilSimulasi,
  type HasilTPG,
  type Jenjang,
  type KebutuhanMapel,
  type Koordinat,
  type StatusKepegawaian,
  type StatusKecukupan,
} from "./tipe";

const JAM_MAPEL = jamPerRombel as unknown as Record<Jenjang, Record<string, number>>;

export function jamMapelPerRombel(jenjang: Jenjang, mapel: string): number {
  return JAM_MAPEL[jenjang]?.[mapel] ?? 0;
}

export function daftarMapel(jenjang: Jenjang): string[] {
  return Object.keys(JAM_MAPEL[jenjang] ?? {});
}

/**
 * Beban tatap muka satu mata pelajaran di sebuah sekolah, dalam jam per minggu.
 */
export function hitungBebanMapel(rombel: number, jenjang: Jenjang, mapel: string): number {
  if (rombel <= 0) return 0;
  return rombel * jamMapelPerRombel(jenjang, mapel);
}

/**
 * Jumlah guru yang dibutuhkan untuk satu mapel.
 * Dibulatkan ke bawah: sisa beban di bawah 24 jam bisa ditutup guru yang sama
 * lewat mapel lain, tapi tidak cukup untuk satu formasi penuh.
 */
export function hitungKebutuhanGuru(rombel: number, jenjang: Jenjang, mapel: string): number {
  const beban = hitungBebanMapel(rombel, jenjang, mapel);
  if (beban === 0) return 0;
  return Math.max(1, Math.floor(beban / AMBANG_JAM_TPG));
}

/**
 * Jam tatap muka tiap guru mapel bila beban dibagi rata — inilah angka yang
 * dipakai InfoGTK untuk memutuskan TPG.
 */
export function hitungJamNgajar(rombel: number, jenjang: Jenjang, mapel: string, jumlahGuru: number): number {
  if (jumlahGuru <= 0) return 0;
  const beban = hitungBebanMapel(rombel, jenjang, mapel);
  return Math.min(JAM_MAKSIMAL_PER_GURU, Math.ceil(beban / jumlahGuru));
}

export function statusKecukupan(kurang: number, lebih: number): StatusKecukupan {
  if (kurang > 0) return "kekurangan";
  if (lebih > 0) return "kelebihan";
  return "cukup";
}

/**
 * Selisih antara kebutuhan dan ketersediaan guru pada satu mapel.
 * kurang > 0 berarti sekolah belum punya cukup guru mapel tersebut.
 * lebih  > 0 berarti ada guru yang jam tatap mukanya akan turun di bawah ambang TPG.
 */
export function hitungKekuranganGuru(kebutuhan: KebutuhanMapel): HasilKekurangan {
  const { mapel, jumlahButuh, jumlahAda } = kebutuhan;
  const kurang = Math.max(jumlahButuh - jumlahAda, 0);
  const lebih = Math.max(jumlahAda - jumlahButuh, 0);
  return { mapel, jumlahButuh, jumlahAda, kurang, lebih, status: statusKecukupan(kurang, lebih) };
}

export function hitungKekuranganSekolah(kebutuhan: KebutuhanMapel[]) {
  const rincian = kebutuhan.map(hitungKekuranganGuru);
  return {
    rincian,
    totalKurang: rincian.reduce((n, r) => n + r.kurang, 0),
    totalLebih: rincian.reduce((n, r) => n + r.lebih, 0),
  };
}

/**
 * Aturan 24 jam. Guru non-sertifikasi tidak menerima TPG, jadi statusnya
 * "tidak_berlaku" — bukan "aman", supaya UI tidak memberi kesan keliru.
 */
export function cekTPG(
  jamNgajar: number,
  sertifikasi: boolean,
  statusKepegawaian: StatusKepegawaian,
): HasilTPG {
  if (!sertifikasi) {
    return {
      aman: false,
      status: "tidak_berlaku",
      jamNgajar,
      ambang: AMBANG_JAM_TPG,
      alasan: "Guru belum bersertifikasi (tidak punya Serdik), sehingga belum berhak menerima TPG.",
    };
  }
  if (jamNgajar >= AMBANG_JAM_TPG) {
    return {
      aman: true,
      status: "aman",
      jamNgajar,
      ambang: AMBANG_JAM_TPG,
      alasan: `Jam tatap muka ${jamNgajar} jam/minggu, memenuhi syarat minimal ${AMBANG_JAM_TPG} jam. TPG ${statusKepegawaian} tetap dibayarkan.`,
    };
  }
  return {
    aman: false,
    status: "rawan",
    jamNgajar,
    ambang: AMBANG_JAM_TPG,
    alasan: `Jam tatap muka hanya ${jamNgajar} jam/minggu, kurang ${AMBANG_JAM_TPG - jamNgajar} jam dari syarat minimal ${AMBANG_JAM_TPG} jam. InfoGTK akan menghentikan pembayaran TPG.`,
  };
}

function toRad(derajat: number): number {
  return (derajat * Math.PI) / 180;
}

/** Jarak lingkaran besar (haversine) dalam kilometer. */
export function hitungJarakKm(a: Koordinat, b: Koordinat): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/**
 * Skor dampak psikologis mutasi (0-100, makin tinggi makin berat).
 * Faktor yang dipakai adalah hal-hal yang benar-benar dikeluhkan guru:
 * jam ngajar turun, TPG hilang, pindah jauh dari domisili, dan pindah
 * sendirian ke daerah terpencil.
 */
export function hitungDampakPsikologis(input: {
  jarakKm: number | null;
  tpgAman: boolean;
  sertifikasi: boolean;
  selisihJam: number;
  domisiliBedaKabupaten: boolean;
  tujuanDaerahTertinggal: boolean;
}): DampakPsikologis {
  const faktor: string[] = [];
  let skor = 5;

  if (input.sertifikasi && !input.tpgAman) {
    skor += 35;
    faktor.push("TPG berisiko berhenti, penghasilan turun sekitar Rp2 juta per bulan");
  }
  if (input.jarakKm !== null) {
    if (input.jarakKm >= 200) {
      skor += 30;
      faktor.push(`Pindah sangat jauh dari domisili (${input.jarakKm} km), praktis harus pindah rumah`);
    } else if (input.jarakKm >= 50) {
      skor += 20;
      faktor.push(`Jarak tempuh harian bertambah (${input.jarakKm} km dari domisili)`);
    } else if (input.jarakKm >= 15) {
      skor += 10;
      faktor.push(`Jarak dari domisili ${input.jarakKm} km`);
    }
  }
  if (input.selisihJam < 0) {
    skor += Math.min(20, Math.abs(input.selisihJam) * 2);
    faktor.push(`Jam tatap muka berkurang ${Math.abs(input.selisihJam)} jam per minggu`);
  }
  if (input.tujuanDaerahTertinggal) {
    skor += 15;
    faktor.push("Bertugas di daerah 3T: akses layanan dan konektivitas terbatas");
  }
  if (input.domisiliBedaKabupaten) {
    skor += 10;
    faktor.push("Domisili berbeda kabupaten dengan sekolah tujuan");
  }

  skor = Math.max(0, Math.min(100, skor));
  const kategori = skor >= 55 ? "berat" : skor >= 25 ? "sedang" : "ringan";
  if (faktor.length === 0) faktor.push("Tidak ada faktor risiko yang menonjol");

  return { skor, kategori, faktor };
}

export interface InputSimulasi {
  guru: {
    id: string;
    nama: string;
    mapel: string;
    sertifikasi: boolean;
    statusKepegawaian: StatusKepegawaian;
    jamNgajar: number;
    sekolahId: string;
    domisili: string;
    domisiliKoordinat?: Koordinat;
  };
  sekolahAsal: {
    id: string;
    nama: string;
    jenjang: Jenjang;
    rombel: number;
    kabupaten: string;
    provinsi: string;
    koordinat: Koordinat;
    jumlahGuruMapel: number;
    kebutuhanMapel: KebutuhanMapel;
  };
  sekolahTujuan: {
    id: string;
    nama: string;
    jenjang: Jenjang;
    rombel: number;
    kabupaten: string;
    provinsi: string;
    koordinat: Koordinat;
    jumlahGuruMapel: number;
    kebutuhanMapel: KebutuhanMapel;
  };
}

const DAERAH_TERTINGGAL = new Set(["Kabupaten Asmat", "Kabupaten Sumba Timur", "Kabupaten Jeneponto"]);

/**
 * Simulasi mutasi: hitung jam ngajar baru, status TPG, jarak, dan dampak psikologis
 * SEBELUM mutasi dieksekusi. Ini inti produk.
 */
export function simulasiMutasi(input: InputSimulasi): HasilSimulasi {
  const { guru, sekolahAsal, sekolahTujuan } = input;

  const kebutuhanTujuan: KebutuhanMapel = {
    mapel: guru.mapel,
    jumlahButuh: hitungKebutuhanGuru(sekolahTujuan.rombel, sekolahTujuan.jenjang, guru.mapel),
    jumlahAda: sekolahTujuan.jumlahGuruMapel + 1,
  };
  const kebutuhan = hitungKekuranganGuru(kebutuhanTujuan);

  const jamNgajarBaru = hitungJamNgajar(
    sekolahTujuan.rombel,
    sekolahTujuan.jenjang,
    guru.mapel,
    kebutuhanTujuan.jumlahAda,
  );
  const tpg = cekTPG(jamNgajarBaru, guru.sertifikasi, guru.statusKepegawaian);

  const jarakDariDomisiliKm = guru.domisiliKoordinat
    ? hitungJarakKm(guru.domisiliKoordinat, sekolahTujuan.koordinat)
    : null;
  const jarakDariSekolahAsalKm = hitungJarakKm(sekolahAsal.koordinat, sekolahTujuan.koordinat);

  const domisiliBedaKabupaten = guru.domisili !== sekolahTujuan.kabupaten;
  const tujuanDaerahTertinggal = DAERAH_TERTINGGAL.has(sekolahTujuan.kabupaten);

  const psikologis = hitungDampakPsikologis({
    jarakKm: jarakDariDomisiliKm ?? jarakDariSekolahAsalKm,
    tpgAman: tpg.aman,
    sertifikasi: guru.sertifikasi,
    selisihJam: jamNgajarBaru - guru.jamNgajar,
    domisiliBedaKabupaten,
    tujuanDaerahTertinggal,
  });

  // Dampak ke sekolah asal: guru ini keluar, sisa guru mapel menanggung bebannya.
  const jumlahGuruSetelah = Math.max(sekolahAsal.jumlahGuruMapel - 1, 0);
  const jamRataRataSetelah =
    jumlahGuruSetelah === 0
      ? 0
      : hitungJamNgajar(sekolahAsal.rombel, sekolahAsal.jenjang, guru.mapel, jumlahGuruSetelah);
  const peringatanAsal =
    jumlahGuruSetelah === 0
      ? `Tidak ada lagi guru ${guru.mapel} di ${sekolahAsal.nama}. Mapel ini berisiko tanpa pengajar.`
      : jamRataRataSetelah > JAM_MAKSIMAL_PER_GURU - 4
        ? `Guru ${guru.mapel} di ${sekolahAsal.nama} tersisa ${jumlahGuruSetelah} orang dengan beban ${jamRataRataSetelah} jam — mendekati batas maksimal ${JAM_MAKSIMAL_PER_GURU} jam.`
        : null;

  const alasan: string[] = [];
  const saran: string[] = [];
  let tingkat: HasilSimulasi["rekomendasi"]["tingkat"] = "aman";
  let judul = "Mutasi aman dijalankan";

  if (jumlahGuruSetelah === 0) {
    tingkat = "berisiko";
    judul = "Sekolah asal akan kehilangan pengajar mapel ini";
    saran.push(
      `Jangan eksekusi sebelum ada pengganti guru ${guru.mapel} untuk ${sekolahAsal.nama}.`,
    );
  }

  if (guru.sertifikasi && !tpg.aman) {
    tingkat = "berisiko";
    judul = "Jangan eksekusi sebelum jam ngajar ditambah";
    alasan.push(tpg.alasan);
  }
  if (kebutuhan.status === "kelebihan") {
    tingkat = tingkat === "berisiko" ? "berisiko" : "perhatian";
    if (judul === "Mutasi aman dijalankan") judul = "Mutasi bisa jalan, tapi formasi di sekolah tujuan sudah penuh";
    alasan.push(
      `Sekolah tujuan sudah punya ${kebutuhanTujuan.jumlahAda} guru ${guru.mapel} untuk kebutuhan ${kebutuhanTujuan.jumlahButuh} formasi.`,
    );
    saran.push("Pertimbangkan mapel lain yang masih kekurangan di sekolah tujuan.");
  }
  if (kebutuhan.status === "kekurangan") {
    alasan.push(
      `Sekolah tujuan justru masih kurang ${kebutuhan.kurang} guru ${guru.mapel}, jadi kehadiran guru ini menutup kebutuhan.`,
    );
  }
  if (peringatanAsal) {
    tingkat = tingkat === "berisiko" ? "berisiko" : "perhatian";
    alasan.push(peringatanAsal);
    saran.push(`Siapkan pengganti guru ${guru.mapel} di ${sekolahAsal.nama} sebelum mutasi dieksekusi.`);
  }
  if (psikologis.kategori === "berat") {
    tingkat = tingkat === "berisiko" ? "berisiko" : "perhatian";
    alasan.push(`Dampak psikologis berat (skor ${psikologis.skor}/100).`);
    saran.push("Jalankan pendampingan dan libatkan keluarga guru dalam proses mutasi.");
  }
  if (tingkat === "aman" && alasan.length === 0) {
    alasan.push(
      `Jam tatap muka di sekolah tujuan ${jamNgajarBaru} jam/minggu, memenuhi ambang ${AMBANG_JAM_TPG} jam.`,
    );
  }
  if (saran.length === 0) saran.push("Lanjutkan ke pengajuan resmi dan lengkapi berkas pendukung.");

  return {
    jamNgajarLama: guru.jamNgajar,
    jamNgajarBaru,
    selisihJam: jamNgajarBaru - guru.jamNgajar,
    kebutuhan,
    tpg,
    jarakDariDomisiliKm,
    jarakDariSekolahAsalKm,
    psikologis,
    sekolahAsal: { jumlahGuruSetelah, jamRataRataSetelah, peringatan: peringatanAsal },
    rekomendasi: { tingkat, judul, alasan, saran },
  };
}

/** Ringkasan status daerah untuk pewarnaan peta: merah / kuning / hijau. */
export function statusDaerah(totalKurang: number, totalLebih: number): StatusKecukupan {
  return statusKecukupan(totalKurang, totalLebih);
}
