"use client";

import Link from "next/link";
import { useActionState } from "react";
import { batalkanMutasi, type HasilAksi } from "@/app/(kerja)/mutasi/aksi";
import { LencanaStatusMutasi } from "@/components/lencana-mutasi";
import { Kartu } from "@/components/kartu";
import { formatTanggal, formatWaktuLengkap, LABEL_ALASAN_MUTASI } from "@/lib/data/format";
import { useMutasiRealtime } from "@/components/use-mutasi-realtime";
import type { BarisMutasi } from "@/lib/data/kueri";

const AWAL: HasilAksi = {};

const URUTAN = ["diajukan", "disetujui", "ditolak", "dibatalkan"] as const;

export function DaftarMutasi({ mutasi, bisaMemutuskan }: { mutasi: BarisMutasi[]; bisaMemutuskan: boolean }) {
  const [hasil, aksi] = useActionState(batalkanMutasi, AWAL);
  const { terhubung, peristiwaTerakhir, galat } = useMutasiRealtime();

  if (mutasi.length === 0) return null;

  const kelompok = URUTAN.map((status) => ({
    status,
    baris: mutasi.filter((m) => m.status === status),
  })).filter((k) => k.baris.length > 0);

  return (
    <div className="space-y-5">
      <p
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center gap-2 text-[13px] text-teks-lembut"
      >
        <span
          aria-hidden
          className={terhubung ? "size-2 rounded-full bg-kelebihan" : "size-2 rounded-full bg-garis-tegas"}
        />
        {galat
          ? `Pembaruan langsung bermasalah: ${galat}`
          : terhubung
            ? "Terhubung ke pembaruan langsung. Perubahan pengajuan dari pengguna lain muncul di sini tanpa muat ulang."
            : "Menghubungkan ke pembaruan langsung…"}
        {peristiwaTerakhir
          ? ` Perubahan ${peristiwaTerakhir.jenis.toLowerCase()} diterima ${formatWaktuLengkap(peristiwaTerakhir.waktu.toISOString())}.`
          : ""}
      </p>

      {hasil.pesan ? (
        <p role="status" className="rounded-kartu border border-kelebihan/30 bg-kelebihan-lembut px-3 py-2 text-[13px] text-kelebihan">
          {hasil.pesan}
        </p>
      ) : null}

      {kelompok.map(({ status, baris }) => (
        <Kartu
          key={status}
          judul={
            status === "diajukan"
              ? "Menunggu review dinas"
              : status === "disetujui"
                ? "Sudah disetujui dan dieksekusi"
                : status === "ditolak"
                  ? "Ditolak"
                  : "Dibatalkan"
          }
          keterangan={`${baris.length} pengajuan`}
        >
          <ul className="divide-y divide-garis">
            {baris.map((m) => (
              <li key={m.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">
                      <Link href={`/mutasi/${m.id}`} className="hover:underline">
                        {m.guru_nama}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-[13px] text-teks-lembut">
                      {m.mapel} · dari {m.sekolah_asal} ke {m.sekolah_tujuan}
                    </p>
                    <p className="mt-1 text-[12px] text-teks-lembut">
                      Diajukan {formatTanggal(m.created_at)} ·{" "}
                      {LABEL_ALASAN_MUTASI[m.alasan] ?? m.alasan}
                      {m.approved_at ? ` · diputuskan ${formatTanggal(m.approved_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <LencanaStatusMutasi status={m.status} />
                    <Link
                      href={`/mutasi/${m.id}`}
                      className="rounded-kartu border border-garis-tegas px-3 py-1.5 text-[13px] font-medium hover:bg-latar"
                    >
                      Lihat detail
                    </Link>
                  </div>
                </div>

                {m.catatan_dinas ? (
                  <p className="mt-2 rounded-kartu bg-latar px-3 py-2 text-[13px]">
                    <span className="font-medium">Catatan dinas: </span>
                    {m.catatan_dinas}
                  </p>
                ) : null}

                {m.status === "diajukan" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {bisaMemutuskan ? (
                      <Link
                        href={`/mutasi/${m.id}`}
                        className="rounded-kartu bg-inti px-3 py-1.5 text-[13px] font-medium text-white hover:bg-inti/90"
                      >
                        Review pengajuan ini
                      </Link>
                    ) : null}
                    <form action={aksi}>
                      <input type="hidden" name="mutasi_id" value={m.id} />
                      <button
                        type="submit"
                        className="rounded-kartu border border-garis-tegas px-3 py-1.5 text-[13px] font-medium hover:bg-latar"
                      >
                        Batalkan pengajuan
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Kartu>
      ))}
    </div>
  );
}
