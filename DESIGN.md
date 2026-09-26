# Arah Desain GuruMerata

Dokumen ini arah desain, bukan catatan tempelan. Setiap keputusan visual di
aplikasi merujuk ke sini, dan setiap keputusan punya alasan satu baris.

## Siapa penggunanya

Kepala dinas pendidikan kabupaten/provinsi, operator sekolah, dan guru.
Bukan pengguna teknologi. Banyak yang membuka aplikasi di HP sambil berdiri di
ruang dinas. Waktu mereka sedikit, dan keputusan di layar ini menentukan
penghasilan orang lain (TPG Rp2 juta per bulan bisa berhenti).

Konsekuensinya: keterbacaan dan kepastian menang atas kesan modern.

## Design Read

Reading this as: aplikasi kerja pemerintah untuk pengambil keputusan dinas
pendidikan, bahasa visual dokumen administratif yang rapi, dial
ENERGY 1 / RHYTHM 2 / MOTION 1.

- **ENERGY 1 (tenang).** Tidak ada sapaan berlebihan. Judul halaman langsung
  menyebut pekerjaannya, bukan slogan.
- **RHYTHM 2 (konsisten dengan beberapa jeda).** Halaman kerja memakai pola sama
  supaya cepat dipelajari; yang berbeda adalah komposisinya: peta + angka,
  tabel panjang, formulir bertahap. Bukan semua halaman berbentuk kartu.
- **MOTION 1 (hover dan transisi saja).** Tidak ada animasi masuk, tidak ada
  gerakan berulang. Angka yang berubah cukup berubah.

## Palet

Satu warna inti, satu aksen, sisanya netral.

| Peran | Nilai | Alasan |
|---|---|---|
| Inti | navy `#17375E` | warna dokumen dan seragam dinas: kesan tercatat dan resmi, bukan startup |
| Aksen | jingga tua `#8A5300` | hanya untuk hal yang butuh tindakan, jadi jarang dan terlihat; digelapkan dari `#C77700` karena nilai terang hanya mencapai kontras 3,46:1 di atas putih, di bawah syarat WCAG AA 4,5:1 |
| Netral | `#F5F6F8` latar, `#E4E6EB` garis, `#5B6472` teks sekunder, `#1C2430` teks utama | dasar dokumen, tidak menarik perhatian |

Warna status tidak dihitung sebagai palet gaya karena membawa makna:

| Status | Nilai | Arti di produk ini |
|---|---|---|
| kekurangan | `#B3261E` | sekolah belum punya cukup guru |
| cukup | `#9A6700` | pas, tidak ada yang perlu digeser |
| kelebihan | `#1F6F4A` | ada guru yang jam mengajarnya di bawah 24 jam |

Merah dan hijau aman dipakai bersamaan karena selalu didampingi label teks
("Kekurangan 3 guru"), jadi tidak bergantung pada warna saja.

## Tipografi

**Plus Jakarta Sans** untuk seluruh teks. Dipilih karena dirancang untuk teks
digital berbahasa Indonesia, angka dan huruf kecilnya tegas di layar HP, dan
tidak membawa kesan "produk teknologi".

Skala: 12 / 13 / 14 / 16 / 20 / 28 / 36 px. Angka besar di kartu statistik 36 px,
judul halaman 28 px, isi tabel 14 px.

## Bentuk

- Sudut 6 px untuk kartu, tombol, dan input; 4 px untuk label status. Tidak ada
  elemen yang serba pil.
- Garis 1 px `#E4E6EB` sebagai pemisah utama. Kartu tidak memakai bayangan.
- Bayangan hanya di panel peta, satu elemen, sebagai penanda permukaan di atas latar.
- Ikon Lucide dipilih per makna (peta, peringatan, tanda centang), bukan hiasan.
  Tidak ada ikon di judul halaman.

## Tema

Hanya mode terang, dengan alasan: dipakai di ruang dinas berpencahayaan ruang,
dan hasilnya sering dicetak (daftar sekolah dan guru) untuk dibawa ke rapat.
Mode gelap akan menambah beban uji tanpa manfaat. Keputusan ini dicatat di sini
supaya bukan default yang tidak dipikirkan.

## Motif identitas

Setiap angka sebaran ditulis dengan pola yang sama di seluruh aplikasi:
**"kurang N · lebih N"** diikuti nama wilayah. Pola ini muncul di kartu
statistik, baris tabel, jawaban AI, dan rekomendasi simulasi. Guru yang melihat
satu baris langsung tahu bentuk datanya di mana pun ia muncul.

## Aturan yang dipegang

1. Bahasa Indonesia di seluruh antarmuka. Istilah asing hanya bila itu nama
   resmi: NPSN, NUPTK, TPG, InfoGTK, Dapodik, SIMPKB.
2. Tidak ada angka tanpa sumber. Semua angka dihitung dari tabel sekolah, guru,
   dan kebutuhan_guru.
3. Tidak ada gradien ungu-biru, glassmorphism, atau emoji di antarmuka.
4. Setiap halaman yang menampilkan data punya keadaan memuat, kosong, dan gagal;
   setiap keadaan menyebut sebab dan langkah berikutnya.
5. Status selalu dibaca sebagai warna + label, tidak pernah warna saja.
