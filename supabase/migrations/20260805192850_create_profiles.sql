-- PROJ-1: profiles-Tabelle (1:1 zu auth.users) + RLS-Grundmuster für alle künftigen Tabellen

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Nutzer sieht eigenes Profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Nutzer aktualisiert eigenes Profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Kein Sign-up-Flow in der App (Account wird manuell in Supabase angelegt, siehe PROJ-1 Spec),
-- daher legt dieser Trigger die profiles-Zeile automatisch bei Nutzeranlage an.
-- INSERT/DELETE durch Nutzer selbst ist bewusst nicht erlaubt (keine Policy dafür = per RLS verweigert).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
