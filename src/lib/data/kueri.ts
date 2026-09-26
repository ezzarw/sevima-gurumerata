import { buatKlienServer } from "@/lib/supabase/server";
import {
  hitungJamNgajar,
  hitungKebutuhanGuru,
  hitungKekuranganSekolah,
  type InputSimulasi,
} from "@/lib/domain/logika";
import type { Jenjang, KebutuhanMapel, StatusKepegawaian, StatusMutasi } from "@/lib/domain/tipe";

export interface BarisSekolah {
  id: string;
  nama: string;
  npsn: string | null;
  jenjang: Jenjang;
  jumlah_rombel: number;
  alamat: string | null;
  latitude: number;
  longitude: number;
  kabupaten: string;
  provinsi: string;
  kabupaten_id: string;
  provinsi_id: string;
  jumlah_guru: number;
}

export interface BarisKebutuhan {
  id: string;
  sekolah_id: string;
  mapel: string;
  jumlah_butuh: number;
  jumlah_ada: number;
  kurang: number;
  lebih: number;
  sekolah_nama: string;
  jenjang: Jenjang;
  jumlah_rombel: number;
  kabupaten_nama: string;
  provinsi_nama: string;
}

export interface BarisGuru {
  id: string;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  status_kepegawaian: StatusKepegawaian;
  mapel: string;
  sertifikasi: boolean;
  sekolah_id: string;
  domisili: string;
  jam_ngajar: number;
  sekolah_nama: string;
  jenjang: Jenjang;
  kabupaten_id: string;
  kabupaten_nama: string;
  provinsi_id: string;
  provinsi_nama: string;
  /** Dibaca dari kabupaten.daerah_tertinggal, bukan daftar di kode. */
  daerah_tertinggal: boolean;
}

export interface BarisMutasi {
  id: string;
  guru_id: string;
  sekolah_asal_id: string;
  sekolah_tujuan_id: string;
  mapel: string;
  alasan: string;
  catatan_guru: string | null;
  status: StatusMutasi;
  catatan_dinas: string | null;
  created_at: string;
  approved_at: string | null;
  guru_nama: string;
  sekolah_asal: string;
  sekolah_tujuan: string;
}

export interface Wilayah {
  id: string;
  nama: string;
  kode: string;
  latitude: number;
  longitude: number;
  jumlah_sekolah: number;
  jumlah_guru: number;
  total_kurang: number;
  total_lebih: number;
}

const MAKS_BARIS = 1000;

/**
 * View `guru_publik` dan `kebutuhan_sekolah` tidak memuat NIP/NUPTK dan bisa
 * dibaca semua pengguna yang login, sehingga dashboard dan daftar sebaran
 * tidak bergantung pada peran akun.
 */
export async function ambilSekolah(): Promise<BarisSekolah[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("sekolah")
    .select(
      "id, nama, npsn, jenjang, jumlah_rombel, alamat, latitude, longitude, kabupaten_id, kabupaten:kabupaten_id(nama, provinsi_id, provinsi:provinsi_id(nama))",
    )
    .order("nama")
    .limit(MAKS_BARIS);

  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((s) => s.id);
  const jumlahGuru = new Map<string, number>();
  if (ids.length > 0) {
    const { data: guru, error: galatGuru } = await supabase
      .from("guru_publik")
      .select("sekolah_id")
      .in("sekolah_id", ids);
    if (galatGuru) throw new Error(galatGuru.message);
    for (const g of guru ?? []) {
      jumlahGuru.set(g.sekolah_id, (jumlahGuru.get(g.sekolah_id) ?? 0) + 1);
    }
  }

  return (data ?? []).map((s) => {
    const kab = s.kabupaten as unknown as {
      nama: string;
      provinsi_id: string;
      provinsi: { nama: string } | null;
    } | null;
    return {
      id: s.id,
      nama: s.nama,
      npsn: s.npsn,
      jenjang: s.jenjang as Jenjang,
      jumlah_rombel: s.jumlah_rombel,
      alamat: s.alamat,
      latitude: s.latitude,
      longitude: s.longitude,
      kabupaten: kab?.nama ?? "-",
      kabupaten_id: s.kabupaten_id,
      provinsi: kab?.provinsi?.nama ?? "-",
      provinsi_id: kab?.provinsi_id ?? "",
      jumlah_guru: jumlahGuru.get(s.id) ?? 0,
    };
  });
}

