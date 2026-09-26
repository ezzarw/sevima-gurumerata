-- GuruMerata — aktifkan Supabase Realtime untuk tabel mutasi
-- Tabel mutasi perlu masuk publikasi supabase_realtime supaya perubahan
-- status pengajuan (diajukan/disetujui/ditolak) terdorong ke klien.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mutasi'
  ) then
    alter publication supabase_realtime add table public.mutasi;
  end if;
end $$;

-- RLS pada realtime.messages: pengguna yang sudah masuk boleh menerima
-- perubahan. Barisnya tetap disaring RLS tabel mutasi itu sendiri, jadi guru
-- hanya menerima perubahan pengajuannya sendiri.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'realtime' and tablename = 'messages' and policyname = 'mutasi_baca_realtime'
  ) then
    create policy mutasi_baca_realtime on realtime.messages
      for select to authenticated using (true);
  end if;
end $$;
