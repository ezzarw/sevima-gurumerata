-- GuruMerata — tampilkan NIP dan NUPTK pada view guru_publik.
--
-- Sebelumnya view ini sengaja tidak memuat kolom identitas kepegawaian supaya
-- tidak bocor ke pengguna anonim. Akibatnya halaman Data Guru selalu gagal
-- menampilkan identitas: labelnya berbunyi "NIP belum terdata" padahal
-- 171 baris guru punya NIP dan NUPTK yang lengkap.
--
-- Kolom identitas memang perlu ditampilkan, tetapi hanya kepada pengguna yang
-- berhak. Karena itu ditambahkan ke view, dan pembatasannya diserahkan ke RLS
-- yang sudah ada: guru hanya melihat dirinya, operator sekolah hanya sekolahnya,
-- admin dinas melihat semuanya. Akses anonim atas view ini sudah dicabut pada
-- migrasi sebelumnya.
-- View harus dijatuhkan dulu: CREATE OR REPLACE tidak bisa menyisipkan
-- kolom baru di tengah daftar kolom.
drop view if exists public.guru_publik;
create view public.guru_publik as
  select g.id, g.nama, g.nip, g.nuptk, g.mapel, g.status_kepegawaian, g.sertifikasi,
         g.sekolah_id, g.domisili, g.jam_ngajar,
         s.nama as sekolah_nama, s.jenjang,
         kb.id as kabupaten_id, kb.nama as kabupaten_nama,
         p.id as provinsi_id, p.nama as provinsi_nama
  from public.guru g
  join public.sekolah s on s.id = g.sekolah_id
  join public.kabupaten kb on kb.id = s.kabupaten_id
  join public.provinsi p on p.id = kb.provinsi_id;

grant select on public.guru_publik to authenticated;
