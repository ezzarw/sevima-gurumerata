import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("menggabungkan beberapa kelas", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("membiarkan nilai kosong tanpa menambah spasi berlebih", () => {
    expect(cn("px-2", undefined, null, false, "py-1")).toBe("px-2 py-1");
  });

  it("membiarkan kelas terakhir menang saat ada bentrok Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-teks-lembut", "text-kekurangan")).toBe("text-kekurangan");
  });

  it("menerima kelas kondisional sebagai objek", () => {
    expect(cn("rounded-kartu", { "bg-latar": true, "bg-permukaan": false })).toBe(
      "rounded-kartu bg-latar",
    );
  });
});
