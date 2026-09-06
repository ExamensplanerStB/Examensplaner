-- PROJ-4: Übungsaufgaben-Hub
-- "uebungsaufgaben": Titel/Fach/Quelle + Wiederholungs-Steuerfelder
--   (pflicht_wdh_datum, wdh_anzahl). Status (Unbewertet/Gültig/Wiederholung
--   fällig/Verfallen/Geschlossen) wird nie gespeichert, sondern beim Laden
--   live berechnet (siehe Tech Design).
-- "uebungsaufgaben_themen": Verknüpfungstabelle (eine Aufgabe kann mehrere
--   Themen aus PROJ-2 haben), identisches Muster zu "karteikarten_themen".
-- "uebungsaufgaben_reviews": unveränderliche Bewertungshistorie, eine Zeile
--   pro Bewertungsereignis (nur Insert, kein Update/Delete durch den
--   Nutzer). Eigene Tabelle statt einer geteilten "reviews"-Tabelle über
--   alle Hubs — folgt dem PROJ-3-Präzedenzfall ("karteikarten_reviews"),
--   damit eine Fremdschlüssel-Kaskade die Historie beim Löschen der
--   Aufgabe automatisch mitentfernt.

create table if not exists public.uebungsaufgaben (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fach_id text not null references public.faecher(id),
  titel text not null check (char_length(btrim(titel)) > 0 and char_length(titel) <= 300),
  quelle text not null default '' check (char_length(quelle) <= 200),
  pflicht_wdh_datum date,
  wdh_anzahl int not null default 0 check (wdh_anzahl >= 0),
  created_at timestamptz not null default now()
);

alter table public.uebungsaufgaben enable row level security;

create policy "Nutzer sieht eigene Übungsaufgaben"
  on public.uebungsaufgaben for select
  using (auth.uid() = user_id);

create policy "Nutzer legt eigene Übungsaufgaben an"
  on public.uebungsaufgaben for insert
  with check (auth.uid() = user_id);

create policy "Nutzer bearbeitet eigene Übungsaufgaben"
  on public.uebungsaufgaben for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Nutzer löscht eigene Übungsaufgaben"
  on public.uebungsaufgaben for delete
  using (auth.uid() = user_id);

create index if not exists uebungsaufgaben_user_id_idx on public.uebungsaufgaben (user_id);
create index if not exists uebungsaufgaben_fach_id_idx on public.uebungsaufgaben (fach_id);
create index if not exists uebungsaufgaben_pflicht_wdh_datum_idx on public.uebungsaufgaben (pflicht_wdh_datum);

create table if not exists public.uebungsaufgaben_themen (
  uebungsaufgabe_id uuid not null references public.uebungsaufgaben(id) on delete cascade,
  thema_id uuid not null references public.themen(id) on delete cascade,
  primary key (uebungsaufgabe_id, thema_id)
);

alter table public.uebungsaufgaben_themen enable row level security;

create policy "Nutzer sieht Themenzuordnung eigener Aufgaben"
  on public.uebungsaufgaben_themen for select
  using (exists (
    select 1 from public.uebungsaufgaben a
    where a.id = uebungsaufgabe_id and a.user_id = auth.uid()
  ));

create policy "Nutzer legt Themenzuordnung eigener Aufgaben an"
  on public.uebungsaufgaben_themen for insert
  with check (exists (
    select 1 from public.uebungsaufgaben a
    where a.id = uebungsaufgabe_id and a.user_id = auth.uid()
  ));

create policy "Nutzer löscht Themenzuordnung eigener Aufgaben"
  on public.uebungsaufgaben_themen for delete
  using (exists (
    select 1 from public.uebungsaufgaben a
    where a.id = uebungsaufgabe_id and a.user_id = auth.uid()
  ));

create index if not exists uebungsaufgaben_themen_thema_id_idx on public.uebungsaufgaben_themen (thema_id);

create table if not exists public.uebungsaufgaben_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  uebungsaufgabe_id uuid not null references public.uebungsaufgaben(id) on delete cascade,
  datum timestamptz not null default now(),
  fachlich smallint not null check (fachlich between 1 and 5),
  klausurtechnik smallint not null check (klausurtechnik between 1 and 5),
  fehlernotiz text not null default '' check (char_length(fehlernotiz) <= 1000)
);

alter table public.uebungsaufgaben_reviews enable row level security;

create policy "Nutzer sieht eigene Bewertungshistorie"
  on public.uebungsaufgaben_reviews for select
  using (auth.uid() = user_id);

create policy "Nutzer protokolliert eigene Bewertungen"
  on public.uebungsaufgaben_reviews for insert
  with check (auth.uid() = user_id);

-- Kein Update/Delete für Nutzer: Historie ist unveränderlich
-- (keine Policy dafür = per RLS verweigert).

create index if not exists uebungsaufgaben_reviews_user_id_idx on public.uebungsaufgaben_reviews (user_id);
create index if not exists uebungsaufgaben_reviews_aufgabe_id_idx on public.uebungsaufgaben_reviews (uebungsaufgabe_id);
