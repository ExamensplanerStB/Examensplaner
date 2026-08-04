# PROJ-1: Supabase-Infrastruktur-Setup

## Status: Architected
**Created:** 2026-08-03
**Last Updated:** 2026-08-04

## Dependencies
- None

## User Stories
- Als Lukas möchte ich mich mit E-Mail und Passwort einloggen können, damit nur ich Zugriff auf meine Examensvorbereitungsdaten habe.
- Als Lukas möchte ich, dass nicht eingeloggte Zugriffe auf geschützte Seiten automatisch zum Login umgeleitet werden, damit meine Daten nicht offen im Netz erreichbar sind.
- Als Lukas möchte ich nach dem Login automatisch zu der Seite gelangen, die ich ursprünglich aufrufen wollte, damit ich nicht jedes Mal manuell navigieren muss.
- Als Lukas möchte ich dauerhaft eingeloggt bleiben, solange ich mich nicht aktiv auslogge, damit ich die App täglich ohne Reibungsverluste nutzen kann.
- Als Entwickler (Claude Code) möchte ich ein wiederverwendbares RLS-Muster haben, damit jede künftige Tabelle (Themenkatalog, Karteikarten, etc.) konsistent abgesichert werden kann.

## Out of Scope
- Öffentliche Registrierung / Sign-up-Formular — es gibt nur einen Nutzer (Lukas), der Account wird manuell im Supabase-Dashboard angelegt
- Selbstständiger "Passwort vergessen"-Flow in der App — Reset erfolgt bei Bedarf direkt über das Supabase-Dashboard
- Multi-Faktor-Authentifizierung
- Rate-Limiting / Account-Lockout auf App-Ebene — kein Multi-User-Angriffsszenario, Supabase-eigener Schutz genügt
- Fachliche Tabellen der einzelnen Hubs (Themenkatalog, Karteikarten, Übungsaufgaben, Probeklausuren, Todos, etc.) — diese entstehen jeweils im Backend-Spec des zugehörigen Features (PROJ-2 ff.)
- Das eigentliche Dashboard-UI (Zeitstrahl, Kalender, Kompetenz-Mini-Übersicht etc.) — kommt mit PROJ-9, hier nur ein Platzhalter
- Session-Timeout nach Inaktivität — Session bleibt dauerhaft aktiv bis explizitem Logout
- Cross-Tab/Cross-Device Logout-Synchronisierung — jede Session verhält sich unabhängig (Supabase-Standardverhalten)
- Mehrbenutzerfähigkeit / Multi-Tenant (siehe PRD Non-Goals)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er eine geschützte Route (z.B. `/dashboard`) direkt aufruft, dann wird er zu `/login?redirect=/dashboard` umgeleitet
- [ ] Angenommen der Nutzer gibt auf der Login-Seite korrekte Zugangsdaten ein, wenn er das Formular abschickt, dann wird er zur ursprünglich angeforderten URL (bzw. `/dashboard` als Default) weitergeleitet
- [ ] Angenommen der Nutzer gibt eine falsche E-Mail oder ein falsches Passwort ein, wenn er das Formular abschickt, dann erscheint die Meldung „E-Mail oder Passwort ist falsch" und die Eingaben bleiben im Formular erhalten (Passwortfeld wird geleert)
- [ ] Angenommen der Nutzer schickt das Login-Formular leer ab, wenn er auf „Anmelden" klickt, dann wird für E-Mail- und Passwortfeld je eine Validierungsfehlermeldung angezeigt, ohne dass eine Anfrage an Supabase gesendet wird
- [ ] Angenommen Supabase ist nicht erreichbar, wenn der Nutzer sich einzuloggen versucht, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" und die eingegebene E-Mail bleibt erhalten
- [ ] Angenommen der Nutzer ist eingeloggt, wenn er auf „Abmelden" klickt, dann wird die Session beendet und er landet auf `/login`
- [ ] Angenommen der Nutzer war bereits eingeloggt, wenn er die App zu einem späteren Zeitpunkt (z.B. am nächsten Tag) erneut öffnet, dann ist er weiterhin eingeloggt, ohne sich neu anmelden zu müssen
- [ ] Angenommen die `profiles`-Tabelle enthält Zeilen mehrerer Nutzer (technisch möglich, auch wenn aktuell nur einer existiert), wenn ein eingeloggter Nutzer per API/DB-Query auf `profiles` zugreift, dann sieht er ausschließlich seine eigene Zeile (RLS-Policy `user_id = auth.uid()`)
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt auf die Datenbank zuzugreifen, dann verweigert RLS jeden Zugriff (keine Zeile wird zurückgegeben)

