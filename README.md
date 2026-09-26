# GuruMerata

Guru tepat, di tempat yang tepat.

Aplikasi untuk dinas pendidikan: melihat sebaran guru per daerah, menghitung
dampak mutasi **sebelum** diputuskan, dan mencatat prosesnya secara transparan.

Masalah yang diselesaikan: Indonesia punya 3,7 juta guru, tetapi distribusinya
timpang. Satu daerah kekurangan guru, daerah lain kelebihan guru di mapel yang
sama. Penyebabnya data tersebar di Dapodik, SIMPKB, dan InfoGTK yang tidak
saling terhubung. Akibat paling mahal: guru bersertifikasi yang wajib mengajar
minimal **24 jam tatap muka per minggu** bisa kehilangan TPG sekitar Rp2 juta
per bulan bila dipindahkan ke sekolah yang jam mengajarnya sudah terisi.

## Fitur

| Halaman | Isi |
|---|---|
| `/dashboard` | Peta sebaran guru per provinsi (merah kekurangan, kuning cukup, hijau kelebihan), kartu statistik, daftar sekolah paling membutuhkan guru |
| `/guru` | Daftar guru dengan pencarian dan penyaring mapel, status kepegawaian, provinsi, serta penanda TPG per baris |
| `/sekolah` | Daftar sekolah dengan status kecukupan dan rincian kebutuhan per mapel |
| `/simulator` | Hitung jam mengajar baru, status TPG, jarak dari domisili, dampak ke sekolah asal, dan skor dampak psikologis |
| `/mutasi` | Pengajuan, review dinas, keputusan, dan riwayat. Menyetujui pengajuan benar-benar memindahkan guru dan menghitung ulang kebutuhan guru |
| `/asisten` | Asisten analitis dengan function calling untuk empat pertanyaan yang paling sering muncul |

## Aturan bisnis inti

Seluruh aturan ada di satu tempat, `src/lib/domain/logika.ts`, dan dipakai
bersama oleh antarmuka, aksi server, generator data contoh, serta unit test.
Tidak ada perhitungan yang ditulis dua kali.

```
beban mapel x       = jumlah rombel x jam tatap muka mapel per minggu
jumlah_butuh        = max(1, floor(x / 24))       # 24 jam syarat TPG
jam_ngajar per guru = min(40, ceil(x / jumlah_ada))
kurang              = max(butuh - ada, 0)         # sekolah kekurangan guru
lebih               = max(ada - butuh, 0)         # guru kelebihan, TPG rawan
```

## Tumpukan teknologi

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, RLS) · Leaflet + OpenStreetMap · Vitest · Docker · GitHub Actions.

## Menjalankan

```bash
cp .env.example .env.local     # isi kredensial Supabase dan kunci API asisten
npm install
npm run dev
```

Skema dan data contoh:

```bash
# jalankan supabase/migrations/20260926000001_skema_awal.sql
# lalu supabase/seed.sql melalui SQL editor Supabase
npm run seed:generate          # menulis ulang supabase/seed.sql (opsional)
```

Data pada `supabase/seed.sql` adalah **data sintetis untuk demo**, bukan data
resmi Dapodik, SIMPKB, atau InfoGTK. Nama sekolah, kabupaten, dan provinsi
memakai nama nyata supaya polanya mudah dikenali; nama guru dibangkitkan.

## Pengujian

```bash
npm test              # menjalankan seluruh unit test
npm run test:coverage # dengan laporan cakupan
```

Cakupan terakhir, dijalankan dengan `npm run test:coverage`:

| Berkas | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `src/lib/domain/logika.ts` | 99,14% | 95,00% | 100% | 100% |
| `src/lib/asisten/tools.ts` | 94,21% | 87,00% | 97,22% | 98,01% |
| `src/lib/asisten/balasan.ts` | 97,22% | 94,11% | 100% | 100% |
| `src/lib/data/format.ts` | 100% | 100% | 100% | 100% |
| `src/lib/data/ambil.ts` | 100% | 100% | 100% | 100% |
| `src/lib/utils.ts` | 100% | 100% | 100% | 100% |
| **Total** | **96,90%** | **91,36%** | **98,36%** | **99,20%** |

Ambang minimum di `vitest.config.ts` adalah 80% untuk keempat ukuran, dan
`npm run test:coverage` akan gagal bila ada yang turun di bawahnya.

Yang diuji adalah logika bisnis, bukan tampilan: `hitungKekuranganGuru()`,
`cekTPG()` (termasuk kasus tepat 24 jam), `simulasiMutasi()`, `hitungJarakKm()`,
`hitungDampakPsikologis()`, pemformatan angka dan istilah domain, keempat tool
asisten beserta penanganan nama yang ambigu, dan pembacaan balasan model dalam
bentuk JSON maupun text/event-stream.

## Struktur

```
src/
  app/
    (kerja)/            halaman setelah login: dashboard, guru, sekolah,
                        simulator, mutasi, asisten
    masuk/              halaman masuk dan pendaftaran
    api/asisten/        route function calling asisten
  components/           komponen antarmuka
  lib/
    domain/             aturan bisnis dan tipenya (diuji unit)
    data/               akses data Supabase dan pemformatan
    supabase/           klien browser dan server
  proxy.ts              penyegaran sesi dan penjaga halaman kerja
supabase/
  migrations/           skema, RLS, dan view
  seed.sql              data contoh sintetis
scripts/
  generate_seed.py      generator data contoh
Dockerfile              citra produksi
.github/workflows/ci.yml
```
