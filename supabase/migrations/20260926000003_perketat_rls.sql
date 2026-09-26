-- GuruMerata — menutup empat celah RLS yang ditemukan saat audit.
--
-- Semua celah ini dibuktikan lebih dulu dengan permintaan sungguhan ke API,
-- bukan dugaan dari membaca kode. Urutannya dari yang paling berbahaya.

-- =====================================================================
-- 1. CRITICAL — guru bisa menaikkan perannya sendiri menjadi admin
--
-- Policy users_ubah sebelumnya hanya memeriksa `id = auth.uid()`, tanpa
-- membatasi kolom. Akibatnya satu permintaan PATCH ke /rest/v1/users sudah
-- cukup untuk mengubah peran sendiri dari 'guru' menjadi 'admin_dinas', dan
-- setelah itu RLS membuka seluruh data serta hak menyetujui mutasi.
--
-- Penjagaannya ditaruh di trigger, bukan di policy, karena policy UPDATE
-- tidak bisa membandingkan nilai lama dan nilai baru sebuah kolom.
-- =====================================================================
create or replace function public.larang_ubah_peran()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  pelaku uuid := auth.uid();
begin
  if new.peran is distinct from old.peran then
    -- Bila tidak ada konteks pengguna (service role, SQL editor, migrasi),
    -- perubahan tetap diizinkan: begitulah cara admin baru dibuat.
    if pelaku is not null then
      if not exists (
        select 1 from public.users
        where id = pelaku and peran = 'admin_dinas'
      ) then
        raise exception 'Peran pengguna hanya boleh diubah oleh admin dinas pendidikan.'
          using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists jaga_peran_pengguna on public.users;
create trigger jaga_peran_pengguna
  before update on public.users
  for each row execute function public.larang_ubah_peran();

-- =====================================================================
-- 2. HIGH — pendaftar bebas memilih perannya sendiri
--
-- Trigger pendaftaran sebelumnya membaca peran dari raw_user_meta_data, dan
-- nilai itu datang dari klien. Terbukti: permintaan signup dengan
-- `data.peran = admin_dinas` langsung menghasilkan baris admin_dinas.
--
-- Sekarang peran selalu 'guru'. Akun admin dibuat lewat SQL atau service role,
-- bukan lewat pendaftaran mandiri.
-- =====================================================================
create or replace function public.tangani_pengguna_baru()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, nama, peran)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nama', ''), split_part(new.email, '@', 1)),
    'guru'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- =====================================================================
-- 3. MEDIUM — catatan aktivitas bisa dipalsukan siapa saja
--
-- Policy sebelumnya `with check (true)`, jadi pengguna mana pun bisa menulis
-- entri log atas nama siapa pun. Padahal fitur mutasi ini menjanjikan jejak
-- yang bisa dipercaya.
-- =====================================================================
drop policy if exists log_tulis on public.log_aktivitas;
create policy log_tulis on public.log_aktivitas for insert to authenticated
  with check (auth.uid() = user_id);

-- =====================================================================
-- 4. MEDIUM — data guru dan kebutuhan sekolah terbaca tanpa login
--
-- View guru_publik dan kebutuhan_sekolah sebelumnya diberikan ke `anon`.
-- Terbukti terbaca tanpa sesi: nama 171 guru, sekolah, domisili, jam mengajar,
-- dan seluruh kebutuhan sekolah. Untuk data pemerintah, itu terlalu terbuka.
-- Akses tetap diberikan ke `authenticated` supaya aplikasi berjalan seperti biasa.
-- =====================================================================
revoke select on public.guru_publik from anon;
revoke select on public.kebutuhan_sekolah from anon;
