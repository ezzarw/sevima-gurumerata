"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eksekusiMutasi } from "@/lib/data/eksekusi";
import { siapkanSimulasi } from "@/lib/data/kueri";
import { simulasiMutasi } from "@/lib/domain/logika";
import { buatKlienServer } from "@/lib/supabase/server";

export interface HasilAksi {
  galat?: string;
  pesan?: string;
}

const ALASAN_SAH = ["keluarga", "kesehatan", "karir", "lainnya"];

export async function ajukanMutasi(_sebelumnya: HasilAksi, data: FormData): Promise<HasilAksi> {
  const guruId = String(data.get("guru_id") ?? "");
  const tujuanId = String(data.get("sekolah_tujuan_id") ?? "");
  const alasan = String(data.get("alasan") ?? "");
  const catatanGuru = String(data.get("catatan_guru") ?? "").trim();

  if (!guruId || !tujuanId) {
    return { galat: "Guru dan sekolah tujuan wajib dipilih." };
  }
  if (!ALASAN_SAH.includes(alasan)) {
    return { galat: "Pilih salah satu alasan pengajuan." };
  }
  if (catatanGuru.length < 20) {
    return { galat: "Tulis alasan lengkap minimal 20 karakter supaya dinas bisa menilai." };
  }

  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { galat: "Sesi berakhir. Masuk kembali lalu ulangi pengajuan." };

  const { data: guru } = await supabase
    .from("guru")
    .select("id, sekolah_id, mapel")
    .eq("id", guruId)
    .maybeSingle();
  if (!guru) return { galat: "Data guru tidak ditemukan atau tidak boleh Anda akses." };
  if (guru.sekolah_id === tujuanId) {
    return { galat: "Sekolah tujuan sama dengan sekolah asal guru." };
  }

  // Hasil simulasi disimpan bersama pengajuan supaya angka yang dilihat guru
  // saat mengajukan tetap bisa dibuka kembali setelah datanya berubah.
  const bahan = await siapkanSimulasi(guru.id, tujuanId);
  const simulasi = bahan ? simulasiMutasi(bahan.input) : null;

  const { error } = await supabase.from("mutasi").insert({
    guru_id: guru.id,
    sekolah_asal_id: guru.sekolah_id,
    sekolah_tujuan_id: tujuanId,
    mapel: guru.mapel,
    alasan,
    catatan_guru: catatanGuru,
    status: "diajukan",
    pengaju_id: user.id,
    simulasi,
  });
  if (error) {
    return {
      galat:
        "Pengajuan tidak tersimpan. Akun guru hanya bisa mengajukan untuk datanya sendiri; akun dinas dan operator sekolah bisa mengajukan untuk guru mana pun.",
    };
  }

  await supabase.from("log_aktivitas").insert({
    user_id: user.id,
    aksi: "ajukan_mutasi",
    detail: { guru_id: guru.id, sekolah_tujuan_id: tujuanId, alasan },
  });

  revalidatePath("/mutasi");
  revalidatePath("/dashboard");
  redirect("/mutasi?hasil=diajukan");
}

export async function putuskanMutasi(_sebelumnya: HasilAksi, data: FormData): Promise<HasilAksi> {
  const mutasiId = String(data.get("mutasi_id") ?? "");
  const keputusan = String(data.get("keputusan") ?? "");
  const catatan = String(data.get("catatan_dinas") ?? "").trim();

  if (!mutasiId) return { galat: "Pengajuan tidak dikenal." };
  if (keputusan !== "disetujui" && keputusan !== "ditolak") {
    return { galat: "Pilih setujui atau tolak." };
  }
  if (catatan.length < 10) {
    return { galat: "Tulis catatan keputusan minimal 10 karakter agar guru tahu alasannya." };
  }

  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { galat: "Sesi berakhir. Masuk kembali lalu ulangi keputusan." };

  const { data: profil } = await supabase.from("users").select("peran").eq("id", user.id).maybeSingle();
  if (profil?.peran !== "admin_dinas") {
    return {
      galat:
        "Hanya admin dinas pendidikan yang bisa menyetujui atau menolak pengajuan mutasi.",
    };
  }

  const { data: mutasi } = await supabase
    .from("mutasi")
    .select("id, status")
    .eq("id", mutasiId)
    .maybeSingle();
  if (!mutasi) return { galat: "Pengajuan tidak ditemukan." };
  if (mutasi.status !== "diajukan") {
    return { galat: "Pengajuan ini sudah diputuskan sebelumnya." };
  }

  if (keputusan === "disetujui") {
    try {
      await eksekusiMutasi(mutasiId);
    } catch (galat) {
      return {
        galat: `Mutasi tidak bisa dieksekusi: ${
          galat instanceof Error ? galat.message : "kesalahan tidak dikenal"
        }`,
      };
    }
  }

  const { error } = await supabase
    .from("mutasi")
    .update({
      status: keputusan,
      catatan_dinas: catatan,
      approved_at: keputusan === "disetujui" ? new Date().toISOString() : null,
    })
    .eq("id", mutasiId);
  if (error) return { galat: `Keputusan gagal disimpan: ${error.message}` };

  await supabase.from("log_aktivitas").insert({
    user_id: user.id,
    aksi: keputusan === "disetujui" ? "setujui_mutasi" : "tolak_mutasi",
    detail: { mutasi_id: mutasiId, catatan },
  });

  revalidatePath("/mutasi");
  revalidatePath("/dashboard");
  revalidatePath("/guru");
  revalidatePath("/sekolah");
  redirect(`/mutasi/${mutasiId}?hasil=${keputusan}`);
}

export async function batalkanMutasi(_sebelumnya: HasilAksi, data: FormData): Promise<HasilAksi> {
  const mutasiId = String(data.get("mutasi_id") ?? "");
  if (!mutasiId) return { galat: "Pengajuan tidak dikenal." };

  const supabase = await buatKlienServer();
  const { error } = await supabase
    .from("mutasi")
    .update({ status: "dibatalkan", catatan_dinas: "Dibatalkan oleh pengaju." })
    .eq("id", mutasiId)
    .eq("status", "diajukan");
  if (error) return { galat: `Pembatalan gagal: ${error.message}` };

  revalidatePath("/mutasi");
  return { pesan: "Pengajuan dibatalkan." };
}
