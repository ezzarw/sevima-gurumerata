"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { REALTIME_SUBSCRIBE_STATES, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { klienBrowser } from "@/lib/supabase/klien";

export interface PeristiwaMutasi {
  jenis: string;
  id: string | null;
  waktu: Date;
}

/**
 * Berlangganan perubahan tabel mutasi lewat Supabase Realtime.
 *
 * Halaman kerja dirender di server, jadi keputusan pengguna lain tidak
 * terlihat sampai halaman dimuat ulang. Hook ini memantau tabel mutasi lalu
 * meminta router menyegarkan data, sehingga angka di layar ikut berubah tanpa
 * menekan muat ulang.
 *
 * Token sesi dipasang ulang ke koneksi realtime sebelum berlangganan: pada
 * tabel dengan RLS aktif, langganan tanpa token tidak menerima baris apa pun.
 */
export function useMutasiRealtime() {
  const router = useRouter();
  const [terhubung, setTerhubung] = useState(false);
  const [peristiwaTerakhir, setPeristiwaTerakhir] = useState<PeristiwaMutasi | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    const supabase = klienBrowser();
    let hidup = true;
    let saluran: ReturnType<typeof supabase.channel> | null = null;

    async function mulai() {
      const { data } = await supabase.auth.getSession();
      if (!hidup) return;

      if (!data.session?.access_token) {
        setGalat("Sesi tidak ditemukan, jadi pembaruan langsung tidak bisa dinyalakan.");
        return;
      }

      // Realtime perlu token akses agar RLS ikut berlaku pada langganan.
      supabase.realtime.setAuth(data.session.access_token);

      saluran = supabase
        .channel("mutasi-perubahan")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "mutasi" },
          (bayangan: RealtimePostgresChangesPayload<{ id?: string }>) => {
            const baris = bayangan.new as { id?: string } | null;
            setPeristiwaTerakhir({
              jenis: bayangan.eventType,
              id: baris?.id ?? null,
              waktu: new Date(),
            });
            router.refresh();
          },
        )
        .subscribe((status: REALTIME_SUBSCRIBE_STATES, kesalahan?: Error) => {
          if (!hidup) return;
          setTerhubung(status === "SUBSCRIBED");
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setGalat(kesalahan?.message ?? `Langganan bermasalah (${status}).`);
          }
        });
    }

    void mulai();

    return () => {
      hidup = false;
      if (saluran) void supabase.removeChannel(saluran);
    };
  }, [router]);

  return { terhubung, peristiwaTerakhir, galat };
}
