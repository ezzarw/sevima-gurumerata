"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Galat({ galat, reset }: { galat: Error; reset: () => void }) {
  useEffect(() => {
    // Dicatat ke konsol supaya bisa ditelusuri saat demo, bukan disembunyikan.
    console.error(galat);
  }, [galat]);

  return (
    <div role="alert" className="rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-5 py-6">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-[2px] size-5 shrink-0 text-kekurangan" />
        <div>
          <h1 className="text-[17px] font-semibold text-kekurangan">Halaman gagal dimuat</h1>
          <p className="mt-1 text-[14px]">
            Ada kesalahan saat mengambil data. Coba muat ulang halaman ini; bila tetap gagal, periksa
            koneksi ke Supabase.
          </p>
          <p className="mt-2 rounded-[4px] bg-permukaan px-2 py-1 font-mono text-[12px] text-teks-lembut">
            {galat.message}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90"
          >
            Muat ulang halaman
          </button>
        </div>
      </div>
    </div>
  );
}
