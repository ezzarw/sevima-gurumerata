"use client";

import { useActionState, useState } from "react";
import { daftar, masuk, type HasilMasuk } from "@/app/masuk/aksi";
import { AlertTriangle, Loader2 } from "lucide-react";

const AWAL: HasilMasuk = {};

export function FormMasuk({ dari }: { dari: string }) {
  const [tab, setTab] = useState<"masuk" | "daftar">("masuk");
  const [galatMasuk, aksiMasuk, sedangMasuk] = useActionState(masuk, AWAL);
  const [galatDaftar, aksiDaftar, sedangDaftar] = useActionState(daftar, AWAL);
  const [pesanDaftar, setPesanDaftar] = useState<string | null>(null);

  const galat = tab === "masuk" ? galatMasuk.galat : galatDaftar.galat;

  return (
    <div className="rounded-kartu border border-garis bg-permukaan p-5">
      <div role="tablist" aria-label="Pilih masuk atau daftar" className="mb-4 flex gap-1 rounded-kartu bg-latar p-1">
        {(["masuk", "daftar"] as const).map((nilai) => (
          <button
            key={nilai}
            role="tab"
            type="button"
            aria-selected={tab === nilai}
            onClick={() => setTab(nilai)}
            className={`flex-1 rounded-[4px] px-3 py-2 text-[14px] font-medium ${
              tab === nilai ? "bg-permukaan text-inti shadow-sm" : "text-teks-lembut hover:text-teks"
            }`}
          >
            {nilai === "masuk" ? "Masuk" : "Daftar akun"}
          </button>
        ))}
      </div>

      {galat ? (
        <p
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-3 py-2 text-[13px] text-kekurangan"
        >
          <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0" />
          {galat}
        </p>
      ) : null}

      {pesanDaftar ? (
        <p role="status" className="mb-3 rounded-kartu border border-kelebihan/30 bg-kelebihan-lembut px-3 py-2 text-[13px] text-kelebihan">
          {pesanDaftar}
        </p>
      ) : null}

      {tab === "masuk" ? (
        <form action={aksiMasuk} className="space-y-3">
          <input type="hidden" name="dari" value={dari} />
          <Bidang label="Email" name="email" type="email" autoComplete="email" />
          <Bidang label="Kata sandi" name="sandi" type="password" autoComplete="current-password" />
          <TombolKirim sedang={sedangMasuk} label="Masuk" />
        </form>
      ) : (
        <form action={aksiDaftar} className="space-y-3">
          <Bidang label="Nama lengkap" name="nama" type="text" autoComplete="name" />
          <Bidang label="Email" name="email" type="email" autoComplete="email" />
          <Bidang label="Kata sandi" name="sandi" type="password" autoComplete="new-password" keterangan="Minimal 8 karakter" />
          <div>
            <label htmlFor="peran" className="block text-[13px] font-medium">
              Peran di aplikasi
            </label>
            <select
              id="peran"
              name="peran"
              defaultValue="guru"
              className="mt-1 w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]"
            >
              <option value="guru">Guru</option>
              <option value="operator_sekolah">Operator sekolah</option>
              <option value="admin_dinas">Admin dinas pendidikan</option>
            </select>
            <p className="mt-1 text-[12px] text-teks-lembut">
              Peran menentukan data yang boleh dilihat sesuai aturan RLS Supabase.
            </p>
          </div>
          <TombolKirim sedang={sedangDaftar} label="Buat akun" />
        </form>
      )}
    </div>
  );
}

function Bidang({
  label,
  name,
  type,
  autoComplete,
  keterangan,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  keterangan?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[13px] font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-kartu border border-garis-tegas bg-permukaan px-3 py-2 text-[14px]"
      />
      {keterangan ? <p className="mt-1 text-[12px] text-teks-lembut">{keterangan}</p> : null}
    </div>
  );
}

function TombolKirim({ sedang, label }: { sedang: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={sedang}
      className="inline-flex w-full items-center justify-center gap-2 rounded-kartu bg-inti px-4 py-2 text-[14px] font-medium text-white hover:bg-inti/90 disabled:opacity-60"
    >
      {sedang ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
      {sedang ? "Memproses" : label}
    </button>
  );
}
