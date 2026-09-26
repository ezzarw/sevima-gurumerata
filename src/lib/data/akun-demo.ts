/**
 * Daftar akun demo yang ditampilkan sebagai tombol pada halaman masuk.
 *
 * Dipisahkan dari aksi server karena berkas "use server" hanya boleh
 * mengekspor fungsi async. Komponen klien dan aksi server sama-sama
 * mengimpor dari sini supaya daftarnya tidak pernah berbeda.
 */
export const AKUN_DEMO = [
  {
    peran: "admin_dinas",
    label: "Admin Dinas Pendidikan",
    keterangan: "Melihat seluruh provinsi, sekolah, dan guru, serta menyetujui mutasi.",
    email: "admin@demo.test",
  },
  {
    peran: "operator_sekolah",
    label: "Operator Sekolah",
    keterangan: "Hanya melihat data sekolahnya sendiri, yaitu SMP Negeri 2 Jeneponto.",
    email: "operator@demo.test",
  },
  {
    peran: "guru",
    label: "Guru",
    keterangan: "Hanya melihat datanya sendiri dan mengajukan mutasi.",
    email: "guru@demo.test",
  },
] as const;

export const SANDI_DEMO = "gurumerata2026";
