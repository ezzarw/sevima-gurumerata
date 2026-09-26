import { describe, expect, it } from "vitest";
import { bacaBalasan } from "@/lib/asisten/balasan";

describe("bacaBalasan bentuk JSON", () => {
  it("membaca jawaban teks biasa", () => {
    const mentah = JSON.stringify({
      choices: [{ message: { role: "assistant", content: "SMAN 1 Kupang paling butuh." } }],
    });
    const hasil = bacaBalasan(mentah, "application/json");
    expect(hasil.content).toBe("SMAN 1 Kupang paling butuh.");
    expect(hasil.tool_calls).toEqual([]);
  });

  it("membaca tool_calls yang sudah utuh", () => {
    const mentah = JSON.stringify({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: { name: "cari_sekolah_kekurangan", arguments: '{"provinsi":"NTT"}' },
              },
            ],
          },
        },
      ],
    });
    const hasil = bacaBalasan(mentah, "application/json");
    expect(hasil.content).toBe("");
    expect(hasil.tool_calls).toHaveLength(1);
    expect(hasil.tool_calls[0].function.name).toBe("cari_sekolah_kekurangan");
    expect(JSON.parse(hasil.tool_calls[0].function.arguments)).toEqual({ provinsi: "NTT" });
  });

  it("melempar galat bila tidak ada pilihan jawaban", () => {
    expect(() => bacaBalasan(JSON.stringify({ choices: [] }), "application/json")).toThrow(
      "tidak mengembalikan pilihan jawaban",
    );
  });
});

describe("bacaBalasan bentuk text/event-stream", () => {
  it("menggabungkan potongan jawaban teks", () => {
    const mentah = [
      'data: {"choices":[{"delta":{"content":"SMAN 1 "}}]}',
      'data: {"choices":[{"delta":{"content":"Kupang"}}]}',
      "data: [DONE]",
      "",
    ].join("\n");
    const hasil = bacaBalasan(mentah, "text/event-stream");
    expect(hasil.content).toBe("SMAN 1 Kupang");
    expect(hasil.tool_calls).toEqual([]);
  });

  it("menggabungkan argumen tool yang datang bertahap", () => {
    const mentah = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_abc","function":{"name":"cari_sekolah_kekurangan","arguments":""}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"prov"}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"insi\\":\\"NTT\\"}"}}]}}]}',
      "data: [DONE]",
    ].join("\n");
    const hasil = bacaBalasan(mentah, "text/event-stream");
    expect(hasil.tool_calls).toHaveLength(1);
    expect(hasil.tool_calls[0].id).toBe("call_abc");
    expect(hasil.tool_calls[0].function.name).toBe("cari_sekolah_kekurangan");
    expect(JSON.parse(hasil.tool_calls[0].function.arguments)).toEqual({ provinsi: "NTT" });
  });

  it("memisahkan dua panggilan tool yang berbeda", () => {
    const mentah = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"a","function":{"name":"cek_tpg","arguments":"{}"}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":1,"id":"b","function":{"name":"cek_tpg","arguments":"{}"}}]}}]}',
      "data: [DONE]",
    ].join("\n");
    const hasil = bacaBalasan(mentah, "text/event-stream");
    expect(hasil.tool_calls.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("mengenali stream walau tipe kontennya salah", () => {
    const mentah = 'data: {"choices":[{"delta":{"content":"halo"}}]}\n';
    const hasil = bacaBalasan(mentah, "application/json");
    expect(hasil.content).toBe("halo");
  });

  it("melewati baris yang bukan data dan JSON yang rusak", () => {
    const mentah = [
      ": komentar",
      "event: message",
      "data: ini bukan json",
      'data: {"choices":[{"delta":{"content":"tetap masuk"}}]}',
      "",
    ].join("\n");
    const hasil = bacaBalasan(mentah, "text/event-stream");
    expect(hasil.content).toBe("tetap masuk");
  });

  it("memberi id cadangan bila endpoint tidak mengirim id panggilan", () => {
    const mentah = 'data: {"choices":[{"delta":{"tool_calls":[{"index":2,"function":{"name":"cek_tpg","arguments":"{}"}}]}}]}\n';
    const hasil = bacaBalasan(mentah, "text/event-stream");
    expect(hasil.tool_calls[0].id).toBe("panggilan-2");
  });
});