export async function ambilKebutuhan(): Promise<BarisKebutuhan[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kebutuhan_sekolah")
    .select("*")
    .order("sekolah_nama")
    .limit(MAKS_BARIS);
  if (error) throw new Error(error.message);
  return (data ?? []) as BarisKebutuhan[];
}

export async function ambilGuru(): Promise<BarisGuru[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("guru_publik")
    .select("*")
    .order("nama")
    .limit(MAKS_BARIS);
  if (error) throw new Error(error.message);
  return (data ?? []) as BarisGuru[];
}

export async function ambilGuruSatu(id: string): Promise<BarisGuru | null> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("guru_publik").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BarisGuru | null) ?? null;
}

/**
 * Koordinat kabupaten dipakai untuk menghitung jarak domisili guru ke sekolah
 * tujuan. Domisili pada data guru berupa nama kabupaten, jadi peta ini yang
 * menghubungkannya ke titik di peta.
 */
export async function ambilKoordinatKabupaten(): Promise<Record<string, { lat: number; lon: number }>> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("kabupaten").select("nama, latitude, longitude");
  if (error) throw new Error(error.message);
  const peta: Record<string, { lat: number; lon: number }> = {};
  for (const k of data ?? []) {
    peta[k.nama] = { lat: k.latitude, lon: k.longitude };
  }
  return peta;
}

export async function ambilWilayah(): Promise<Wilayah[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("provinsi")
    .select("id, nama, kode, latitude, longitude")
    .order("nama");
  if (error) throw new Error(error.message);

  const [sekolah, kebutuhan] = await Promise.all([ambilSekolah(), ambilKebutuhan()]);

  return (data ?? []).map((p) => {
    const daftarSekolah = sekolah.filter((s) => s.provinsi_id === p.id);
    const namaSekolah = new Set(daftarSekolah.map((s) => s.nama));
    const barisKebutuhan = kebutuhan.filter((k) => namaSekolah.has(k.sekolah_nama));
    return {
      id: p.id,
      nama: p.nama,
      kode: p.kode,
      latitude: p.latitude,
      longitude: p.longitude,
      jumlah_sekolah: daftarSekolah.length,
      jumlah_guru: daftarSekolah.reduce((n, s) => n + s.jumlah_guru, 0),
      total_kurang: barisKebutuhan.reduce((n, k) => n + k.kurang, 0),
      total_lebih: barisKebutuhan.reduce((n, k) => n + k.lebih, 0),
    };
  });
}

export async function ambilMutasi(): Promise<BarisMutasi[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("mutasi")
    .select(
      "id, guru_id, sekolah_asal_id, sekolah_tujuan_id, mapel, alasan, catatan_guru, status, catatan_dinas, created_at, approved_at, guru:guru_id(nama), asal:sekolah_asal_id(nama), tujuan:sekolah_tujuan_id(nama)",
    )
    .order("created_at", { ascending: false })
    .limit(MAKS_BARIS);
  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => {
    const guru = m.guru as unknown as { nama: string } | null;
    const asal = m.asal as unknown as { nama: string } | null;
    const tujuan = m.tujuan as unknown as { nama: string } | null;
    return {
      id: m.id,
      guru_id: m.guru_id,
      sekolah_asal_id: m.sekolah_asal_id,
      sekolah_tujuan_id: m.sekolah_tujuan_id,
      mapel: m.mapel,
      alasan: m.alasan,
      catatan_guru: m.catatan_guru,
      status: m.status as StatusMutasi,
      catatan_dinas: m.catatan_dinas,
      created_at: m.created_at,
      approved_at: m.approved_at,
      guru_nama: guru?.nama ?? "-",
      sekolah_asal: asal?.nama ?? "-",
      sekolah_tujuan: tujuan?.nama ?? "-",
    };
  });
}

