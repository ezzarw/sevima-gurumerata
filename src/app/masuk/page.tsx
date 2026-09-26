import { FormMasuk } from "@/components/form-masuk";
import { KeadaanGagal } from "@/components/keadaan";

export const metadata = { title: "Masuk · GuruMerata" };

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string }>;
}) {
  const { dari } = await searchParams;
  const siap = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[1040px] flex-col justify-center gap-8 px-4 py-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14">
      <div>
        <p className="text-[13px] font-medium text-aksen">Hackathon SEMESTA 8 · SDG 4</p>
        <h1 className="mt-2 text-[36px] font-semibold leading-tight tracking-tight text-inti">
          GuruMerata
        </h1>
        <p className="mt-2 text-[16px] text-teks-lembut">Guru tepat, di tempat yang tepat.</p>

        <dl className="mt-6 space-y-3 text-[14px]">
          <div className="rounded-kartu border border-garis bg-permukaan px-4 py-3">
            <dt className="font-medium">Sebaran guru tidak merata</dt>
            <dd className="mt-1 text-teks-lembut">
              Satu daerah kekurangan guru, daerah lain justru kelebihan guru di mapel yang sama.
            </dd>
          </div>
          <div className="rounded-kartu border border-garis bg-permukaan px-4 py-3">
            <dt className="font-medium">Simulasi sebelum eksekusi</dt>
            <dd className="mt-1 text-teks-lembut">
              Hitung jam tatap muka dan status TPG sebelum guru dipindahkan, bukan sesudahnya.
            </dd>
          </div>
          <div className="rounded-kartu border border-garis bg-permukaan px-4 py-3">
            <dt className="font-medium">Mutasi tercatat</dt>
            <dd className="mt-1 text-teks-lembut">
              Setiap pengajuan dan keputusan dinas tersimpan, lengkap dengan alasannya.
            </dd>
          </div>
        </dl>
      </div>

      <div>
        {siap ? (
          <FormMasuk dari={dari ?? "/dashboard"} />
        ) : (
          <KeadaanGagal
            judul="Supabase belum dikonfigurasi"
            keterangan="Aplikasi belum bisa memuat data karena kredensial Supabase belum ada. Salin .env.example menjadi .env.local lalu isi URL dan anon key dari dashboard Supabase."
          />
        )}
        <p className="mt-4 text-[12px] text-teks-lembut">
          Data pada aplikasi ini adalah data sintetis untuk demo, bukan data resmi Dapodik,
          SIMPKB, atau InfoGTK.
        </p>
      </div>
    </div>
  );
}
