import { Suspense } from "react";
import { KeadaanGagal, KeadaanKosong, KeadaanMemuat } from "@/components/keadaan";
import { JudulHalaman } from "@/components/shell";
import { TabelSekolah } from "@/components/tabel-sekolah";
import { ambilAman } from "@/lib/data/ambil";
import { ambilKebutuhan, ambilSekolah } from "@/lib/data/kueri";

export const metadata = { title: "Data sekolah · GuruMerata" };

async function IsiSekolah() {
  const hasil = await ambilAman(async () => {
    const [sekolah, kebutuhan] = await Promise.all([ambilSekolah(), ambilKebutuhan()]);
    return { sekolah, kebutuhan };
  });

  if (!hasil.ok) {
    return (
      <KeadaanGagal
        keterangan="Daftar sekolah tidak bisa dimuat dari Supabase. Periksa koneksi lalu muat ulang halaman."
        detail={hasil.pesan}
      />
    );
  }

  if (hasil.data.sekolah.length === 0) {
    return (
      <KeadaanKosong
        judul="Belum ada data sekolah"
        keterangan="Tabel sekolah masih kosong. Jalankan supabase/seed.sql untuk memuat data demo."
      />
    );
  }

  return <TabelSekolah sekolah={hasil.data.sekolah} kebutuhan={hasil.data.kebutuhan} />;
}

export default function HalamanSekolah() {
  return (
    <>
      <JudulHalaman
        judul="Data sekolah"
        keterangan="Setiap sekolah dihitung kebutuhan gurunya per mapel. Buka satu baris untuk melihat mapel mana yang kurang dan mana yang kelebihan."
      />
      <Suspense fallback={<KeadaanMemuat pesan="Memuat data sekolah" />}>
        <IsiSekolah />
      </Suspense>
    </>
  );
}
