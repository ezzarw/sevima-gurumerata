# Naskah Video Demo — GuruMerata (5 menit)

Rekam dengan aplikasi **sudah login** dan tab sudah disiapkan. Jangan mengetik
saat merekam kalau bisa dihindari; kalau harus, ketik pelan.

**Siapkan sebelum merekam:**
- Tab 1: `https://sevima-gurumerata.vercel.app/dashboard` (sudah login admin@demo.test)
- Tab 2: `/simulator` dengan `?guru=<id Sulastri>&tujuan=<id SMAN 1 Waingapu>`
- Tab 3: `/asisten`
- Tab 4: `/mutasi` — buka **dua jendela** untuk adegan realtime
- Zoom peramban 110%, ukuran jendela 1440×900

---

## Beat 1 · 00:00–00:30 · Perkenalan

> "Nama saya Aliezzar Wicaksono. Saya membuat **GuruMerata**, sebuah aplikasi untuk dinas
> pendidikan yang menghitung dampak pemindahan guru **sebelum** keputusan diambil.
> Tagline-nya: guru tepat, di tempat yang tepat."

**Di layar:** halaman `/masuk`, lalu masuk sebagai admin. Tunjukkan nama dan peran di sidebar.

---

## Beat 2 · 00:30–01:00 · Masalahnya

> "Indonesia punya 3,7 juta guru, tapi distribusinya timpang: kurang 374 ribu guru di sekolah
> negeri, sementara 229 ribu guru kelebihan di mapel tertentu. Masalahnya bukan jumlah, tapi
> data yang tersebar di Dapodik, SIMPKB, dan InfoGTK yang tidak nyambung.
>
> Yang paling dirugikan guru bersertifikasi. Mereka wajib mengajar minimal 24 jam tatap muka
> per minggu. Kalau dipindah ke sekolah yang jamnya sudah terisi, InfoGTK otomatis menghentikan
> TPG sekitar dua juta rupiah per bulan. Karena itu guru takut dipindah."

**Di layar:** `/dashboard`, sorot kartu "Formasi guru belum terisi" dan "Guru kelebihan formasi".

---

## Beat 3 · 01:00–03:30 · Demo langsung (inti)

### 3a · 01:00–01:35 · Peta sebaran
> "Ini peta sebaran guru. Merah kekurangan, hijau kelebihan. NTT kekurangan lima formasi,
> DKI Jakarta justru kelebihan sepuluh. Angka ini dihitung dari tabel kebutuhan guru,
> bukan nilai contoh."

**Di layar:** klik provinsi NTT di peta, tunjukkan panel detail muncul.

### 3b · 01:35–02:15 · Simulator, skenario aman
> "Ini fitur andalan. Saya pilih guru Sulastri dari SMAN 8 Jakarta, sekolah tujuan SMAN 1 Waingapu.
> Jam mengajarnya naik dari 20 ke 30 jam, jadi TPG-nya aman. Tapi sistem tetap memberi peringatan:
> jaraknya 1.529 kilometer dari domisili, skor dampak psikologisnya 60 dari 100."

**Di layar:** tab `/simulator`, tunjukkan kotak rekomendasi hijau, rincian perhitungan, skor psikologis.

### 3c · 02:15–02:50 · Simulator, skenario berisiko
> "Sekarang saya coba yang berisiko. Citra Ayu, guru Matematika bersertifikasi, dipindah ke
> SMP Negeri 2 Jakarta. Jam mengajarnya cuma 18 jam, kurang 6 jam dari ambang 24.
> Sistem langsung memberi peringatan merah: TPG berisiko hangus, dan alasannya dijelaskan.
> Rekomendasinya: jangan eksekusi sebelum jam mengajar ditambah."

**Di layar:** ganti sekolah tujuan, tunjukkan kotak rekomendasi merah.

