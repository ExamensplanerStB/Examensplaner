# PROJ-2: Zentraler Themenkatalog

## Status: Planned
**Created:** 2026-08-13
**Last Updated:** 2026-08-13

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Route `/themen` und das RLS-Muster

## User Stories
- Als Lukas möchte ich pro Fach neue Themen anlegen können, damit ich meine Karteikarten, Übungsaufgaben und Probeklausuren später danach einordnen kann.
- Als Lukas möchte ich gewarnt werden, wenn ein Themenname (unabhängig von Groß-/Kleinschreibung) innerhalb eines Fachs bereits existiert, damit keine Dopplungen durch unterschiedliche Schreibweisen entstehen.
- Als Lukas möchte ich ein bestehendes Thema auf der Themenverwaltungs-Seite umbenennen können, damit ich Tippfehler korrigieren kann, ohne die zugrunde liegende Zuordnung zu verlieren.
- Als Lukas möchte ich, dass eine Umbenennung automatisch überall dort sichtbar wird, wo das Thema bereits verwendet wird (z.B. bei bestehenden Karteikarten), damit ich Bezeichnungen konsistent halten kann, ohne jeden Eintrag einzeln anzupassen.
- Als Lukas möchte ich ein Thema auf der Themenverwaltungs-Seite löschen können, mit einer Sicherheitsabfrage davor, damit ich nicht versehentlich Themen entferne.
- Als Lukas möchte ich jedem Thema eine Klausurrelevanz (hoch/mittel/niedrig) zuweisen können, damit ich auf einen Blick sehe, welche Themen für das Examen besonders wichtig sind.
- Als Lukas möchte ich alle Themen gruppiert nach den 3 Klausurtagen und 11 Fächern auf einen Blick sehen, damit ich den Überblick über meinen Themenkatalog behalte.
- Als Entwickler (Claude Code) möchte ich eine zentrale, RLS-geschützte `themen`-Datenquelle haben, damit PROJ-3, PROJ-4 und PROJ-5 künftig konsistent darauf referenzieren können.
- Als Entwickler (Claude Code) möchte ich ein einheitliches technisches Muster für die Themenzuordnung (Datenmodell + UI-Komponente) etablieren, damit Karteikarten, Übungsaufgaben und Probeklausuren die Verknüpfung zu Themen identisch umsetzen, statt drei eigenständige Lösungen für dasselbe Konzept zu bauen.

