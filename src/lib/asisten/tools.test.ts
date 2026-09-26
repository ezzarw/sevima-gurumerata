import { describe, expect, it } from "vitest";
import { DEFINISI_TOOLS, jalankanTool, type DataAsisten } from "@/lib/asisten/tools";

/**
 * Data uji ini dibuat kecil dan sengaja memuat kasus yang sulit:
 * nama guru yang muncul di dua sekolah, sekolah dengan formasi penuh,
 * dan provinsi dengan dua sekolah kekurangan.
 */
const DATA: DataAsisten = {
  wilayah: [
    { id: "p-ntt", kode: "53", nama: "Nusa Tenggara Timur", latitude: -10.17, longitude: 123.6, jumlah_sekolah: 2, jumlah_guru: 3, total_kurang: 2, total_lebih: 0 },
    { id: "p-jkt", kode: "31", nama: "DKI Jakarta", latitude: -6.2, longitude: 106.8, jumlah_sekolah: 1, jumlah_guru: 3, total_kurang: 0, total_lebih: 1 },
  ],
  sekolah: [
    { id: "s-kupang", nama: "SMAN 1 Kupang", npsn: "50302901", jenjang: "SMA", jumlah_rombel: 18, alamat: null, latitude: -10.17, longitude: 123.6, kabupaten: "Kota Kupang", provinsi: "Nusa Tenggara Timur", kabupaten_id: "k-kupang", provinsi_id: "p-ntt", jumlah_guru: 2 },
    { id: "s-waingapu", nama: "SMAN 1 Waingapu", npsn: "50303977", jenjang: "SMA", jumlah_rombel: 15, alamat: null, latitude: -9.65, longitude: 120.26, kabupaten: "Kabupaten Sumba Timur", provinsi: "Nusa Tenggara Timur", kabupaten_id: "k-sumba", provinsi_id: "p-ntt", jumlah_guru: 1 },
    { id: "s-menteng", nama: "SDN Menteng 01 Pagi", npsn: "20102110", jenjang: "SD", jumlah_rombel: 12, alamat: null, latitude: -6.19, longitude: 106.83, kabupaten: "Kota Jakarta Pusat", provinsi: "DKI Jakarta", kabupaten_id: "k-jktp", provinsi_id: "p-jkt", jumlah_guru: 3 },
  ],
  kebutuhan: [
    { id: "b1", sekolah_id: "s-kupang", mapel: "Matematika", jumlah_butuh: 3, jumlah_ada: 2, kurang: 1, lebih: 0, sekolah_nama: "SMAN 1 Kupang", jenjang: "SMA", jumlah_rombel: 18, kabupaten_nama: "Kota Kupang", provinsi_nama: "Nusa Tenggara Timur" },
    { id: "b2", sekolah_id: "s-waingapu", mapel: "Matematika", jumlah_butuh: 2, jumlah_ada: 1, kurang: 1, lebih: 0, sekolah_nama: "SMAN 1 Waingapu", jenjang: "SMA", jumlah_rombel: 15, kabupaten_nama: "Kabupaten Sumba Timur", provinsi_nama: "Nusa Tenggara Timur" },
    { id: "b3", sekolah_id: "s-waingapu", mapel: "Fisika", jumlah_butuh: 1, jumlah_ada: 2, kurang: 0, lebih: 1, sekolah_nama: "SMAN 1 Waingapu", jenjang: "SMA", jumlah_rombel: 15, kabupaten_nama: "Kabupaten Sumba Timur", provinsi_nama: "Nusa Tenggara Timur" },
    { id: "b4", sekolah_id: "s-menteng", mapel: "Matematika", jumlah_butuh: 2, jumlah_ada: 3, kurang: 0, lebih: 1, sekolah_nama: "SDN Menteng 01 Pagi", jenjang: "SD", jumlah_rombel: 12, kabupaten_nama: "Kota Jakarta Pusat", provinsi_nama: "DKI Jakarta" },
  ],
  guru: [
    { id: "g-kupang", nama: "Yohanes Tefa, S.Pd", nip: null, nuptk: null, status_kepegawaian: "PNS", mapel: "Matematika", sertifikasi: true, sekolah_id: "s-kupang", domisili: "Kota Kupang", jam_ngajar: 36, sekolah_nama: "SMAN 1 Kupang", jenjang: "SMA", kabupaten_id: "k-kupang", kabupaten_nama: "Kota Kupang", provinsi_id: "p-ntt", provinsi_nama: "Nusa Tenggara Timur", daerah_tertinggal: false },
    { id: "g-citra-menteng", nama: "Citra Ayu, S.Pd", nip: null, nuptk: null, status_kepegawaian: "PNS", mapel: "Matematika", sertifikasi: true, sekolah_id: "s-menteng", domisili: "Kota Jakarta Pusat", jam_ngajar: 18, sekolah_nama: "SDN Menteng 01 Pagi", jenjang: "SD", kabupaten_id: "k-jktp", kabupaten_nama: "Kota Jakarta Pusat", provinsi_id: "p-jkt", provinsi_nama: "DKI Jakarta", daerah_tertinggal: false },
    { id: "g-citra-waingapu", nama: "Citra Ayu, S.Pd", nip: null, nuptk: null, status_kepegawaian: "PPPK", mapel: "Fisika", sertifikasi: false, sekolah_id: "s-waingapu", domisili: "Kabupaten Sumba Timur", jam_ngajar: 18, sekolah_nama: "SMAN 1 Waingapu", jenjang: "SMA", kabupaten_id: "k-sumba", kabupaten_nama: "Kabupaten Sumba Timur", provinsi_id: "p-ntt", provinsi_nama: "Nusa Tenggara Timur", daerah_tertinggal: false },
  ],
};

