# Narasi Teknis — GuruMerata

Hackathon SEMESTA 8 · Tema: Empowering Youth for a Sustainable Future: Build with AI
Produk: GuruMerata — "Guru tepat, di tempat yang tepat."

## 1. Problem & Scope

Indonesia punya 3,7 juta guru, tetapi distribusinya timpang: kurang 374.000 guru di
sekolah negeri, sementara 229.382 guru kelebihan di mapel tertentu. Masalahnya bukan
jumlah, melainkan distribusi dan data yang tersebar di Dapodik, SIMPKB, dan InfoGTK
yang tak terhubung.

Penggunanya dinas pendidikan kabupaten/provinsi. Tiga fitur intinya: peta sebaran guru
per daerah, simulator mutasi yang menghitung jam tatap muka dan status TPG **sebelum**
guru dipindahkan, dan pencatatan mutasi. Aturan inti seluruh perhitungan:
guru bersertifikasi wajib mengajar minimal 24 jam tatap muka per minggu; kalau kurang,
TPG sekitar Rp2 juta per bulan berhenti lewat InfoGTK.

## 2. Hambatan Teknis

Setelah aplikasi berjalan, saya curiga pada backend-nya sendiri lalu mengujinya dengan
permintaan sungguhan ke API, bukan membaca kode. Empat celah RLS terbuka.

Pertama, **guru bisa menaikkan perannya sendiri jadi admin**. Policy `users_ubah`
hanya memeriksa `id = auth.uid()` tanpa membatasi kolom, jadi satu PATCH ke
`/rest/v1/users` cukup untuk mengubah peran sendiri. Terbukti: peran berubah dari
`guru` menjadi `admin_dinas` dengan status 200; setelah itu RLS membuka seluruh data
dan hak menyetujui mutasi.

Kedua, pendaftar bebas memilih peran karena trigger membaca peran dari
`raw_user_meta_data` yang datang dari klien. Ketiga, catatan aktivitas bisa dipalsukan
siapa saja karena policy insert-nya `with check (true)`. Keempat, view `guru_publik`
terbuka untuk `anon`, sehingga nama 171 guru dan jam mengajarnya terbaca tanpa login.

Penjagaan perubahan peran saya taruh di **trigger**, bukan policy, karena policy UPDATE
di Postgres tidak bisa membandingkan nilai lama dan baru sebuah kolom. Trigger tetap
mengizinkan perubahan saat `auth.uid()` kosong supaya admin baru bisa dibuat lewat SQL
Editor. Peran pendaftaran dikunci ke `guru`, policy log dibatasi ke `user_id` sendiri,
dan hak `anon` dicabut. Diuji ulang: naik peran ditolak 403, ketiga akun demo tetap
normal dengan RLS per peran.

## 3. Perubahan Arah

Semula data contoh saya karang dengan angka kekurangan yang ditulis manual, sehingga
tidak konsisten dengan data gurunya sendiri. Saya buang pendekatan itu: roster guru
dibangkitkan dari jumlah rombel, sehingga kekurangan dan kelebihan muncul dari datanya.
Satu tabel jam per rombel dipakai bersama generator Python dan logika TypeScript
supaya angkanya tidak mungkin berbeda.

Saya juga membuang satu pola di seluruh halaman karena CI menangkap masalah nyata:
`try { return <JSX/> } catch` di Server Component tidak menangkap error render.

## 4. Keputusan Stack & Tools

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, RLS,
Realtime) · Leaflet · Vitest · Docker · GitHub Actions · Vercel. Asisten memakai
endpoint gaya OpenAI dengan function calling, bukan Gemini, karena formatnya bisa
ditukar penyedianya tanpa mengubah kode.

Satu keputusan teknis yang saya buat sendiri: **aturan 24 jam TPG hanya ditulis sekali**,
di `src/lib/domain/logika.ts`, lalu dipakai bersama antarmuka, aksi server, generator
data contoh, keempat tool asisten, dan unit test. Satu sumber kebenaran membuat angka
di peta, simulator, jawaban asisten, dan hasil uji tidak mungkin berbeda. Cakupan uji
96,90% statements dengan ambang 80%.

## 5. Satu Hal Berikutnya

Menambahkan riwayat perubahan per kolom untuk `sekolah` dan `guru`, karena satu
keputusan mutasi mengubah jam mengajar banyak guru sekaligus. Sekarang yang tercatat
hanya keputusan mutasinya. Ini diprioritaskan agar dinas bisa menelusuri siapa mengubah
apa bila ada sengketa TPG.
