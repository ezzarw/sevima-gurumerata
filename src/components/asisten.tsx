"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Send, Wrench } from "lucide-react";
import { Kartu } from "@/components/kartu";
import { cn } from "@/lib/utils";

interface Giliran {
  peran: "pengguna" | "asisten";
  teks: string;
  tool?: { tool: string; argumen: unknown }[];
}

const CONTOH = [
  "Sekolah mana yang paling butuh guru matematika di NTT?",
  "Guru apa saja yang kelebihan di DKI Jakarta?",
  "Kalau Citra Ayu, S.Pd dipindah ke SMAN 1 Waingapu, TPG-nya aman?",
  "Berapa sekolah yang kekurangan guru Bahasa Indonesia di Papua?",
];

export function Asisten() {
  const [giliran, setGiliran] = useState<Giliran[]>([]);
  const [pertanyaan, setPertanyaan] = useState("");
  const [sedang, setSedang] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const kotakAkhir = useRef<HTMLDivElement>(null);

  async function kirim(teks: string) {
    const isi = teks.trim();
    if (!isi || sedang) return;

    setGalat(null);
    setSedang(true);
    setPertanyaan("");
    const riwayat = [...giliran, { peran: "pengguna" as const, teks: isi }];
    setGiliran(riwayat);

    try {
      const respons = await fetch("/api/asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pertanyaan: isi,
          riwayat: giliran.map((g) => ({
            peran: g.peran === "pengguna" ? "user" : "asisten",
            teks: g.teks,
          })),
        }),
      });
      const hasil = await respons.json();

      if (!respons.ok || hasil.galat) {
        setGalat(hasil.galat ?? `Asisten menjawab dengan kode ${respons.status}.`);
        return;
      }

      setGiliran([
        ...riwayat,
        { peran: "asisten", teks: hasil.jawaban, tool: hasil.tool_dipakai },
      ]);
    } catch (kesalahan) {
      setGalat(
        kesalahan instanceof Error
          ? `Tidak bisa menghubungi asisten: ${kesalahan.message}`
          : "Tidak bisa menghubungi asisten.",
      );
    } finally {
      setSedang(false);
      requestAnimationFrame(() => kotakAkhir.current?.scrollIntoView({ block: "nearest" }));
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Kartu
        judul="Tanya asisten"
        keterangan="Asisten menjawab dengan memanggil data sekolah, guru, dan kebutuhan guru. Angkanya sama dengan yang ada di halaman lain."
      >
        <div className="flex h-[420px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {giliran.length === 0 ? (
              <div className="text-[14px] text-teks-lembut">
                <p className="font-medium text-teks">Belum ada pertanyaan</p>
                <p className="mt-1">
                  Tulis pertanyaan tentang sebaran guru atau dampak mutasi. Asisten akan memanggil
                  data yang diperlukan sebelum menjawab.
                </p>
                <ul className="mt-4 space-y-2">
                  {CONTOH.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        onClick={() => kirim(c)}
                        className="w-full rounded-kartu border border-garis-tegas px-3 py-2 text-left hover:bg-latar"
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              giliran.map((g, i) => (
                <div key={`${g.peran}-${i}`} className={cn("flex", g.peran === "pengguna" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-kartu px-3 py-2 text-[14px]",
                      g.peran === "pengguna"
                        ? "bg-inti text-white"
                        : "border border-garis bg-latar text-teks",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{g.teks}</p>
                    {g.tool && g.tool.length > 0 ? (
                      <div className="mt-2 border-t border-garis-tegas pt-2">
                        <p className="flex items-center gap-1.5 text-[12px] text-teks-lembut">
                          <Wrench aria-hidden className="size-3.5" />
                          Data yang dipanggil:
                        </p>
                        <ul className="mt-1 space-y-1 text-[12px] text-teks-lembut">
                          {g.tool.map((t, j) => (
                            <li key={`${t.tool}-${j}`} className="font-mono">
                              {t.tool}({Object.entries(t.argumen as Record<string, unknown>)
                                .map(([k, v]) => `${k}: ${String(v)}`)
                                .join(", ")})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            <div ref={kotakAkhir} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              kirim(pertanyaan);
            }}
            className="border-t border-garis px-4 py-3"
          >
            {galat ? (
              <p
                role="alert"
                className="mb-2 flex items-start gap-2 rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-3 py-2 text-[13px] text-kekurangan"
              >
                <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0" />
                {galat}
              </p>
            ) : null}

            <label htmlFor="pertanyaan-asisten" className="sr-only">
              Pertanyaan untuk asisten
            </label>
            <div className="flex gap-2">
              <input
                id="pertanyaan-asisten"
                type="text"
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                placeholder="Contoh: sekolah mana yang paling butuh guru matematika di NTT?"
                disabled={sedang}
                className="w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]"
              />
              <button
                type="submit"
                disabled={sedang || pertanyaan.trim() === ""}
                className="inline-flex shrink-0 items-center gap-2 rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90 disabled:opacity-60"
              >
                {sedang ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Send aria-hidden className="size-4" />}
                {sedang ? "Mencari" : "Tanya"}
              </button>
            </div>
          </form>
        </div>
      </Kartu>

      <Kartu
        judul="Yang bisa dilakukan asisten"
        keterangan="Empat aksi yang tersedia, semuanya membaca data yang sama dengan halaman kerja."
      >
        <ul className="divide-y divide-garis text-[14px]">
          {[
            ["cari_sekolah_kekurangan", "Mencari sekolah yang masih kekurangan guru, bisa disaring per provinsi dan mapel."],
            ["cari_guru_kelebihan", "Mencari guru yang jam mengajarnya di bawah 24 jam sehingga TPG-nya rawan berhenti."],
            ["simulasi_mutasi", "Menghitung jam mengajar baru dan status TPG bila satu guru dipindahkan."],
            ["cek_tpg", "Memeriksa apakah TPG seorang guru tetap aman pada jam mengajar tertentu."],
          ].map(([nama, keterangan]) => (
            <li key={nama} className="px-4 py-3">
              <p className="font-mono text-[12px] text-inti">{nama}</p>
              <p className="mt-1 text-teks-lembut">{keterangan}</p>
            </li>
          ))}
        </ul>
        <div className="border-t border-garis px-4 py-3">
          <p className="text-[13px] text-teks-lembut">
            Aturan yang dipakai: guru bersertifikasi wajib mengajar minimal 24 jam tatap muka per
            minggu. Bila kurang, InfoGTK menghentikan TPG sekitar Rp2 juta per bulan.
          </p>
        </div>
      </Kartu>
    </div>
  );
}