## Out of Scope
- Verwaltung der 11 Fächer selbst (Name, Zuordnung zum Klausurtag) — diese sind laut PRD fest vorgegeben und in dieser Version nicht durch den Nutzer editierbar
- Die wiederverwendbare Mehrfachauswahl-Komponente (Chip-Eingabefeld), mit der Themen einer Karteikarte/Übungsaufgabe/Probeklausur zugeordnet werden — wird erst mit PROJ-3 (Karteikarten-Hub) gebaut, wenn das erste Formular sie tatsächlich braucht. **Vorgabe für PROJ-3:** Diese Komponente muss sowohl die Auswahl bereits angelegter Themen als auch die Neuanlage eines Themas direkt im Formular unterstützen (analog Design-Prototyp) — neu angelegte Themen erhalten dabei automatisch die Standard-Klausurrelevanz „Mittel". **Vorgabe für PROJ-4 und PROJ-5:** Beide übernehmen exakt dieselbe Komponente und dasselbe Zuordnungsmuster (Fremdschlüssel auf `themen.id`) aus PROJ-3 unverändert — keine eigenständige Neuentwicklung für Übungsaufgaben oder Probeklausuren
- Die eigentlichen Zuordnungstabellen zwischen Themen und Karteikarten/Übungsaufgaben/Probeklausuren — entstehen jeweils in PROJ-3/4/5
- Anzeige der Anzahl betroffener Einträge beim Löschen eines Themas ("Thema wird in X Einträgen verwendet") — technisch erst möglich, sobald PROJ-3/4/5 Fremdschlüssel auf `themen` anlegen; PROJ-2 zeigt vorerst nur einen generischen Bestätigungsdialog
- Der "Themen verwalten"-Button im Header der Hub-Seiten (wie im Design-Prototyp) — kommt mit PROJ-3/4/5, sobald diese Seiten existieren. Die eigenständige Route `/themen` bleibt jedoch dauerhaft bestehen (nicht nur Übergangslösung bis die Hubs existieren) — sie ist und bleibt der einzige Ort, an dem Themen umbenannt, gelöscht oder in der Klausurrelevanz eingestuft werden können
- Bearbeitung der Klausurrelevanz an anderer Stelle als der `/themen`-Seite — auch das künftige Chip-Eingabefeld in PROJ-3/4/5 erlaubt nur Auswahl/Neuanlage von Themen, keine Änderung der Klausurrelevanz
- Zusammenführen (Merge) von zwei versehentlich doppelt angelegten Themen — falls die Duplikatsprüfung durch stark abweichende Schreibweisen umgangen wird, bleibt nur manuelles Löschen/Neuanlegen
- Sortieren/Umsortieren der Themenreihenfolge per Drag & Drop
- Import/Export von Themenlisten
- Cross-Fach-Themen (ein Thema, das mehreren Fächern gleichzeitig zugeordnet ist) — jedes Thema gehört genau zu einem Fach
- Verwendung der Klausurrelevanz in der Kompetenzanalyse-Berechnung (PROJ-8) — hier wird nur das Datenfeld geschaffen, die fachliche Verknüpfung zur Berechnung ist Teil der PROJ-8-Spezifikation

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er `/themen` direkt aufruft, dann wird er zu `/login?redirect=/themen` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt und öffnet `/themen`, wenn die Seite lädt, dann werden alle 3 Klausurtage mit ihren jeweiligen Fächern angezeigt, jedes Fach mit seinen bestehenden Themen inkl. ihrer Klausurrelevanz
- [ ] Angenommen ein Fach hat noch keine Themen, wenn die Seite lädt, dann erscheint für dieses Fach der Hinweistext „Noch keine Themen"
- [ ] Angenommen der Nutzer wählt ein Fach und tippt einen neuen, in diesem Fach noch nicht existierenden Themennamen ein, wenn er auf „Hinzufügen" klickt (oder Enter drückt), dann wird das Thema mit der Standard-Klausurrelevanz „Mittel" angelegt und erscheint sofort unter dem gewählten Fach
- [ ] Angenommen der Nutzer tippt einen Themennamen ein, der (Groß-/Kleinschreibung sowie führende/folgende Leerzeichen ignoriert) bereits im gewählten Fach existiert, wenn er auf „Hinzufügen" klickt, dann wird die Aktion verhindert, eine Fehlermeldung „Dieses Thema existiert bereits in [Fach]" erscheint, und kein Duplikat wird angelegt
- [ ] Angenommen das Eingabefeld für einen neuen Themennamen ist leer oder enthält nur Leerzeichen, dann bleibt der „Hinzufügen"-Button deaktiviert
- [ ] Angenommen der Nutzer tippt einen Themennamen, der bereits (unter beliebiger Schreibweise) in einem anderen Fach existiert, wenn er auf „Hinzufügen" klickt, dann wird das Thema ohne Fehlermeldung angelegt (Duplikatsprüfung gilt nur innerhalb desselben Fachs)
- [ ] Angenommen ein Thema existiert, wenn der Nutzer auf `/themen` die Klausurrelevanz ändert (hoch/mittel/niedrig), dann wird die neue Einstufung sofort gespeichert und angezeigt
- [ ] Angenommen ein Thema existiert, wenn der Nutzer die Umbenennen-Aktion nutzt, einen neuen Namen einträgt und bestätigt, dann wird der Themenname aktualisiert, ohne dass sich die Themen-ID oder die Klausurrelevanz ändert
- [ ] Angenommen ein Thema wurde umbenannt und ist bereits einer Karteikarte/Übungsaufgabe/Probeklausur zugeordnet (sobald PROJ-3/4/5 existieren), dann zeigen diese Einträge automatisch den neuen Namen, ohne dass an den Einträgen selbst etwas geändert werden muss (Referenzierung über die unveränderte Themen-ID)
- [ ] Angenommen der neue Name beim Umbenennen kollidiert (Groß-/Kleinschreibung egal) mit einem anderen bestehenden Thema im selben Fach, wenn der Nutzer speichert, dann wird die Änderung verhindert und eine Fehlermeldung angezeigt
- [ ] Angenommen ein Thema existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor das Thema entfernt wird
- [ ] Angenommen der Bestätigungsdialog zum Löschen ist geöffnet, wenn der Nutzer abbricht, dann bleibt das Thema (inkl. Klausurrelevanz) unverändert erhalten
- [ ] Angenommen der Bestätigungsdialog zum Löschen ist geöffnet, wenn der Nutzer bestätigt, dann wird das Thema entfernt und verschwindet sofort aus der Liste
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Hinzufügen/Umbenennen/Löschen/Einstufen eines Themas fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" und der vorherige Zustand bleibt unverändert sichtbar
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf die `themen`-Tabelle zuzugreifen, dann verweigert RLS jeden Zugriff (keine Zeile wird zurückgegeben)

