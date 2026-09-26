"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { AKUN_DEMO, SANDI_DEMO } from "@/lib/data/akun-demo";

export interface HasilMasuk {
  galat?: string;
}

export async function masuk(_sebelumnya: HasilMasuk, data: FormData): Promise<HasilMasuk> {
  const email = String(data.get("email") ?? "").trim();
  const sandi = String(data.get("sandi") ?? "");
  const tujuan = String(data.get("dari") ?? "/dashboard");

  if (!email || !sandi) {
    return { galat: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password: sandi });
  if (error) {
    return { galat: "Email atau kata sandi tidak cocok. Periksa kembali penulisannya." };
  }

  revalidatePath("/", "layout");
  redirect(tujuan.startsWith("/") ? tujuan : "/dashboard");
}

/**
 * Masuk memakai salah satu akun demo tanpa mengetik kredensial.
 *
 * Halaman pendaftaran sengaja tidak disediakan. Aplikasi ini dinilai lewat
 * akun demo, dan membiarkan pendaftaran terbuka hanya menambah permukaan
 * masalah tanpa memberi nilai. Pengguna baru juga akan melihat halaman kosong
 * karena RLS hanya mengizinkan guru melihat datanya sendiri, sedangkan baris
 * datanya belum ada.
 */
export async function masukDemo(_sebelumnya: HasilMasuk, data: FormData): Promise<HasilMasuk> {
  const email = String(data.get("email") ?? "").trim();
  if (!AKUN_DEMO.some((a) => a.email === email)) {
    return { galat: "Akun demo yang dipilih tidak dikenal." };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password: SANDI_DEMO });
  if (error) {
    return { galat: "Akun demo sedang tidak bisa diakses. Hubungi pengembang." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function keluar() {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/masuk");
}
