import Link from "next/link";
import { JudulHalaman } from "@/components/shell";

export default function PengajuanTidakDitemukan() {
  return (
    <>
      <JudulHalaman judul="Pengajuan tidak ditemukan" />
      <div className="rounded-kartu border border-garis bg-permukaan px-5 py-8 text-center">
        <p className="font-medium">Pengajuan dengan nomor itu tidak ada</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-teks-lembut">
          Nomornya mungkin salah, atau pengajuan itu bukan milik akun yang sedang dipakai. Akun guru
          hanya bisa membuka pengajuannya sendiri.
        </p>
        <Link
          href="/mutasi"
          className="mt-4 inline-block rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90"
        >
          Kembali ke daftar pengajuan
        </Link>
      </div>
    </>
  );
}