## Edge Cases
- Was passiert, wenn der Nutzer einen extrem langen Themennamen eingibt? → Validierungsfehler mit Zeichenlimit-Hinweis (Limit wird in `/architecture` festgelegt)
- Wie verhält sich die Duplikatsprüfung bei Sonder-/Leerzeichen-Varianten (z.B. „AO §370" vs. „AO  § 370")? → Nur exakte Übereinstimmung nach Trimmen und Groß-/Kleinschreibung wird erkannt; abweichende Schreibweisen werden nicht automatisch erkannt (siehe Out of Scope: kein Merge-Flow)
- Was zeigt `/themen`, bevor die Daten vom Server geladen sind? → Kurzer Ladezustand (Skeleton), kein Flackern
- Was passiert, wenn zwei Browser-Tabs gleichzeitig geöffnet sind und in beiden ein Thema angelegt/gelöscht/umbenannt wird? → Kein Konflikt-Handling in dieser Version (nur ein Nutzer, kein Concurrent-Editing-Schutz); die zuletzt gespeicherte Aktion gewinnt, Seite muss ggf. manuell neu geladen werden
- Wie reagiert die Anwendung, wenn ein Thema gelöscht wird, während der Nutzer gerade die Umbenennen-Aktion für dasselbe Thema in einem anderen Tab offen hat? → Kein Sonderfall in dieser Version (Single-User, geringe Wahrscheinlichkeit); die zweite Aktion schlägt mit der generischen Verbindungsfehlermeldung fehl, falls die Zeile nicht mehr existiert
- Ändert sich die Klausurrelevanz rückwirkend für bereits ausgewertete Kompetenzanalyse-Daten? → Nicht Teil von PROJ-2; die Verrechnung ist Sache der PROJ-8-Spezifikation

## Technical Requirements (optional)
- Security: `themen`-Tabelle ist RLS-geschützt nach dem in PROJ-1 etablierten Muster (kein Zugriff ohne gültige Session, Zugriff nur auf eigene Daten)
- Security: Die 11 Fächer und ihre Zuordnung zu den 3 Klausurtagen (Verfahrensrecht/Ertragsteuern/Bilanzsteuerrecht) sind feste Referenzdaten gemäß PRD, nicht über die UI editierbar
- Datenmodell: Jedes Thema hat neben Name und Fach-Zuordnung eine Klausurrelevanz (hoch/mittel/niedrig, Standard bei Neuanlage: mittel)
- Datenmodell: Künftige Hub-Tabellen (PROJ-3/4/5) müssen Themen über die Themen-ID referenzieren (Fremdschlüssel), nicht über eine Kopie des Namens — nur so wirkt sich ein Umbenennen automatisch überall aus, ohne Folge-Updates in den Hub-Tabellen
- Datenmodell: Die technische Umsetzung der Themenzuordnung (Aufbau der Zuordnungstabelle UND die verwendete UI-Komponente) ist für Karteikarten, Übungsaufgaben und Probeklausuren identisch — PROJ-3 etabliert das Muster einmalig, PROJ-4 und PROJ-5 übernehmen es unverändert statt eigener Lösungen
- Performance: Laden der Themenübersicht < 300ms (analog Auth-Check-Vorgabe aus PROJ-1)

