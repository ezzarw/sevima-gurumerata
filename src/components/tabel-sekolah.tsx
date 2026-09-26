"use client";

import { useMemo, useState } from "react";
import { LencanaSebaran } from "@/components/lencana";
import { KeadaanKosongFilter } from "@/components/keadaan";
import { Kartu } from "@/components/kartu";
import type { BarisKebutuhan, BarisSekolah } from "@/lib/data/kueri";
import { hitungJamNgajar, statusKecukupan } from "@/lib/domain/logika";
import type { StatusKecukupan } from "@/lib/domain/tipe";
import { formatAngka } from "@/lib/data/format";
import { cn } from "@/lib/utils";

const KELAS_BIDANG =
  "w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]";

export function TabelSekolah({
  sekolah,
  kebutuhan,
}: {
  sekolah: BarisSekolah[];
  kebutuhan: BarisKebutuhan[];
}) {
  const [cari, setCari] = useState("");
  const [jenjang, setJenjang] = useState("semua");
  const [provinsi, setProvinsi] = useState("semua");
  const [status, setStatus] = useState<"semua" | StatusKecukupan>("semua");
  const [terbuka, setTerbuka] = useState<string | null>(null);

  const perSekolah = useMemo(() => {
    const peta = new Map<string, BarisKebutuhan[]>();
    for (const k of kebutuhan) {
      const daftar = peta.get(k.sekolah_id) ?? [];
      daftar.push(k);
      peta.set(k.sekolah_id, daftar);
    }
    return peta;
  }, [kebutuhan]);

  const pilihan = useMemo(
    () => ({
      jenjang: [...new Set(sekolah.map((s) => s.jenjang))].sort(),
      provinsi: [...new Set(sekolah.map((s) => s.provinsi))].sort(),
    }),
    [sekolah],
  );

  const ringkasan = useMemo(() => {
    const peta = new Map<string, { kurang: number; lebih: number; status: StatusKecukupan }>();
    for (const s of sekolah) {
      const baris = perSekolah.get(s.id) ?? [];
      const kurang = baris.reduce((n, k) => n + k.kurang, 0);
      const lebih = baris.reduce((n, k) => n + k.lebih, 0);
      peta.set(s.id, { kurang, lebih, status: statusKecukupan(kurang, lebih) });
    }
    return peta;
  }, [sekolah, perSekolah]);

  const hasil = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return sekolah.filter((s) => {
      if (kata && !`${s.nama} ${s.npsn ?? ""} ${s.kabupaten} ${s.alamat ?? ""}`.toLowerCase().includes(kata)) {
        return false;
      }
      if (jenjang !== "semua" && s.jenjang !== jenjang) return false;
      if (provinsi !== "semua" && s.provinsi !== provinsi) return false;
      if (status !== "semua" && ringkasan.get(s.id)?.status !== status) return false;
      return true;
    });
  }, [sekolah, cari, jenjang, provinsi, status, ringkasan]);

  const bersihkan = () => {
    setCari("");
    setJenjang("semua");
    setProvinsi("semua");
    setStatus("semua");
  };

  const filterAktif = cari !== "" || jenjang !== "semua" || provinsi !== "semua" || status !== "semua";

  return (
    <div className="space-y-4">
      <Kartu
        judul="Penyaring data sekolah"
        keterangan={`${formatAngka(sekolah.length)} sekolah terdata. Status kecukupan dihitung dari kebutuhan per mapel dibanding jumlah guru yang ada.`}
      >
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="cari-sekolah" className="block text-[13px] font-medium">
              Cari nama sekolah, NPSN, kabupaten, atau alamat
            </label>
            <input
              id="cari-sekolah"
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Contoh: Waingapu atau Kabupaten Asmat"
              className={cn(KELAS_BIDANG, "mt-1")}
            />
          </div>
          <div>
            <label htmlFor="filter-jenjang" className="block text-[13px] font-medium">
              Jenjang
            </label>
            <select
              id="filter-jenjang"
              value={jenjang}
              onChange={(e) => setJenjang(e.target.value)}
              className={cn(KELAS_BIDANG, "mt-1")}
            >
              <option value="semua">Semua jenjang</option>
              {pilihan.jenjang.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-provinsi-sekolah" className="block text-[13px] font-medium">
              Provinsi
            </label>
            <select
              id="filter-provinsi-sekolah"
              value={provinsi}
              onChange={(e) => setProvinsi(e.target.value)}
              className={cn(KELAS_BIDANG, "mt-1")}
            >
              <option value="semua">Semua provinsi</option>
              {pilihan.provinsi.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium">Status kecukupan:</span>
              {(["semua", "kekurangan", "cukup", "kelebihan"] as const).map((nilai) => (
                <button
                  key={nilai}
                  type="button"
                  onClick={() => setStatus(nilai)}
                  aria-pressed={status === nilai}
                  className={cn(
                    "rounded-kartu border px-3 py-1.5 text-[13px] font-medium",
                    status === nilai
                      ? "border-inti bg-inti-lembut text-inti"
                      : "border-garis-tegas hover:bg-latar",
                  )}
                >
                  {nilai === "semua" ? "Semua" : nilai.charAt(0).toUpperCase() + nilai.slice(1)}
                </button>
              ))}
            </div>
            {filterAktif ? (
              <button
                type="button"
                onClick={bersihkan}
                className="rounded-kartu border border-garis-tegas px-3 py-1.5 text-[13px] font-medium hover:bg-latar"
              >
                Bersihkan filter
              </button>
            ) : null}
          </div>
        </div>
      </Kartu>

      {hasil.length === 0 ? (
        <KeadaanKosongFilter onReset={bersihkan} />
      ) : (
        <>
          <p className="text-[13px] text-teks-lembut" role="status" aria-live="polite">
            Menampilkan {formatAngka(hasil.length)} dari {formatAngka(sekolah.length)} sekolah.
          </p>
          <ul className="space-y-2">
            {hasil.map((s) => {
              const ringkas = ringkasan.get(s.id);
              const baris = perSekolah.get(s.id) ?? [];
              const terbukaBaris = terbuka === s.id;
              return (
                <li key={s.id} className="rounded-kartu border border-garis bg-permukaan">
                  <button
                    type="button"
                    onClick={() => setTerbuka(terbukaBaris ? null : s.id)}
                    aria-expanded={terbukaBaris}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium">{s.nama}</span>
                      <span className="block text-[12px] text-teks-lembut">
                        {s.jenjang} · NPSN {s.npsn ?? "belum terdata"} · {s.kabupaten}, {s.provinsi}
                      </span>
                      <span className="block text-[12px] text-teks-lembut">
                        {s.jumlah_rombel} rombel · {formatAngka(s.jumlah_guru)} guru
                        {s.alamat ? ` · ${s.alamat}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {ringkas ? (
                        <LencanaSebaran
                          status={ringkas.status}
                          kurang={ringkas.kurang}
                          lebih={ringkas.lebih}
                        />
                      ) : null}
                      <span className="text-[12px] text-teks-lembut">
                        {terbukaBaris ? "Tutup rincian" : "Lihat rincian mapel"}
                      </span>
                    </span>
                  </button>

                  {terbukaBaris ? (
                    <div className="border-t border-garis px-4 py-3">
                      {baris.length === 0 ? (
                        <p className="text-[13px] text-teks-lembut">
                          Sekolah ini belum punya data kebutuhan per mapel.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[520px] border-collapse text-[14px]">
                            <caption className="sr-only">
                              Kebutuhan guru per mapel di {s.nama}
                            </caption>
                            <thead>
                              <tr className="border-b border-garis text-left text-[12px] text-teks-lembut">
                                <th scope="col" className="py-2 pr-3">Mapel</th>
                                <th scope="col" className="py-2 pr-3 text-right">Butuh</th>
                                <th scope="col" className="py-2 pr-3 text-right">Ada</th>
                                <th scope="col" className="py-2 pr-3 text-right">Jam per guru</th>
                                <th scope="col" className="py-2">Keterangan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-garis">
                              {baris.map((k) => (
                                <tr key={k.id}>
                                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                                    {k.mapel}
                                  </th>
                                  <td className="py-2 pr-3 text-right tabular-nums">{k.jumlah_butuh}</td>
                                  <td className="py-2 pr-3 text-right tabular-nums">{k.jumlah_ada}</td>
                                  <td className="py-2 pr-3 text-right tabular-nums">
                                    {k.jumlah_ada > 0
                                      ? hitungJamNgajar(
                                          k.jumlah_rombel,
                                          k.jenjang,
                                          k.mapel,
                                          k.jumlah_ada,
                                        )
                                      : 0}
                                  </td>
                                  <td className="py-2">
                                    {k.kurang > 0 ? (
                                      <span className="text-kekurangan">Kurang {k.kurang} guru</span>
                                    ) : k.lebih > 0 ? (
                                      <span className="text-kelebihan">
                                        Kelebihan {k.lebih} guru, jam mengajar turun di bawah 24 jam
                                      </span>
                                    ) : (
                                      <span className="text-cukup">Sudah cukup</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

