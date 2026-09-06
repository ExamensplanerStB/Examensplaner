# PROJ-4: Übungsaufgaben-Hub

## Status: In Progress
**Created:** 2026-09-06
**Last Updated:** 2026-09-06

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Hub-Route und das RLS-Muster
- PROJ-2 (Zentraler Themenkatalog) — Übungsaufgaben referenzieren Themen über `themen.id`; nutzt die `ThemaFeld`-Komponente unverändert (wie bereits in PROJ-3 etabliert)

## User Stories
- Als Lukas möchte ich eine extern gelöste Übungsaufgabe mit Titel, Fach, mindestens einem Thema und optional einer Quelle erfassen können, damit ich meine Anwendungspraxis systematisch dokumentiere, ohne die Aufgabe selbst in der App abzutippen.
- Als Lukas möchte ich eine erfasste Aufgabe getrennt nach Fachlich und Klausurtechnik (je 1–5) bewerten können, damit ich erkenne, ob ein Fehler an der rechtlichen Argumentation oder an der Darstellung/dem Gutachtenstil lag.
- Als Lukas möchte ich, dass die App mir bei einer schwachen Bewertung automatisch eine Pflicht-Wiederholung mit passendem Abstand vorschlägt, damit ich Schwachstellen zeitnah und gezielt nachhole, statt sie zu vergessen.
- Als Lukas möchte ich zu jeder Bewertung eine eigene, historisierte Fehlernotiz hinterlegen können, damit ich bei einer späteren Wiederholung nachvollziehen kann, was beim letzten Versuch konkret schiefging.
- Als Lukas möchte ich auf einen Blick den Status jeder Aufgabe sehen (unbewertet, gültig, Wiederholung fällig, verfallen, geschlossen), damit ich weiß, wo ich als Nächstes ansetzen muss.
- Als Lukas möchte ich Aufgaben nach Fach und Status filtern und nach Fälligkeit oder Fach sortieren können, damit ich gezielt in einem Themenbereich oder an fälligen Wiederholungen arbeiten kann.
- Als Entwickler (Claude Code) möchte ich jede Bewertung zusätzlich in der gemeinsamen Historientabelle protokollieren, damit PROJ-8 (Kompetenzanalyse) später darauf aufbauen kann, ohne dass rückwirkend Daten fehlen.

## Out of Scope
- Erfassung der Aufgabenstellung/des Sachverhalts oder der eigenen Lösung im Detail in der App — reines Tracking-Tool, das Lösen erfolgt extern (Papier/Aufgabenbuch)
- Fokuseinheit / geführter Session-Modus (wie bei PROJ-3) — bewusst nicht umgesetzt, siehe Decision Log
- Zwei getrennte Fehlernotiz-Felder (fachlich/Klausurtechnik) — ein gemeinsames Feld genügt, siehe Decision Log
- Funktionale Verlinkung zu betroffenen Karteikarten bei der „Nacharbeit empfohlen"-Meldung — reiner Text-Hinweis in dieser Version; eine echte hub-übergreifende Verknüpfung ist Teil von PROJ-7 (Wiederholungsplan)
- Wiederholungsplan (hub-übergreifende Aggregation aller fälligen Wiederholungen über Karteikarten/Übungsaufgaben/Probeklausuren) — eigenständiges Feature PROJ-7
- Themen-Stufenlogik, Fach-Ebene-Kennzahlen, Kalibrierungs-Auswertungen (Abschnitte 5, 8, 9 der Berechnungsspezifikation) — vollständig Teil von PROJ-8
- Erneute Bewertung einer Aufgabe nach Status „Geschlossen" — bewusste Sackgasse, siehe Decision Log
- Manuelles Verschieben/Vorziehen des automatisch berechneten Pflicht-Wiederholungsdatums — das Bewerten-Formular ist ohnehin jederzeit vorher nutzbar (siehe Decision Log), ein separates Termin-Editierfeld ist nicht nötig
- Eine Parameter-Einstellungsseite für die Wiederholungs-Parameter (UEB_HALTBARKEIT, UEB_WDH_BEI_3 etc.) — feste Default-Werte im Code, keine UI (analog PROJ-3)
- Mehrfachauswahl/Stapel-Aktionen (Bulk-Löschen, Bulk-Bewerten)
- Import/Export von Übungsaufgaben
- Offline-Nutzung ohne Internetverbindung
- Bilder/Anhänge an Aufgaben (nur Text)
- Zeitmessung während der Bearbeitung (Lernzeittracking ist laut PRD P2/Non-Goal dieser Version)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Übungsaufgaben-Route direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn der Übungsaufgaben-Hub lädt, dann werden alle eigenen Aufgaben geladen und entsprechend der aktuellen Filter/Sortierung angezeigt (Standard: alle Fächer, alle Status, sortiert nach Fälligkeit)
- [ ] Angenommen es existieren noch keine Aufgaben, wenn der Hub lädt, dann erscheint der Hinweis „Keine Übungsaufgaben" statt einer leeren Liste