## Open Questions
- [x] Zeichenlimit für Themennamen — in `/architecture` auf 100 Zeichen festgelegt (siehe Technical Decisions)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Themen können später mehreren Karteikarten/Übungsaufgaben/Probeklausur-Teilen gleichzeitig zugeordnet werden (Mehrfachauswahl statt Einzel-Dropdown) | Entspricht dem validierten Design-Prototyp (Chip-Eingabefeld); ein einzelner Eintrag kann fachlich mehrere Themen berühren (z.B. eine Klausur-Teilaufgabe zu AO und FGO) | 2026-08-13 |
| Themenverwaltung erhält eine eigenständige, dauerhaft bestehende Route `/themen` | Hub-Seiten (PROJ-3/4/5) existieren noch nicht; PROJ-2 muss eigenständig nutzbar und testbar sein. Bleibt auch nach PROJ-3/4/5 der einzige Ort für Umbenennen/Löschen/Klausurrelevanz-Einstufung | 2026-08-13 |
| Umbenennen und Löschen von Themen sind ausschließlich auf `/themen` möglich | Nutzerentscheidung: zentrale, kontrollierte Verwaltung statt verteilter Bearbeitungsmöglichkeiten in jedem Hub | 2026-08-13 |
| Löschen eines Themas erfordert einen Bestätigungsdialog | Schutz vor versehentlichem Datenverlust; einfacher als der Prototyp (der keinen Dialog zeigt) | 2026-08-13 |
| Duplikatsprüfung für Themennamen gilt pro Fach (case-insensitive), nicht global | Entspricht dem Prototyp-Verhalten; verschiedene Fächer dürfen gleichnamige Themen haben, ohne dass das als Duplikat gilt | 2026-08-13 |
| Jedes Thema erhält eine Klausurrelevanz (hoch/mittel/niedrig), nur über `/themen` editierbar | Nutzerentscheidung: sichtbare Priorisierung der Themen für die Prüfungsvorbereitung, zentral gepflegt statt verteilt | 2026-08-13 |
| Neue Themen erhalten automatisch die Klausurrelevanz „Mittel", keine Pflichtabfrage beim Anlegen | Hält das schnelle Anlegen eines Themas (auch später inline aus einem Hub-Formular heraus) reibungslos; Einstufung kann jederzeit auf `/themen` nachgetragen werden | 2026-08-13 |
| Umbenennen aktualisiert automatisch alle referenzierenden Einträge, da Hub-Tabellen künftig per Themen-ID (nicht Namenskopie) referenzieren müssen | Nutzerentscheidung: eine Umbenennung soll überall wirken, ohne Einträge einzeln anzupassen; etabliert das Referenzierungsmuster für PROJ-3/4/5 | 2026-08-13 |
| Die wiederverwendbare Mehrfachauswahl-Komponente (ThemaFeld) wird NICHT in PROJ-2 gebaut, sondern erst in PROJ-3 — muss dort aber sowohl Neuanlage als auch Auswahl bestehender Themen unterstützen | Ohne ein Hub-Formular, das sie einbindet, wäre die Komponente ungenutzter Code; die Anforderung „Neuanlage UND Auswahl bestehender Themen" wird hier für PROJ-3 festgehalten, damit sie beim Schreiben der PROJ-3-Spezifikation nicht verloren geht | 2026-08-13 |
| Die technische Umsetzung der Themenzuordnung (Datenmodell + UI-Komponente) muss in PROJ-3, PROJ-4 und PROJ-5 identisch sein, nicht drei unabhängige Lösungen | Nutzerentscheidung: verhindert inkonsistente Implementierungen desselben Konzepts über die drei Hubs hinweg; PROJ-3 (zuerst gebaut) etabliert das Muster, PROJ-4 und PROJ-5 übernehmen es unverändert | 2026-08-13 |
| Der Lösch-Bestätigungsdialog zeigt in PROJ-2 noch keine Anzahl betroffener Einträge | Mangels existierender Hub-Tabellen wäre die Zahl aktuell immer 0; die Zählung wird als Folgearbeit in PROJ-3/4/5 ergänzt, sobald diese Fremdschlüssel auf `themen` anlegen | 2026-08-13 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Die 11 Fächer werden als eigene, feste Datenbanktabelle (`faecher`) angelegt statt im Anwendungscode hinterlegt | Ermöglicht künftigen Features (Wiederholungsplan PROJ-7, Kompetenzanalyse PROJ-8) sauberes Verknüpfen/Filtern nach Fach und Klausurtag direkt in der Datenbank; die Datenbank selbst stellt sicher, dass jedes Thema wirklich einem gültigen Fach zugeordnet ist, statt sich auf Code-Constants zu verlassen | 2026-08-13 |
| Eindeutigkeit von Themennamen pro Fach (case-insensitive) wird als Datenbank-Regel erzwungen, nicht nur im Formular geprüft | Verhindert doppelte Themen zuverlässig, auch bei gleichzeitigen Anfragen — konsistent mit dem "keine Dopplungen"-Ziel aus der Spezifikation | 2026-08-13 |
| Themenname ist auf 100 Zeichen begrenzt | Löst die offene Frage aus der Spezifikation; ausreichend für auch längere Themenbezeichnungen (Praxisbeispiele aus dem Prototyp liegen bei ca. 40 Zeichen), verhindert aber ausufernde Eingaben in der Chip-Darstellung | 2026-08-13 |
| Alle Aktionen auf `/themen` (Hinzufügen, Umbenennen, Löschen, Klausurrelevanz ändern) laufen über Server Actions, keine eigenen API-Routen | Konsistent mit dem in PROJ-1 etablierten Muster (Login lief bereits über eine Server Action); Zugangsdaten/Mutationen werden serverseitig verarbeitet, kein Aufbau einer separaten REST-API nötig | 2026-08-13 |
| RLS auf `themen` folgt exakt dem PROJ-1-Muster (`user_id = auth.uid()`); `faecher` ist für jeden eingeloggten Nutzer lesbar, aber ohne Schreibrechte für den Nutzer | Konsistent mit der bereits abgenommenen Sicherheitsarchitektur; `faecher` ist reine Referenzdatenquelle, keine persönlichen Nutzerdaten | 2026-08-13 |
| Schema (Tabellen `faecher` + `themen`) und die Seed-Daten der 11 Fächer werden über eine versionierte Supabase-CLI-Migration angelegt | Gleiches Vorgehen wie bei der `profiles`-Tabelle in PROJ-1 — nachvollziehbare, im Repo versionierte Historie | 2026-08-13 |
| Keine neuen npm-Pakete nötig — Formulare nutzen react-hook-form + Zod (aus PROJ-1), UI nutzt die bereits installierten shadcn/ui-Komponenten Select, AlertDialog, Badge, Skeleton | Alle benötigten Bausteine sind bereits im Projekt vorhanden; PRD-Vorgabe "shadcn/ui first" | 2026-08-13 |
| Fach-zu-Klausurtag-Zuordnung der Seed-Daten (K1 Verfahrensrecht: AO/FGO/USt/BewG/ErbSt · K2 Ertragsteuern: ESt/KSt/GewSt/IntStR · K3 Bilanzsteuerrecht: Bilanz/UmwStR) per Web-Recherche gegen § 37 Abs. 3 StBerG, BStBK und Steuerberaterkammer München geprüft, nicht ungeprüft aus dem Prototyp übernommen | Gesetzestext definiert nur grobe Prüfungsgebiete, keine klausurscharfe Einzelfach-Zuordnung; bei Umwandlungssteuerrecht widersprachen sich Sekundärquellen (Tag 2 vs. Tag 3) — Nutzer hat als StB-Kandidat die Zuordnung zu Tag 3 (wie Prototyp) verbindlich bestätigt | 2026-08-13 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
/themen (geschützte Route — Zugriff nur eingeloggt, sonst Redirect zu /login,
          gesichert durch die bestehende Middleware aus PROJ-1)
