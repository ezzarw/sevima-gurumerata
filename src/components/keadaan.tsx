import { AlertTriangle, Inbox, Loader2, SearchX } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Keadaan memuat, kosong, dan gagal. Setiap keadaan menyebut sebab dan
 * langkah berikutnya, bukan sekadar "tidak ada data".
 */

export function KeadaanMemuat({ pesan = "Memuat data" }: { pesan?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-kartu border border-garis bg-permukaan px-4 py-6 text-teks-lembut"
    >
      <Loader2 aria-hidden className="size-4 animate-spin" />
      <span className="text-sm">{pesan}…</span>
    </div>
  );
}

export function KeadaanKosong({
  judul,
  keterangan,
  tindakan,
}: {
  judul: string;
  keterangan: string;
  tindakan?: ReactNode;
}) {
  return (
    <div className="rounded-kartu border border-garis bg-permukaan px-5 py-8 text-center">
      <Inbox aria-hidden className="mx-auto size-5 text-teks-lembut" />
      <p className="mt-3 font-medium">{judul}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-teks-lembut">{keterangan}</p>
      {tindakan ? <div className="mt-4 flex justify-center">{tindakan}</div> : null}
    </div>
  );
}

export function KeadaanKosongFilter({ onReset }: { onReset?: () => void }) {
  return (
    <div className="rounded-kartu border border-garis bg-permukaan px-5 py-8 text-center">
      <SearchX aria-hidden className="mx-auto size-5 text-teks-lembut" />
      <p className="mt-3 font-medium">Tidak ada hasil untuk filter ini</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-teks-lembut">
        Longgarkan filter daerah, mapel, atau kata kunci. Data yang tersedia hanya mencakup 5
        provinsi contoh.
      </p>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-kartu border border-garis-tegas px-3 py-2 text-sm font-medium hover:bg-latar"
        >
          Bersihkan filter
        </button>
      ) : null}
    </div>
  );
}

export function KeadaanGagal({
  judul = "Data gagal dimuat",
  keterangan,
  detail,
}: {
  judul?: string;
  keterangan: string;
  detail?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-5 py-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0 text-kekurangan" />
        <div>
          <p className="font-medium text-kekurangan">{judul}</p>
          <p className="mt-1 text-sm text-teks">{keterangan}</p>
          {detail ? (
            <p className="mt-2 rounded-[4px] bg-permukaan px-2 py-1 font-mono text-[12px] text-teks-lembut">
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