describe("definisi tool", () => {
  it("menyediakan tepat empat aksi", () => {
    expect(DEFINISI_TOOLS).toHaveLength(4);
    expect(DEFINISI_TOOLS.map((t) => t.function.name).sort()).toEqual([
      "cari_guru_kelebihan",
      "cari_sekolah_kekurangan",
      "cek_tpg",
      "simulasi_mutasi",
    ]);
  });

  it("memberi keterangan pada setiap tool supaya model tahu kapan memakainya", () => {
    for (const t of DEFINISI_TOOLS) {
      expect(t.function.description.length).toBeGreaterThan(40);
      expect(t.function.parameters).toBeTypeOf("object");
    }
  });
});

describe("cari_sekolah_kekurangan", () => {
  it("menyaring per provinsi dan mapel", async () => {
    const hasil = (await jalankanTool("cari_sekolah_kekurangan", { provinsi: "Nusa Tenggara Timur", mapel: "Matematika" }, DATA)) as {
      jumlah_ditemukan: number;
      sekolah: { sekolah: string; kurang: number }[];
    };
    expect(hasil.jumlah_ditemukan).toBe(2);
    expect(hasil.sekolah.map((s) => s.sekolah).sort()).toEqual(["SMAN 1 Kupang", "SMAN 1 Waingapu"]);
  });

  it("mengenali singkatan provinsi NTT", async () => {
    const hasil = (await jalankanTool("cari_sekolah_kekurangan", { provinsi: "NTT" }, DATA)) as {
      provinsi_cocok: string[];
      jumlah_ditemukan: number;
    };
    expect(hasil.provinsi_cocok).toEqual(["Nusa Tenggara Timur"]);
    expect(hasil.jumlah_ditemukan).toBe(2);
  });

  it("hanya mengembalikan sekolah yang benar-benar kekurangan", async () => {
    const hasil = (await jalankanTool("cari_sekolah_kekurangan", {}, DATA)) as {
      sekolah: { sekolah: string }[];
    };
    expect(hasil.sekolah.map((s) => s.sekolah)).not.toContain("SDN Menteng 01 Pagi");
  });

  it("menghormati batas jumlah baris", async () => {
    const hasil = (await jalankanTool("cari_sekolah_kekurangan", { batas: 1 }, DATA)) as {
      jumlah_ditemukan: number;
    };
    expect(hasil.jumlah_ditemukan).toBe(1);
  });

  it("mengembalikan daftar kosong bila provinsi tidak ada", async () => {
    const hasil = (await jalankanTool("cari_sekolah_kekurangan", { provinsi: "Bali" }, DATA)) as {
      jumlah_ditemukan: number;
      sekolah: unknown[];
    };
    expect(hasil.jumlah_ditemukan).toBe(0);
    expect(hasil.sekolah).toEqual([]);
  });
});

describe("cari_guru_kelebihan", () => {
  it("hanya mengembalikan guru dengan jam mengajar di bawah 24 jam", async () => {
    const hasil = (await jalankanTool("cari_guru_kelebihan", {}, DATA)) as {
      guru: { nama: string; jam_ngajar: number }[];
      ambang_jam: number;
    };
    expect(hasil.ambang_jam).toBe(24);
    expect(hasil.guru).toHaveLength(2);
    expect(hasil.guru.every((g) => g.jam_ngajar < 24)).toBe(true);
  });

  it("menyaring per provinsi", async () => {
    const hasil = (await jalankanTool("cari_guru_kelebihan", { provinsi: "DKI Jakarta" }, DATA)) as {
      guru: { nama: string }[];
    };
    expect(hasil.guru).toHaveLength(1);
    expect(hasil.guru[0].nama).toBe("Citra Ayu, S.Pd");
  });

  it("menandai guru bersertifikasi yang TPG-nya terancam", async () => {
    const hasil = (await jalankanTool("cari_guru_kelebihan", { mapel: "Matematika" }, DATA)) as {
      guru: { sertifikasi: boolean; tpg_terancam: boolean }[];
    };
    expect(hasil.guru[0].sertifikasi).toBe(true);
    expect(hasil.guru[0].tpg_terancam).toBe(true);
  });
});

