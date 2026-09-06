# PROJ-4: Übungsaufgaben-Hub

## Status: Planned
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
- Security: `uebungsaufgaben`-Tabelle und die (gemeinsam mit PROJ-3 genutzte) `reviews`-Tabelle sind RLS-geschützt nach dem in PROJ-1 etablierten Muster (`auth.uid() = user_id`)
- Datenmodell: Jede Aufgabe referenziert ihre Themen über `themen.id` (Fremdschlüssel, PROJ-2-Muster), nicht über eine Namenskopie
- Datenmodell: Jede Bewertung (Fachlich, Klausurtechnik, Fehlernotiz) wird als eigene, unveränderliche Zeile protokolliert (kein Update/Delete durch den Nutzer, nur Insert) — in derselben `reviews`-Tabelle wie PROJ-3, mit `item_typ = 'uebung'`, `bewertung` (Fachlich) und `bewertung_2` (Klausurtechnik)
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
- [ ] Zeichenlimits für Titel/Quelle/Fehlernotiz — analog PROJ-2/PROJ-3 in `/architecture` festzulegen

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
| _Example: localStorage over Supabase_ | _No user accounts needed; data is device-local_ | YYYY-MM-DD |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
