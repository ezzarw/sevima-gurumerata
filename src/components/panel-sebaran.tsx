"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DaftarProvinsi, LegendaSebaran, PetaSebaran, type TitikWilayah } from "@/components/peta-sebaran";
import { Kartu } from "@/components/kartu";
import { formatAngka, ringkasSebaran } from "@/lib/data/format";

/**
 * Panel peta dan daftar provinsi berbagi satu keadaan terpilih, sehingga klik
 * di peta dan klik di daftar menunjuk daerah yang sama.
 */
export function PanelSebaran({ wilayah }: { wilayah: TitikWilayah[] }) {
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const provinsi = wilayah.find((w) => w.id === terpilih) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <Kartu
        judul="Peta sebaran guru"
        keterangan="Satu lingkaran per provinsi. Ukuran lingkaran mengikuti jumlah guru."
        aksi={<LegendaSebaran wilayah={wilayah} />}
      >
        <div className="p-4">
          <PetaSebaran wilayah={wilayah} terpilih={terpilih} onPilih={setTerpilih} />
        </div>

        {provinsi ? (
          <div className="border-t border-garis bg-inti-lembut px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">{provinsi.nama}</p>
                <p className="text-[12px] text-teks-lembut">
                  {formatAngka(provinsi.jumlah_sekolah)} sekolah ·{" "}
                  {formatAngka(provinsi.jumlah_guru)} guru ·{" "}
                  {ringkasSebaran(provinsi.total_kurang, provinsi.total_lebih)} guru
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTerpilih(null)}
                className="rounded-[4px] p-1 text-teks-lembut hover:bg-permukaan"
                aria-label="Tutup detail provinsi"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </Kartu>

      <Kartu
        judul="Peringkat kebutuhan guru"
        keterangan="Provinsi dengan kekurangan formasi terbanyak di paling atas."
      >
        <DaftarProvinsi wilayah={wilayah} terpilih={terpilih} onPilih={setTerpilih} />
      </Kartu>
    </div>
  );
}
