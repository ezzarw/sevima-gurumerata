import { KeadaanMemuat } from "@/components/keadaan";

export default function Memuat() {
  return (
    <div className="space-y-5">
      <div className="h-9 w-64 animate-pulse rounded-kartu bg-garis" aria-hidden />
      <KeadaanMemuat pesan="Memuat halaman" />
    </div>
  );
}