### Anlegen
- [ ] Angenommen der Nutzer öffnet das Formular für eine neue Aufgabe, wenn er ein Fach wählt, dann wird das Themenfeld aktiv und zeigt ausschließlich Themen dieses Fachs zur Auswahl oder Neuanlage
- [ ] Angenommen Titel, Fach oder mindestens ein Thema fehlen, wenn der Nutzer speichern möchte, dann wird das Speichern verhindert und für jedes fehlende Pflichtfeld eine Validierungsfehlermeldung angezeigt
- [ ] Angenommen Titel, Fach und mindestens ein Thema sind ausgefüllt (Quelle optional), wenn der Nutzer speichert, dann wird die Aufgabe mit Status „Unbewertet" angelegt und erscheint sofort in der Liste — ohne Bewertung, ohne Fälligkeitsdatum
- [ ] Angenommen der Nutzer tippt im Themenfeld einen im gewählten Fach noch nicht existierenden Namen ein, wenn er die Neuanlage-Option wählt, dann wird das Thema mit der Standard-Klausurrelevanz „Mittel" angelegt (PROJ-2-Verhalten) und der Aufgabe direkt zugeordnet

### Bewertung & Wiederholungslogik
- [ ] Angenommen eine Aufgabe hat Status „Unbewertet" oder „Wiederholung fällig", wenn der Nutzer das Bewerten-Formular öffnet, dann kann er unabhängig vom Fälligkeitsdatum sofort Fachlich (1–5), Klausurtechnik (1–5) und optional eine Fehlernotiz erfassen
- [ ] Angenommen eine Bewertung wird gespeichert und `worst = min(Fachlich, Klausurtechnik)` ist ≥ 4, dann erhält die Aufgabe Status „Gültig", eine Gültigkeit von 56 Tagen ab Bewertungsdatum, und es wird keine weitere Pflicht-Wiederholung gesetzt
- [ ] Angenommen eine Bewertung wird gespeichert und `worst` ist genau 3, dann erhält die Aufgabe eine Pflicht-Wiederholung in 7 Tagen und zeigt den Status „Wiederholung fällig am [Datum]"
- [ ] Angenommen eine Bewertung wird gespeichert und `worst` ist ≤ 2, dann erscheint zusätzlich der Hinweis „Erst Nacharbeit empfohlen" und die Aufgabe erhält eine Pflicht-Wiederholung in 5 Tagen
- [ ] Angenommen eine Aufgabe hat bereits eine Erstbewertung mit `worst` ≤ 3 erhalten, wenn die fällige Wiederholung bewertet wird und `worst` jetzt ≥ 4 ist, dann wechselt die Aufgabe zu Status „Gültig" (56 Tage ab diesem Bewertungsdatum)
- [ ] Angenommen eine Aufgabe hat bereits eine Erstbewertung mit `worst` ≤ 3 erhalten, wenn die fällige Wiederholung bewertet wird und `worst` weiterhin ≤ 3 ist, dann erhält die Aufgabe eine letzte, finale Pflicht-Wiederholung in 21 Tagen
- [ ] Angenommen eine Aufgabe hat bereits 2 Wiederholungen (insgesamt 3 Bewertungen) ohne `worst` ≥ 4 erhalten, wenn die letzte fällige Wiederholung erneut mit `worst` ≤ 3 bewertet wird, dann wechselt die Aufgabe zu Status „Geschlossen" und das Bewerten-Formular ist nicht mehr verfügbar
- [ ] Angenommen eine Aufgabe hat Status „Gültig" und die 56 Tage sind abgelaufen, dann wechselt sie automatisch zu Status „Verfallen", ohne dass eine neue Pflicht-Wiederholung für dieselbe Aufgabe gesetzt wird
- [ ] Angenommen eine Bewertung wird gespeichert, dann wird sie zusätzlich als eigener, unveränderlicher Eintrag in der gemeinsamen Bewertungshistorie protokolliert, inklusive der zu diesem Zeitpunkt erfassten Fehlernotiz