describe("simulasi_mutasi", () => {
  it("menghitung jam baru dan status TPG memakai nama guru dan nama sekolah", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "Yohanes Tefa, S.Pd", sekolah_tujuan: "SMAN 1 Waingapu" },
      DATA,
    )) as {
      jam_ngajar_setelah_pindah: number;
      tpg_aman: boolean;
      status_tpg: string;
      sekolah_tujuan: { nama: string };
      dampak_sekolah_asal: { sisa_guru_mapel: number };
    };
    // 15 rombel x 4 jam = 60 jam, dibagi 2 guru -> 30 jam, di atas ambang 24.
    expect(hasil.jam_ngajar_setelah_pindah).toBe(30);
    expect(hasil.tpg_aman).toBe(true);
    expect(hasil.status_tpg).toBe("aman");
    expect(hasil.sekolah_tujuan.nama).toBe("SMAN 1 Waingapu");
    expect(hasil.dampak_sekolah_asal.sisa_guru_mapel).toBe(1);
  });

  it("menerima id selain nama", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "g-kupang", sekolah_tujuan: "s-waingapu" },
      DATA,
    )) as { jam_ngajar_setelah_pindah: number };
    expect(hasil.jam_ngajar_setelah_pindah).toBe(30);
  });

  it("meminta pemilihan saat nama guru muncul di dua sekolah", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "Citra Ayu", sekolah_tujuan: "SMAN 1 Waingapu" },
      DATA,
    )) as { perlu_dipilih: boolean; kandidat: { guru_id: string; sekolah: string }[] };
    expect(hasil.perlu_dipilih).toBe(true);
    expect(hasil.kandidat).toHaveLength(2);
  });

  it("meminta pemilihan saat nama sekolah cocok dengan beberapa baris", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "Yohanes Tefa, S.Pd", sekolah_tujuan: "SMAN" },
      DATA,
    )) as { perlu_dipilih: boolean };
    expect(hasil.perlu_dipilih).toBe(true);
  });

  it("menolak bila sekolah tujuan sama dengan sekolah asal", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "Yohanes Tefa, S.Pd", sekolah_tujuan: "SMAN 1 Kupang" },
      DATA,
    )) as { galat: string };
    expect(hasil.galat).toContain("sama dengan sekolah asal");
  });

  it("memberi keterangan bila guru tidak ditemukan", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "Guru Tidak Ada", sekolah_tujuan: "SMAN 1 Waingapu" },
      DATA,
    )) as { galat: string };
    expect(hasil.galat).toContain("tidak ditemukan");
  });

  it("memberi keterangan bila nama sekolah tidak ditemukan", async () => {
    const hasil = (await jalankanTool(
      "simulasi_mutasi",
      { guru: "Yohanes Tefa, S.Pd", sekolah_tujuan: "Sekolah Tidak Ada" },
      DATA,
    )) as { galat: string };
    expect(hasil.galat).toContain("tidak ditemukan");
  });
});

describe("cek_tpg", () => {
  it("menyatakan aman saat jam memenuhi ambang", async () => {
    const hasil = (await jalankanTool("cek_tpg", { guru: "Yohanes Tefa, S.Pd", jam_baru: 24 }, DATA)) as {
      aman: boolean;
      status: string;
      ambang_jam: number;
      akibat_bila_tidak_aman: string | null;
    };
    expect(hasil.aman).toBe(true);
    expect(hasil.status).toBe("aman");
    expect(hasil.ambang_jam).toBe(24);
    expect(hasil.akibat_bila_tidak_aman).toBeNull();
  });

  it("menyatakan rawan saat jam di bawah ambang dan menyebut nilai TPG", async () => {
    const hasil = (await jalankanTool("cek_tpg", { guru: "Yohanes Tefa, S.Pd", jam_baru: 18 }, DATA)) as {
      aman: boolean;
      status: string;
      nilai_tpg_per_bulan: string;
      akibat_bila_tidak_aman: string | null;
    };
    expect(hasil.aman).toBe(false);
    expect(hasil.status).toBe("rawan");
    expect(hasil.nilai_tpg_per_bulan).toContain("2.000.000");
    expect(hasil.akibat_bila_tidak_aman).toContain("InfoGTK");
  });

  it("menyatakan tidak berlaku untuk guru belum bersertifikasi", async () => {
    const hasil = (await jalankanTool("cek_tpg", { guru: "g-citra-waingapu" }, DATA)) as {
      status: string;
      sertifikasi: boolean;
    };
    expect(hasil.sertifikasi).toBe(false);
    expect(hasil.status).toBe("tidak_berlaku");
  });

  it("memakai jam mengajar sekarang bila jam_baru tidak diisi", async () => {
    const hasil = (await jalankanTool("cek_tpg", { guru: "Yohanes Tefa, S.Pd" }, DATA)) as {
      jam_diperiksa: number;
    };
    expect(hasil.jam_diperiksa).toBe(36);
  });

  it("meminta pemilihan saat nama guru ambigu", async () => {
    const hasil = (await jalankanTool("cek_tpg", { guru: "Citra Ayu" }, DATA)) as {
      perlu_dipilih: boolean;
    };
    expect(hasil.perlu_dipilih).toBe(true);
  });
});

describe("tool yang tidak dikenal", () => {
  it("mengembalikan keterangan galat", async () => {
    const hasil = (await jalankanTool("hapus_semua_data", {}, DATA)) as { galat: string };
    expect(hasil.galat).toContain("tidak dikenal");
  });
});
