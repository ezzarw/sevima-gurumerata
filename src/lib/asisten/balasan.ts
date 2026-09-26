export interface PanggilanTool {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface BalasanModel {
  content: string;
  tool_calls: PanggilanTool[];
}

interface PotonganStream {
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
}

/**
 * Membaca balasan endpoint chat completions gaya OpenAI.
 *
 * Sebagian endpoint membalas dengan text/event-stream walaupun stream tidak
 * diminta, dan argumen tool_calls pada mode itu datang bertahap per potongan.
 * Keduanya harus ditangani, kalau tidak fungsi pemanggilan tool akan gagal
 * dengan galat JSON yang membingungkan.
 */
export function bacaBalasan(mentah: string, tipeKonten: string): BalasanModel {
  const berupaStream = tipeKonten.includes("event-stream") || mentah.trimStart().startsWith("data:");
  if (!berupaStream) {
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

    let potongan: PotonganStream;
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