### Fehlernotiz
- [ ] Angenommen eine Bewertung hat eine hinterlegte Fehlernotiz, wenn der Nutzer sie nicht aufdeckt, dann bleibt sie verborgen — nur Titel und Metadaten der Aufgabe sind sichtbar
- [ ] Angenommen der Nutzer deckt die Fehlernotiz(en) einer Aufgabe auf, dann werden alle bisherigen Bewertungen inkl. ihrer jeweiligen Fehlernotiz in zeitlicher Reihenfolge angezeigt (oder „Keine Fehlernotiz hinterlegt" je Bewertung ohne Notiz)

### Listenansicht & Status-Badge
- [ ] Angenommen Aufgaben unterschiedlicher Fächer existieren, wenn der Nutzer den Fach-Filter wechselt, dann zeigt die Liste nur noch Aufgaben des gewählten Fachs
- [ ] Angenommen Aufgaben mit unterschiedlichem Status existieren, wenn der Nutzer den Status-Filter wechselt, dann zeigt die Liste nur noch Aufgaben mit dem gewählten Status
- [ ] Angenommen mehrere Aufgaben existieren, wenn der Nutzer die Sortierung (Fälligkeit/Fach) ändert, dann aktualisiert sich die Liste entsprechend
- [ ] Angenommen eine Aufgabe befindet sich in einem der fünf Status (Unbewertet/Gültig/Wiederholung fällig am [Datum]/Verfallen/Geschlossen), dann zeigt die Liste das entsprechende Badge eindeutig an

### Bearbeiten & Löschen
- [ ] Angenommen eine Aufgabe existiert, wenn der Nutzer auf den Titel oder das Bearbeiten-Icon klickt, dann öffnet sich ein Formular vorausgefüllt mit Titel, Fach, Thema(n) und Quelle (nicht mit vergangenen Bewertungen — diese entstehen nur über das Bewerten-Formular)
- [ ] Angenommen eine Aufgabe existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor die Aufgabe inkl. ihrer gesamten Bewertungshistorie entfernt wird
- [ ] Angenommen der Lösch-Bestätigungsdialog ist geöffnet, wenn der Nutzer abbricht, dann bleibt die Aufgabe unverändert erhalten

### Fehler & Sicherheit
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Anlegen/Bewerten/Bearbeiten/Löschen einer Aufgabe fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" und der vorherige Zustand bleibt sichtbar
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf die `uebungsaufgaben`- oder `reviews`-Tabelle zuzugreifen, dann verweigert RLS jeden Zugriff

## Edge Cases
- Nutzer löst dieselbe externe Aufgabe später ein weiteres Mal freiwillig, obwohl die vorherige Erfassung bereits Status „Gültig" oder „Geschlossen" hat → bei „Geschlossen" ist das Formular gesperrt; bei „Gültig" fachlich nicht vorgesehen — der Nutzer legt für zusätzliche freiwillige Übung eine neue Aufgabe an
- Nutzer bewertet die fällige Wiederholung bereits deutlich vor Ablauf der empfohlenen Nacharbeit-Zeit → keine Sperre, das System vertraut der Selbstauskunft des Nutzers (Single-User-Konvention wie PROJ-1–3)
- Zwei Browser-Tabs gleichzeitig geöffnet, in beiden wird dieselbe Aufgabe bewertet → kein Konflikt-Handling, die zuletzt gespeicherte Bewertung gewinnt (wie PROJ-3)
- Nutzer versucht, ein Thema aus einem anderen Fach als dem gewählten Aufgabenfach zuzuordnen → nicht möglich, das Themenfeld zeigt ausschließlich Themen des gewählten Fachs
- Nutzer ändert das Fach einer bestehenden Aufgabe, sodass ein bisher zugeordnetes Thema nicht mehr zum neuen Fach passt → bisherige Themenzuordnung wird beim Fachwechsel geleert, Nutzer muss neu zuordnen (mind. 1 Thema bleibt Pflicht)
- Extrem langer Titel/Quelle/Fehlernotiz → Validierungsfehler mit Zeichenlimit-Hinweis (genaues Limit wird in `/architecture` festgelegt, analog PROJ-2/PROJ-3)
- Aufgabe erreicht Status „Verfallen", Nutzer möchte das Thema dennoch weiter üben → keine Reaktivierung derselben Aufgabe vorgesehen, Nutzer legt bei Bedarf eine neue Aufgabe zum selben Thema an (konsistent mit Abschnitt 3 der Berechnungsspezifikation)

## Technical Requirements (optional)
- Security: Alle neuen Tabellen sind RLS-geschützt nach dem in PROJ-1 etablierten Muster (`auth.uid() = user_id`)
- Datenmodell: Jede Aufgabe referenziert ihre Themen über `themen.id` (Fremdschlüssel, PROJ-2-Muster), nicht über eine Namenskopie
- Datenmodell: Jede Bewertung (Fachlich, Klausurtechnik, Fehlernotiz) wird als eigene, unveränderliche Zeile protokolliert (kein Update/Delete durch den Nutzer, nur Insert) — siehe Tech Design für die konkrete Tabellenstruktur
- Wiederverwendung: Die Thema-Mehrfachauswahl nutzt die in PROJ-2/PROJ-3 etablierte `ThemaFeld`-Komponente unverändert
- Algorithmus: Wiederholungslogik folgt `Berechnungsspezifikation_Kompetenzmodell.md`, Abschnitt 3 (Wiederholungslogik Übungsaufgaben) und Abschnitt 4 (Gültigkeitsfunktion `gueltig(uebungs_beleg)`). Relevante Default-Parameter:

  | Parameter | Default | Bedeutung |
  |---|---|---|
  | `UEB_HALTBARKEIT` | 56 Tage | Gültigkeitsdauer eines Übungsaufgaben-Belegs nach `worst` ≥ 4 |
  | `UEB_WDH_BEI_3` | 7 Tage | Pflicht-Wiederholungsabstand nach Erstbewertung `worst` = 3 |
  | `UEB_WDH_BEI_12` | 5 Tage | Pflicht-Wiederholungsabstand nach Erstbewertung `worst` ≤ 2 (Kontrolle der Nacharbeit) |
  | `UEB_WDH_FINAL` | 21 Tage | Abstand der letzten (2.) Pflicht-Wiederholung, falls die 1. Wiederholung erneut `worst` ≤ 3 ergibt |
  | `UEB_WDH_MAX` | 2 | Maximale Anzahl Pflicht-Wiederholungen derselben Aufgabe, danach Status „Geschlossen" |
  | `NIVEAU_SCHWELLE` | 4 | Mindestwert (1–5), den `worst` erreichen muss, damit eine Bewertung als erfolgreich zählt |

- Gültigkeits-Logik: `gueltig(uebungs_beleg) = beleg.worst >= NIVEAU_SCHWELLE UND heute <= beleg.datum + UEB_HALTBARKEIT UND keine offene Pflicht-Wiederholung für diese Aufgabe` (Abschnitt 4 der Berechnungsspezifikation) — steuert ausschließlich das Aufgaben-Badge, keine Themen-/Fach-Aggregation (das ist PROJ-8)
- Performance: Laden der Aufgabenliste < 300ms (analog PROJ-1–3)

## Open Questions
- [x] Zeichenlimits für Titel/Quelle/Fehlernotiz — in `/architecture` festgelegt (siehe Technical Decisions): Titel 300, Quelle 200, Fehlernotiz 1.000 Zeichen

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Reines Tracking-Tool — Aufgabenstellung/Lösung wird nicht in der App erfasst | Übungsaufgaben werden extern (Papier/Aufgabenbuch) gelöst; die App soll nur Referenz + Selbsteinschätzung festhalten, kein Aufgaben-Editor sein | 2026-09-06 |
| Kein Fokuseinheit-Modus (anders als PROJ-3) | Aufgaben werden einzeln und zeitlich verteilt extern bearbeitet, nicht in einer Batch-Session am Stück wie Karteikarten-Retrieval | 2026-09-06 |
| Ein gemeinsames Fehlernotiz-Feld statt zwei getrennter Felder (fachlich/Klausurtechnik) | Ausreichend für den Zweck, hält das Bewerten-Formular einfach | 2026-09-06 |
| Fehlernotiz wird pro Bewertung historisiert, nicht überschrieben | Der Zweck der Pflicht-Wiederholung ist gezieltes Nacharbeiten des letzten Fehlers — eine überschriebene Notiz würde diesen Verlauf verlieren; bei max. 3 Bewertungen pro Aufgabe ist der Mehraufwand minimal | 2026-09-06 |
| Anlegen der Aufgabe und Erstbewertung sind zwei getrennte Schritte | Nutzerentscheidung — eine Aufgabe kann referenziert werden, bevor sie bewertet wird (analog Karteikarten-Modell) | 2026-09-06 |
| Bewerten-Formular ist jederzeit verfügbar, unabhängig vom Fälligkeitsdatum der Pflicht-Wiederholung | Eine künstliche Sperre bis zum exakten Datum wäre bei einem Tracking-Tool nur hinderlich; der Nutzer bestimmt selbst, wann er tatsächlich übt | 2026-09-06 |
| Status „Geschlossen" ist eine bewusste Sackgasse (keine erneute Bewertung derselben Aufgabe) | Konsistent mit der Berechnungsspezifikation: nach Ausschöpfen von `UEB_WDH_MAX` entsteht neue Evidenz nur über eine neue Aufgabe zum Thema | 2026-09-06 |
| 5-Status-Badge-Schema (Unbewertet/Gültig/Wiederholung fällig/Verfallen/Geschlossen) statt binärem Gültig/Verfallen wie bei PROJ-3 | Der Lebenszyklus einer Übungsaufgabe ist reicher als der einer Karteikarte (mehrstufige Pflicht-Wiederholungen), ein binäres Badge würde das nicht abbilden | 2026-09-06 |
| „Nacharbeit empfohlen"-Hinweis bei `worst` ≤ 2 ist reiner Text, keine funktionale Verlinkung zu betroffenen Karteikarten | Echte hub-übergreifende Verknüpfung ist Aufgabe von PROJ-7 (Wiederholungsplan); PROJ-4 bleibt in seinem Scope | 2026-09-06 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Eigene `uebungsaufgaben_reviews`-Tabelle statt einer geteilten `reviews`-Tabelle über alle Hubs | Weicht bewusst von der ursprünglichen Berechnungsspezifikation (Abschnitt 7) ab und folgt stattdessen dem tatsächlichen PROJ-3-Präzedenzfall (`karteikarten_reviews`): eine Fremdschlüssel-Kaskade löscht die komplette Bewertungshistorie automatisch mit, wenn die Aufgabe gelöscht wird, ohne zusätzliche Aufräum-Logik | 2026-09-06 |
| Status wird bei jedem Laden aus den Rohdaten berechnet, nicht als Spalte gespeichert | Identisches Prinzip wie das Gültigkeits-Badge in PROJ-3: der Status kann allein durch Zeitablauf kippen (z.B. Gültig → Verfallen nach 56 Tagen), ein gespeicherter Wert würde veralten | 2026-09-06 |
| Verknüpfungstabelle `uebungsaufgaben_themen` (Aufgabe ↔ Thema), identisches Muster zu `karteikarten_themen` | Eine Aufgabe kann laut Spezifikation mehreren Themen zugeordnet sein; volle strukturelle Wiederverwendung des in PROJ-2/PROJ-3 etablierten Musters | 2026-09-06 |
| Zeichenlimits: Titel 300 Zeichen, Quelle 200 Zeichen, Fehlernotiz 1.000 Zeichen | Quelle/Fehlernotiz analog PROJ-3 übernommen; Titel kürzer als die Karteikarten-„Frage" (1.000) angesetzt, da ein Aufgabentitel ein kurzes Label ist, kein ausformulierter Sachverhalt | 2026-09-06 |
| Zwei Bewertungs-Dropdowns (Fachlich, Klausurtechnik, je 1–5) statt Buttons/Radio wie bei Karteikarten | Entspricht der PRD-Bezeichnung „Zwei-Dropdown-Bewertung"; zwei unabhängige Dropdown-Felder machen die getrennte Bewertungsdimension visuell klarer als eine gemeinsame Button-Reihe | 2026-09-06 |
| Server Actions statt eigener API-Routen, RLS-Muster 1:1 aus PROJ-1–3 | Konsistent mit dem bereits abgenommenen Muster im gesamten Projekt | 2026-09-06 |
| `ThemaFeld`-Komponente unverändert wiederverwendet | Bereits für genau diesen Zweck in PROJ-2 vorgesehen und in PROJ-3 erstmals verwendet | 2026-09-06 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
/uebungsaufgaben (geschützte Route — Zugriff nur eingeloggt, sonst Redirect zu
                  /login, gesichert durch die bestehende Middleware aus PROJ-1)
└── Übungsaufgaben-Hub-Seite
    ├── Kopfzeile: Seitentitel + Kurzbeschreibung + "Themen verwalten"-Link
    │   (→ /themen) + "Neue Aufgabe"-Button
    │
    ├── Filter-/Aktionsleiste
    │   ├── Fach-Auswahl (Dropdown, alle 11 Fächer)
    │   ├── Status-Filter (Alle / Unbewertet / Gültig / Wiederholung fällig /
    │   │   Verfallen / Geschlossen)
    │   ├── Sortierung (Fälligkeit / Fach)
    │   └── Aufgabenanzahl (Anzeige)
    │
    ├── Aufgabenliste
    │   └── Je Aufgabe (Card)
    │       ├── Kopfzeile: Fach, Themen-Chips, Status-Badge (eines der 5 Status,
    │       │   bei "Wiederholung fällig" inkl. Datum und "überfällig"-Hinweis
    │       │   falls das Datum in der Vergangenheit liegt)
    │       ├── Titel (klickbar → öffnet Bearbeiten-Formular), Quelle (falls
    │       │   vorhanden)
    │       ├── Hinweiszeile "Erst Nacharbeit empfohlen" — nur sichtbar, wenn
    │       │   die letzte Bewertung `worst` ≤ 2 ergab und eine Wiederholung
    │       │   noch aussteht
    │       ├── Aktionsreihe: "Bewerten"-Button (immer aktiv außer bei Status
    │       │   "Geschlossen"), Bearbeiten-Icon, Löschen-Icon
    │       └── Aufklappbarer Verlaufs-Bereich ("Bewertungshistorie anzeigen")
    │           — listet jede bisherige Bewertung chronologisch: Datum,
    │           Fachlich, Klausurtechnik, Fehlernotiz (oder "Keine Fehlernotiz
    │           hinterlegt")
    │
    ├── Leerer Zustand ("Keine Übungsaufgaben") — wenn Filter keine Treffer
    │   liefert
    │
    ├── Neue/Bearbeiten-Aufgabe-Formular (Modal)
    │   ├── Fach-Auswahl
    │   ├── Themenfeld (ThemaFeld-Komponente, unverändert aus PROJ-2/PROJ-3
    │   │   übernommen) — mind. 1 Pflicht, nur Themen des gewählten Fachs
    │   ├── Titel (Textfeld, max. 300 Zeichen)
    │   └── Quelle (optionales Textfeld, max. 200 Zeichen)
    │
    ├── Bewerten-Formular (Modal, unabhängig vom Anlegen-Formular)
    │   ├── Fachlich (Dropdown 1–5)
    │   ├── Klausurtechnik (Dropdown 1–5)
    │   ├── Fehlernotiz (optionales Textfeld, mehrzeilig, max. 1.000 Zeichen)
    │   └── Speichern-Button — berechnet `worst`, setzt Status/Fälligkeit neu
    │       und zeigt bei `worst` ≤ 2 zusätzlich einen Hinweis-Toast "Erst
    │       Nacharbeit empfohlen"
    │
    ├── Lösch-Bestätigungsdialog (Abbrechen / Löschen)
    │
    └── Lade-/Fehlerzustände (Skeleton beim initialen Laden, "Verbindung
        fehlgeschlagen"-Hinweis bei Netzwerkfehlern)
```

### Data Model (in plain language)
```
Tabelle "uebungsaufgaben" (eine Zeile pro erfasster Übungsaufgabe):
- id
- user_id            → verweist auf den eingeloggten Nutzer (RLS-Muster aus
                        PROJ-1)
- fach_id            → verweist auf "faecher" (PROJ-2)
- titel              → Bezeichnung der Aufgabe, max. 300 Zeichen
- quelle             → optionale Quellenangabe, max. 200 Zeichen
- pflicht_wdh_datum  → nächste fällige Pflicht-Wiederholung (Datum), leer =
                        keine offene Wiederholung
- wdh_anzahl         → Anzahl bisheriger Bewertungen (0 = unbewertet, max. 3:
                        Erstbewertung + höchstens 2 Pflicht-Wiederholungen)
- created_at

Tabelle "uebungsaufgaben_themen" (Verknüpfungstabelle, eine Aufgabe kann
mehrere Themen haben — identisches Muster zu "karteikarten_themen"):
- uebungsaufgabe_id  → verweist auf "uebungsaufgaben"; Löschen der Aufgabe
                        entfernt automatisch auch diese Zuordnungen
- thema_id           → verweist auf "themen" (PROJ-2)

Tabelle "uebungsaufgaben_reviews" (unveränderliche Historie, eine Zeile pro
Bewertungsereignis — nie aktualisiert oder einzeln gelöscht, nur beim Löschen
der zugehörigen Aufgabe automatisch mitentfernt):
- id
- user_id
- uebungsaufgabe_id  → verweist auf "uebungsaufgaben"
- datum              → Zeitpunkt der Bewertung
- fachlich           → vergebene Bewertung 1–5
- klausurtechnik     → vergebene Bewertung 1–5
- fehlernotiz        → optionale Fehleranalyse zu dieser konkreten Bewertung,
                        max. 1.000 Zeichen, in der UI standardmäßig verborgen

Der Status einer Aufgabe (Unbewertet/Gültig/Wiederholung fällig/Verfallen/
Geschlossen) ist kein gespeichertes Feld, sondern wird beim Laden aus
`wdh_anzahl`, `pflicht_wdh_datum` und der jüngsten Zeile aus
"uebungsaufgaben_reviews" berechnet (Details siehe Tech Decisions).

Zugriffsregel (Row Level Security) für alle drei Tabellen: identisches Muster
wie "karteikarten"/"karteikarten_reviews" aus PROJ-1–3 — ein Nutzer sieht und
bearbeitet ausschließlich eigene Zeilen (user_id = eingeloggter Nutzer).

Gespeichert in: Supabase (PostgreSQL) — wie alle bisherigen Daten, zentral und
über Geräte hinweg synchron.
```

### Tech Decisions (Reasoning)
- **Eigene `uebungsaufgaben_reviews`-Tabelle statt einer geteilten `reviews`-Tabelle über alle Hubs:** Die ursprüngliche Berechnungsspezifikation (Abschnitt 7) sah eine gemeinsame `reviews`-Tabelle für alle Hubs vor. PROJ-3 ist davon bereits abgewichen und hat eine eigene `karteikarten_reviews`-Tabelle angelegt, gerade damit beim Löschen einer Karte ihre Bewertungshistorie automatisch per Fremdschlüssel-Kaskade mitgelöscht wird, ohne eigene Aufräum-Logik. PROJ-4 folgt demselben, bereits bewährten Muster.
- **Status wird bei jedem Laden berechnet, nicht gespeichert:** Der Status kann allein durch Zeitablauf kippen (z.B. "Gültig" → "Verfallen" nach 56 Tagen), ohne dass der Nutzer etwas tut. Ein gespeicherter Wert würde sofort veralten — identisches Prinzip wie das Gültigkeits-Badge in PROJ-3. Berechnungsschema: kein Eintrag in "uebungsaufgaben_reviews" → Unbewertet; `pflicht_wdh_datum` gesetzt → Wiederholung fällig; sonst, wenn `min(fachlich, klausurtechnik)` der jüngsten Bewertung ≥ 4 und ≤ 56 Tage alt → Gültig; wenn ≥ 4 aber älter → Verfallen; wenn `wdh_anzahl` das Maximum (3) erreicht hat und die letzte Bewertung < 4 war → Geschlossen.
- **`uebungsaufgaben_themen` als eigene Verknüpfungstabelle:** identisches Muster zu `karteikarten_themen` — eine Aufgabe kann laut Spezifikation mehreren Themen zugeordnet sein.
- **Eine einzige serverseitige „Bewertung speichern"-Aktion:** verarbeitet Fachlich/Klausurtechnik/Fehlernotiz, berechnet `worst`, setzt `pflicht_wdh_datum` und `wdh_anzahl` neu und schreibt den Historieneintrag — ein Vorgang statt mehrerer, die auseinanderlaufen könnten.
- **Zwei Bewertungs-Dropdowns statt Buttons/Radio (anders als Karteikarten):** entspricht der PRD-Bezeichnung „Zwei-Dropdown-Bewertung" und macht die zwei unabhängigen Bewertungsdimensionen visuell klarer als eine gemeinsame Button-Reihe.
- **Zeichenlimits:** lösen die offene Frage aus der Spezifikation (siehe Technical Decisions) — Titel 300 (kurzes Label, kürzer als die Karteikarten-„Frage"), Quelle 200 und Fehlernotiz 1.000 Zeichen analog PROJ-3.
- **Server Actions statt eigener API-Routen, RLS-Muster 1:1 aus PROJ-1–3:** konsistent mit dem bereits abgenommenen Muster.
- **`ThemaFeld`-Komponente unverändert wiederverwendet:** kein PROJ-4-internes Detail, sondern genau der in PROJ-2 vorgesehene und in PROJ-3 erstmals genutzte Wiederverwendungsfall.
- **Kein Fokuseinheit-Äquivalent:** bereits im Spec-Interview entschieden (siehe Product Decisions) — hier nur zur Vollständigkeit der Architektur bestätigt, keine zusätzliche Session-Infrastruktur nötig.

### Dependencies
- Keine neuen npm-Pakete nötig — react-hook-form, Zod und alle benötigten shadcn/ui-Komponenten (Select, Textarea, Dialog, AlertDialog, Badge, Collapsible, Skeleton, Sonner/Toast) sind bereits aus PROJ-1–3 im Projekt installiert
- Supabase CLI (bereits im Einsatz) für die neue Migration

## Frontend Implementation Notes (Frontend Developer)

**Umgesetzt (2026-09-06):**
- `src/lib/uebungsaufgaben-wiederholung.ts`: reine, framework-unabhängige Wiederholungslogik nach Berechnungsspezifikation Abschnitt 3 + 4 (`worst()`, `naechstePflichtWdh()`, `istGueltig()`). Nutzt die bereits bestehenden Datumsfunktionen `diffTage`/`heuteISO`/`naechsteFaelligkeit` aus `karteikarten-intervall.ts` (PROJ-3) statt sie zu duplizieren — reine Tagesarithmetik ohne Fuzz/Karenz, deutlich einfacher als der Karteikarten-Algorithmus
- `src/lib/uebungsaufgaben-wiederholung.test.ts`: 12 Unit-Tests (Erstbewertung bei worst≥4/=3/≤2, 1. Wiederholung erfolgreich/erneut fällig, finale Wiederholung erfolgreich/geschlossen, Gültigkeits-Grenze bei genau 56 Tagen) — alle grün
- `src/lib/uebungsaufgaben.ts`: Typen (`Uebungsaufgabe`, `UebungsaufgabeReview`, `UebungsaufgabenStatus`), `BEWERTUNG_OPTIONEN` (geteilt für Fachlich/Klausurtechnik), `statusVon()` (berechnet den 5-Status live, nie gespeichert) und Anzeige-Helfer (`letzteReviewVon`, `wiederholungsDringlichkeit`, `formatDatum`, `kurzerText`, `CONNECTION_ERROR`) — Letztere bewusst analog PROJ-3 dupliziert statt hub-übergreifend importiert, damit jeder Hub-Ordner in sich abgeschlossen bleibt (Präzedenzfall: `karteikarten.ts` importiert ebenfalls nichts aus anderen Hubs)
- `src/lib/schemas/uebungsaufgabe.ts`: zwei Zod-Schemas — `uebungsaufgabeSchema` fürs Anlegen/Bearbeiten (Titel 1–300 Zeichen, Quelle ≤ 200, mind. 1 Thema) und `bewertenSchema` fürs separate Bewerten-Formular (Fachlich/Klausurtechnik je 1–5, Fehlernotiz ≤ 1.000)
- `src/components/uebungsaufgaben/uebungsaufgabe-card.tsx`, `uebungsaufgabe-form.tsx`, `bewerten-form.tsx`, `uebungsaufgaben-manager.tsx`: Listenansicht mit Filter (Status/Fach)/Sortierung (fällig/Fach), getrenntes Anlegen- und Bewerten-Formular (zwei Dropdowns), aufklappbare Bewertungshistorie pro Aufgabe. `ThemaFeld` unverändert aus PROJ-2/PROJ-3 übernommen
- `src/app/uebungsaufgaben/page.tsx`: async Server Component, lädt `faecher`/`themen` live aus dem produktiven Supabase-Projekt (PROJ-1/PROJ-2-Backend existiert schon); `/uebungsaufgaben` ist automatisch durch die bestehende Middleware (`src/proxy.ts`) geschützt, ohne dass dort etwas geändert werden musste
- **Präzisierung gegenüber der Spec beim Umsetzen:** Die AC „Bewerten-Formular verfügbar bei Status Unbewertet/Wiederholung fällig" wurde wörtlich umgesetzt — der „Bewerten"-Button ist bei Gültig/Verfallen/Geschlossen deaktiviert, nicht nur bei Geschlossen. Ein „Gültig" oder „Verfallen" gewordener Beleg wird laut Berechnungsspezifikation bewusst nicht erneut bewertet; neue Evidenz entsteht über eine neue Aufgabe

**Bewusst noch nicht umgesetzt (folgt in `/backend`):**
- Komplett lokaler React-Zustand, keine echte Persistenz — Aufgaben und Bewertungen gehen bei Neuladen der Seite verloren; `uebungsaufgaben`, `uebungsaufgaben_themen`, `uebungsaufgaben_reviews` existieren noch nicht als Tabellen (`initialAufgaben`/`initialReviews` in `page.tsx` sind bewusst leere Platzhalter-Konstanten)
- „Verbindung fehlgeschlagen"-Meldung (AC „Fehler & Sicherheit") kann erst mit echten Supabase-Aufrufen getestet werden (analog PROJ-1–3) — im lokalen State gibt es aktuell keinen Fehlerfall, der sie auslösen könnte
- RLS-Verweigerung ohne Session (AC „Fehler & Sicherheit") erst testbar, sobald die drei Tabellen inkl. Policies existieren
- Lade-Skeleton ist noch nicht verdrahtet, da die Aufgabenliste noch nicht asynchron aus einer eigenen Tabelle lädt

**Getestet:** `npm run build` fehlerfrei (Route `/uebungsaufgaben` korrekt erzeugt), `npm test` 107/107 grün (davon 12 neue Tests). Unauthentifizierter Zugriff auf `/uebungsaufgaben` per Playwright verifiziert: korrekter Redirect zu `/login?redirect=%2Fuebungsaufgaben`, identisches Verhalten wie die bestehenden Hubs. Das interaktive Verhalten hinter dem Login (Anlegen, Bewerten-Formular, Status-Wechsel, Bewertungshistorie, Löschen) konnte ich **nicht** selbst im Browser durchklicken, da mir kein Test-Account/Passwort für das echte Supabase-Projekt vorliegt — bitte einmal selbst unter `/uebungsaufgaben` gegenprüfen (Golden Path: Fach wählen → Thema inline anlegen → Aufgabe anlegen → Bewerten mit Fachlich 3/Klausurtechnik 2 → Status sollte zu „Wiederholung fällig in 5 Tagen" mit Nacharbeit-Hinweis wechseln → Bewertungshistorie aufklappen → Löschen).

**Umgebungshinweis (Ergänzung zu PROJ-3):** Das dort beschriebene Vitest-Worker-Timeout-Phänomen auf diesem iCloud-synchronisierten Projektpfad hatte diesmal eine konkret behebbare Ursache: ein verwaister `node_modules/.vite`-Cache-Ordner. `rm -rf node_modules/.vite` hat den Fehler dauerhaft behoben (nicht nur einen erneuten Anlauf gebraucht) — für künftige Sessions mit demselben Symptom zuerst prüfen, ob dieser Cache-Ordner das Problem ist, bevor mehrfach neu versucht wird. `npm run lint` weiterhin ohne Ergebnis (bekannte, vorbestehende Tooling-Lücke aus PROJ-1, unabhängig von diesem Feature).

## Backend Implementation Notes (Backend Developer)

**Umgesetzt (2026-09-06):**
- Migration `supabase/migrations/20260906132902_create_uebungsaufgaben.sql`: drei Tabellen wie im Tech Design festgelegt — `uebungsaufgaben` (fach_id, titel ≤ 300 Zeichen, quelle ≤ 200, pflicht_wdh_datum nullable, wdh_anzahl), `uebungsaufgaben_themen` (Verknüpfung, identisches Muster zu `karteikarten_themen`), `uebungsaufgaben_reviews` (unveränderliche Historie: fachlich, klausurtechnik, fehlernotiz ≤ 1.000 Zeichen). RLS auf allen drei Tabellen nach dem PROJ-1-Muster (`auth.uid() = user_id`, bei den Verknüpfungs-/Historientabellen über Exists-Checks auf die Elterntabelle). Migration erfolgreich auf das verlinkte Live-Supabase-Projekt angewendet und verifiziert (`supabase db query --linked`: alle drei Tabellen vorhanden, `relrowsecurity = true` auf allen dreien)
- `src/app/uebungsaufgaben/actions.ts`: `createUebungsaufgabe`, `updateUebungsaufgabe` (Metadaten only, rührt `pflicht_wdh_datum`/`wdh_anzahl` nicht an), `bewerteUebungsaufgabe` (einzige Stelle, die `worst()` + `naechstePflichtWdh()` aus der reinen Wiederholungslogik anwendet, schreibt Review + aktualisiert die Aufgabe in einem Vorgang), `deleteUebungsaufgabe` — alle nach dem PROJ-3-Server-Action-Muster (Zod-Validierung, Session-Check, try/catch → `CONNECTION_ERROR`, `revalidatePath`)
- **Technische Entscheidung beim Umsetzen:** `uebungsaufgaben_reviews.datum` ist in der DB `timestamptz` (nicht `date`) für verlässliche chronologische Sortierung, auch bei mehreren Bewertungen am selben Tag. Die reine Wiederholungslogik (`istGueltig`, `diffTage`) arbeitet aber ausschließlich mit Datums-Granularität — `toReview()` in `actions.ts` kürzt den DB-Zeitstempel deshalb auf die ersten 10 Zeichen (`YYYY-MM-DD`), bevor er ins Domänenmodell gelangt. Damit ist die DB-Spalte präzise für Sortierung/Historie, während die Berechnung so einfach bleibt wie geplant
- `src/app/uebungsaufgaben/page.tsx`: lädt jetzt zusätzlich `uebungsaufgaben`, `uebungsaufgaben_themen` und `uebungsaufgaben_reviews` live aus Supabase (die Reviews werden geladen, da PROJ-4 anders als PROJ-3 eine sichtbare Bewertungshistorie in der UI zeigt)
- `src/components/uebungsaufgaben/uebungsaufgaben-manager.tsx`: die drei lokalen State-Mutationen aus der Frontend-Phase (`handleFormSubmit`, `handleBewertenSubmit`, `confirmDelete`) rufen jetzt die echten Server Actions auf, mit try/catch für Netzwerkfehler (analog PROJ-3 BUG-1-Fix, von Anfang an mit eingebaut statt nachträglich gefunden)
- `src/app/uebungsaufgaben/actions.test.ts`: 15 neue Integrationstests (Validierung ohne Supabase-Aufruf, erfolgreicher Pfad je Funktion, Verbindungsfehler bei fehlender Session/fehlgeschlagener Query) — Mock-Pattern 1:1 von `karteikarten/actions.test.ts` übernommen

**Getestet:** `npm run build` fehlerfrei, `npm test` 122/122 grün (davon 15 neue Integrationstests). Migration live auf dem verlinkten Supabase-Projekt angewendet und Tabellen/RLS per SQL-Query verifiziert.

**Noch nicht möglich:** Echter End-to-End-Test (Anlegen → Bewerten → Statuswechsel → Historie → Löschen gegen die echte Datenbank) — mir liegt weiterhin kein Login für das echte Supabase-Projekt vor (siehe Frontend Implementation Notes). Bitte einmal selbst durchklicken, jetzt mit echter Persistenz: Seite neu laden sollte die angelegte/bewertete Aufgabe weiterhin zeigen.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
