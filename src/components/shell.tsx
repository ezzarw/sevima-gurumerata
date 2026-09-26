"use client";

import Link from "next/link";
import {
  Map,
  GraduationCap,
  School,
  ArrowLeftRight,
  ClipboardList,
  MessageSquareText,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { keluar } from "@/app/masuk/aksi";
import { NavTautan } from "@/components/nav-tautan";
import type { Peran } from "@/lib/domain/tipe";

const LABEL_PERAN: Record<Peran, string> = {
  admin_dinas: "Admin Dinas Pendidikan",
  operator_sekolah: "Operator Sekolah",
  guru: "Guru",
};

const MENU = [
  { href: "/dashboard", label: "Peta sebaran", ikon: Map },
  { href: "/guru", label: "Data guru", ikon: GraduationCap },
  { href: "/sekolah", label: "Data sekolah", ikon: School },
  { href: "/simulator", label: "Simulator mutasi", ikon: ArrowLeftRight },
  { href: "/mutasi", label: "Pengajuan mutasi", ikon: ClipboardList },
  { href: "/asisten", label: "Asisten analitis", ikon: MessageSquareText },
];

export function Shell({
  children,
  nama,
  email,
  peran,
  sekolah,
}: {
  children: ReactNode;
  nama: string;
  email: string;
  peran: Peran;
  sekolah?: string | null;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-garis bg-permukaan lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block">
          <Link href="/dashboard" className="block">
            <span className="block text-[17px] font-semibold tracking-tight text-inti">
              GuruMerata
            </span>
            <span className="block text-[12px] text-teks-lembut">Guru tepat, di tempat yang tepat</span>
          </Link>
        </div>

        <nav aria-label="Menu utama" className="border-t border-garis px-2 py-2">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {MENU.map(({ href, label, ikon: Ikon }) => (
              <li key={href} className="shrink-0 lg:shrink">
                <NavTautan href={href} label={label} Ikon={Ikon} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-garis px-4 py-3">
          <p className="text-[13px] font-medium">{nama}</p>
          <p className="text-[12px] text-teks-lembut">{email}</p>
          <p className="mt-1 text-[12px] text-teks-lembut">
            {LABEL_PERAN[peran]}
            {sekolah ? ` · ${sekolah}` : ""}
          </p>
          <form action={keluar} className="mt-3">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-kartu border border-garis-tegas px-3 py-2 text-[13px] font-medium hover:bg-latar"
            >
              <LogOut aria-hidden className="size-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <main className="min-w-0 flex-1 px-4 py-5 lg:px-7 lg:py-6">{children}</main>
        <Kaki />
      </div>
    </div>
  );
}

/**
 * Kaki halaman mengikuti pola portal pemerintahan: beberapa kolom ringkas,
 * pemisah garis, dan keterangan sumber data di bagian bawah. Fungsinya bukan
 * hiasan, melainkan menegaskan dari mana angka di aplikasi ini berasal.
 */
function Kaki() {
  return (
    <footer className="mt-2 border-t border-garis bg-permukaan">
      <div className="grid gap-6 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-7">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-inti">GuruMerata</p>
          <p className="mt-1 text-[13px] text-teks-lembut">Guru tepat, di tempat yang tepat.</p>
          <p className="mt-2 text-[12px] text-teks-lembut">
            Prototipe untuk hackathon SEMESTA 8, tema SDG 4 Pendidikan Berkualitas.
          </p>
        </div>

        <div>
          <p className="text-[13px] font-semibold">Menu</p>
          <ul className="mt-2 space-y-1">
            {MENU.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-[13px] text-teks-lembut hover:text-inti hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-semibold">Sumber data</p>
          <p className="mt-2 text-[12px] leading-relaxed text-teks-lembut">
            Di lapangan, data guru tersebar di Dapodik, SIMPKB, dan InfoGTK yang belum saling
            terhubung. GuruMerata menunjukkan bagaimana ketiganya bisa dibaca sebagai satu
            gambaran sebaran.
          </p>
        </div>

        <div>
          <p className="text-[13px] font-semibold">Catatan</p>
          <p className="mt-2 text-[12px] leading-relaxed text-teks-lembut">
            Seluruh angka pada versi ini adalah data sintetis untuk keperluan demo. Nama sekolah
            dan kabupaten memakai nama nyata agar polanya mudah dikenali, tetapi jumlah guru dan
            kebutuhannya bukan data resmi.
          </p>
        </div>
      </div>

      <div className="border-t border-garis px-4 py-3 lg:px-7">
        <p className="text-[12px] text-teks-lembut">
          GuruMerata · Prototipe kebijakan distribusi guru · Data sintetis, bukan data resmi
          Dapodik, SIMPKB, atau InfoGTK.
        </p>
      </div>
    </footer>
  );
}

/**
 * Judul bagian rata tengah dengan garis pemisah tipis, mengikuti pola bagian
 * "dalam angka" pada portal data pemerintah. Dipakai untuk membuka sebuah blok
 * isi, bukan untuk setiap kartu.
 */
export function JudulBagian({
  judul,
  keterangan,
}: {
  judul: string;
  keterangan?: string;
}) {
  return (
    <div className="border-t border-garis pt-5 text-center">
      <h2 className="text-[20px] font-semibold tracking-tight text-inti">{judul}</h2>
      {keterangan ? (
        <p className="mx-auto mt-1 max-w-2xl text-[13px] text-teks-lembut">{keterangan}</p>
      ) : null}
    </div>
  );
}

export function JudulHalaman({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{judul}</h1>
        {keterangan ? <p className="mt-1 max-w-2xl text-[14px] text-teks-lembut">{keterangan}</p> : null}
      </div>
      {aksi}
    </header>
  );
}
