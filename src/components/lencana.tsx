import { cn } from "@/lib/utils";
import type { StatusKecukupan } from "@/lib/domain/tipe";

/**
 * Status selalu dibaca sebagai warna + label. Warnanya membawa makna
 * (kekurangan / cukup / kelebihan), jadi tidak boleh dipakai tanpa teks.
 */
const GAYA: Record<StatusKecukupan, string> = {
  kekurangan: "bg-kekurangan-lembut text-kekurangan border-kekurangan/30",
  cukup: "bg-cukup-lembut text-cukup border-cukup/30",
  kelebihan: "bg-kelebihan-lembut text-kelebihan border-kelebihan/30",
};

const LABEL: Record<StatusKecukupan, string> = {
  kekurangan: "Kekurangan guru",
  cukup: "Sudah cukup",
  kelebihan: "Kelebihan guru",
};

export function LencanaSebaran({
  status,
  kurang,
  lebih,
  className,
}: {
  status: StatusKecukupan;
  kurang: number;
  lebih: number;
  className?: string;
}) {
  const teks =
    status === "kekurangan"
      ? `${LABEL[status]} ${kurang}`
      : status === "kelebihan"
        ? `${LABEL[status]} ${lebih}`
        : LABEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] border px-2 py-[3px] text-[12px] font-medium",
        GAYA[status],
        className,
      )}
    >
      {teks}
    </span>
  );
}

const GAYA_TPG: Record<"aman" | "rawan" | "tidak_berlaku", string> = {
  aman: "bg-kelebihan-lembut text-kelebihan border-kelebihan/30",
  rawan: "bg-kekurangan-lembut text-kekurangan border-kekurangan/30",
  tidak_berlaku: "bg-latar text-teks-lembut border-garis-tegas",
};

const LABEL_TPG: Record<"aman" | "rawan" | "tidak_berlaku", string> = {
  aman: "TPG aman",
  rawan: "TPG berisiko hangus",
  tidak_berlaku: "Tanpa TPG (belum sertifikasi)",
};

export function LencanaTPG({
  status,
  className,
}: {
  status: "aman" | "rawan" | "tidak_berlaku";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] border px-2 py-[3px] text-[12px] font-medium",
        GAYA_TPG[status],
        className,
      )}
    >
      {LABEL_TPG[status]}
    </span>
  );
}
