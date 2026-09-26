-- GuruMerata — view harus ikut aturan RLS tabel di bawahnya.
--
-- Ditemukan saat menguji peran guru: setelah login sebagai guru, halaman Data
-- Guru menampilkan 163 baris, padahal policy guru_baca pada tabel guru hanya
-- mengizinkan guru melihat barisnya sendiri. Penyebabnya view guru_publik
-- dijalankan dengan hak pemilik view, sehingga Row Level Security tabel dasar
-- dilewati. Policy-nya sendiri sudah benar sejak awal.
--
-- Postgres 15 dan lebih baru menyediakan security_invoker untuk view. Opsi ini
-- membuat view dievaluasi dengan hak pengguna yang memanggilnya, jadi RLS
-- tabel guru, sekolah, kabupaten, dan provinsi ikut berlaku. Tanpa ini, setiap
-- view di aplikasi adalah jalan pintas menembus RLS.
alter view public.guru_publik set (security_invoker = true);
alter view public.kebutuhan_sekolah set (security_invoker = true);

comment on view public.guru_publik is
  'Data guru untuk halaman kerja. security_invoker aktif: RLS tabel guru berlaku, guru hanya melihat dirinya, operator sekolah hanya sekolahnya, admin dinas melihat semua.';

comment on view public.kebutuhan_sekolah is
  'Kebutuhan guru per sekolah. security_invoker aktif agar RLS tabel sekolah dan kebutuhan_guru berlaku.';

-- Sambungkan akun demo guru@demo.test ke baris gurunya. Tautan ini terlepas
-- saat seed diimpor ulang. Tanpa tautan, guru login dan tidak melihat datanya
-- sendiri karena policy bergantung pada kolom guru.user_id.
update public.guru g
set user_id = u.id
from public.users u
where u.email = 'guru@demo.test'
  and g.nama = 'Yohanes Tefa, S.Pd'
  and g.user_id is null;
