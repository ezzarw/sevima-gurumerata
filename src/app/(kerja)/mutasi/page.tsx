import { Suspense } from "react";
import { KeadaanGagal, KeadaanKosong, KeadaanMemuat } from "@/components/keadaan";
import { JudulHalaman } from "@/components/shell";
import Link from "next/link";
import { DaftarMutasi } from "@/components/daftar-mutasi";
import { ambilAman } from "@/lib/data/ambil";
import { ambilMutasi } from "@/lib/data/kueri";
import { buatKlienServer } from "@/lib/supabase/server";

export const metadata = { title: "Pengajuan mutasi · GuruMerata" };

async function IsiMutasi() {
  const hasil = await ambilAman(async () => {
    const supabase = await buatKlienServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profil } = user
      ? await supabase.from("users").select("peran").eq("id", user.id).maybeSingle()
      : { data: null };

    const mutasi = await ambilMutasi();
    return { bisaMemutuskan: profil?.peran === "admin_dinas", mutasi };
  });

  if (!hasil.ok) {
    return (
      <KeadaanGagal
        keterangan="Daftar pengajuan mutasi tidak bisa dimuat. Akun guru hanya melihat pengajuannya sendiri, akun dinas melihat semuanya."
        detail={hasil.pesan}
      />
    );
  }

  if (hasil.data.mutasi.length === 0) {
    return (
      <KeadaanKosong
        judul="Belum ada pengajuan mutasi"
        keterangan="Pengajuan yang dibuat guru atau dinas akan muncul di sini beserta keputusannya. Mulai dari simulator untuk memeriksa dampaknya."
        tindakan={
          <Link
            href="/simulator"
            className="rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90"
          >
            Buka simulator mutasi
          </Link>
        }
      />
    );
  }

  return <DaftarMutasi mutasi={hasil.data.mutasi} bisaMemutuskan={hasil.data.bisaMemutuskan} />;
}

export default function HalamanMutasi() {
  return (
    <>
      <JudulHalaman
        judul="Pengajuan mutasi"
        keterangan="Setiap pengajuan tercatat lengkap dengan alasan guru dan catatan keputusan dinas."
        aksi={
          <Link
            href="/mutasi/ajukan"
            className="rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90"
          >
            Buat pengajuan baru
          </Link>
        }
      />
      <Suspense fallback={<KeadaanMemuat pesan="Memuat pengajuan mutasi" />}>
        <IsiMutasi />
      </Suspense>
    </>
  );
}
