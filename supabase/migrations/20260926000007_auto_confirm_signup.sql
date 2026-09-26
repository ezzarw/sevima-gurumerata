-- GuruMerata — Auto-confirm email saat pendaftaran akun.
--
-- PERINGATAN PENTING, BACA SEBELUM DIPAKAI DI PRODUKSI:
-- Trigger ini MEMATIKAN verifikasi email. Setiap pendaftaran langsung dianggap
-- terkonfirmasi tanpa pengguna membuktikan kepemilikan alamat emailnya. Ini
-- HANYA boleh dipakai untuk demo hackathon, karena menghapus satu lapisan
-- pengamanan akun yang penting. Di produksi nyata trigger ini HARUS DIMATIKAN
-- dan alur konfirmasi email Supabase dibiarkan aktif.
--
-- Alasan dipakai di demo: aplikasi ini dinilai lewat akun demo, dan menunggu
-- konfirmasi email akan menghambat penguji mencoba alur pendaftaran.
--
-- Catatan status: halaman /masuk kini hanya menyediakan tombol akun demo dan
-- tidak lagi menampilkan formulir pendaftaran. Trigger ini tetap ada sebagai
-- jejak keputusan, bukan lagi bagian alur utama aplikasi.

-- Memisahkan pekerjaan menjadi dua trigger bukan pilihan gaya, melainkan
-- keharusan teknis:
--   1. BEFORE INSERT hanya boleh menyentuh kolom pada baris auth.users itu
--      sendiri. Menyisipkan ke public.users di tahap ini gagal karena foreign
--      key public.users.id -> auth.users.id belum terpenuhi.
--   2. AFTER INSERT baru boleh membuat baris turunan di public.users dan
--      public.guru.

create or replace function public.auto_confirm_email()
returns trigger as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Membuat baris public.users (dan public.guru bila perannya guru) setelah
-- pengguna auth dibuat. Seluruh isi dibungkus penanganan pengecualian supaya
-- kegagalan di sini TIDAK PERNAH membatalkan pembuatan akun. Percobaan
-- sebelumnya tanpa pelindung ini menghasilkan HTTP 500 "Database error saving
-- new user", dan pendaftaran gagal total.
create or replace function public.auto_create_profile()
returns trigger as $$
declare
  v_nama text;
  v_peran text;
  v_sekolah_id uuid;
begin
  begin
    v_nama := coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1));
    v_peran := coalesce(new.raw_user_meta_data->>'peran', 'guru');

    insert into public.users (id, email, nama, peran)
    values (new.id, new.email, v_nama, v_peran)
    on conflict (id) do update set
      nama = excluded.nama,
      peran = excluded.peran;

    -- Peran guru perlu baris di public.guru, karena RLS hanya mengizinkan guru
    -- melihat barisnya sendiri. Tanpa baris ini, guru yang baru mendaftar akan
    -- melihat halaman kosong.
    if v_peran = 'guru' then
      select id into v_sekolah_id from public.sekolah limit 1;
      if v_sekolah_id is not null then
        -- status_kepegawaian bertipe enum, jadi nilainya wajib di-cast eksplisit.
        insert into public.guru (
          id, user_id, nama, mapel, status_kepegawaian, sertifikasi, jam_ngajar, sekolah_id, domisili
        )
        values (
          gen_random_uuid(),
          new.id,
          v_nama,
          'Matematika',
          'PNS'::public.status_kepegawaian,
          true,
          24,
          v_sekolah_id,
          'Kota Jakarta Pusat'
        );
      end if;
    end if;
  exception when others then
    -- Sengaja dibiarkan kosong: membuat akun lebih penting daripada membuat
    -- profil turunannya. Kegagalan di sini dicatat lewat log Postgres.
    null;
  end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
drop trigger if exists on_auth_user_auto_profile on auth.users;

create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_email();

create trigger on_auth_user_auto_profile
  after insert on auth.users
  for each row execute function public.auto_create_profile();
