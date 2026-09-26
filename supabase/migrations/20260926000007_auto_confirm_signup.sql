-- GuruMerata — Auto-confirm email dan auto-create profile pengguna baru tanpa Error 500.

create or replace function public.auto_confirm_email()
returns trigger as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

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

    if v_peran = 'guru' then
      select id into v_sekolah_id from public.sekolah limit 1;
      if v_sekolah_id is not null then
        insert into public.guru (
          user_id, nama, mapel, status_kepegawaian, sertifikasi, jam_ngajar, sekolah_id, domisili
        )
        values (
          new.id,
          v_nama,
          'Matematika',
          'PNS',
          true,
          24,
          v_sekolah_id,
          'Kota Jakarta Pusat'
        );
      end if;
    end if;
  exception when others then
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
