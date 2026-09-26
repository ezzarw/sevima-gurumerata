import { JudulHalaman } from "@/components/shell";
import { Asisten } from "@/components/asisten";
import { KeadaanGagal } from "@/components/keadaan";

export const metadata = { title: "Asisten · GuruMerata" };

export default function HalamanAsisten() {
  const siap = Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY);

  return (
    <>
      <JudulHalaman
        judul="Asisten analitis"
        keterangan="Tanya langsung soal sebaran guru dan dampak mutasi. Asisten memanggil data yang diperlukan, bukan menebak angkanya."
      />
      {siap ? (
        <Asisten />
      ) : (
        <KeadaanGagal
          judul="Kunci API asisten belum diisi"
          keterangan="Asisten butuh AI_BASE_URL, AI_API_KEY, dan AI_MODEL di berkas lingkungan. Endpoint harus mendukung /chat/completions gaya OpenAI beserta function calling."
        />
      )}
    </>
  );
}
