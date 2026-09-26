import Link from "next/link";
import { notFound } from "next/navigation";
import { Kartu } from "@/components/kartu";
import { KeadaanGagal } from "@/components/keadaan";
import { LencanaStatusMutasi } from "@/components/lencana-mutasi";
import { LencanaTPG } from "@/components/lencana";
import { FormKeputusan } from "@/components/form-mutasi";
import { JudulHalaman } from "@/components/shell";
import { siapkanSimulasi } from "@/lib/data/kueri";
import { buatKlienServer } from "@/lib/supabase/server";
import { formatWaktuLengkap, LABEL_ALASAN_MUTASI } from "@/lib/data/format";
import { simulasiMutasi } from "@/lib/domain/logika";
import type { HasilSimulasi, StatusMutasi } from "@/lib/domain/tipe";

export const metadata = { title: "Detail pengajuan mutasi · GuruMerata" };

interface BarisDetail {
  id: string;
  guru_id: string;
  sekolah_asal_id: string;
  sekolah_tujuan_id: string;
  mapel: string;
  alasan: string;
  catatan_guru: string | null;
  status: StatusMutasi;
  catatan_dinas: string | null;
  created_at: string;
  approved_at: string | null;
  simulasi: HasilSimulasi | null;
  guru_nama: string;
  sekolah_asal: string;
  sekolah_tujuan: string;
}

