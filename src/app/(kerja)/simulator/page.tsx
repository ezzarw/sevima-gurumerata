import { Suspense } from "react";
import { KeadaanGagal, KeadaanKosong, KeadaanMemuat } from "@/components/keadaan";
import { JudulHalaman } from "@/components/shell";
import { Simulator } from "@/components/simulator";
import { ambilGuru, ambilKebutuhan, ambilKoordinatKabupaten, ambilSekolah } from "@/lib/data/kueri";

export const metadata = { title: "Simulator mutasi · GuruMerata" };

async function IsiSimulator({
  guruAwal,
  sekolahAwal,
}: {
  guruAwal: string;
  sekolahAwal: string;
}) {
  try {
    const [guru, sekolah, kebutuhan, koordinatKabupaten] = await Promise.all([
      ambilGuru(),
      ambilSekolah(),
      ambilKebutuhan(),
      ambilKoordinatKabupaten(),
    ]);
    if (guru.length === 0 || sekolah.length === 0) {
      return (
        <KeadaanKosong
          judul="Data belum tersedia"
          keterangan="Simulator butuh data guru dan sekolah. Jalankan supabase/seed.sql lebih dulu."
        />
      );
    }
    return (
      <Simulator
        guru={guru}
        sekolah={sekolah}
        kebutuhan={kebutuhan}
        koordinatKabupaten={koordinatKabupaten}
        guruAwal={guruAwal}
        sekolahAwal={sekolahAwal}
      />
    );
  } catch (galat) {
    return (
      <KeadaanGagal
        keterangan="Simulator tidak bisa memuat data guru dan sekolah dari Supabase. Periksa koneksi lalu muat ulang halaman."
        detail={galat instanceof Error ? galat.message : undefined}
      />
    );
  }
}

export default async function HalamanSimulator({
  searchParams,
}: {
  searchParams: Promise<{ guru?: string; tujuan?: string }>;
}) {
  const { guru, tujuan } = await searchParams;

  return (
    <>
      <JudulHalaman
        judul="Simulator mutasi"
        keterangan="Hitung jam mengajar dan status TPG setelah guru dipindahkan, sebelum keputusan diambil. Aturan yang dipakai adalah ambang 24 jam tatap muka per minggu."
      />
      <Suspense fallback={<KeadaanMemuat pesan="Menyiapkan simulator" />}>
        <IsiSimulator guruAwal={guru ?? ""} sekolahAwal={tujuan ?? ""} />
      </Suspense>
    </>
  );
}
