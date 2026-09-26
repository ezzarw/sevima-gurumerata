import { Suspense } from "react";
import { KeadaanGagal, KeadaanKosong, KeadaanMemuat } from "@/components/keadaan";
import { JudulHalaman } from "@/components/shell";
import { TabelGuru } from "@/components/tabel-guru";
import { ambilAman } from "@/lib/data/ambil";
import { ambilGuru } from "@/lib/data/kueri";

export const metadata = { title: "Data guru · GuruMerata" };

async function IsiGuru() {
  const hasil = await ambilAman(ambilGuru);

  if (!hasil.ok) {
    return (
      <KeadaanGagal
        keterangan="Daftar guru tidak bisa dimuat dari Supabase. Periksa koneksi lalu muat ulang halaman."
        detail={hasil.pesan}
      />
    );
  }

  if (hasil.data.length === 0) {
    return (
      <KeadaanKosong
        judul="Belum ada data guru"
        keterangan="Tabel guru masih kosong. Jalankan supabase/seed.sql untuk memuat data demo."
      />
    );
  }

  return <TabelGuru guru={hasil.data} />;
}

export default function HalamanGuru() {
  return (
    <>
      <JudulHalaman
        judul="Data guru"
        keterangan="Cari guru berdasarkan mapel, status kepegawaian, atau daerah. Kolom jam mengajar dipakai untuk memeriksa syarat TPG."
      />
      <Suspense fallback={<KeadaanMemuat pesan="Memuat data guru" />}>
        <IsiGuru />
      </Suspense>
    </>
  );
}
