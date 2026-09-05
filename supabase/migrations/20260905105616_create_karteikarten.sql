-- PROJ-3: Karteikarten-Hub
-- "karteikarten": Theorie + Klausurtechnik in einer gemeinsamen, per Typ-Feld
--   unterschiedenen Tabelle (siehe Tech Design). RLS-Muster aus PROJ-1/PROJ-2
--   (user_id = auth.uid()).
-- "karteikarten_themen": Verknüpfungstabelle (eine Karte kann mehrere Themen
--   aus PROJ-2 haben). Führt selbst keine user_id — Zugriff wird über die
--   Elternkarte geprüft.
-- "karteikarten_reviews": unveränderliche Bewertungshistorie, eine Zeile pro
--   Bewertungsereignis (nur Insert, kein Update/Delete durch den Nutzer).

create table if not exists public.karteikarten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fach_id text not null references public.faecher(id),
  typ text not null check (typ in ('theorie', 'klausurtechnik')),
  frage text not null check (char_length(btrim(frage)) > 0 and char_length(frage) <= 1000),
  quelle text not null default '' check (char_length(quelle) <= 200),
  fehlernotiz text not null default '' check (char_length(fehlernotiz) <= 1000),
  bewertung smallint not null check (bewertung between 1 and 5),
  intervall numeric not null check (intervall > 0),
  wdh_anzahl int not null default 1 check (wdh_anzahl >= 0),
  wdh_datum date not null,
  created_at timestamptz not null default now()
);

alter table public.karteikarten enable row level security;

create policy "Nutzer sieht eigene Karteikarten"
  on public.karteikarten for select
  using (auth.uid() = user_id);

create policy "Nutzer legt eigene Karteikarten an"
  on public.karteikarten for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeitet eigene Karteikarten"
  on public.karteikarten for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Nutzer löscht eigene Karteikarten"
  on public.karteikarten for delete
  using (auth.uid() = user_id);

create index if not exists karteikarten_user_id_idx on public.karteikarten (user_id);
create index if not exists karteikarten_fach_id_idx on public.karteikarten (fach_id);
create index if not exists karteikarten_wdh_datum_idx on public.karteikarten (wdh_datum);

create table if not exists public.karteikarten_themen (
  karteikarte_id uuid not null references public.karteikarten(id) on delete cascade,
  thema_id uuid not null references public.themen(id) on delete cascade,
  primary key (karteikarte_id, thema_id)
);

alter table public.karteikarten_themen enable row level security;

create policy "Nutzer sieht Themenzuordnung eigener Karten"
  on public.karteikarten_themen for select
  using (exists (
    select 1 from public.karteikarten k
    where k.id = karteikarte_id and k.user_id = auth.uid()
  ));

create policy "Nutzer legt Themenzuordnung eigener Karten an"
  on public.karteikarten_themen for insert
  with check (exists (
    select 1 from public.karteikarten k
    where k.id = karteikarte_id and k.user_id = auth.uid()
  ));

create policy "Nutzer löscht Themenzuordnung eigener Karten"
  on public.karteikarten_themen for delete
  using (exists (
    select 1 from public.karteikarten k
    where k.id = karteikarte_id and k.user_id = auth.uid()
  ));

create index if not exists karteikarten_themen_thema_id_idx on public.karteikarten_themen (thema_id);

create table if not exists public.karteikarten_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  karteikarte_id uuid not null references public.karteikarten(id) on delete cascade,
  datum timestamptz not null default now(),
  bewertung smallint not null check (bewertung between 1 and 5),
  intervall_danach numeric not null check (intervall_danach > 0)
);

alter table public.karteikarten_reviews enable row level security;

create policy "Nutzer sieht eigene Bewertungshistorie"
  on public.karteikarten_reviews for select
  using (auth.uid() = user_id);

create policy "Nutzer protokolliert eigene Bewertungen"
  on public.karteikarten_reviews for insert
  with check (auth.uid() = user_id);

-- Kein Update/Delete für Nutzer: Historie ist unveränderlich
-- (keine Policy dafür = per RLS verweigert).

create index if not exists karteikarten_reviews_user_id_idx on public.karteikarten_reviews (user_id);
create index if not exists karteikarten_reviews_karteikarte_id_idx on public.karteikarten_reviews (karteikarte_id);
