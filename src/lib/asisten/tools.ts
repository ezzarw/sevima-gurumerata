import { cekTPG, hitungJamNgajar, hitungKekuranganGuru } from "@/lib/domain/logika";
import type { Jenjang, StatusKepegawaian } from "@/lib/domain/tipe";
import {
  ambilGuru,
  ambilKebutuhan,
  ambilSekolah,
  ambilWilayah,
  type BarisGuru,
  type BarisKebutuhan,
  type BarisSekolah,
  type Wilayah,
} from "@/lib/data/kueri";

/**
 * Empat aksi yang bisa dipanggil asisten. Semuanya membaca data yang sama
 * dengan halaman kerja, jadi jawaban asisten tidak bisa berbeda dari angka
 * yang dilihat dinas di layar.
 *
 * Parameter guru dan sekolah menerima id maupun nama, karena model sering
 * menyebut nama yang dibacanya dari jawaban sebelumnya.
 */
export const DEFINISI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "cari_sekolah_kekurangan",
      description:
        "Mencari sekolah yang masih kekurangan guru, bisa disaring per provinsi dan/atau mata pelajaran. Pakai ini untuk pertanyaan seperti 'sekolah mana yang paling butuh guru matematika di NTT'. Hasilnya memuat sekolah_id yang bisa dipakai tool simulasi.",
      parameters: {
        type: "object",
        properties: {
          provinsi: {
            type: "string",
            description: "Nama provinsi, misalnya 'Nusa Tenggara Timur' atau 'NTT'. Kosongkan untuk seluruh provinsi.",
          },
          mapel: {
            type: "string",
            description: "Mata pelajaran, misalnya 'Matematika'. Kosongkan untuk semua mapel.",
          },
          batas: { type: "integer", description: "Jumlah sekolah yang ditampilkan, maksimal 20." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cari_guru_kelebihan",
      description:
        "Mencari guru yang jam mengajarnya di bawah 24 jam per minggu, artinya formasi di sekolahnya kelebihan dan TPG-nya rawan berhenti. Hasilnya memuat guru_id yang bisa dipakai tool simulasi.",
      parameters: {
        type: "object",
        properties: {
          provinsi: { type: "string", description: "Nama provinsi, misalnya 'DKI Jakarta'." },
          mapel: { type: "string", description: "Mata pelajaran." },
          batas: { type: "integer", description: "Jumlah guru yang ditampilkan, maksimal 20." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "simulasi_mutasi",
      description:
        "Menghitung dampak pemindahan satu guru ke satu sekolah: jam mengajar baru, status TPG, dan dampaknya ke sekolah asal. Pakai ini sebelum menyarankan mutasi.",
      parameters: {
        type: "object",
        properties: {
          guru: {
            type: "string",
            description: "Nama atau id guru, misalnya 'Citra Ayu, S.Pd' atau id hasil pencarian.",
          },
          sekolah_tujuan: {
            type: "string",
            description: "Nama atau id sekolah tujuan, misalnya 'SMAN 1 Waingapu'.",
          },
        },
        required: ["guru", "sekolah_tujuan"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cek_tpg",
      description:
        "Memeriksa apakah seorang guru tetap menerima TPG bila jam mengajarnya berubah. Aturannya: guru bersertifikasi wajib mengajar minimal 24 jam tatap muka per minggu.",
      parameters: {
        type: "object",
        properties: {
          guru: { type: "string", description: "Nama atau id guru." },
          jam_baru: {
            type: "integer",
            description: "Perkiraan jam mengajar baru per minggu. Bila kosong, dipakai jam mengajar sekarang.",
          },
        },
        required: ["guru"],
      },
    },
  },
];

export interface DataAsisten {
  wilayah: Wilayah[];
  sekolah: BarisSekolah[];
  kebutuhan: BarisKebutuhan[];
  guru: BarisGuru[];
}

export async function muatDataAsisten(): Promise<DataAsisten> {
  const [wilayah, sekolah, kebutuhan, guru] = await Promise.all([
    ambilWilayah(),
    ambilSekolah(),
    ambilKebutuhan(),
    ambilGuru(),
  ]);
  return { wilayah, sekolah, kebutuhan, guru };
}

function batasi(nilai: unknown, bawaan = 10): number {
  const n = typeof nilai === "number" && Number.isFinite(nilai) ? nilai : bawaan;
  return Math.max(1, Math.min(20, Math.trunc(n)));
}

function kata(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim().toLowerCase() : "";
}

function cocokProvinsi(nama: unknown, wilayah: Wilayah[]): Wilayah[] {
  const kataKunci = kata(nama);
  if (!kataKunci) return wilayah;
  const singkatan: Record<string, string> = {
    ntt: "nusa tenggara timur",
    ntb: "nusa tenggara barat",
    dki: "dki jakarta",
    jakarta: "dki jakarta",
    jabar: "jawa barat",
    sulsel: "sulawesi selatan",
  };
  const sasaran = singkatan[kataKunci] ?? kataKunci;
  return wilayah.filter(
    (w) => w.nama.toLowerCase().includes(sasaran) || sasaran.includes(w.nama.toLowerCase()),
  );
}

function cocokMapel(nama: unknown, daftar: string[]): string[] {
  const kataKunci = kata(nama);
  if (!kataKunci) return daftar;
  return daftar.filter(
    (m) => m.toLowerCase().includes(kataKunci) || kataKunci.includes(m.toLowerCase()),
  );
}

/**
 * Mencari guru berdasarkan id atau nama. Bila nama muncul lebih dari sekali
 * (guru yang sama mengajar di sekolah berbeda), hasilnya dikembalikan sebagai
 * daftar kandidat supaya model bisa memilih atau bertanya balik, bukan menebak.
 */
function cariGuru(nilai: unknown, data: DataAsisten):
  | { guru: BarisGuru }
  | { kandidat: { guru_id: string; nama: string; mapel: string; sekolah: string }[] }
  | { galat: string } {
  const masukan = typeof nilai === "string" ? nilai.trim() : "";
  if (!masukan) return { galat: "Parameter guru wajib diisi." };

  const langsung = data.guru.find((g) => g.id === masukan);
  if (langsung) return { guru: langsung };

  const kk = masukan.toLowerCase();
  const cocok = data.guru.filter((g) => g.nama.toLowerCase().includes(kk));
  if (cocok.length === 0) return { galat: `Guru "${masukan}" tidak ditemukan.` };
  if (cocok.length === 1) return { guru: cocok[0] };

  return {
    kandidat: cocok.slice(0, 10).map((g) => ({
      guru_id: g.id,
      nama: g.nama,
      mapel: g.mapel,
      sekolah: g.sekolah_nama,
    })),
  };
}

function cariSekolah(nilai: unknown, data: DataAsisten):
  | { sekolah: BarisSekolah }
  | { kandidat: { sekolah_id: string; nama: string; kabupaten: string }[] }
  | { galat: string } {
  const masukan = typeof nilai === "string" ? nilai.trim() : "";
  if (!masukan) return { galat: "Parameter sekolah wajib diisi." };

  const langsung = data.sekolah.find((s) => s.id === masukan);
  if (langsung) return { sekolah: langsung };

  const kk = masukan.toLowerCase();
  const cocok = data.sekolah.filter(
    (s) => s.nama.toLowerCase().includes(kk) || `${s.nama} ${s.kabupaten}`.toLowerCase().includes(kk),
  );
  if (cocok.length === 0) return { galat: `Sekolah "${masukan}" tidak ditemukan.` };
  if (cocok.length === 1) return { sekolah: cocok[0] };

  return {
    kandidat: cocok.slice(0, 10).map((s) => ({
      sekolah_id: s.id,
      nama: s.nama,
      kabupaten: s.kabupaten,
    })),
  };
}

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Pelaksana tool. Mengembalikan data siap dibaca model, tanpa angka karangan. */
export async function jalankanTool(
  nama: string,
  argumen: Record<string, unknown>,
  data: DataAsisten,
): Promise<unknown> {
  switch (nama) {
    case "cari_sekolah_kekurangan": {
      const provinsi = cocokProvinsi(argumen.provinsi, data.wilayah);
      const namaProvinsi = new Set(provinsi.map((p) => p.nama));
      const mapelSah = cocokMapel(argumen.mapel, [...new Set(data.kebutuhan.map((k) => k.mapel))]);

      const hasil = data.kebutuhan
        .filter((k) => k.kurang > 0)
        .filter((k) => namaProvinsi.size === 0 || namaProvinsi.has(k.provinsi_nama))
        .filter((k) => mapelSah.includes(k.mapel))
        .sort((a, b) => b.kurang - a.kurang || a.sekolah_nama.localeCompare(b.sekolah_nama, "id"))
        .slice(0, batasi(argumen.batas))
        .map((k) => ({
          sekolah_id: k.sekolah_id,
          sekolah: k.sekolah_nama,
          jenjang: k.jenjang,
          kabupaten: k.kabupaten_nama,
          provinsi: k.provinsi_nama,
          mapel: k.mapel,
          rombel: k.jumlah_rombel,
          butuh: k.jumlah_butuh,
          ada: k.jumlah_ada,
          kurang: k.kurang,
        }));

      return {
        provinsi_ditanyakan: (argumen.provinsi as string) ?? "semua provinsi",
        mapel_ditanyakan: (argumen.mapel as string) ?? "semua mapel",
        provinsi_cocok: provinsi.map((p) => p.nama),
        jumlah_ditemukan: hasil.length,
        sekolah: hasil,
      };
    }

    case "cari_guru_kelebihan": {
      const provinsi = cocokProvinsi(argumen.provinsi, data.wilayah);
      const namaProvinsi = new Set(provinsi.map((p) => p.nama));
      const mapelSah = cocokMapel(argumen.mapel, [...new Set(data.guru.map((g) => g.mapel))]);

      const hasil = data.guru
        .filter((g) => g.jam_ngajar < 24)
        .filter((g) => namaProvinsi.size === 0 || namaProvinsi.has(g.provinsi_nama))
        .filter((g) => mapelSah.includes(g.mapel))
        .sort((a, b) => a.jam_ngajar - b.jam_ngajar || a.nama.localeCompare(b.nama, "id"))
        .slice(0, batasi(argumen.batas))
        .map((g) => ({
          guru_id: g.id,
          nama: g.nama,
          mapel: g.mapel,
          sekolah: g.sekolah_nama,
          kabupaten: g.kabupaten_nama,
          provinsi: g.provinsi_nama,
          jam_ngajar: g.jam_ngajar,
          sertifikasi: g.sertifikasi,
          status_kepegawaian: g.status_kepegawaian,
          tpg_terancam: g.sertifikasi,
        }));

      return {
        provinsi_ditanyakan: (argumen.provinsi as string) ?? "semua provinsi",
        mapel_ditanyakan: (argumen.mapel as string) ?? "semua mapel",
        provinsi_cocok: provinsi.map((p) => p.nama),
        ambang_jam: 24,
        jumlah_ditemukan: hasil.length,
        guru: hasil,
      };
    }

    case "simulasi_mutasi": {
      const cariG = cariGuru(argumen.guru, data);
      if ("galat" in cariG) return { galat: cariG.galat };
      if ("kandidat" in cariG) {
        return {
          perlu_dipilih: true,
          pesan: "Ada beberapa guru dengan nama itu. Sebutkan sekolahnya atau pakai guru_id.",
          kandidat: cariG.kandidat,
        };
      }

      const cariS = cariSekolah(argumen.sekolah_tujuan, data);
      if ("galat" in cariS) return { galat: cariS.galat };
      if ("kandidat" in cariS) {
        return {
          perlu_dipilih: true,
          pesan: "Ada beberapa sekolah yang cocok. Pakai sekolah_id dari daftar ini.",
          kandidat: cariS.kandidat,
        };
      }

      const guru = cariG.guru;
      const tujuan = cariS.sekolah;
      const asal = data.sekolah.find((s) => s.id === guru.sekolah_id);
      if (!asal) return { galat: "Sekolah asal guru tidak ditemukan." };
      if (asal.id === tujuan.id) {
        return { galat: `Sekolah tujuan sama dengan sekolah asal (${asal.nama}).` };
      }

      const barisTujuan = data.kebutuhan.find(
        (k) => k.sekolah_id === tujuan.id && k.mapel === guru.mapel,
      );
      const adaTujuan = barisTujuan?.jumlah_ada ?? 0;
      const butuhTujuan =
        barisTujuan?.jumlah_butuh ??
        hitungJamNgajar(tujuan.jumlah_rombel, tujuan.jenjang as Jenjang, guru.mapel, 1);
      const adaSetelah = adaTujuan + 1;
      const jamBaru = hitungJamNgajar(
        tujuan.jumlah_rombel,
        tujuan.jenjang as Jenjang,
        guru.mapel,
        adaSetelah,
      );
      const tpg = cekTPG(jamBaru, guru.sertifikasi, guru.status_kepegawaian as StatusKepegawaian);
      const kecukupan = hitungKekuranganGuru({
        mapel: guru.mapel,
        jumlahButuh: butuhTujuan,
        jumlahAda: adaSetelah,
      });

      const barisAsal = data.kebutuhan.find(
        (k) => k.sekolah_id === asal.id && k.mapel === guru.mapel,
      );
      const sisaAsal = Math.max((barisAsal?.jumlah_ada ?? 0) - 1, 0);
      const jamAsalSetelah =
        sisaAsal === 0
          ? 0
          : hitungJamNgajar(asal.jumlah_rombel, asal.jenjang as Jenjang, guru.mapel, sisaAsal);

      return {
        guru: { guru_id: guru.id, nama: guru.nama, mapel: guru.mapel, sekolah_asal: asal.nama },
        sekolah_tujuan: {
          sekolah_id: tujuan.id,
          nama: tujuan.nama,
          kabupaten: tujuan.kabupaten,
          jenjang: tujuan.jenjang,
        },
        jam_ngajar_sekarang: guru.jam_ngajar,
        jam_ngajar_setelah_pindah: jamBaru,
        selisih_jam: jamBaru - guru.jam_ngajar,
        sertifikasi: guru.sertifikasi,
        status_tpg: tpg.status,
        tpg_aman: tpg.aman,
        penjelasan_tpg: tpg.alasan,
        formasi_di_sekolah_tujuan: {
          butuh: butuhTujuan,
          ada_sebelum: adaTujuan,
          ada_setelah: adaSetelah,
          status: kecukupan.status,
        },
        dampak_sekolah_asal: {
          sisa_guru_mapel: sisaAsal,
          jam_per_guru_setelah: jamAsalSetelah,
          peringatan:
            sisaAsal === 0
              ? `Tidak ada lagi guru ${guru.mapel} di ${asal.nama}.`
              : jamAsalSetelah > 36
                ? `Guru ${guru.mapel} yang tersisa akan menanggung ${jamAsalSetelah} jam per minggu.`
                : null,
        },
      };
    }

    case "cek_tpg": {
      const cariG = cariGuru(argumen.guru, data);
      if ("galat" in cariG) return { galat: cariG.galat };
      if ("kandidat" in cariG) {
        return {
          perlu_dipilih: true,
          pesan: "Ada beberapa guru dengan nama itu. Sebutkan sekolahnya atau pakai guru_id.",
          kandidat: cariG.kandidat,
        };
      }

      const guru = cariG.guru;
      const jam =
        typeof argumen.jam_baru === "number" && Number.isFinite(argumen.jam_baru)
          ? Math.max(0, Math.trunc(argumen.jam_baru))
          : guru.jam_ngajar;
      const hasil = cekTPG(jam, guru.sertifikasi, guru.status_kepegawaian as StatusKepegawaian);

      return {
        guru: { guru_id: guru.id, nama: guru.nama, sekolah: guru.sekolah_nama, mapel: guru.mapel },
        status_kepegawaian: guru.status_kepegawaian,
        sertifikasi: guru.sertifikasi,
        jam_diperiksa: jam,
        ambang_jam: hasil.ambang,
        status: hasil.status,
        aman: hasil.aman,
        penjelasan: hasil.alasan,
        nilai_tpg_per_bulan: rupiah(2000000),
        akibat_bila_tidak_aman: hasil.aman
          ? null
          : "InfoGTK menghentikan pembayaran TPG sekitar Rp2 juta per bulan.",
      };
    }

    default:
      return { galat: `Tool ${nama} tidak dikenal.` };
  }
}
