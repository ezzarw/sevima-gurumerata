import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Kartu({
  judul,
  keterangan,
  aksi,
  children,
  className,
}: {
  judul?: string;
  keterangan?: string;
  aksi?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-kartu border border-garis bg-permukaan", className)}>
      {judul ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-garis px-4 py-3">
          <div>
            <h2 className="text-[15px] font-semibold">{judul}</h2>
            {keterangan ? <p className="mt-1 text-[13px] text-teks-lembut">{keterangan}</p> : null}
          </div>
          {aksi}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Angka statistik. Nilainya selalu berasal dari tabel sekolah, guru, dan
 * kebutuhan_guru, bukan angka contoh. Sumbernya ditulis di baris keterangan.
 */
export function KartuStatistik({
  label,
  nilai,
  satuan,
  sumber,
  nada = "netral",
}: {
  label: string;
  nilai: number | string;
  satuan?: string;
  sumber: string;
  nada?: "netral" | "kekurangan" | "cukup" | "kelebihan";
}) {
  const warna = {
    netral: "text-teks",
    kekurangan: "text-kekurangan",
    cukup: "text-cukup",
    kelebihan: "text-kelebihan",
  }[nada];

  return (
    <div className="rounded-kartu border border-garis bg-permukaan px-4 py-3">
      <p className="text-[13px] text-teks-lembut">{label}</p>
      <p className={cn("mt-1 text-[28px] font-semibold leading-tight tabular-nums", warna)}>
        {nilai}
        {satuan ? <span className="ml-1 text-[14px] font-normal text-teks-lembut">{satuan}</span> : null}
      </p>
      <p className="mt-1 text-[12px] text-teks-lembut">{sumber}</p>
    </div>
  );
}
