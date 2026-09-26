import { Suspense } from "react";
import { KeadaanGagal, KeadaanKosong, KeadaanMemuat } from "@/components/keadaan";
import { JudulHalaman } from "@/components/shell";
import Link from "next/link";
import { FormAjukanMutasi } from "@/components/form-mutasi";
import { ambilAman } from "@/lib/data/ambil";
import { ambilGuru, ambilSekolah } from "@/lib/data/kueri";

export const metadata = { title: "Ajukan mutasi · GuruMerata" };

async function IsiForm({ guruAwal, tujuanAwal }: { guruAwal: string; tujuanAwal: string }) {
  const hasil = await ambilAman(async () => {
    const [guru, sekolah] = await Promise.all([ambilGuru(), ambilSekolah()]);
    return { guru, sekolah };
  });

  if (!hasil.ok) {
    return (
      <KeadaanGagal
        keterangan="Formulir pengajuan tidak bisa memuat data. Periksa koneksi lalu muat ulang halaman."
        detail={hasil.pesan}
      />
    );
  }

  if (hasil.data.guru.length === 0 || hasil.data.sekolah.length === 0) {
    return (
      <KeadaanKosong
        judul="Data guru dan sekolah belum tersedia"
        keterangan="Pengajuan butuh data guru dan sekolah. Jalankan supabase/seed.sql lebih dulu."
      />
    );
  }

  return (
    <FormAjukanMutasi
      guru={hasil.data.guru}
      sekolah={hasil.data.sekolah}
      guruAwal={guruAwal}
      tujuanAwal={tujuanAwal}
    />
  );
}

export default async function HalamanAjukan({
  searchParams,
}: {
  searchParams: Promise<{ guru?: string; tujuan?: string }>;
}) {
  const { guru, tujuan } = await searchParams;

  return (
    <>
      <JudulHalaman
        judul="Ajukan mutasi guru"
        keterangan="Isi alasan sejelas mungkin. Dinas menilai pengajuan ini berdasarkan kondisi guru dan ketersediaan formasi di sekolah tujuan."
        aksi={
          <Link
            href="/mutasi"
            className="rounded-kartu border border-garis-tegas bg-permukaan px-4 py-2 text-[14px] font-medium hover:bg-latar"
          >
            Kembali ke daftar
          </Link>
        }
      />
      <Suspense fallback={<KeadaanMemuat pesan="Menyiapkan formulir" />}>
        <IsiForm guruAwal={guru ?? ""} tujuanAwal={tujuan ?? ""} />
      </Suspense>
    </>
  );
}
