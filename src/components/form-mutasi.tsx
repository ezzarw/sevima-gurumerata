"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ajukanMutasi, putuskanMutasi, type HasilAksi } from "@/app/(kerja)/mutasi/aksi";
import { LABEL_ALASAN_MUTASI, formatAngka } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import type { BarisGuru, BarisSekolah } from "@/lib/data/kueri";

const AWAL: HasilAksi = {};
const KELAS_BIDANG =
  "w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]";

export function FormAjukanMutasi({
  guru,
  sekolah,
  guruAwal,
  tujuanAwal,
}: {
  guru: BarisGuru[];
  sekolah: BarisSekolah[];
  guruAwal: string;
  tujuanAwal: string;
}) {
  const [hasil, aksi, sedang] = useActionState(ajukanMutasi, AWAL);
  const [guruId, setGuruId] = useState(guruAwal || (guru[0]?.id ?? ""));
  const [tujuanId, setTujuanId] = useState(tujuanAwal);

  const guruTerpilih = guru.find((g) => g.id === guruId) ?? null;
  const tujuan = sekolah.find((s) => s.id === tujuanId) ?? null;
  const samaSekolah = guruTerpilih && tujuan && guruTerpilih.sekolah_id === tujuan.id;

  return (
    <form action={aksi} className="space-y-4">
      {hasil.galat ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-3 py-2 text-[13px] text-kekurangan"
        >
          <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0" />
          {hasil.galat}
        </p>
      ) : null}

      <div className="rounded-kartu border border-garis bg-permukaan px-4 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="guru_id" className="block text-[13px] font-medium">
              Guru yang mengajukan
            </label>
            <select
              id="guru_id"
              name="guru_id"
              value={guruId}
              onChange={(e) => setGuruId(e.target.value)}
              className={cn(KELAS_BIDANG, "mt-1")}
            >
              {guru.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} — {g.mapel} — {g.sekolah_nama}
                </option>
              ))}
            </select>
            {guruTerpilih ? (
              <p className="mt-1 text-[12px] text-teks-lembut">
                Sekolah asal {guruTerpilih.sekolah_nama}, {guruTerpilih.mapel},{" "}
                {guruTerpilih.jam_ngajar} jam per minggu
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="sekolah_tujuan_id" className="block text-[13px] font-medium">
              Sekolah tujuan
            </label>
            <select
              id="sekolah_tujuan_id"
              name="sekolah_tujuan_id"
              value={tujuanId}
              onChange={(e) => setTujuanId(e.target.value)}
              className={cn(KELAS_BIDANG, "mt-1")}
            >
              <option value="">Pilih sekolah tujuan</option>
              {sekolah.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} — {s.jenjang} — {s.kabupaten}
                </option>
              ))}
            </select>
            {tujuan ? (
              <p className="mt-1 text-[12px] text-teks-lembut">
                {tujuan.jumlah_rombel} rombel, {formatAngka(tujuan.jumlah_guru)} guru,{" "}
                {tujuan.kabupaten}
              </p>
            ) : null}
          </div>
        </div>

        {samaSekolah ? (
          <p className="mt-3 rounded-kartu border border-cukup/40 bg-cukup-lembut px-3 py-2 text-[13px] text-cukup">
            Sekolah tujuan masih sama dengan sekolah asal. Pilih sekolah lain.
          </p>
        ) : null}
      </div>

      <div className="rounded-kartu border border-garis bg-permukaan px-4 py-4">
        <label htmlFor="alasan" className="block text-[13px] font-medium">
          Alasan pengajuan
        </label>
        <select id="alasan" name="alasan" defaultValue="keluarga" className={cn(KELAS_BIDANG, "mt-1")}>
          {Object.entries(LABEL_ALASAN_MUTASI).map(([nilai, label]) => (
            <option key={nilai} value={nilai}>
              {label}
            </option>
          ))}
        </select>

        <label htmlFor="catatan_guru" className="mt-4 block text-[13px] font-medium">
          Keterangan tambahan
        </label>
        <textarea
          id="catatan_guru"
          name="catatan_guru"
          rows={4}
          minLength={20}
          required
          placeholder="Contoh: suami saya bertugas di sekolah tujuan dan kami sudah tiga tahun berjauhan"
          className={cn(KELAS_BIDANG, "mt-1 resize-y")}
        />
        <p className="mt-1 text-[12px] text-teks-lembut">
          Keterangan ini dibaca dinas saat menilai pengajuan, jadi tulis keadaan sebenarnya.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={sedang || !tujuanId || Boolean(samaSekolah)}
          className="inline-flex items-center gap-2 rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90 disabled:opacity-60"
        >
          {sedang ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {sedang ? "Mengirim" : "Kirim pengajuan"}
        </button>
        <p className="text-[12px] text-teks-lembut">
          Pengajuan masuk ke dinas dengan status menunggu review. Simulasi tetap disarankan dijalankan
          lebih dulu.
        </p>
      </div>
    </form>
  );
}

export function FormKeputusan({ mutasiId }: { mutasiId: string }) {
  const [hasil, aksi, sedang] = useActionState(putuskanMutasi, AWAL);

  return (
    <form action={aksi} className="space-y-3">
      <input type="hidden" name="mutasi_id" value={mutasiId} />

      {hasil.galat ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-3 py-2 text-[13px] text-kekurangan"
        >
          <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0" />
          {hasil.galat}
        </p>
      ) : null}

      <div>
        <label htmlFor="catatan_dinas" className="block text-[13px] font-medium">
          Catatan keputusan
        </label>
        <textarea
          id="catatan_dinas"
          name="catatan_dinas"
          rows={3}
          minLength={10}
          required
          placeholder="Contoh: disetujui, jam mengajar di sekolah tujuan tetap 36 jam sehingga TPG aman"
          className={cn(KELAS_BIDANG, "mt-1 resize-y")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="keputusan"
          value="disetujui"
          disabled={sedang}
          className="inline-flex items-center gap-2 rounded-kartu bg-kelebihan px-4 py-2 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {sedang ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          Setujui dan eksekusi
        </button>
        <button
          type="submit"
          name="keputusan"
          value="ditolak"
          disabled={sedang}
          className="inline-flex items-center gap-2 rounded-kartu border border-kekurangan bg-permukaan px-4 py-2 text-[14px] font-medium text-kekurangan hover:bg-kekurangan-lembut disabled:opacity-60"
        >
          Tolak pengajuan
        </button>
      </div>
      <p className="text-[12px] text-teks-lembut">
        Menyetujui pengajuan akan langsung memindahkan guru dan menghitung ulang jam mengajar serta
        kebutuhan guru di kedua sekolah.
      </p>
    </form>
  );
}
