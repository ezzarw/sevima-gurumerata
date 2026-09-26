import { DEFINISI_TOOLS, jalankanTool, muatDataAsisten } from "@/lib/asisten/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.AI_BASE_URL;
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";
const MAKS_PUTARAN = 5;

interface Pesan {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: PanggilanTool[];
  tool_call_id?: string;
}

interface PanggilanTool {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

const PROMPT_SISTEM = `Kamu adalah asisten analitis GuruMerata untuk dinas pendidikan Indonesia.
Tugasmu menjawab pertanyaan sebaran guru dan dampak mutasi.

Aturan:
1. Selalu panggil tool yang tersedia sebelum menjawab pertanyaan tentang data. Jangan pernah mengarang angka, nama sekolah, atau nama guru.
2. Angka yang kamu sebutkan harus berasal dari hasil tool.
3. Istilah yang dipakai: TPG adalah Tunjangan Profesi Guru. Guru bersertifikasi wajib mengajar minimal 24 jam tatap muka per minggu, kalau kurang maka TPG sekitar Rp2 juta per bulan berhenti.
4. Jawab ringkas dalam bahasa Indonesia, maksimal 150 kata. Pakai kalimat biasa, bukan tabel markdown.
5. Sebutkan nama sekolah atau nama guru yang relevan beserta angkanya.
6. Bila tool mengembalikan hasil kosong, katakan terus terang bahwa tidak ada data yang cocok, jangan menawarkan dugaan.`;

interface BalasanModel {
  content: string;
  tool_calls: PanggilanTool[];
}

/**
 * Sebagian endpoint gaya OpenAI membalas dengan text/event-stream walaupun
 * stream tidak diminta. Pembaca ini menangani dua bentuk balasan: JSON biasa
 * dan SSE, termasuk potongan argumen tool_calls yang datang bertahap.
 */
async function bacaBalasan(respons: Response): Promise<BalasanModel> {
  const tipe = respons.headers.get("content-type") ?? "";
  const mentah = await respons.text();

  if (!tipe.includes("event-stream") && !mentah.trimStart().startsWith("data:")) {
    const data = JSON.parse(mentah);
    const pesan = data.choices?.[0]?.message;
    if (!pesan) throw new Error("Endpoint asisten tidak mengembalikan pilihan jawaban.");
    return { content: pesan.content ?? "", tool_calls: pesan.tool_calls ?? [] };
  }

  let content = "";
  const panggilan = new Map<number, { id: string; name: string; arguments: string }>();

  for (const baris of mentah.split("\n")) {
    if (!baris.startsWith("data:")) continue;
    const isi = baris.slice(5).trim();
    if (isi === "" || isi === "[DONE]") continue;

    let potongan: {
      choices?: {
        delta?: {
          content?: string | null;
          tool_calls?: {
            index?: number;
            id?: string;
            function?: { name?: string; arguments?: string };
          }[];
        };
      }[];
    };
    try {
      potongan = JSON.parse(isi);
    } catch {
      continue;
    }

    const delta = potongan.choices?.[0]?.delta;
    if (!delta) continue;
    if (delta.content) content += delta.content;

    for (const tc of delta.tool_calls ?? []) {
      const indeks = tc.index ?? 0;
      const sekarang = panggilan.get(indeks) ?? { id: "", name: "", arguments: "" };
      if (tc.id) sekarang.id = tc.id;
      if (tc.function?.name) sekarang.name += tc.function.name;
      if (tc.function?.arguments) sekarang.arguments += tc.function.arguments;
      panggilan.set(indeks, sekarang);
    }
  }

  return {
    content,
    tool_calls: [...panggilan.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([indeks, nilai]) => ({
        id: nilai.id || `panggilan-${indeks}`,
        type: "function" as const,
        function: { name: nilai.name, arguments: nilai.arguments },
      })),
  };
}

async function panggilModel(pesan: Pesan[]): Promise<BalasanModel> {
  const respons = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: pesan,
      tools: DEFINISI_TOOLS,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 900,
      stream: false,
    }),
  });

  if (!respons.ok) {
    const teks = await respons.text();
    throw new Error(`Endpoint asisten menolak permintaan (${respons.status}): ${teks.slice(0, 300)}`);
  }
  return bacaBalasan(respons);
}

export async function POST(permintaan: Request) {
  if (!BASE_URL || !API_KEY) {
    return Response.json(
      {
        galat:
          "Kunci API asisten belum diisi. Isi AI_BASE_URL, AI_API_KEY, dan AI_MODEL di berkas lingkungan lebih dulu.",
      },
      { status: 503 },
    );
  }

  let badan: { pertanyaan?: string; riwayat?: { peran: string; teks: string }[] };
  try {
    badan = await permintaan.json();
  } catch {
    return Response.json({ galat: "Isi permintaan bukan JSON yang sah." }, { status: 400 });
  }

  const pertanyaan = (badan.pertanyaan ?? "").trim();
  if (!pertanyaan) {
    return Response.json({ galat: "Pertanyaan masih kosong." }, { status: 400 });
  }

  const data = await muatDataAsisten();

  const pesan: Pesan[] = [{ role: "system", content: PROMPT_SISTEM }];
  for (const giliran of badan.riwayat ?? []) {
    if (giliran.peran === "user" || giliran.peran === "asisten") {
      pesan.push({ role: giliran.peran === "asisten" ? "assistant" : "user", content: giliran.teks });
    }
  }
  pesan.push({ role: "user", content: pertanyaan });

  const dipakai: { tool: string; argumen: unknown }[] = [];

  try {
    for (let putaran = 0; putaran < MAKS_PUTARAN; putaran += 1) {
      const balasan = await panggilModel(pesan);
      const panggilan = balasan.tool_calls;
      if (panggilan.length === 0) {
        return Response.json({
          jawaban: balasan.content.trim() || "Asisten tidak menghasilkan jawaban.",
          tool_dipakai: dipakai,
        });
      }

      pesan.push({ role: "assistant", content: balasan.content || null, tool_calls: panggilan });

      for (const satu of panggilan) {
        let argumen: Record<string, unknown> = {};
        try {
          argumen = satu.function.arguments ? JSON.parse(satu.function.arguments) : {};
        } catch {
          argumen = {};
        }
        const hasil = await jalankanTool(satu.function.name, argumen, data);
        dipakai.push({ tool: satu.function.name, argumen });
        pesan.push({
          role: "tool",
          tool_call_id: satu.id,
          content: JSON.stringify(hasil),
        });
      }
    }

    return Response.json({
      jawaban:
        "Pertanyaan ini butuh lebih dari lima langkah pemeriksaan data. Coba persempit dulu, misalnya sebutkan provinsi atau mata pelajarannya.",
      tool_dipakai: dipakai,
    });
  } catch (galat) {
    return Response.json(
      {
        galat: galat instanceof Error ? galat.message : "Asisten gagal menjawab.",
      },
      { status: 502 },
    );
  }
}
