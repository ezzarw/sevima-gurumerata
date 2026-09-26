import { describe, expect, it } from "vitest";
import { AMBANG_JAM_TPG } from "@/lib/domain/tipe";
import {
  daftarMapel,
  cekTPG,
  hitungBebanMapel,
  hitungDampakPsikologis,
  hitungJarakKm,
  hitungJamNgajar,
  hitungKebutuhanGuru,
  hitungKekuranganGuru,
  hitungKekuranganSekolah,
  jamMapelPerRombel,
  simulasiMutasi,
  statusDaerah,
  type InputSimulasi,
} from "@/lib/domain/logika";

describe("jamMapelPerRombel", () => {
  it("mengembalikan jam resmi untuk mapel dan jenjang yang dikenal", () => {
    expect(jamMapelPerRombel("SD", "Matematika")).toBe(6);
    expect(jamMapelPerRombel("SMP", "IPA")).toBe(5);
    expect(jamMapelPerRombel("SMA", "Fisika")).toBe(3);
    expect(jamMapelPerRombel("SMK", "Produktif TKJ")).toBe(8);
  });

  it("mengembalikan 0 untuk mapel yang tidak ada di jenjang tersebut", () => {
    expect(jamMapelPerRombel("SD", "Fisika")).toBe(0);
    expect(jamMapelPerRombel("SMK", "Biologi")).toBe(0);
  });

  it("mendaftar mapel sesuai jenjang", () => {
    expect(daftarMapel("SMA")).toContain("Fisika");
    expect(daftarMapel("SD")).not.toContain("Fisika");
  });
});

describe("hitungBebanMapel", () => {
  it("mengalikan rombel dengan jam mapel", () => {
    expect(hitungBebanMapel(12, "SMP", "Matematika")).toBe(60);
  });

  it("mengembalikan 0 bila rombel tidak valid", () => {
    expect(hitungBebanMapel(0, "SMP", "Matematika")).toBe(0);
    expect(hitungBebanMapel(-3, "SMP", "Matematika")).toBe(0);
  });
});

describe("hitungKebutuhanGuru", () => {
  it("membulatkan ke bawah beban dibagi 24 jam", () => {
    // SMP 24 rombel x 5 jam = 120 jam -> 5 formasi
    expect(hitungKebutuhanGuru(24, "SMP", "Matematika")).toBe(5);
    // SMP 12 rombel x 5 jam = 60 jam -> 2 formasi
    expect(hitungKebutuhanGuru(12, "SMP", "Matematika")).toBe(2);
  });

  it("selalu butuh minimal 1 guru bila mapel diajarkan", () => {
    // SMA 2 rombel x 2 jam = 4 jam, di bawah 24 jam
    expect(hitungKebutuhanGuru(2, "SMA", "Informatika")).toBe(1);
  });

  it("mengembalikan 0 untuk mapel yang tidak diajarkan", () => {
    expect(hitungKebutuhanGuru(12, "SD", "Fisika")).toBe(0);
    expect(hitungKebutuhanGuru(0, "SMP", "Matematika")).toBe(0);
  });
});

describe("hitungJamNgajar", () => {
  it("membagi beban rata antar guru", () => {
    // 12 rombel x 6 jam = 72 jam, 3 guru -> 24 jam
    expect(hitungJamNgajar(12, "SD", "Matematika", 3)).toBe(24);
  });

  it("membatasi jam ngajar pada 40 jam per minggu", () => {
    // 27 rombel x 4 jam = 108 jam, 2 guru -> 54, dipangkas ke 40
    expect(hitungJamNgajar(27, "SMA", "Matematika", 2)).toBe(40);
  });

  it("mengembalikan 0 bila tidak ada guru", () => {
    expect(hitungJamNgajar(12, "SD", "Matematika", 0)).toBe(0);
  });
});

describe("hitungKekuranganGuru", () => {
  it("menandai sekolah kekurangan guru", () => {
    const hasil = hitungKekuranganGuru({ mapel: "Matematika", jumlahButuh: 3, jumlahAda: 1 });
    expect(hasil).toMatchObject({ kurang: 2, lebih: 0, status: "kekurangan" });
  });

  it("menandai sekolah dengan guru kelebihan", () => {
    const hasil = hitungKekuranganGuru({ mapel: "IPS", jumlahButuh: 2, jumlahAda: 4 });
    expect(hasil).toMatchObject({ kurang: 0, lebih: 2, status: "kelebihan" });
  });

  it("menandai sekolah yang sudah cukup", () => {
    const hasil = hitungKekuranganGuru({ mapel: "IPA", jumlahButuh: 3, jumlahAda: 3 });
    expect(hasil).toMatchObject({ kurang: 0, lebih: 0, status: "cukup" });
  });
});