### 3d · 02:50–03:10 · Asisten AI
> "Dinas juga bisa bertanya langsung. Saya tanya: sekolah mana yang paling butuh guru matematika
> di NTT? Asisten tidak menebak. Dia memanggil fungsi pencarian data lebih dulu, lalu menjawab
> berdasarkan hasilnya. Tool yang dipanggil ditampilkan sebagai bukti."

**Di layar:** tab `/asisten`, klik contoh pertanyaan, tunggu jawaban, sorot baris "Data yang dipanggil".

### 3e · 03:10–03:30 · Realtime + mutasi
> "Setujui sebuah pengajuan di jendela ini. Perhatikan jendela sebelahnya: daftar pengajuan
> berubah sendiri tanpa dimuat ulang. Mutasi yang disetujui benar-benar memindahkan guru
> di basis data dan menghitung ulang kebutuhan guru di kedua sekolah."

**Di layar:** dua jendela `/mutasi` berdampingan. Setujui di satu, tunjukkan yang lain berubah.

---

## Beat 4 · 03:30–04:15 · Satu keputusan teknis

> "Keputusan teknis yang saya buat sendiri: aturan 24 jam TPG itu hanya ditulis **sekali**,
> di satu berkas `logika.ts`. Dipakai bersama oleh antarmuka, aksi server saat menyetujui mutasi,
> generator data contoh, keempat tool asisten, dan unit test.
>
> Alasannya: kalau aturan ini ditulis dua kali, angka di peta bisa berbeda dari angka di simulator,
> dan jawaban asisten bisa berbeda dari keduanya. Dengan satu sumber kebenaran, ketiganya mustahil
> berbeda. Cakupan uji saya 96,90 persen, ambangnya 80 persen."

**Di layar:** buka berkas `src/lib/domain/logika.ts`, sorot fungsi `cekTPG`, lalu buka laporan cakupan.

---

## Beat 5 · 04:15–04:45 · Tools, AI, dan challenge

> "Saya memakai Next.js 16, Supabase untuk basis data, autentikasi, RLS, dan realtime,
> lalu Docker, GitHub Actions, dan Vercel untuk pengiriman. Asisten memakai endpoint
> gaya OpenAI dengan function calling, jadi penyedianya bisa ditukar tanpa mengubah kode.
>
> Challenge yang saya kerjakan: AI agent fungsional, deploy dengan CI/CD dan Docker,
> fitur realtime, unit test dengan cakupan di atas 80 persen, plus basis data, autentikasi,
> responsif, dan aksesibilitas."

**Di layar:** tab GitHub Actions yang hijau, lalu halaman Dockerfile.

---

## Beat 6 · 04:45–05:00 · Penutup

> "Satu hal berikutnya kalau ada waktu: mencatat riwayat perubahan per kolom untuk tabel guru,
> supaya dinas bisa menelusuri siapa mengubah jam mengajar siapa. Itu penting saat ada sengketa TPG.
>
> GuruMerata: guru tepat, di tempat yang tepat. Terima kasih."

**Di layar:** kembali ke `/dashboard`.

---

## Checklist sebelum rekam

- [ ] Sudah login, tab siap dalam urutan beat
- [ ] Dua jendela `/mutasi` terbuka dan **terhubung** (lihat tulisan "Terhubung ke pembaruan langsung")
- [ ] Ada satu pengajuan berstatus "menunggu review" untuk disetujui di adegan realtime
- [ ] Rekaman cadangan: ulangi alur inti sekali tanpa komentar, simpan sebagai berkas terpisah
- [ ] Latihan sekali sambil menghitung waktu; kalau lebih dari 5 menit, potong beat 2 dan 5
- [ ] Jangan pernah debug di depan kamera lebih dari 10 detik

## Kalau ada yang gagal saat merekam

Sebutkan apa yang gagal, tampilkan rekaman cadangan, lanjut. Jangan mengulang dari awal
kecuali kesalahannya di beat 3.
