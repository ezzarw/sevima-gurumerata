-- GuruMerata — status daerah tertinggal (3T) pindah dari kode ke database.
--
-- Sebelumnya daftar kabupaten 3T ditulis di dalam kode aplikasi sebagai
-- himpunan tetap: Kabupaten Asmat, Sumba Timur, dan Jeneponto. Dua masalah
-- yang timbul dari cara itu:
--   1. Menambah wilayah 3T baru berarti mengubah kode dan mengirim ulang
--      aplikasi, padahal wilayahnya bertambah dari waktu ke waktu.
--   2. Kalau ditambahkan lewat UI atau SQL, skor dampak psikologis mutasi
--      diam-diam salah karena kode tidak mengenali kabupaten itu sebagai 3T.
--
-- Karena status ini sifat data, bukan sifat logika, tempatnya di tabel
-- kabupaten. Aplikasi cukup membaca kolomnya.
alter table public.kabupaten
  add column if not exists daerah_tertinggal boolean not null default false;

comment on column public.kabupaten.daerah_tertinggal is
  'Menandai kabupaten daerah tertinggal (3T). Dipakai untuk menambah faktor risiko pada skor dampak psikologis mutasi.';

-- Isi data awal: tiga kabupaten yang sebelumnya tertulis di kode.
update public.kabupaten set daerah_tertinggal = true
where nama in ('Kabupaten Asmat', 'Kabupaten Sumba Timur', 'Kabupaten Jeneponto');

-- View guru_publik perlu membawa status ini supaya halaman kerja tidak
-- perlu memanggil provinsi dan kabupaten secara terpisah.
drop view if exists public.guru_publik;
create view public.guru_publik as
  select g.id, g.nama, g.nip, g.nuptk, g.mapel, g.status_kepegawaian, g.sertifikasi,
         g.sekolah_id, g.domisili, g.jam_ngajar,
         s.nama as sekolah_nama, s.jenjang,
         kb.id as kabupaten_id, kb.nama as kabupaten_nama, kb.daerah_tertinggal,
         p.id as provinsi_id, p.nama as provinsi_nama
  from public.guru g
  join public.sekolah s on s.id = g.sekolah_id
  join public.kabupaten kb on kb.id = s.kabupaten_id
  join public.provinsi p on p.id = kb.provinsi_id;

grant select on public.guru_publik to authenticated;
revoke all on public.guru_publik from anon;
