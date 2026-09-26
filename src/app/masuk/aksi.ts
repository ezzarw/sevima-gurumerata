"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";

export interface HasilMasuk {
  galat?: string;
}

const LABEL_PERAN: Record<string, string> = {
  admin_dinas: "Admin Dinas",
  operator_sekolah: "Operator Sekolah",
  guru: "Guru",
};

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

export async function daftar(_sebelumnya: HasilMasuk, data: FormData): Promise<HasilMasuk> {
  const email = String(data.get("email") ?? "").trim();
  const sandi = String(data.get("sandi") ?? "");
  const nama = String(data.get("nama") ?? "").trim();
  const peran = String(data.get("peran") ?? "guru");

  if (!email || !sandi || !nama) {
    return { galat: "Nama, email, dan kata sandi wajib diisi." };
  }
  if (sandi.length < 8) {
    return { galat: "Kata sandi minimal 8 karakter." };
  }
  if (!(peran in LABEL_PERAN)) {
    return { galat: "Peran yang dipilih tidak dikenal." };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.signUp({
    email,
    password: sandi,
    options: { data: { nama, peran } },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { galat: "Email ini sudah terdaftar. Coba masuk saja." };
    }
    return { galat: `Pendaftaran gagal: ${error.message}` };
  }

  return {
    galat: undefined,
  };
}

export async function keluar() {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/masuk");
}
