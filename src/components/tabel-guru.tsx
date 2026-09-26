"use client";

import { useMemo, useState } from "react";
import { LencanaTPG } from "@/components/lencana";
import { KeadaanKosongFilter } from "@/components/keadaan";
import { Kartu } from "@/components/kartu";
import { cekTPG } from "@/lib/domain/logika";
import type { BarisGuru } from "@/lib/data/kueri";
import { cn, formatAngka } from "@/lib/utils";

const KELAS_BIDANG =
  "w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]";

export function TabelGuru({ guru }: { guru: BarisGuru[] }) {
  const [cari, setCari] = useState("");
  const [mapel, setMapel] = useState("semua");
  const [status, setStatus] = useState("semua");
  const [provinsi, setProvinsi] = useState("semua");
  const [hanyaRawan, setHanyaRawan] = useState(false);
  const [terpilih, setTerpilih] = useState<string | null>(null);

  const pilihan = useMemo(
    () => ({
      mapel: [...new Set(guru.map((g) => g.mapel))].sort(),
      status: [...new Set(guru.map((g) => g.status_kepegawaian))].sort(),
      provinsi: [...new Set(guru.map((g) => g.provinsi_nama))].sort(),
    }),
    [guru],
  );

  const hasil = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return guru.filter((g) => {
      if (kata && !`${g.nama} ${g.nip ?? ""} ${g.nuptk ?? ""} ${g.sekolah_nama}`.toLowerCase().includes(kata)) {
        return false;
      }
      if (mapel !== "semua" && g.mapel !== mapel) return false;
      if (status !== "semua" && g.status_kepegawaian !== status) return false;
      if (provinsi !== "semua" && g.provinsi_nama !== provinsi) return false;
      if (hanyaRawan && !(g.sertifikasi && g.jam_ngajar < 24)) return false;
      return true;
    });
  }, [guru, cari, mapel, status, provinsi, hanyaRawan]);

  const bersihkan = () => {
    setCari("");
    setMapel("semua");
    setStatus("semua");
    setProvinsi("semua");
    setHanyaRawan(false);
  };

  const filterAktif =
    cari !== "" || mapel !== "semua" || status !== "semua" || provinsi !== "semua" || hanyaRawan;

  const jumlahRawan = guru.filter((g) => g.sertifikasi && g.jam_ngajar < 24).length;
  const barisTerpilih = hasil.find((g) => g.id === terpilih) ?? null;

  return (
    <div className="space-y-4">
      <Kartu
        judul="Penyaring data guru"
        keterangan={`${formatAngka(guru.length)} guru terdata · ${formatAngka(jumlahRawan)} guru bersertifikasi dengan jam mengajar di bawah 24 jam`}
      >
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <label htmlFor="cari-guru" className="block text-[13px] font-medium">
              Cari nama, NIP/NUPTK, atau sekolah
            </label>
            <input
              id="cari-guru"
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Contoh: Yohanes atau SMAN 1 Kupang"
              className={cn(KELAS_BIDANG, "mt-1")}
            />
          </div>
          <div>
            <label htmlFor="filter-mapel" className="block text-[13px] font-medium">
              Mata pelajaran
            </label>
            <select
              id="filter-mapel"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className={cn(KELAS_BIDANG, "mt-1")}
            >
              <option value="semua">Semua mapel</option>
              {pilihan.mapel.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-status" className="block text-[13px] font-medium">
              Status kepegawaian
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={cn(KELAS_BIDANG, "mt-1")}
            >
              <option value="semua">Semua status</option>
              {pilihan.status.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-provinsi" className="block text-[13px] font-medium">
              Provinsi
            </label>
            <select
              id="filter-provinsi"
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
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                checked={hanyaRawan}
                onChange={(e) => setHanyaRawan(e.target.checked)}
                className="size-4 rounded-[3px] border border-garis-tegas"
              />
              Tampilkan hanya guru bersertifikasi dengan jam mengajar di bawah 24 jam
            </label>
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
            Menampilkan {formatAngka(hasil.length)} dari {formatAngka(guru.length)} guru.
          </p>
          <div className="overflow-x-auto rounded-kartu border border-garis bg-permukaan">
            <table className="w-full min-w-[860px] border-collapse text-[14px]">
              <caption className="sr-only">
                Daftar guru beserta mata pelajaran, status kepegawaian, dan jam mengajar
              </caption>
              <thead>
                <tr className="border-b border-garis bg-latar text-left text-[12px] font-medium text-teks-lembut">
                  <th scope="col" className="px-4 py-2">Nama</th>
                  <th scope="col" className="px-4 py-2">Mapel</th>
                  <th scope="col" className="px-4 py-2">Status</th>
                  <th scope="col" className="px-4 py-2">Sekolah</th>
                  <th scope="col" className="px-4 py-2">Domisili</th>
                  <th scope="col" className="px-4 py-2 text-right">Jam mengajar</th>
                  <th scope="col" className="px-4 py-2">Status TPG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {hasil.slice(0, 200).map((g) => {
                  const tpg = cekTPG(g.jam_ngajar, g.sertifikasi, g.status_kepegawaian);
                  const aktif = terpilih === g.id;
                  return (
                    <tr key={g.id} className={aktif ? "bg-inti-lembut" : undefined}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium">
                        <button
                          type="button"
                          onClick={() => setTerpilih(aktif ? null : g.id)}
                          className="text-left hover:underline"
                        >
                          {g.nama}
                        </button>
                        <span className="block font-normal text-[12px] text-teks-lembut">
                          {g.nip ? `NIP ${g.nip}` : g.nuptk ? `NUPTK ${g.nuptk}` : "NIP belum terdata"}
                        </span>
                      </th>
                      <td className="px-4 py-2.5">{g.mapel}</td>
                      <td className="px-4 py-2.5">{g.status_kepegawaian}</td>
                      <td className="px-4 py-2.5">
                        <span className="block">{g.sekolah_nama}</span>
                        <span className="block text-[12px] text-teks-lembut">{g.provinsi_nama}</span>
                      </td>
                      <td className="px-4 py-2.5 text-teks-lembut">{g.domisili}</td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right font-medium tabular-nums",
                          g.jam_ngajar < 24 ? "text-kekurangan" : undefined,
                        )}
                      >
                        {g.jam_ngajar} jam
                      </td>
                      <td className="px-4 py-2.5">
                        <LencanaTPG status={tpg.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasil.length > 200 ? (
            <p className="text-[12px] text-teks-lembut">
              Ditampilkan 200 baris pertama. Persempit dengan penyaring di atas untuk melihat sisanya.
            </p>
          ) : null}

          {barisTerpilih ? (
            <Kartu
              judul={barisTerpilih.nama}
              keterangan={`${barisTerpilih.mapel} · ${barisTerpilih.sekolah_nama}`}
            >
              <dl className="grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
                <Rincian label="NIP" nilai={barisTerpilih.nip ?? "Belum terdata"} />
                <Rincian label="NUPTK" nilai={barisTerpilih.nuptk ?? "Belum terdata"} />
                <Rincian label="Status kepegawaian" nilai={barisTerpilih.status_kepegawaian} />
                <Rincian label="Sertifikasi" nilai={barisTerpilih.sertifikasi ? "Sudah (punya Serdik)" : "Belum"} />
                <Rincian label="Jam mengajar" nilai={`${barisTerpilih.jam_ngajar} jam per minggu`} />
                <Rincian label="Domisili" nilai={barisTerpilih.domisili} />
                <Rincian label="Jenjang sekolah" nilai={barisTerpilih.jenjang} />
                <Rincian
                  label="Keterangan TPG"
                  nilai={cekTPG(barisTerpilih.jam_ngajar, barisTerpilih.sertifikasi, barisTerpilih.status_kepegawaian).alasan}
                />
              </dl>
            </Kartu>
          ) : null}
        </>
      )}
    </div>
  );
}

function Rincian({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <dt className="text-[12px] text-teks-lembut">{label}</dt>
      <dd className="mt-0.5 text-[14px]">{nilai}</dd>
    </div>
  );
}