└── Themenverwaltungs-Seite
    ├── Seitentitel + Kurzbeschreibung
    │
    ├── Neues-Thema-Formular
    │   ├── Fach-Auswahl (Dropdown, alle 11 Fächer)
    │   ├── Themenname-Eingabefeld (max. 100 Zeichen)
    │   └── "Hinzufügen"-Button (deaktiviert bei leerem/nur-Leerzeichen-Namen)
    │
    ├── Themenübersicht (gruppiert, analog Design-Prototyp)
    │   └── Je Klausurtag (K1 Verfahrensrecht / K2 Ertragsteuern / K3 Bilanzsteuerrecht)
    │       └── Je Fach im Klausurtag
    │           ├── Fach-Titel
    │           └── Themen-Liste als Chips (oder Hinweistext "Noch keine Themen")
    │               └── Je Thema
    │                   ├── Themenname (per Umbenennen-Aktion editierbar)
    │                   ├── Klausurrelevanz-Auswahl (hoch/mittel/niedrig)
    │                   └── Löschen-Aktion → öffnet Bestätigungsdialog
    │
    ├── Lösch-Bestätigungsdialog (Abbrechen / Löschen)
    └── Lade-/Fehlerzustände (Skeleton beim initialen Laden, "Verbindung fehlgeschlagen"-Hinweis bei Netzwerkfehlern)
