-- GuruMerata — Auto-confirm email dan auto-login untuk pengguna baru saat pendaftaran.
--
-- Supabase Auth secara default menahan login sebelum email dikonfirmasi.
-- Trigger ini mengonfirmasi email pengguna secara otomatis saat pendaftaran (BEFORE INSERT pada auth.users),
-- sehingga pendaftaran dapat langsung otomatis login dan redirect ke dashboard tanpa hambatan konfirmasi email.

create or replace function public.auto_confirm_and_profile()
returns trigger as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_and_profile();
