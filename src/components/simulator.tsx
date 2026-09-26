"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Kartu } from "@/components/kartu";
import { KeadaanKosong } from "@/components/keadaan";
import { LencanaTPG } from "@/components/lencana";
import { simulasiMutasi } from "@/lib/domain/logika";
import type { HasilSimulasi } from "@/lib/domain/tipe";
import type { BarisGuru, BarisKebutuhan, BarisSekolah } from "@/lib/data/kueri";
import { formatAngka } from "@/lib/data/format";
import { cn } from "@/lib/utils";

const KELAS_BIDANG =
  "w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]";

/**
 * Simulator mutasi: hitung jam mengajar baru dan status TPG sebelum mutasi
 * dieksekusi. Seluruh perhitungan memakai fungsi domain yang sama dengan
 * unit test, jadi angka di layar tidak bisa berbeda dari aturan resminya.
 */
export function Simulator({
  guru,
  sekolah,
  kebutuhan,
  koordinatKabupaten,
  guruAwal,
  sekolahAwal,
}: {
  guru: BarisGuru[];
  sekolah: BarisSekolah[];
  kebutuhan: BarisKebutuhan[];
  koordinatKabupaten: Record<string, { lat: number; lon: number }>;
  guruAwal: string;
  sekolahAwal: string;
}) {
  const [guruId, setGuruId] = useState(guruAwal);
  const [tujuanId, setTujuanId] = useState(sekolahAwal);
  const [cariGuru, setCariGuru] = useState("");
  const [cariTujuan, setCariTujuan] = useState("");

  const kebutuhanPerSekolah = useMemo(() => {
    const peta = new Map<string, BarisKebutuhan[]>();
    for (const k of kebutuhan) {
      const daftar = peta.get(k.sekolah_id) ?? [];
      daftar.push(k);
      peta.set(k.sekolah_id, daftar);
    }
    return peta;
  }, [kebutuhan]);

  const guruTerpilih = guru.find((g) => g.id === guruId) ?? null;
  const sekolahAsal = guruTerpilih
    ? sekolah.find((s) => s.id === guruTerpilih.sekolah_id) ?? null
    : null;
  const sekolahTujuan = sekolah.find((s) => s.id === tujuanId) ?? null;

  const daftarGuru = useMemo(() => {
    const kata = cariGuru.trim().toLowerCase();
    const urut = [...guru].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
    if (!kata) return urut.slice(0, 40);
    return urut
      .filter((g) =>
        `${g.nama} ${g.mapel} ${g.sekolah_nama} ${g.provinsi_nama}`.toLowerCase().includes(kata),
      )
      .slice(0, 40);
  }, [guru, cariGuru]);

  const daftarTujuan = useMemo(() => {
    const kata = cariTujuan.trim().toLowerCase();
    const urut = [...sekolah].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
    if (!kata) return urut;
    return urut.filter((s) =>
      `${s.nama} ${s.kabupaten} ${s.provinsi} ${s.jenjang}`.toLowerCase().includes(kata),
    );
  }, [sekolah, cariTujuan]);

  const hasil = useMemo<HasilSimulasi | null>(() => {
    if (!guruTerpilih || !sekolahAsal || !sekolahTujuan) return null;
    if (sekolahAsal.id === sekolahTujuan.id) return null;

    const kAsal = kebutuhanPerSekolah.get(sekolahAsal.id) ?? [];
    const kTujuan = kebutuhanPerSekolah.get(sekolahTujuan.id) ?? [];
    const barisAsal = kAsal.find((k) => k.mapel === guruTerpilih.mapel);
    const barisTujuan = kTujuan.find((k) => k.mapel === guruTerpilih.mapel);

    return simulasiMutasi({
      guru: {
        id: guruTerpilih.id,
        nama: guruTerpilih.nama,
        mapel: guruTerpilih.mapel,
        sertifikasi: guruTerpilih.sertifikasi,
        statusKepegawaian: guruTerpilih.status_kepegawaian,
        jamNgajar: guruTerpilih.jam_ngajar,
        sekolahId: guruTerpilih.sekolah_id,
        domisili: guruTerpilih.domisili,
        domisiliKoordinat: koordinatKabupaten[guruTerpilih.domisili],
      },
      sekolahAsal: {
        id: sekolahAsal.id,
        nama: sekolahAsal.nama,
        jenjang: sekolahAsal.jenjang,
        rombel: sekolahAsal.jumlah_rombel,
        kabupaten: sekolahAsal.kabupaten,
        provinsi: sekolahAsal.provinsi,
        koordinat: { lat: sekolahAsal.latitude, lon: sekolahAsal.longitude },
        jumlahGuruMapel: barisAsal?.jumlah_ada ?? 0,
        kebutuhanMapel: {
          mapel: guruTerpilih.mapel,
          jumlahButuh: barisAsal?.jumlah_butuh ?? 0,
          jumlahAda: barisAsal?.jumlah_ada ?? 0,
        },
      },
      sekolahTujuan: {
        id: sekolahTujuan.id,
        nama: sekolahTujuan.nama,
        jenjang: sekolahTujuan.jenjang,
        rombel: sekolahTujuan.jumlah_rombel,
        kabupaten: sekolahTujuan.kabupaten,
        provinsi: sekolahTujuan.provinsi,
        koordinat: { lat: sekolahTujuan.latitude, lon: sekolahTujuan.longitude },
        daerahTertinggal: Boolean(guruTerpilih.daerah_tertinggal),
        jumlahGuruMapel: barisTujuan?.jumlah_ada ?? 0,
        kebutuhanMapel: {
          mapel: guruTerpilih.mapel,
          jumlahButuh: barisTujuan?.jumlah_butuh ?? 0,
          jumlahAda: barisTujuan?.jumlah_ada ?? 0,
        },
      },
    });
  }, [guruTerpilih, sekolahAsal, sekolahTujuan, kebutuhanPerSekolah, koordinatKabupaten]);

  const tautanPengajuan =
    guruTerpilih && sekolahTujuan
      ? `/mutasi/ajukan?guru=${guruTerpilih.id}&tujuan=${sekolahTujuan.id}`
      : "/mutasi";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-5">
          <Kartu
            judul="1. Pilih guru yang akan dipindahkan"
            keterangan="Cari berdasarkan nama, mapel, atau sekolah asal."
          >
            <div className="space-y-3 px-4 py-4">
              <div>
                <label htmlFor="cari-guru-simulasi" className="block text-[13px] font-medium">
                  Cari guru
                </label>
                <input
                  id="cari-guru-simulasi"
                  type="search"
                  value={cariGuru}
                  onChange={(e) => setCariGuru(e.target.value)}
                  placeholder="Contoh: Dorkas atau Matematika"
                  className={cn(KELAS_BIDANG, "mt-1")}
                />
              </div>
              <fieldset>
                <legend className="text-[13px] font-medium">
                  Guru ({formatAngka(daftarGuru.length)} dari {formatAngka(guru.length)})
                </legend>
                {daftarGuru.length === 0 ? (
                  <p className="mt-2 rounded-kartu border border-garis bg-latar px-3 py-3 text-[13px] text-teks-lembut">
                    Tidak ada guru yang cocok dengan kata kunci itu. Coba kata lain, misalnya nama
                    mapel seperti Matematika.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-[320px] overflow-y-auto rounded-kartu border border-garis">
                    {daftarGuru.map((g) => (
                      <li key={g.id} className="border-b border-garis last:border-b-0">
                        <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-latar">
                          <input
                            type="radio"
                            name="guru-terpilih"
                            value={g.id}
                            checked={g.id === guruId}
                            onChange={() => setGuruId(g.id)}
                            className="mt-1 size-4 shrink-0"
                          />
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium">{g.nama}</span>
                            <span className="block text-[12px] text-teks-lembut">
                              {g.mapel} · {g.sekolah_nama} · {g.jam_ngajar} jam/minggu
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>
            </div>
          </Kartu>

          <Kartu
            judul="2. Pilih sekolah tujuan"
            keterangan="Sekolah tujuan harus berbeda dari sekolah asal."
          >
            <div className="space-y-3 px-4 py-4">
              <div>
                <label htmlFor="cari-tujuan" className="block text-[13px] font-medium">
                  Cari sekolah tujuan
                </label>
                <input
                  id="cari-tujuan"
                  type="search"
                  value={cariTujuan}
                  onChange={(e) => setCariTujuan(e.target.value)}
                  placeholder="Contoh: Waingapu atau Asmat"
                  className={cn(KELAS_BIDANG, "mt-1")}
                />
              </div>
              <fieldset>
                <legend className="text-[13px] font-medium">
                  Sekolah tujuan ({formatAngka(daftarTujuan.length)} sekolah)
                </legend>
                {daftarTujuan.length === 0 ? (
                  <p className="mt-2 rounded-kartu border border-garis bg-latar px-3 py-3 text-[13px] text-teks-lembut">
                    Tidak ada sekolah yang cocok dengan kata kunci itu. Coba nama kabupaten seperti
                    Waingapu atau Asmat.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-[320px] overflow-y-auto rounded-kartu border border-garis">
                    {daftarTujuan.map((s) => {
                      const dariSekolahAsal = guruTerpilih?.sekolah_id === s.id;
                      return (
                        <li key={s.id} className="border-b border-garis last:border-b-0">
                          <label
                            className={cn(
                              "flex items-start gap-3 px-3 py-2.5",
                              dariSekolahAsal ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-latar",
                            )}
                          >
                            <input
                              type="radio"
                              name="sekolah-tujuan-terpilih"
                              value={s.id}
                              checked={s.id === tujuanId}
                              disabled={dariSekolahAsal}
                              onChange={() => setTujuanId(s.id)}
                              className="mt-1 size-4 shrink-0"
                            />
                            <span className="min-w-0">
                              <span className="block text-[14px] font-medium">{s.nama}</span>
                              <span className="block text-[12px] text-teks-lembut">
                                {s.jenjang} · {s.jumlah_rombel} rombel · {s.kabupaten}
                                {dariSekolahAsal ? " · sekolah asal guru ini" : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
            </div>
          </Kartu>
        </div>

        <div className="space-y-5">
          {!guruTerpilih ? (
            <KeadaanKosong
              judul="Belum ada guru yang dipilih"
              keterangan="Pilih satu guru di panel kiri, lalu pilih sekolah tujuan untuk melihat hasil simulasinya."
            />
          ) : !sekolahTujuan ? (
            <KeadaanKosong
              judul="Belum ada sekolah tujuan"
              keterangan={`Guru ${guruTerpilih.nama} berasal dari ${guruTerpilih.sekolah_nama}. Pilih sekolah tujuan untuk mulai menghitung.`}
            />
          ) : sekolahTujuan.id === guruTerpilih.sekolah_id ? (
            <KeadaanKosong
              judul="Sekolah tujuan sama dengan sekolah asal"
              keterangan="Pilih sekolah lain supaya simulasinya bermakna."
            />
          ) : hasil ? (
            <>
              <HasilRekomendasi hasil={hasil} tautanPengajuan={tautanPengajuan} />
              <Kartu judul="Rincian perhitungan" keterangan="Angka ini yang dipakai untuk memutuskan.">
                <dl className="grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-2">
                  <Rincian label="Jam mengajar sekarang" nilai={`${hasil.jamNgajarLama} jam per minggu`} />
                  <Rincian
                    label="Jam mengajar setelah pindah"
                    nilai={`${hasil.jamNgajarBaru} jam per minggu`}
                    nada={hasil.jamNgajarBaru < 24 ? "kekurangan" : "kelebihan"}
                  />
                  <Rincian
                    label="Selisih jam"
                    nilai={`${hasil.selisihJam > 0 ? "+" : ""}${hasil.selisihJam} jam per minggu`}
                  />
                  <Rincian
                    label="Jarak dari domisili"
                    nilai={
                      hasil.jarakDariDomisiliKm === null
                        ? "Koordinat domisili belum terdata"
                        : `${formatAngka(hasil.jarakDariDomisiliKm)} km`
                    }
                  />
                  <Rincian
                    label="Jarak dari sekolah asal"
                    nilai={
                      hasil.jarakDariSekolahAsalKm === null
                        ? "-"
                        : `${formatAngka(hasil.jarakDariSekolahAsalKm)} km`
                    }
                  />
                  <Rincian
                    label="Formasi di sekolah tujuan"
                    nilai={`${hasil.kebutuhan.jumlahAda} guru untuk ${hasil.kebutuhan.jumlahButuh} formasi`}
                  />
                </dl>
              </Kartu>

              <Kartu
                judul="Dampak ke sekolah asal"
                keterangan={`${guruTerpilih.sekolah_nama} kehilangan satu guru ${guruTerpilih.mapel}.`}
              >
                <div className="px-4 py-4">
                  <p className="text-[14px]">
                    Sisa guru {guruTerpilih.mapel}: {hasil.sekolahAsal.jumlahGuruSetelah} orang,
                    dengan beban {hasil.sekolahAsal.jamRataRataSetelah} jam per minggu masing-masing.
                  </p>
                  {hasil.kebutuhan.kurang > 0 ? (
                    <p className="mt-2 text-[13px] text-teks-lembut">
                      Catatan: sekolah tujuan memang masih kurang {hasil.kebutuhan.kurang} guru{" "}
                      {guruTerpilih.mapel}, jadi perpindahan ini membantu sekolah tujuan sekaligus
                      menambah beban sekolah asal.
                    </p>
                  ) : null}
                  {hasil.sekolahAsal.peringatan ? (
                    <p className="mt-2 flex items-start gap-2 text-[13px] text-kekurangan">
                      <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0" />
                      {hasil.sekolahAsal.peringatan}
                    </p>
                  ) : (
                    <p className="mt-2 text-[13px] text-teks-lembut">
                      Beban guru yang tersisa masih dalam batas wajar, tidak perlu penambahan guru
                      pengganti.
                    </p>
                  )}
                </div>
              </Kartu>

              <Kartu
                judul="Skor dampak psikologis"
                keterangan="Menimbang perubahan jam mengajar, risiko TPG, jarak, dan kondisi daerah tujuan."
              >
                <div className="px-4 py-4">
                  <div className="flex items-baseline gap-3">
                    <span
                      className={cn(
                        "text-[28px] font-semibold tabular-nums",
                        hasil.psikologis.kategori === "berat"
                          ? "text-kekurangan"
                          : hasil.psikologis.kategori === "sedang"
                            ? "text-cukup"
                            : "text-kelebihan",
                      )}
                    >
                      {hasil.psikologis.skor}
                    </span>
                    <span className="text-[14px] text-teks-lembut">
                      dari 100 · dampak {hasil.psikologis.kategori}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-[13px]">
                    {hasil.psikologis.faktor.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-teks-lembut">
                        <Info aria-hidden className="mt-[2px] size-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Kartu>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const GAYA_REKOMENDASI = {
  aman: {
    bingkai: "border-kelebihan/40 bg-kelebihan-lembut",
    judul: "text-kelebihan",
    Ikon: CheckCircle2,
  },
  perhatian: {
    bingkai: "border-cukup/40 bg-cukup-lembut",
    judul: "text-cukup",
    Ikon: Info,
  },
  berisiko: {
    bingkai: "border-kekurangan/40 bg-kekurangan-lembut",
    judul: "text-kekurangan",
    Ikon: AlertTriangle,
  },
} as const;

function HasilRekomendasi({
  hasil,
  tautanPengajuan,
}: {
  hasil: HasilSimulasi;
  tautanPengajuan: string;
}) {
  const gaya = GAYA_REKOMENDASI[hasil.rekomendasi.tingkat];
  const { Ikon } = gaya;

  return (
    <section
      aria-live="polite"
      className={cn("rounded-kartu border px-5 py-4", gaya.bingkai)}
    >
      <div className="flex items-start gap-3">
        <Ikon aria-hidden className={cn("mt-[2px] size-5 shrink-0", gaya.judul)} />
        <div className="min-w-0">
          <h2 className={cn("text-[17px] font-semibold", gaya.judul)}>{hasil.rekomendasi.judul}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LencanaTPG status={hasil.tpg.status} />
            <span className="text-[13px] text-teks-lembut">
              Jam mengajar setelah pindah: {hasil.jamNgajarBaru} jam per minggu
            </span>
          </div>

          <ul className="mt-3 space-y-2 text-[14px]">
            {hasil.rekomendasi.alasan.map((a) => (
              <li key={a} className="flex items-start gap-2">
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-current opacity-60" />
                {a}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[13px] font-medium">Langkah berikutnya</p>
          <ul className="mt-1 space-y-1 text-[13px] text-teks-lembut">
            {hasil.rekomendasi.saran.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={tautanPengajuan}
              className="rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90"
            >
              Ajukan mutasi ini
            </Link>
            <Link
              href="/sekolah"
              className="rounded-kartu border border-garis-tegas bg-permukaan px-4 py-2 text-[14px] font-medium hover:bg-latar"
            >
              Lihat kebutuhan sekolah tujuan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rincian({
  label,
  nilai,
  nada,
}: {
  label: string;
  nilai: string;
  nada?: "kekurangan" | "kelebihan";
}) {
  return (
    <div>
      <dt className="text-[12px] text-teks-lembut">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-[14px] font-medium",
          nada === "kekurangan" ? "text-kekurangan" : nada === "kelebihan" ? "text-kelebihan" : undefined,
        )}
      >
        {nilai}
      </dd>
    </div>
  );
}