## Edge Cases
- Was passiert, wenn die Supabase-Session abläuft, während der Nutzer aktiv in der App arbeitet? → Automatisches Token-Refresh im Hintergrund; schlägt dieses fehl, wird der Nutzer bei der nächsten Aktion zu `/login` umgeleitet
- Wie verhält sich die App, wenn `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` fehlen oder ungültig sind (Fehlkonfiguration)? → Klarer Fehler beim Start/Build, kein stiller Fallback auf `null`-Client
- Was passiert bei parallelen Logins auf mehreren Geräten (z.B. Laptop + Handy gleichzeitig)? → Beide Sessions sind unabhängig gültig, kein Konflikt
- Wie reagiert die App auf einen ungültigen/manipulierten `redirect`-Parameter in der Login-URL? → Nur relative, App-interne Pfade werden als Redirect-Ziel akzeptiert (Schutz vor Open-Redirect); ungültige Werte fallen auf `/dashboard` zurück
- Was zeigt die Login-Seite während des Auth-Checks beim initialen Laden (bevor bekannt ist, ob eine Session existiert)? → Kurzer Ladezustand (Spinner/Skeleton), kein Flackern zwischen Login-Formular und Dashboard-Platzhalter

## Technical Requirements (optional)
- Security: Row Level Security auf allen Tabellen aktiviert (auch `profiles`), kein Zugriff ohne gültige Session
- Security: Redirect-Parameter wird gegen Open-Redirect validiert (nur relative Pfade erlaubt)
- Security: Supabase Anon Key ist client-seitig exponiert (by design), sensible Operationen laufen ausschließlich über RLS-geschützte Queries, kein Service-Role-Key im Frontend
- Performance: Auth-Check beim Seitenaufruf < 300ms (Supabase Standard)

## Open Questions
- [ ] Keine offenen Punkte — alle Kernentscheidungen wurden im Interview geklärt

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kein öffentliches Sign-up, Account wird manuell in Supabase angelegt | Nur ein Nutzer (Lukas) in dieser Version, Multi-Tenant ist Non-Goal laut PRD | 2026-08-03 |
| Kein In-App Passwort-Reset-Flow | Bei nur einem Account reicht manueller Reset über Supabase-Dashboard, spart Aufwand | 2026-08-03 |
| PROJ-1 umfasst nur Auth-Infrastruktur + `profiles`-Tabelle, keine fachlichen Hub-Tabellen | Hält den Scope klar abgegrenzt; fachliche Tabellen entstehen in den jeweiligen Backend-Specs (PROJ-2 ff.) | 2026-08-03 |
| Redirect-Ziel nach Login via `?redirect=`-Parameter, Default `/dashboard` | Bessere UX als immer auf Startseite zu landen; `/dashboard` existiert vorerst nur als Platzhalter, da PROJ-9 noch nicht gebaut ist | 2026-08-03 |
| Generische Fehlermeldung bei falschen Zugangsdaten | Verhindert, dass Angreifer erraten können, ob eine E-Mail-Adresse existiert (Security Best Practice) | 2026-08-03 |
| Kein Rate-Limiting/Lockout auf App-Ebene | Nur ein legitimer Nutzer, kein Multi-User-Bedrohungsmodell; Supabase-eigener Schutz reicht | 2026-08-03 |
| Lange, persistente Session ohne manuellen Timeout | Persönliches Tool für tägliche Nutzung über 14 Monate; Reibungsverluste durch häufiges Neu-Einloggen sollen vermieden werden | 2026-08-03 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| `@supabase/ssr` zusätzlich zu `@supabase/supabase-js` installieren | Standard-Empfehlung von Supabase für Next.js App Router; erlaubt sicheren Session-Zugriff sowohl in Middleware/Server Components als auch im Browser | 2026-08-04 |
| Routen-Schutz über zentrale Next.js Middleware statt Prüfung in jeder einzelnen Seite | Eine Stelle prüft bei jedem Request die Session; künftige geschützte Seiten (Dashboard, alle Hubs) brauchen keine eigene Auth-Logik mehr | 2026-08-04 |
| Login-Vorgang läuft über eine Server Action, nicht über einen direkten Client-Aufruf | Zugangsdaten werden serverseitig verarbeitet statt im Browser-JavaScript; sicherer Standardansatz für Formulare im App Router | 2026-08-04 |
| Schema-Änderungen (inkl. `profiles`-Tabelle und RLS-Policy) über versionierte Supabase-CLI-Migrationsdateien im Repo (`supabase/migrations/`) | Nutzerentscheidung: nachvollziehbare, in Git versionierte Schema-Historie — wichtig, da noch 8 weitere Features eigene Tabellen anlegen werden | 2026-08-04 |
| Row Level Security auf `profiles` von Anfang an aktiv, nicht erst bei Bedarf nachgerüstet | Etabliert das RLS-Muster, das alle künftigen Hub-Tabellen (PROJ-2 ff.) übernehmen; verhindert versehentlich offene Endpunkte auch bei nur einem Nutzer | 2026-08-04 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
App (Next.js App Router)
├── Middleware (läuft vor jedem Request)
│   └── Prüft Session → leitet bei fehlender Session zu /login?redirect=<pfad> um
│
├── /login (öffentliche Route)
│   └── Login-Seite
│       ├── Ladezustand (kurz, während initialer Auth-Check läuft)
│       └── Login-Formular
│           ├── E-Mail-Feld + Validierung
│           ├── Passwort-Feld + Validierung
│           ├── Fehleranzeige (falsche Zugangsdaten / Verbindungsfehler)
│           └── "Anmelden"-Button (löst Server Action aus)
│
└── /dashboard (geschützte Route — Platzhalter bis PROJ-9)
    └── Platzhalter-Seite
        ├── "Eingeloggt als [E-Mail]"
        └── "Abmelden"-Button