```

### Data Model (in plain language)
```
Tabelle "faecher" (feste Referenzdaten, 11 Zeilen, einmalig per Migration
angelegt und befüllt, nicht über die UI editierbar):
- id
- name        → z.B. "Einkommensteuer"
- kuerzel     → z.B. "ESt"
- klausurtag  → 1, 2 oder 3 (Verfahrensrecht / Ertragsteuern / Bilanzsteuerrecht)

Tabelle "themen" (vom Nutzer gepflegt):
- id
- fach_id          → verweist auf "faecher"
- name              → max. 100 Zeichen
- klausurrelevanz   → hoch / mittel / niedrig, Standard bei Neuanlage: mittel
- user_id           → verweist auf den eingeloggten Nutzer (RLS-Muster aus PROJ-1)
- created_at

Eindeutigkeitsregel: Innerhalb desselben Fachs darf ein Themenname
(Groß-/Kleinschreibung ignoriert) nur einmal vorkommen — von der
Datenbank selbst erzwungen, nicht nur im Formular geprüft.

Zugriffsregel (Row Level Security):
- "themen": ein Nutzer sieht und bearbeitet ausschließlich eigene Themen
  (exakt das Muster aus PROJ-1: user_id = eingeloggter Nutzer)
- "faecher": für jeden eingeloggten Nutzer lesbar, vom Nutzer nicht
  veränderbar (feste Referenzdaten)

Wichtig für PROJ-3/4/5: Künftige Tabellen (Karteikarten, Übungsaufgaben,
Probeklausuren) verweisen auf ein Thema über dessen "id", nicht über eine
Kopie des Namens — dadurch wirkt sich ein Umbenennen automatisch überall
aus, ohne dass diese Tabellen angefasst werden müssen.

Gespeichert in: Supabase (PostgreSQL) — wie alle bisherigen Daten, zentral
und über Geräte hinweg synchron.
```

### Tech Decisions (Reasoning)
- **`faecher` als eigene Datenbanktabelle statt Code-Konstante:** erlaubt sauberes Verknüpfen/Filtern nach Fach und Klausurtag direkt in der Datenbank für künftige Features (Wiederholungsplan, Kompetenzanalyse), und die Datenbank erzwingt selbst, dass jedes Thema einem gültigen Fach zugeordnet ist.
- **Eindeutigkeit auf Datenbankebene statt nur im Formular:** zuverlässiger Schutz vor Duplikaten, auch bei gleichzeitigen Anfragen.
- **Server Actions statt eigener API-Routen:** konsistent mit dem bereits abgenommenen Muster aus PROJ-1 (Login-Formular); Mutationen laufen serverseitig, keine separate REST-API nötig.
- **RLS-Muster 1:1 aus PROJ-1 übernommen:** etabliertes, bereits geprüftes Sicherheitsmuster, keine neue Logik nötig.
- **Supabase-CLI-Migration für Schema + Seed-Daten:** gleiches, bereits bewährtes Vorgehen wie bei der `profiles`-Tabelle — nachvollziehbare Versionshistorie im Repo.
- **Themen-ID als Referenzpunkt für künftige Hub-Tabellen:** technische Grundlage dafür, dass Umbenennen sich automatisch überall auswirkt (Anforderung aus der Spezifikation).

### Dependencies
- Keine neuen npm-Pakete — react-hook-form, Zod und die benötigten shadcn/ui-Komponenten (Select, AlertDialog, Badge, Skeleton, Input, Button) sind bereits im Projekt installiert
- Supabase CLI (lokales Werkzeug, kein npm-Paket) — bereits aus PROJ-1 im Einsatz, für die neue Migration

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
