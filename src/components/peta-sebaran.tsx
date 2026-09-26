"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { statusDaerah } from "@/lib/domain/logika";
import type { StatusKecukupan } from "@/lib/domain/tipe";
import { formatAngka, ringkasSebaran } from "@/lib/data/format";
import { cn } from "@/lib/utils";

export interface TitikWilayah {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  jumlah_sekolah: number;
  jumlah_guru: number;
  total_kurang: number;
  total_lebih: number;
}

const WARNA: Record<StatusKecukupan, string> = {
  kekurangan: "#b3261e",
  cukup: "#9a6700",
  kelebihan: "#1f6f4a",
};

/**
 * Peta sebaran: satu lingkaran per provinsi, warnanya menunjukkan status
 * kecukupan guru. Besar lingkaran mengikuti jumlah guru, jadi provinsi besar
 * tidak tenggelam di antara provinsi kecil.
 */
export function PetaSebaran({
  wilayah,
  terpilih,
  onPilih,
}: {
  wilayah: TitikWilayah[];
  terpilih: string | null;
  onPilih: (id: string | null) => void;
}) {
  const batas = useMemo<LatLngBoundsExpression>(() => {
    if (wilayah.length === 0) return [[-11, 95], [6, 141]];
    const lats = wilayah.map((w) => w.latitude);
    const lons = wilayah.map((w) => w.longitude);
    const tepi = 2.5;
    return [
      [Math.min(...lats) - tepi, Math.min(...lons) - tepi],
      [Math.max(...lats) + tepi, Math.max(...lons) + tepi],
    ];
  }, [wilayah]);

  return (
    <div className="overflow-hidden rounded-kartu border border-garis">
      <MapContainer
        bounds={batas}
        boundsOptions={{ padding: [16, 16] }}
        scrollWheelZoom={false}
        className="h-[320px] w-full sm:h-[420px]"
        aria-label="Peta sebaran guru per provinsi"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='Peta &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {wilayah.map((w) => {
          const status = statusDaerah(w.total_kurang, w.total_lebih);
          const radius = 10 + Math.min(18, Math.sqrt(w.jumlah_guru));
          const aktif = terpilih === w.id;
          return (
            <CircleMarker
              key={w.id}
              center={[w.latitude, w.longitude]}
              radius={aktif ? radius + 3 : radius}
              pathOptions={{
                color: "#ffffff",
                weight: aktif ? 3 : 1.5,
                fillColor: WARNA[status],
                fillOpacity: aktif ? 0.95 : 0.8,
              }}
              eventHandlers={{ click: () => onPilih(aktif ? null : w.id) }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <span className="text-[13px] font-medium">{w.nama}</span>
                <br />
                <span className="text-[12px]">{ringkasSebaran(w.total_kurang, w.total_lebih)} guru</span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/**
 * Legenda dipisah dari peta karena Leaflet menyembunyikan kontrol HTML
 * kustom di dalam popup. Di sini status selalu warna + label.
 */
export function LegendaSebaran({ wilayah }: { wilayah: TitikWilayah[] }) {
  const hitung = { kekurangan: 0, cukup: 0, kelebihan: 0 };
  for (const w of wilayah) hitung[statusDaerah(w.total_kurang, w.total_lebih)] += 1;

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
      {(
        [
          ["kekurangan", "Kekurangan guru"],
          ["cukup", "Sudah cukup"],
          ["kelebihan", "Kelebihan guru"],
        ] as const
      ).map(([status, label]) => (
        <li key={status} className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-3 rounded-full border border-white"
            style={{ background: WARNA[status] }}
          />
          <span>
            {label} <span className="tabular-nums text-teks-lembut">({hitung[status]} provinsi)</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DaftarProvinsi({
  wilayah,
  terpilih,
  onPilih,
}: {
  wilayah: TitikWilayah[];
  terpilih: string | null;
  onPilih: (id: string | null) => void;
}) {
  const urut = [...wilayah].sort(
    (a, b) => b.total_kurang - a.total_kurang || b.total_lebih - a.total_lebih,
  );
  return (
    <ul className="divide-y divide-garis">
      {urut.map((w) => {
        const status = statusDaerah(w.total_kurang, w.total_lebih);
        return (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => onPilih(terpilih === w.id ? null : w.id)}
              aria-pressed={terpilih === w.id}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                terpilih === w.id ? "bg-inti-lembut" : "hover:bg-latar",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium">{w.nama}</span>
                <span className="block text-[12px] text-teks-lembut">
                  {formatAngka(w.jumlah_sekolah)} sekolah · {formatAngka(w.jumlah_guru)} guru
                </span>
              </span>
              <span
                className="shrink-0 text-[13px] font-medium tabular-nums"
                style={{ color: WARNA[status] }}
              >
                {ringkasSebaran(w.total_kurang, w.total_lebih)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