```

### Data Model (in plain language)
```
Tabelle "profiles" (eine Zeile pro Supabase-Auth-Nutzer):
- id            → verweist auf den zugehörigen Auth-Nutzer
- email
- created_at

Zugriffsregel (Row Level Security):
Ein Nutzer sieht und bearbeitet ausschließlich seine eigene Zeile
(Muster: user_id = aktuell eingeloggter Nutzer). Dieses Muster wird
von allen künftigen Hub-Tabellen (Themenkatalog, Karteikarten, ...)
übernommen.

Gespeichert in: Supabase (PostgreSQL) — zentral, cloud-basiert,
über Geräte hinweg synchron.
```

### Tech Decisions (Reasoning)
- **Supabase Auth (E-Mail + Passwort):** bereits über Env-Variablen und Client vorbereitet; deckt Login, Logout und automatisches Session-Refresh ab, ohne eigene Auth-Logik bauen zu müssen.
- **`@supabase/ssr` zusätzlich installieren:** ermöglicht der Middleware und den Server-Komponenten, die Session sicher zu lesen — nötig für den Routen-Schutz und die Server Action beim Login.
- **Zentrale Middleware für Routen-Schutz:** eine einzige Stelle entscheidet, ob eine Seite geschützt ist und leitet bei fehlender Session um. Jede künftige Seite (Dashboard, alle Hubs) ist damit automatisch abgesichert, ohne dass das dort erneut implementiert werden muss.
- **Server Action für den Login:** die eingegebenen Zugangsdaten werden auf dem Server verarbeitet statt im Browser-JavaScript — reduziert die Angriffsfläche und ist der im App Router vorgesehene Standardweg für Formulare.
- **Supabase-CLI-Migrationen:** Schema-Änderungen (die `profiles`-Tabelle und ihre RLS-Policy) werden als SQL-Dateien im Repo versioniert und über die Supabase CLI auf das Projekt angewendet — schafft eine nachvollziehbare Historie für alle künftigen Tabellen.
- **RLS von Anfang an aktiv:** auch bei nur einem Nutzer verhindert das, dass versehentlich ungeschützte Datenzugriffe entstehen, und legt das Muster für alle folgenden Features fest.

### Dependencies
- `@supabase/ssr` — Session-Verwaltung serverseitig (Middleware, Server Components, Server Actions)
- `@supabase/supabase-js` — bereits installiert, Basis-Client für Auth und Datenbankzugriff
- Supabase CLI (lokales Werkzeug, kein npm-Paket im Projekt) — zum Erstellen und Anwenden der Migrationsdateien

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
