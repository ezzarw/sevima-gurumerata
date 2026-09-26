"use client";

import { useActionState } from "react";
import { masuk, masukDemo, type HasilMasuk } from "@/app/masuk/aksi";
import { AKUN_DEMO, SANDI_DEMO } from "@/lib/data/akun-demo";
import { AlertTriangle, Loader2, LogIn } from "lucide-react";

const AWAL: HasilMasuk = {};

export function FormMasuk({ dari }: { dari: string }) {
  const [galatMasuk, aksiMasuk, sedangMasuk] = useActionState(masuk, AWAL);
  const [galatDemo, aksiDemo, sedangDemo] = useActionState(masukDemo, AWAL);

  const galat = galatMasuk.galat ?? galatDemo.galat;

  return (
    <div className="rounded-kartu border border-garis bg-permukaan p-5">
      <h2 className="text-[16px] font-semibold tracking-tight">Masuk dengan akun demo</h2>
      <p className="mt-1 text-[13px] text-teks-lembut">
        Pilih peran untuk melihat bagaimana tampilan berubah sesuai hak aksesnya. Tidak perlu
        mengetik email atau kata sandi.
      </p>

      {galat ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-kartu border border-kekurangan/30 bg-kekurangan-lembut px-3 py-2 text-[13px] text-kekurangan"
        >
          <AlertTriangle aria-hidden className="mt-[2px] size-4 shrink-0" />
          {galat}
        </p>
      ) : null}

      <form action={aksiDemo} className="mt-3 space-y-2">
        {AKUN_DEMO.map((akun) => (
          <button
            key={akun.email}
            type="submit"
            name="email"
            value={akun.email}
            disabled={sedangDemo}
            className="flex w-full items-start gap-3 rounded-kartu border border-garis-tegas px-3 py-3 text-left hover:border-inti hover:bg-inti-lembut disabled:opacity-60"
          >
            <LogIn aria-hidden className="mt-[2px] size-4 shrink-0 text-inti" />
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">{akun.label}</span>
              <span className="block text-[12px] text-teks-lembut">{akun.keterangan}</span>
            </span>
          </button>
        ))}
      </form>

      <details className="mt-4 border-t border-garis pt-3">
        <summary className="cursor-pointer text-[13px] text-teks-lembut hover:text-teks">
          Masuk dengan akun lain
        </summary>
        <form action={aksiMasuk} className="mt-3 space-y-3">
          <input type="hidden" name="dari" value={dari} />
          <Bidang label="Email" name="email" type="email" autoComplete="email" />
          <Bidang label="Kata sandi" name="sandi" type="password" autoComplete="current-password" />
          <TombolKirim sedang={sedangMasuk} label="Masuk" />
        </form>
        <p className="mt-2 text-[12px] leading-relaxed text-teks-lembut">
          Akun demo memakai kata sandi <code className="rounded bg-latar px-1">{SANDI_DEMO}</code>.
          Pendaftaran akun baru belum dibuka pada versi demo ini.
        </p>
      </details>
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