describe("hitungKekuranganSekolah", () => {
  it("menjumlahkan kekurangan dan kelebihan seluruh mapel", () => {
    const hasil = hitungKekuranganSekolah([
      { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 1 },
      { mapel: "IPA", jumlahButuh: 2, jumlahAda: 3 },
      { mapel: "IPS", jumlahButuh: 2, jumlahAda: 2 },
    ]);
    expect(hasil.totalKurang).toBe(2);
    expect(hasil.totalLebih).toBe(1);
    expect(hasil.rincian).toHaveLength(3);
  });

  it("mengembalikan nol untuk daftar kosong", () => {
    expect(hitungKekuranganSekolah([])).toEqual({ rincian: [], totalKurang: 0, totalLebih: 0 });
  });
});

describe("cekTPG", () => {
  it("aman bila guru bersertifikasi mengajar tepat 24 jam", () => {
    const hasil = cekTPG(24, true, "PNS");
    expect(hasil.aman).toBe(true);
    expect(hasil.status).toBe("aman");
    expect(hasil.alasan).toContain("24 jam");
  });

  it("rawan bila guru bersertifikasi kurang dari 24 jam", () => {
    const hasil = cekTPG(18, true, "PNS");
    expect(hasil.aman).toBe(false);
    expect(hasil.status).toBe("rawan");
    expect(hasil.alasan).toContain("kurang 6 jam");
  });

  it("tidak berlaku bila guru belum bersertifikasi", () => {
    const hasil = cekTPG(30, false, "Honorer");
    expect(hasil.aman).toBe(false);
    expect(hasil.status).toBe("tidak_berlaku");
    expect(hasil.alasan).toContain("belum bersertifikasi");
  });

  it("tetap rawan untuk guru PPPK bersertifikasi dengan jam kurang", () => {
    expect(cekTPG(AMBANG_JAM_TPG - 1, true, "PPPK").status).toBe("rawan");
  });
});

describe("hitungJarakKm", () => {
  it("menghitung jarak Jakarta - Bandung sekitar 120 km", () => {
    const jarak = hitungJarakKm({ lat: -6.2088, lon: 106.8456 }, { lat: -6.9147, lon: 107.6098 });
    expect(jarak).toBeGreaterThan(110);
    expect(jarak).toBeLessThan(135);
  });

  it("mengembalikan 0 untuk titik yang sama", () => {
    expect(hitungJarakKm({ lat: -8.65, lon: 115.22 }, { lat: -8.65, lon: 115.22 })).toBe(0);
  });

  it("mengukur jarak lintas pulau Kupang - Jayapura", () => {
    const jarak = hitungJarakKm({ lat: -10.1772, lon: 123.607 }, { lat: -2.5916, lon: 140.669 });
    expect(jarak).toBeGreaterThan(1800);
  });
});

describe("hitungDampakPsikologis", () => {
  const dasar = {
    jarakKm: 0,
    tpgAman: true,
    sertifikasi: true,
    selisihJam: 0,
    domisiliBedaKabupaten: false,
    tujuanDaerahTertinggal: false,
  };

  it("memberi skor ringan bila semua faktor aman", () => {
    const hasil = hitungDampakPsikologis(dasar);
    expect(hasil.kategori).toBe("ringan");
    expect(hasil.faktor).toEqual(["Tidak ada faktor risiko yang menonjol"]);
  });

  it("memberi skor berat bila TPG berisiko dan pindah sangat jauh", () => {
    const hasil = hitungDampakPsikologis({
      ...dasar,
      jarakKm: 420,
      tpgAman: false,
      selisihJam: -10,
      domisiliBedaKabupaten: true,
      tujuanDaerahTertinggal: true,
    });
    expect(hasil.kategori).toBe("berat");
    expect(hasil.skor).toBeLessThanOrEqual(100);
    expect(hasil.faktor.join(" ")).toContain("TPG");
  });

  it("menghitung faktor jarak menengah", () => {
    const hasil = hitungDampakPsikologis({ ...dasar, jarakKm: 60 });
    expect(hasil.kategori).toBe("sedang");
    expect(hasil.faktor.join(" ")).toContain("60 km");
  });

  it("menandai jarak harian yang masih dekat", () => {
    const hasil = hitungDampakPsikologis({ ...dasar, jarakKm: 20 });
    expect(hasil.faktor.join(" ")).toContain("Jarak dari domisili 20 km");
    expect(hasil.kategori).toBe("ringan");
  });

  it("menaikkan skor bila jam mengajar berkurang", () => {
    const hasil = hitungDampakPsikologis({ ...dasar, selisihJam: -5 });
    expect(hasil.skor).toBeGreaterThan(10);
    expect(hasil.faktor.join(" ")).toContain("berkurang 5 jam");
  });
});

