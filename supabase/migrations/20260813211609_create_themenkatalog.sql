-- PROJ-2: Zentraler Themenkatalog
-- "faecher": feste Referenzdaten (11 Prüfungsfächer, 3 Klausurtage), nicht über die App editierbar.
-- "themen": vom Nutzer gepflegte Themen je Fach, RLS-Muster aus PROJ-1 übernommen (user_id = auth.uid()).

create table if not exists public.faecher (
  id text primary key,
  kuerzel text not null,
  name text not null,
  klausurtag smallint not null check (klausurtag in (1, 2, 3))
);

alter table public.faecher enable row level security;

create policy "Eingeloggte Nutzer sehen alle Fächer"
  on public.faecher for select
  to authenticated
  using (true);

-- Kein Insert/Update/Delete für Nutzer: Fächer sind fest vorgegeben (siehe PRD),
-- keine Policy dafür = per RLS verweigert.

insert into public.faecher (id, kuerzel, name, klausurtag) values
  ('ao', 'AO', 'Abgabenordnung', 1),
  ('fgo', 'FGO', 'Finanzgerichtsordnung', 1),
  ('ust', 'USt', 'Umsatzsteuer', 1),
  ('bewg', 'BewG', 'Bewertungsrecht', 1),
  ('erbst', 'ErbSt', 'Erbschaftsteuer', 1),
  ('est', 'ESt', 'Einkommensteuer', 2),
  ('kst', 'KSt', 'Körperschaftsteuer', 2),
  ('gewst', 'GewSt', 'Gewerbesteuer', 2),
  ('intstr', 'IntStR', 'Internationales Steuerrecht', 2),
  ('bilanz', 'Bilanz', 'Buchführung & Bilanzwesen', 3),
  ('umwstr', 'UmwStR', 'Umwandlungssteuerrecht', 3)
on conflict (id) do nothing;

create table if not exists public.themen (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fach_id text not null references public.faecher(id),
  name text not null check (char_length(btrim(name)) > 0 and char_length(name) <= 100),
  klausurrelevanz text not null default 'mittel'
    check (klausurrelevanz in ('hoch', 'mittel', 'niedrig')),
  created_at timestamptz not null default now()
);

alter table public.themen enable row level security;

create policy "Nutzer sieht eigene Themen"
  on public.themen for select
  using (auth.uid() = user_id);

create policy "Nutzer legt eigene Themen an"
  on public.themen for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeitet eigene Themen"
  on public.themen for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Nutzer löscht eigene Themen"
  on public.themen for delete
  using (auth.uid() = user_id);

-- Duplikatsprüfung pro Fach, Groß-/Kleinschreibung ignoriert (siehe PROJ-2 Spec/Tech Design)
create unique index if not exists themen_user_fach_name_unique
  on public.themen (user_id, fach_id, lower(btrim(name)));

create index if not exists themen_user_id_idx on public.themen (user_id);
create index if not exists themen_fach_id_idx on public.themen (fach_id);
