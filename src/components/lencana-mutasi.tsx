import type { StatusMutasi } from "@/lib/domain/tipe";
import { cn } from "@/lib/utils";

const GAYA: Record<StatusMutasi, string> = {
  diajukan: "bg-aksen-lembut text-aksen border-aksen/30",
  disetujui: "bg-kelebihan-lembut text-kelebihan border-kelebihan/30",
  ditolak: "bg-kekurangan-lembut text-kekurangan border-kekurangan/30",
  dibatalkan: "bg-latar text-teks-lembut border-garis-tegas",
};

const LABEL: Record<StatusMutasi, string> = {
  diajukan: "Menunggu review",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan",
};

export function LencanaStatusMutasi({
  status,
  className,
}: {
  status: StatusMutasi;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] border px-2 py-[3px] text-[12px] font-medium",
        GAYA[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}
