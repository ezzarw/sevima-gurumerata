import { describe, expect, it } from "vitest";
import {
  formatAngka,
  formatTanggal,
  formatWaktuLengkap,
  LABEL_ALASAN_MUTASI,
  LABEL_STATUS_MUTASI,
  ringkasSebaran,
} from "@/lib/data/format";

describe("formatAngka", () => {
  it("memakai pemisah ribuan gaya Indonesia", () => {
    expect(formatAngka(1234)).toBe("1.234");
    expect(formatAngka(1000000)).toBe("1.000.000");
  });

  it("menampilkan nol dan angka kecil apa adanya", () => {
    expect(formatAngka(0)).toBe("0");
    expect(formatAngka(7)).toBe("7");
  });
});

describe("formatTanggal", () => {
  it("memformat tanggal dalam bahasa Indonesia", () => {
    const hasil = formatTanggal("2026-09-26T03:55:49.098Z");
    expect(hasil).toMatch(/2026/);
    expect(hasil).toMatch(/Sep/);
  });

  it("mengembalikan tanda hubung bila tanggal kosong", () => {
    expect(formatTanggal(null)).toBe("-");
    expect(formatTanggal(undefined)).toBe("-");
  });
});

describe("formatWaktuLengkap", () => {
  it("menyertakan jam dan menit", () => {
    const hasil = formatWaktuLengkap("2026-09-26T03:55:49.098Z");
    expect(hasil).toMatch(/2026/);
    expect(hasil).toMatch(/\d{2}[.:]\d{2}/);
  });

  it("mengembalikan tanda hubung bila waktu kosong", () => {
    expect(formatWaktuLengkap(null)).toBe("-");
  });
});

describe("ringkasSebaran", () => {
  it("memakai pola tetap kurang dan lebih dengan pemisah ribuan", () => {
    expect(ringkasSebaran(12, 0)).toBe("kurang 12 · lebih 0");
    expect(ringkasSebaran(0, 1234)).toBe("kurang 0 · lebih 1.234");
  });

  it("tetap menulis kedua angka walau keduanya nol", () => {
    expect(ringkasSebaran(0, 0)).toBe("kurang 0 · lebih 0");
  });
});

describe("label istilah domain", () => {
  it("mencakup seluruh alasan pengajuan yang sah", () => {
    expect(Object.keys(LABEL_ALASAN_MUTASI).sort()).toEqual(
      ["karir", "keluarga", "kesehatan", "lainnya"].sort(),
    );
  });

  it("mencakup seluruh status mutasi", () => {
    expect(Object.keys(LABEL_STATUS_MUTASI).sort()).toEqual(
      ["diajukan", "dibatalkan", "disetujui", "ditolak"].sort(),
    );
  });

  it("memakai istilah berbahasa Indonesia, bukan nama kolom", () => {
    expect(LABEL_STATUS_MUTASI.diajukan).toBe("Menunggu review dinas");
    expect(LABEL_ALASAN_MUTASI.keluarga).toBe("Alasan keluarga");
  });
});
