-- =====================================================================
-- GuruMerata — Skema awal
-- Tabel inti + RLS + view publik (non-sensitif) untuk dashboard
-- =====================================================================
create extension if not exists pgcrypto;

-- ── Enum ──────────────────────────────────────────────────────────────
do $$ begin
  create type public.jenjang_sekolah as enum ('SD','SMP','SMA','SMK');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_kepegawaian as enum ('PNS','PPPK','Honorer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.peran_pengguna as enum ('admin_dinas','operator_sekolah','guru');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_mutasi as enum ('diajukan','disetujui','ditolak','dibatalkan');
exception when duplicate_object then null; end $$;

-- ── Wilayah ───────────────────────────────────────────────────────────
create table if not exists public.provinsi (
  id         uuid primary key default gen_random_uuid(),
  kode       text not null unique,
  nama       text not null unique,
  latitude   double precision not null,
  longitude  double precision not null
);

create table if not exists public.kabupaten (
  id          uuid primary key default gen_random_uuid(),
  provinsi_id uuid not null references public.provinsi(id) on delete cascade,
  nama        text not null,
  latitude    double precision not null,
  longitude   double precision not null,
  unique (provinsi_id, nama)
);

-- ── Sekolah ───────────────────────────────────────────────────────────
create table if not exists public.sekolah (
  id            uuid primary key default gen_random_uuid(),
  kabupaten_id  uuid not null references public.kabupaten(id) on delete cascade,
  nama          text not null,
  npsn          text unique,
  jenjang       public.jenjang_sekolah not null,
  jumlah_rombel integer not null default 0 check (jumlah_rombel >= 0),
  alamat        text,
  latitude      double precision not null,
  longitude     double precision not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_sekolah_kabupaten on public.sekolah (kabupaten_id);

-- ── Pengguna (profil aplikasi, 1:1 dengan auth.users) ─────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  nama       text,
  peran      public.peran_pengguna not null default 'guru',
  sekolah_id uuid references public.sekolah(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Guru ──────────────────────────────────────────────────────────────
create table if not exists public.guru (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.users(id) on delete set null,
  nama               text not null,
  nip                text,
  nuptk              text,
  status_kepegawaian public.status_kepegawaian not null,
  mapel              text not null,
  sertifikasi        boolean not null default false,
  sekolah_id         uuid not null references public.sekolah(id) on delete restrict,
  domisili           text not null,
  jam_ngajar         integer not null default 0 check (jam_ngajar >= 0),
  created_at         timestamptz not null default now()
);
create index if not exists idx_guru_sekolah on public.guru (sekolah_id);
create index if not exists idx_guru_mapel on public.guru (mapel);
create index if not exists idx_guru_status on public.guru (status_kepegawaian);

-- ── Kebutuhan guru per sekolah per mapel ──────────────────────────────
create table if not exists public.kebutuhan_guru (
  id           uuid primary key default gen_random_uuid(),
  sekolah_id   uuid not null references public.sekolah(id) on delete cascade,
  mapel        text not null,
  jumlah_butuh integer not null default 0 check (jumlah_butuh >= 0),
  jumlah_ada   integer not null default 0 check (jumlah_ada >= 0),
  unique (sekolah_id, mapel)
);
create index if not exists idx_kebutuhan_sekolah on public.kebutuhan_guru (sekolah_id);

-- ── Mutasi ────────────────────────────────────────────────────────────
create table if not exists public.mutasi (
  id                uuid primary key default gen_random_uuid(),
  guru_id           uuid not null references public.guru(id) on delete cascade,
  sekolah_asal_id   uuid not null references public.sekolah(id) on delete restrict,
  sekolah_tujuan_id uuid not null references public.sekolah(id) on delete restrict,
  mapel             text not null,
  alasan            text not null,
  catatan_guru      text,
  status            public.status_mutasi not null default 'diajukan',
  catatan_dinas     text,
  pengaju_id        uuid references public.users(id) on delete set null,
  simulasi          jsonb,
  created_at        timestamptz not null default now(),
  approved_at       timestamptz,
  constraint mutasi_sekolah_berbeda check (sekolah_asal_id <> sekolah_tujuan_id)
);
create index if not exists idx_mutasi_status on public.mutasi (status);
create index if not exists idx_mutasi_guru on public.mutasi (guru_id);

-- ── Log aktivitas ─────────────────────────────────────────────────────
create table if not exists public.log_aktivitas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete set null,
  aksi       text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Helper RLS
-- =====================================================================
create or replace function public.peran_saya()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce((select peran::text from public.users where id = auth.uid()), 'anon')
$$;

create or replace function public.sekolah_saya()
returns uuid
language sql stable security definer set search_path = public
as $$
  select (select sekolah_id from public.users where id = auth.uid())
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.provinsi       enable row level security;
alter table public.kabupaten      enable row level security;
alter table public.sekolah        enable row level security;
alter table public.users          enable row level security;
alter table public.guru           enable row level security;
alter table public.kebutuhan_guru enable row level security;
alter table public.mutasi         enable row level security;
alter table public.log_aktivitas  enable row level security;

-- Wilayah & sekolah: referensi publik (dibutuhkan dashboard), tulis hanya admin dinas
drop policy if exists provinsi_baca on public.provinsi;
create policy provinsi_baca on public.provinsi for select to anon, authenticated using (true);
drop policy if exists provinsi_tulis on public.provinsi;
create policy provinsi_tulis on public.provinsi for all to authenticated
  using (public.peran_saya() = 'admin_dinas') with check (public.peran_saya() = 'admin_dinas');

drop policy if exists kabupaten_baca on public.kabupaten;
create policy kabupaten_baca on public.kabupaten for select to anon, authenticated using (true);
drop policy if exists kabupaten_tulis on public.kabupaten;
create policy kabupaten_tulis on public.kabupaten for all to authenticated
  using (public.peran_saya() = 'admin_dinas') with check (public.peran_saya() = 'admin_dinas');

drop policy if exists sekolah_baca on public.sekolah;
create policy sekolah_baca on public.sekolah for select to anon, authenticated using (true);
drop policy if exists sekolah_tulis on public.sekolah;
create policy sekolah_tulis on public.sekolah for all to authenticated
  using (public.peran_saya() = 'admin_dinas') with check (public.peran_saya() = 'admin_dinas');

drop policy if exists kebutuhan_baca on public.kebutuhan_guru;
create policy kebutuhan_baca on public.kebutuhan_guru for select to anon, authenticated using (true);
drop policy if exists kebutuhan_tulis on public.kebutuhan_guru;
create policy kebutuhan_tulis on public.kebutuhan_guru for all to authenticated
  using (public.peran_saya() in ('admin_dinas','operator_sekolah')
         and (public.peran_saya() = 'admin_dinas' or sekolah_id = public.sekolah_saya()))
  with check (public.peran_saya() in ('admin_dinas','operator_sekolah')
         and (public.peran_saya() = 'admin_dinas' or sekolah_id = public.sekolah_saya()));

-- Users: diri sendiri atau admin dinas
drop policy if exists users_baca on public.users;
create policy users_baca on public.users for select to authenticated
  using (id = auth.uid() or public.peran_saya() = 'admin_dinas');
drop policy if exists users_ubah on public.users;
create policy users_ubah on public.users for update to authenticated
  using (id = auth.uid() or public.peran_saya() = 'admin_dinas')
  with check (id = auth.uid() or public.peran_saya() = 'admin_dinas');

-- Guru: admin semua; operator sekolah sebatas sekolahnya; guru hanya dirinya
drop policy if exists guru_baca on public.guru;
create policy guru_baca on public.guru for select to authenticated
  using (
    public.peran_saya() = 'admin_dinas'
    or (public.peran_saya() = 'operator_sekolah' and sekolah_id = public.sekolah_saya())
    or user_id = auth.uid()
  );
drop policy if exists guru_tulis on public.guru;
create policy guru_tulis on public.guru for all to authenticated
  using (
    public.peran_saya() = 'admin_dinas'
    or (public.peran_saya() = 'operator_sekolah' and sekolah_id = public.sekolah_saya())
  )
  with check (
    public.peran_saya() = 'admin_dinas'
    or (public.peran_saya() = 'operator_sekolah' and sekolah_id = public.sekolah_saya())
  );

-- Mutasi: guru melihat & mengajukan miliknya; operator sekolah melihat yang menyangkut sekolahnya;
-- admin dinas melihat semua dan memutuskan
drop policy if exists mutasi_baca on public.mutasi;
create policy mutasi_baca on public.mutasi for select to authenticated
  using (
    public.peran_saya() = 'admin_dinas'
    or (public.peran_saya() = 'operator_sekolah'
        and (sekolah_asal_id = public.sekolah_saya() or sekolah_tujuan_id = public.sekolah_saya()))
    or exists (select 1 from public.guru g where g.id = mutasi.guru_id and g.user_id = auth.uid())
  );
drop policy if exists mutasi_ajukan on public.mutasi;
create policy mutasi_ajukan on public.mutasi for insert to authenticated
  with check (
    exists (select 1 from public.guru g where g.id = guru_id and g.user_id = auth.uid())
    or public.peran_saya() in ('admin_dinas','operator_sekolah')
  );
drop policy if exists mutasi_putuskan on public.mutasi;
create policy mutasi_putuskan on public.mutasi for update to authenticated
  using (public.peran_saya() = 'admin_dinas'
         or exists (select 1 from public.guru g where g.id = mutasi.guru_id and g.user_id = auth.uid()))
  with check (true);

-- Log aktivitas: siapa pun yang login boleh menulis, hanya admin dinas yang membaca
drop policy if exists log_tulis on public.log_aktivitas;
create policy log_tulis on public.log_aktivitas for insert to authenticated with check (true);
drop policy if exists log_baca on public.log_aktivitas;
create policy log_baca on public.log_aktivitas for select to authenticated
  using (public.peran_saya() = 'admin_dinas');

-- =====================================================================
-- View publik: data sebaran tanpa kolom identitas kepegawaian
-- (security_invoker = false → dibaca sebagai pemilik view, lolos RLS guru)
-- =====================================================================
create or replace view public.guru_publik as
  select g.id, g.nama, g.mapel, g.status_kepegawaian, g.sertifikasi,
         g.sekolah_id, g.domisili, g.jam_ngajar,
         s.nama as sekolah_nama, s.jenjang,
         kb.id as kabupaten_id, kb.nama as kabupaten_nama,
         p.id as provinsi_id, p.nama as provinsi_nama
  from public.guru g
  join public.sekolah s on s.id = g.sekolah_id
  join public.kabupaten kb on kb.id = s.kabupaten_id
  join public.provinsi p on p.id = kb.provinsi_id;

grant select on public.guru_publik to anon, authenticated;

create or replace view public.kebutuhan_sekolah as
  select k.id, k.sekolah_id, k.mapel, k.jumlah_butuh, k.jumlah_ada,
         greatest(k.jumlah_butuh - k.jumlah_ada, 0) as kurang,
         greatest(k.jumlah_ada - k.jumlah_butuh, 0) as lebih,
         s.nama as sekolah_nama, s.jenjang, s.jumlah_rombel,
         kb.nama as kabupaten_nama, p.nama as provinsi_nama
  from public.kebutuhan_guru k
  join public.sekolah s on s.id = k.sekolah_id
  join public.kabupaten kb on kb.id = s.kabupaten_id
  join public.provinsi p on p.id = kb.provinsi_id;

grant select on public.kebutuhan_sekolah to anon, authenticated;

-- =====================================================================
-- Trigger: buat profil public.users saat pendaftaran auth
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
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'peran', '')::public.peran_pengguna, 'guru')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tangani_pengguna_baru();
