-- PROJ-8 Kompetenzanalyse: täglicher Stufen-Snapshot je Thema.
-- Reine Historie für die Kalibrierung (Prädiktive Validität, Abschnitt 9A
-- der Berechnungsspezifikation) und einen späteren Trend-Chart — wird nie
-- überschrieben oder gelöscht (siehe Tech Design/Decision Log).

create table if not exists public.stufen_verlauf (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thema_id uuid not null references public.themen(id) on delete cascade,
  datum date not null,
  stufe smallint not null check (stufe between 0 and 4),
  basis_broeckelt boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.stufen_verlauf enable row level security;

create policy "Nutzer sieht eigenen Stufenverlauf"
  on public.stufen_verlauf for select
  using (auth.uid() = user_id);

create policy "Nutzer protokolliert eigenen Stufenverlauf"
  on public.stufen_verlauf for insert
  with check (auth.uid() = user_id);

-- Kein Update/Delete für Nutzer: ein einmal gespeicherter Snapshot ist
-- unveränderlich (keine Policy dafür = per RLS verweigert, analog
-- karteikarten_reviews aus PROJ-3).

-- Höchstens ein Snapshot pro Thema und Kalendertag (PROJ-8 AC).
create unique index if not exists stufen_verlauf_thema_datum_unique
  on public.stufen_verlauf (thema_id, datum);

create index if not exists stufen_verlauf_user_id_idx on public.stufen_verlauf (user_id);
create index if not exists stufen_verlauf_thema_id_idx on public.stufen_verlauf (thema_id);
