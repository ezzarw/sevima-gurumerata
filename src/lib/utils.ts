import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const pemformatAngka = new Intl.NumberFormat("id-ID");

export function formatAngka(nilai: number): string {
  return pemformatAngka.format(nilai);
}

export function formatTanggal(waktu: string | null | undefined): string {
  if (!waktu) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(waktu));
}

export function formatWaktuLengkap(waktu: string | null | undefined): string {
  if (!waktu) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(waktu),
  );
}

export const LABEL_ALASAN_MUTASI: Record<string, string> = {
  keluarga: "Alasan keluarga",
  kesehatan: "Alasan kesehatan",
  karir: "Pengembangan karier",
  lainnya: "Alasan lainnya",
};

export const LABEL_STATUS_MUTASI: Record<string, string> = {
  diajukan: "Menunggu review dinas",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan guru",
};

export function ringkasSebaran(kurang: number, lebih: number): string {
  return `kurang ${formatAngka(kurang)} · lebih ${formatAngka(lebih)}`;
}