export default async function HalamanDetailMutasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await buatKlienServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = user
    ? await supabase.from("users").select("peran").eq("id", user.id).maybeSingle()
    : { data: null };
  const bisaMemutuskan = profil?.peran === "admin_dinas";

  const { data, error } = await supabase
    .from("mutasi")
    .select(
      "id, guru_id, sekolah_asal_id, sekolah_tujuan_id, mapel, alasan, catatan_guru, status, catatan_dinas, created_at, approved_at, simulasi, guru:guru_id(nama), asal:sekolah_asal_id(nama), tujuan:sekolah_tujuan_id(nama)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <JudulHalaman judul="Detail pengajuan mutasi" />
        <KeadaanGagal
          keterangan="Pengajuan ini tidak bisa dibuka. Akun guru hanya boleh melihat pengajuannya sendiri."
          detail={error.message}
        />
      </>
    );
  }
  if (!data) notFound();

  const mutasi: BarisDetail = {
    ...(data as unknown as Omit<BarisDetail, "guru_nama" | "sekolah_asal" | "sekolah_tujuan">),
    guru_nama: (data.guru as unknown as { nama: string } | null)?.nama ?? "-",
    sekolah_asal: (data.asal as unknown as { nama: string } | null)?.nama ?? "-",
    sekolah_tujuan: (data.tujuan as unknown as { nama: string } | null)?.nama ?? "-",
  };

  // Selama pengajuan belum diputuskan, simulasi dihitung ulang dari data
  // terbaru supaya dinas melihat angka hari ini. Setelah diputuskan, yang
  // ditampilkan adalah hasil simulasi saat keputusan diambil, karena
  // menghitung ulang setelah guru pindah akan menggambarkan perpindahan kedua.
  const dariSnapshot = mutasi.status !== "diajukan" && mutasi.simulasi !== null;
  const simulasi = dariSnapshot
    ? mutasi.simulasi
    : await (async () => {
        const bahan = await siapkanSimulasi(mutasi.guru_id, mutasi.sekolah_tujuan_id);
        return bahan ? simulasiMutasi(bahan.input) : null;
      })();

  return (
    <>
      <JudulHalaman
        judul={`Pengajuan ${mutasi.guru_nama}`}
        keterangan={`${mutasi.mapel} · dari ${mutasi.sekolah_asal} ke ${mutasi.sekolah_tujuan}`}
        aksi={
          <Link
            href="/mutasi"
            className="rounded-kartu border border-garis-tegas bg-permukaan px-4 py-2 text-[14px] font-medium hover:bg-latar"
          >
            Kembali ke daftar
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Kartu judul="Isi pengajuan">
            <dl className="grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-2">
              <Rincian label="Status" nilai={<LencanaStatusMutasi status={mutasi.status} />} />
              <Rincian label="Alasan" nilai={LABEL_ALASAN_MUTASI[mutasi.alasan] ?? mutasi.alasan} />
              <Rincian label="Diajukan" nilai={formatWaktuLengkap(mutasi.created_at)} />
              <Rincian
                label="Diputuskan"
                nilai={mutasi.approved_at ? formatWaktuLengkap(mutasi.approved_at) : "Belum diputuskan"}
              />
            </dl>
            <div className="border-t border-garis px-4 py-4">
              <p className="text-[12px] text-teks-lembut">Keterangan dari guru</p>
              <p className="mt-1 text-[14px]">{mutasi.catatan_guru ?? "-"}</p>
            </div>
            {mutasi.catatan_dinas ? (
              <div className="border-t border-garis px-4 py-4">
                <p className="text-[12px] text-teks-lembut">Catatan keputusan dinas</p>
                <p className="mt-1 text-[14px]">{mutasi.catatan_dinas}</p>
              </div>
            ) : null}
          </Kartu>

          <Kartu
            judul="Riwayat pengajuan"
            keterangan="Urutan kejadiannya dicatat dari waktu ke waktu."
          >
            <ol className="px-4 py-4">
              <Langkah
                judul="Pengajuan dibuat"
                waktu={formatWaktuLengkap(mutasi.created_at)}
                keterangan={`${mutasi.guru_nama} mengajukan pindah ke ${mutasi.sekolah_tujuan} dengan ${LABEL_ALASAN_MUTASI[mutasi.alasan]?.toLowerCase() ?? mutasi.alasan}.`}
                selesai
              />
              <Langkah
                judul="Review dinas pendidikan"
                waktu={mutasi.status === "diajukan" ? "Sedang berjalan" : "Selesai"}
                keterangan={
                  mutasi.status === "diajukan"
                    ? "Menunggu keputusan admin dinas. Simulator di panel kanan menampilkan dampaknya."
                    : "Dinas sudah mencatat keputusan beserta alasannya."
                }
                selesai={mutasi.status !== "diajukan"}
              />
              <Langkah
                judul={mutasi.status === "disetujui" ? "Mutasi dieksekusi" : "Eksekusi mutasi"}
                waktu={mutasi.approved_at ? formatWaktuLengkap(mutasi.approved_at) : "-"}
                keterangan={
                  mutasi.status === "disetujui"
                    ? "Data guru, jam mengajar, dan kebutuhan guru di kedua sekolah sudah diperbarui."
                    : mutasi.status === "ditolak"
                      ? "Tidak dieksekusi karena pengajuan ditolak."
                      : mutasi.status === "dibatalkan"
                        ? "Tidak dieksekusi karena pengajuan dibatalkan."
                        : "Baru dijalankan bila pengajuan disetujui."
                }
                selesai={mutasi.status === "disetujui"}
                terakhir
              />
            </ol>
          </Kartu>
        </div>

        <div className="space-y-5">
          {simulasi ? (
            <Kartu
              judul="Hasil simulasi mutasi ini"
              keterangan={
                dariSnapshot
                  ? "Angka yang tercatat saat keputusan diambil."
                  : "Dihitung ulang dari data terbaru saat halaman ini dibuka."
              }
            >
              <div className="space-y-3 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <LencanaTPG status={simulasi.tpg.status} />
                  <span className="text-[13px] text-teks-lembut">
                    Jam mengajar setelah pindah {simulasi.jamNgajarBaru} jam per minggu
                  </span>
                </div>
                <p className="text-[14px] font-medium">{simulasi.rekomendasi.judul}</p>
                <ul className="space-y-2 text-[13px] text-teks-lembut">
                  {simulasi.rekomendasi.alasan.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-3 border-t border-garis pt-3 text-[13px]">
                  <div>
                    <p className="text-teks-lembut">Skor dampak psikologis</p>
                    <p className="font-medium">
                      {simulasi.psikologis.skor}/100 · {simulasi.psikologis.kategori}
                    </p>
                  </div>
                  <div>
                    <p className="text-teks-lembut">Jarak dari domisili</p>
                    <p className="font-medium">
                      {simulasi.jarakDariDomisiliKm === null
                        ? "Belum terdata"
                        : `${simulasi.jarakDariDomisiliKm} km`}
                    </p>
                  </div>
                </div>
              </div>
            </Kartu>
          ) : (
            <Kartu judul="Hasil simulasi mutasi ini">
              <div className="px-4 py-4">
                <KeadaanGagal
                  judul="Simulasi tidak bisa dihitung"
                  keterangan="Data guru atau sekolah tujuan berubah sehingga simulasinya tidak bisa disusun ulang. Buka simulator untuk memeriksa keadaan terbaru."
                />
              </div>
            </Kartu>
          )}

          {mutasi.status === "diajukan" ? (
            <Kartu
              judul="Keputusan dinas"
              keterangan="Hanya admin dinas pendidikan yang bisa memutuskan."
            >
              <div className="px-4 py-4">
                {bisaMemutuskan ? (
                  <FormKeputusan mutasiId={mutasi.id} />
                ) : (
                  <p className="text-[13px] text-teks-lembut">
                    Anda masuk sebagai {profil?.peran === "operator_sekolah" ? "operator sekolah" : "guru"},
                    sehingga pengajuan ini hanya bisa dilihat. Keputusan diambil admin dinas pendidikan.
                  </p>
                )}
              </div>
            </Kartu>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Rincian({ label, nilai }: { label: string; nilai: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-teks-lembut">{label}</dt>
      <dd className="mt-0.5 text-[14px]">{nilai}</dd>
    </div>
  );
}

function Langkah({
  judul,
  waktu,
  keterangan,
  selesai,
  terakhir,
}: {
  judul: string;
  waktu: string;
  keterangan: string;
  selesai?: boolean;
  terakhir?: boolean;
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!terakhir ? (
        <span aria-hidden className="absolute left-[7px] top-4 h-full w-px bg-garis" />
      ) : null}
      <span
        aria-hidden
        className={`mt-[5px] size-[15px] shrink-0 rounded-full border-2 ${
          selesai ? "border-kelebihan bg-kelebihan" : "border-garis-tegas bg-permukaan"
        }`}
      />
      <div>
        <p className="text-[14px] font-medium">{judul}</p>
        <p className="text-[12px] text-teks-lembut">{waktu}</p>
        <p className="mt-1 text-[13px] text-teks-lembut">{keterangan}</p>
      </div>
    </li>
  );
}
