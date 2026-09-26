import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { buatKlienServer } from "@/lib/supabase/server";
import type { Peran } from "@/lib/domain/tipe";

/**
 * Semua halaman kerja ada di dalam grup ini. Guard-nya dua lapis: proxy.ts
 * menahan permintaan tanpa sesi, dan layout ini memastikan sesinya benar-benar
 * milik pengguna yang sah sebelum datanya diambil.
 */
export default async function LayoutKerja({ children }: { children: React.ReactNode }) {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/masuk");

  const { data: profil } = await supabase
    .from("users")
    .select("nama, peran, sekolah:sekolah_id(nama)")
    .eq("id", user.id)
    .maybeSingle();

  const sekolah = (profil?.sekolah as unknown as { nama: string } | null)?.nama ?? null;

  return (
    <Shell
      nama={profil?.nama ?? user.email?.split("@")[0] ?? "Pengguna"}
      email={user.email ?? "-"}
      peran={(profil?.peran as Peran) ?? "guru"}
      sekolah={sekolah}
    >
      {children}
    </Shell>
  );
}
