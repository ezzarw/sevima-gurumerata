import { Suspense } from "react";
import { KeadaanGagal, KeadaanKosong, KeadaanMemuat } from "@/components/keadaan";
import { Kartu, KartuStatistik } from "@/components/kartu";
import { JudulHalaman } from "@/components/shell";
import { PanelSebaran } from "@/components/panel-sebaran";
import { ambilKebutuhan, ambilSekolah, ambilWilayah, ambilMutasi } from "@/lib/data/kueri";
import { formatAngka, ringkasSebaran } from "@/lib/utils";

export const metadata = { title: "Peta sebaran · GuruMerata" };

async function IsiDashboard() {
  let wilayah, sekolah, kebutuhan, mutasi;
  try {
    [wilayah, sekolah, kebutuhan, mutasi] = await Promise.all([
      ambilWilayah(),
      ambilSekolah(),
      ambilKebutuhan(),
      ambilMutasi(),
    ]);
  } catch (galat) {
    return (
      <KeadaanGagal
        keterangan="Dashboard tidak bisa memuat data sekolah dan guru. Periksa koneksi ke Supabase, lalu muat ulang halaman."
        detail={galat instanceof Error ? galat.message : undefined}
      />
    );
  }

  if (wilayah.length === 0) {
    return (
      <KeadaanKosong
        judul="Belum ada data wilayah"
        keterangan="Tabel provinsi masih kosong. Jalankan supabase/seed.sql lebih dulu supaya peta bisa digambar."
      />
    );
  }

  const totalGuru = sekolah.reduce((n, s) => n + s.jumlah_guru, 0);
  const totalKurang = kebutuhan.reduce((n, k) => n + k.kurang, 0);
  const totalLebih = kebutuhan.reduce((n, k) => n + k.lebih, 0);
  const jumlahSekolahKurang = new Set(
    kebutuhan.filter((k) => k.kurang > 0).map((k) => k.sekolah_id),
  ).size;
  const menungguReview = mutasi.filter((m) => m.status === "diajukan").length;

  const prioritas = [...kebutuhan]
    .filter((k) => k.kurang > 0)
    .sort((a, b) => b.kurang - a.kurang)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStatistik
          label="Sekolah terdata"
          nilai={formatAngka(sekolah.length)}
          satuan="sekolah"
          sumber={`${formatAngka(totalGuru)} guru, dari tabel sekolah dan guru`}
        />
        <KartuStatistik
          label="Formasi guru belum terisi"
          nilai={formatAngka(totalKurang)}
          satuan="formasi"
          nada="kekurangan"
          sumber={`di ${jumlahSekolahKurang} sekolah, dari tabel kebutuhan_guru`}
        />
        <KartuStatistik
          label="Guru kelebihan formasi"
          nilai={formatAngka(totalLebih)}
          satuan="guru"
          nada="kelebihan"
          sumber="jam mengajar di bawah 24 jam, TPG rawan berhenti"
        />
        <KartuStatistik
          label="Pengajuan menunggu review"
          nilai={formatAngka(menungguReview)}
          satuan="pengajuan"
          sumber="status diajukan pada tabel mutasi"
        />
      </div>

      <PanelSebaran wilayah={wilayah} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Kartu
          judul="Sekolah yang paling membutuhkan guru"
          keterangan="Diurutkan dari selisih kebutuhan dan ketersediaan guru per mapel."
        >
          {prioritas.length === 0 ? (
            <div className="px-4 py-6">
              <KeadaanKosong
                judul="Tidak ada sekolah kekurangan guru"
                keterangan="Semua mapel di sekolah yang terdata sudah terpenuhi."
              />
            </div>
          ) : (
            <ul className="divide-y divide-garis">
              {prioritas.map((k) => (
                <li key={k.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{k.sekolah_nama}</p>
                    <p className="text-[12px] text-teks-lembut">
                      {k.mapel} · {k.jenjang} · {k.kabupaten_nama}, {k.provinsi_nama}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] font-medium tabular-nums text-kekurangan">
                    kurang {k.kurang}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Kartu>

        <Kartu
          judul="Sebaran per provinsi"
          keterangan="Angka dihitung dari kebutuhan_guru, bukan dari nilai contoh."
        >
          <ul className="divide-y divide-garis">
            {[...wilayah]
              .sort((a, b) => b.total_kurang - a.total_kurang)
              .map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[14px]">{w.nama}</span>
                  <span className="text-[13px] tabular-nums text-teks-lembut">
                    {ringkasSebaran(w.total_kurang, w.total_lebih)}
                  </span>
                </li>
              ))}
          </ul>
        </Kartu>
      </div>
    </div>
  );
}

export default function HalamanDashboard() {
  return (
    <>
      <JudulHalaman
        judul="Peta sebaran guru"
        keterangan="Status kecukupan guru per provinsi. Klik satu provinsi untuk melihat sekolah dan mapel yang perlu perhatian."
      />
      <Suspense fallback={<KeadaanMemuat pesan="Memuat peta sebaran" />}>
        <IsiDashboard />
      </Suspense>
    </>
  );
}