describe("statusDaerah", () => {
  it("merah untuk daerah kekurangan guru", () => {
    expect(statusDaerah(12, 0)).toBe("kekurangan");
  });

  it("kuning untuk daerah yang cukup", () => {
    expect(statusDaerah(0, 0)).toBe("cukup");
  });

  it("hijau untuk daerah kelebihan guru", () => {
    expect(statusDaerah(0, 9)).toBe("kelebihan");
  });
});

const guruSertifikasi = {
  id: "g-1",
  nama: "Yohanes Tefa, S.Pd",
  mapel: "Matematika",
  sertifikasi: true,
  statusKepegawaian: "PNS" as const,
  jamNgajar: 28,
  sekolahId: "s-1",
  domisili: "Kota Kupang",
  domisiliKoordinat: { lat: -10.1772, lon: 123.607 },
};

function input(over: Partial<InputSimulasi> = {}): InputSimulasi {
  return {
    guru: guruSertifikasi,
    sekolahAsal: {
      id: "s-1",
      nama: "SMAN 1 Kupang",
      jenjang: "SMA",
      rombel: 18,
      kabupaten: "Kota Kupang",
      provinsi: "Nusa Tenggara Timur",
      koordinat: { lat: -10.1736, lon: 123.6058 },
      jumlahGuruMapel: 2,
      kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 2 },
    },
    sekolahTujuan: {
      id: "s-2",
      nama: "SMAN 1 Waingapu",
      jenjang: "SMA",
      rombel: 18,
      kabupaten: "Kabupaten Sumba Timur",
      provinsi: "Nusa Tenggara Timur",
      koordinat: { lat: -9.6563, lon: 120.2664 },
      jumlahGuruMapel: 1,
      kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 1 },
    },
    ...over,
  };
}

