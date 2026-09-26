import { describe, expect, it } from "vitest";
import { hitungDampakPsikologis, simulasiMutasi, type InputSimulasi } from "./logika";

/**
 * Status daerah tertinggal dahulu ditulis sebagai daftar tetap di dalam kode
 * (Kabupaten Asmat, Sumba Timur, Jeneponto). Sekarang nilainya datang dari
 * kolom kabupaten.daerah_tertinggal. Test ini memastikan pemindahan itu benar:
 * yang menentukan faktor risiko hanyalah nilai kolomnya, bukan nama kabupaten.
 */
function masukan(daerahTertinggal: boolean, kabupaten: string): InputSimulasi {
  return {
    guru: {
      id: "g-1", nama: "Sulastri, S.Pd", mapel: "Matematika", sertifikasi: true,
      statusKepegawaian: "PNS", jamNgajar: 20, sekolahId: "s-1",
      domisili: "Kota Jakarta Pusat",
      domisiliKoordinat: { lat: -6.18, lon: 106.83 },
    },
    sekolahAsal: {
      id: "s-1", nama: "SMAN 8 Jakarta", jenjang: "SMA", rombel: 15,
      kabupaten: "Kota Jakarta Pusat", provinsi: "DKI Jakarta",
      koordinat: { lat: -6.18, lon: 106.83 },
      jumlahGuruMapel: 3,
      kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 4, jumlahAda: 3 },
    },
    sekolahTujuan: {
      id: "s-2", nama: "SMAN 1 Waingapu", jenjang: "SMA", rombel: 15,
      kabupaten, provinsi: "Nusa Tenggara Timur",
      koordinat: { lat: -9.65, lon: 120.26 },
      daerahTertinggal,
      jumlahGuruMapel: 1,
      kebutuhanMapel: { mapel: "Matematika", jumlahButuh: 2, jumlahAda: 1 },
    },
  };
}

const flag = (daerahTertinggal: boolean) => ({
  jarakKm: 1200, tpgAman: true, sertifikasi: true, selisihJam: 0,
  domisiliBedaKabupaten: true, tujuanDaerahTertinggal: daerahTertinggal,
});

describe("daerah tertinggal dibaca dari data, bukan dari nama kabupaten", () => {
  it("faktor risiko muncul saat kolomnya true, walau nama kabupatennya biasa", () => {
    const dengan = hitungDampakPsikologis(flag(true));
    const tanpa = hitungDampakPsikologis(flag(false));
    expect(dengan.skor - tanpa.skor).toBe(15);
    expect(dengan.faktor.join(" ")).toContain("3T");
  });

  it("nama kabupaten yang dulu ada di daftar kode tidak lagi otomatis berisiko", () => {
    // Kabupaten Asmat dahulu selalu dianggap 3T karena namanya tertulis di kode.
    const asmat = simulasiMutasi(masukan(false, "Kabupaten Asmat"));
    const surabaya = simulasiMutasi(masukan(false, "Kota Surabaya"));
    expect(asmat.psikologis.skor).toBe(surabaya.psikologis.skor);
    expect(asmat.psikologis.faktor.join(" ")).not.toContain("3T");
  });

  it("kolom true tetap memberi faktor risiko saat dipakai lewat simulasi penuh", () => {
    const asmat = simulasiMutasi(masukan(true, "Kabupaten Asmat"));
    const surabaya = simulasiMutasi(masukan(true, "Kota Surabaya"));
    expect(asmat.psikologis.skor).toBe(surabaya.psikologis.skor);
    expect(asmat.psikologis.faktor.join(" ")).toContain("3T");
  });

  it("wilayah 3T baru bisa ditambahkan lewat data tanpa mengubah kode", () => {
    const nduga = simulasiMutasi(masukan(true, "Kabupaten Nduga"));
    const jeneponto = simulasiMutasi(masukan(true, "Kabupaten Jeneponto"));
    expect(nduga.psikologis.skor).toBe(jeneponto.psikologis.skor);
  });
});
