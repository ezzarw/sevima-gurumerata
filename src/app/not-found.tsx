import Link from "next/link";

export default function TidakDitemukan() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-center">
      <p className="text-[13px] font-medium text-aksen">Halaman tidak ditemukan</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Alamat ini tidak ada</h1>
      <p className="mt-2 text-[14px] text-teks-lembut">
        Periksa kembali tautannya, atau kembali ke peta sebaran untuk melanjutkan pekerjaan.
      </p>
      <Link
        href="/dashboard"
        className="mx-auto mt-5 rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90"
      >
        Buka peta sebaran
      </Link>
    </div>
  );
}