describe("simulasiMutasi", () => {
  it("menghitung jam ngajar baru, TPG aman, dan rekomendasi hijau", () => {
    const hasil = simulasiMutasi(
      input({
        sekolahAsal: {
          ...input().sekolahAsal,
          jumlahGuruMapel: 3,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 3 },
        },
        sekolahTujuan: {
          id: "s-4",
          nama: "SMP Negeri 4 Kupang",
          jenjang: "SMA",
          rombel: 18,
          kabupaten: "Kota Kupang",
          provinsi: "Nusa Tenggara Timur",
          koordinat: { lat: -10.1651, lon: 123.6195 },
          jumlahGuruMapel: 1,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 1 },
        },
      }),
    );
    // 18 rombel x 4 jam = 72 jam dibagi 2 guru (1 existing + 1 pindah) = 36 jam
    expect(hasil.jamNgajarBaru).toBe(36);
    expect(hasil.jamNgajarLama).toBe(28);
    expect(hasil.selisihJam).toBe(8);
    expect(hasil.tpg.aman).toBe(true);
    expect(hasil.kebutuhan.status).toBe("kekurangan");
    expect(hasil.psikologis.kategori).toBe("ringan");
    // Sekolah asal: sisa 2 guru menanggung 36 jam, masih di bawah ambang kewaspadaan.
    expect(hasil.sekolahAsal.jumlahGuruSetelah).toBe(2);
    expect(hasil.sekolahAsal.peringatan).toBeNull();
    expect(hasil.rekomendasi.tingkat).toBe("aman");
    expect(hasil.rekomendasi.alasan.join(" ")).toContain("menutup kebutuhan");
  });

  it("TPG aman tapi pindah lintas pulau tetap diberi status perhatian", () => {
    const hasil = simulasiMutasi(input());
    expect(hasil.tpg.aman).toBe(true);
    expect(hasil.psikologis.kategori).toBe("berat");
    expect(hasil.rekomendasi.tingkat).toBe("perhatian");
    expect(hasil.rekomendasi.alasan.join(" ")).toContain("Dampak psikologis berat");
  });

  it("memberi peringatan merah saat TPG bakal hangus", () => {
    const hasil = simulasiMutasi(
      input({
        sekolahTujuan: {
          id: "s-3",
          nama: "SMP Negeri 8 Makassar",
          jenjang: "SMP",
          rombel: 3,
          kabupaten: "Kota Makassar",
          provinsi: "Sulawesi Selatan",
          koordinat: { lat: -5.1632, lon: 119.4801 },
          jumlahGuruMapel: 4,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 1, jumlahAda: 4 },
        },
      }),
    );
    expect(hasil.tpg.aman).toBe(false);
    expect(hasil.tpg.status).toBe("rawan");
    expect(hasil.rekomendasi.tingkat).toBe("berisiko");
    expect(hasil.rekomendasi.judul).toContain("Jangan eksekusi");
    expect(hasil.rekomendasi.alasan.join(" ")).toContain("TPG");
  });

  it("menandai risiko bila sekolah asal kehabisan guru mapel", () => {
    const hasil = simulasiMutasi(
      input({
        sekolahAsal: {
          ...input().sekolahAsal,
          jumlahGuruMapel: 1,
        },
      }),
    );
    expect(hasil.sekolahAsal.jumlahGuruSetelah).toBe(0);
    expect(hasil.sekolahAsal.peringatan).toContain("Tidak ada lagi guru Matematika");
    expect(hasil.rekomendasi.tingkat).toBe("berisiko");
  });

  it("memakai jarak domisili bila koordinat domisili tersedia", () => {
    const hasil = simulasiMutasi(input());
    expect(hasil.jarakDariDomisiliKm).not.toBeNull();
    expect(hasil.jarakDariDomisiliKm!).toBeGreaterThan(200);
    expect(hasil.jarakDariSekolahAsalKm).not.toBeNull();
  });

  it("tidak menghitung jarak domisili bila koordinat tidak ada", () => {
    const tanpaKoordinat = { ...guruSertifikasi };
    delete (tanpaKoordinat as { domisiliKoordinat?: unknown }).domisiliKoordinat;
    const hasil = simulasiMutasi(input({ guru: tanpaKoordinat }));
    expect(hasil.jarakDariDomisiliKm).toBeNull();
  });

  it("menjelaskan saat mutasi aman tanpa catatan tambahan", () => {
    const hasil = simulasiMutasi(
      input({
        guru: { ...guruSertifikasi, jamNgajar: 30 },
        sekolahAsal: {
          ...input().sekolahAsal,
          jumlahGuruMapel: 3,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 3 },
        },
        sekolahTujuan: {
          id: "s-5",
          nama: "SMP Negeri 4 Kupang",
          jenjang: "SMA",
          // 12 rombel x 4 jam Matematika = 48 jam; butuh 2 formasi dan baru
          // terisi 1, sehingga guru yang masuk membuat beban 24 jam per guru
          // dan formasi di sekolah tujuan tepat terpenuhi.
          rombel: 12,
          kabupaten: "Kota Kupang",
          provinsi: "Nusa Tenggara Timur",
          koordinat: { lat: -10.1651, lon: 123.6195 },
          jumlahGuruMapel: 1,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 2, jumlahAda: 1 },
        },
      }),
    );
    expect(hasil.jamNgajarBaru).toBe(24);
    expect(hasil.kebutuhan.status).toBe("cukup");
    expect(hasil.rekomendasi.tingkat).toBe("aman");
    expect(hasil.rekomendasi.alasan.join(" ")).toContain("memenuhi ambang 24 jam");
    expect(hasil.rekomendasi.saran.join(" ")).toContain("Lanjutkan ke pengajuan resmi");
  });

  it("guru honorer tidak diberi klaim TPG aman", () => {
    const hasil = simulasiMutasi(
      input({
        guru: { ...guruSertifikasi, sertifikasi: false, statusKepegawaian: "Honorer" },
        sekolahAsal: {
          ...input().sekolahAsal,
          jumlahGuruMapel: 3,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 3 },
        },
        sekolahTujuan: {
          id: "s-4",
          nama: "SMP Negeri 4 Kupang",
          jenjang: "SMA",
          rombel: 18,
          kabupaten: "Kota Kupang",
          provinsi: "Nusa Tenggara Timur",
          koordinat: { lat: -10.1651, lon: 123.6195 },
          jumlahGuruMapel: 1,
          kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 3, jumlahAda: 1 },
        },
      }),
    );
    expect(hasil.tpg.status).toBe("tidak_berlaku");
    expect(hasil.tpg.alasan).toContain("belum bersertifikasi");
    expect(hasil.rekomendasi.tingkat).toBe("aman");
    expect(hasil.rekomendasi.alasan.join(" ")).not.toContain("TPG");
  });

  it("menghitung dampak psikologis untuk perpindahan lintas kabupaten 3T", () => {
    const hasil = simulasiMutasi(input());
    expect(hasil.psikologis.skor).toBeGreaterThan(10);
    expect(hasil.psikologis.faktor.length).toBeGreaterThan(0);
  });

  it("menyarankan pengganti bila beban guru sisa mendekati batas maksimal", () => {
    const hasil = simulasiMutasi(
      input({
        sekolahAsal: {
          ...input().sekolahAsal,
          rombel: 60,
          jumlahGuruMapel: 3,
        },
      }),
    );
    expect(hasil.sekolahAsal.jamRataRataSetelah).toBe(40);
    expect(hasil.sekolahAsal.peringatan).toContain("mendekati batas maksimal");
    expect(hasil.rekomendasi.saran.join(" ")).toContain("Siapkan pengganti");
  });
});