/** Susun masukan simulasi dari data nyata: guru, sekolah asal, sekolah tujuan. */
export async function siapkanSimulasi(
  guruId: string,
  sekolahTujuanId: string,
): Promise<{ input: InputSimulasi; guru: BarisGuru; tujuan: BarisSekolah } | null> {
  const [guru, sekolah, kebutuhan, koordinatKabupaten] = await Promise.all([
    ambilGuruSatu(guruId),
    ambilSekolah(),
    ambilKebutuhan(),
    ambilKoordinatKabupaten(),
  ]);
  if (!guru) return null;

  const asal = sekolah.find((s) => s.id === guru.sekolah_id);
  const tujuan = sekolah.find((s) => s.id === sekolahTujuanId);
  if (!asal || !tujuan) return null;

  const kebutuhanAsal = kebutuhan.filter((k) => k.sekolah_id === asal.id);
  const kebutuhanTujuan = kebutuhan.filter((k) => k.sekolah_id === tujuan.id);

  const mapelDiSekolah = (daftar: BarisKebutuhan[], mapel: string): KebutuhanMapel => {
    const baris = daftar.find((k) => k.mapel === mapel);
    if (baris) {
      return { mapel, jumlahButuh: baris.jumlah_butuh, jumlahAda: baris.jumlah_ada };
    }
    // Mapel yang belum terdata: kebutuhan diturunkan dari rombel, ketersediaan 0.
    return {
      mapel,
      jumlahButuh: hitungKebutuhanGuru(tujuan.jumlah_rombel, tujuan.jenjang, mapel),
      jumlahAda: 0,
    };
  };

  const jumlahGuruMapelAsal = kebutuhanAsal.find((k) => k.mapel === guru.mapel)?.jumlah_ada ?? 0;
  const jumlahGuruMapelTujuan = kebutuhanTujuan.find((k) => k.mapel === guru.mapel)?.jumlah_ada ?? 0;

  const input: InputSimulasi = {
    guru: {
      id: guru.id,
      nama: guru.nama,
      mapel: guru.mapel,
      sertifikasi: guru.sertifikasi,
      statusKepegawaian: guru.status_kepegawaian,
      jamNgajar: guru.jam_ngajar,
      sekolahId: guru.sekolah_id,
      domisili: guru.domisili,
      domisiliKoordinat: koordinatKabupaten[guru.domisili],
    },
    sekolahAsal: {
      id: asal.id,
      nama: asal.nama,
      jenjang: asal.jenjang,
      rombel: asal.jumlah_rombel,
      kabupaten: asal.kabupaten,
      provinsi: asal.provinsi,
      koordinat: { lat: asal.latitude, lon: asal.longitude },
      jumlahGuruMapel: jumlahGuruMapelAsal,
      kebutuhanMapel: mapelDiSekolah(kebutuhanAsal, guru.mapel),
    },
    sekolahTujuan: {
      id: tujuan.id,
      nama: tujuan.nama,
      jenjang: tujuan.jenjang,
      rombel: tujuan.jumlah_rombel,
      kabupaten: tujuan.kabupaten,
      provinsi: tujuan.provinsi,
      koordinat: { lat: tujuan.latitude, lon: tujuan.longitude },
      daerahTertinggal: Boolean(guru.daerah_tertinggal),
      jumlahGuruMapel: jumlahGuruMapelTujuan,
      kebutuhanMapel: mapelDiSekolah(kebutuhanTujuan, guru.mapel),
    },
  };

  return { input, guru, tujuan };
}

/** Ringkasan jam mengajar per guru, dipakai untuk daftar dan penyaring. */
export function jamNgajarPerGuru(jumlahRombel: number, jenjang: Jenjang, mapel: string, jumlahGuru: number) {
  return hitungJamNgajar(jumlahRombel, jenjang, mapel, jumlahGuru);
}

export function ringkasKebutuhan(kebutuhan: KebutuhanMapel[]) {
  return hitungKekuranganSekolah(kebutuhan);
}
