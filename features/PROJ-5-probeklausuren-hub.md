# PROJ-5: Probeklausuren-Hub

## Status: Planned
**Created:** 2026-09-09
**Last Updated:** 2026-09-09

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Hub-Route und das RLS-Muster
- PROJ-2 (Zentraler Themenkatalog) — Teile referenzieren Themen über `themen.id`; nutzt die `ThemaFeld`-Komponente unverändert (wie bereits in PROJ-3/PROJ-4)

## User Stories
- Als Lukas möchte ich eine geschriebene Probeklausur direkt nach dem Schreiben erfassen (Bezeichnung, Datum, Quelle, ein oder mehrere Teile mit Fach und optional Themen), damit ich sie nicht vergesse, auch wenn die Korrektur noch aussteht.
- Als Lukas möchte ich, dass eine Klausur mehrere Fächer abdecken kann (wie am echten Klausurtag), indem ich mehrere Teile mit unterschiedlichen Fächern anlege, damit kombinierte Klausuren realistisch abgebildet werden.
- Als Lukas möchte ich Punkte und Note nachträglich ergänzen können, sobald die Korrektur da ist, damit ich die Klausur nicht doppelt erfassen muss.
- Als Lukas möchte ich nach dem Schreiben sofort eine fachliche Notiz hinterlegen und nach der Korrektur eine zweite, analytische Notiz, damit ich beide Reflexionsebenen des Drei-Stufen-Nacharbeitsmodells nutze.
- Als Lukas möchte ich automatisch nach 75 Tagen an ein stichprobenartiges Nachschreiben erinnert werden, damit ich mein tatsächliches Behalten unter Klausurbedingungen prüfe.
- Als Lukas möchte ich auf einen Blick sehen, ob eine Klausur bestanden ist und ob eine Korrektur noch aussteht, damit ich meinen Klausurfortschritt schnell überblicke.

## Out of Scope
- Erfassung der Klausuraufgabe/des Sachverhalts oder der eigenen Lösung im Detail — reines Tracking-Tool wie PROJ-3/PROJ-4, das Schreiben erfolgt extern
- Themen-Stufenlogik, Fach-Ebene-Kennzahlen (Klausurreife, Stufenverteilung), Kalibrierungs-Auswertungen (Abschnitte 5, 8, 9 der Berechnungsspezifikation) — vollständig Teil von PROJ-8; PROJ-5 erfasst nur die Rohdaten (Teile, Punkte, Themen-Zuordnung)
- Automatische Ableitung der Note aus der Punktequote — Note wird manuell eingetragen (reguliertes StB-Punkte-Noten-Schema, nicht linear aus der Prozentquote ableitbar)
- Zeitmanagement-Tracking während der Klausur (Stufe 2 der PRD-Roadmap, P1 — nicht Teil dieser Version)
- Erfassung eines Ergebnisses beim Nachschreiben (Stufe 3) — reine Erledigt-Markierung, kein neues Punkte-/Notenfeld (stichprobenartiger Selbsttest, kein offizielles Zweitergebnis)
- Manuelles Verschieben des automatisch berechneten Nachschreiben-Termins — das Erledigt-Markieren ist ohnehin jederzeit möglich (siehe Decision Log), ein Termin-Editierfeld ist nicht nötig
- Wiederholungsplan (hub-übergreifende Aggregation, inkl. der Stufe-3-Erinnerungen aller Klausuren) — eigenständiges Feature PROJ-7
- Verborgen/Aufdecken-Mechanik für Stufe-1-/Stufe-2-Notizen (anders als Fehlernotizen in PROJ-3/PROJ-4) — es gibt keinen Retrieval-Practice-Moment bei der Nacharbeit einer bereits geschriebenen Klausur, daher sind beide Notizfelder beim Öffnen der Klausur direkt sichtbar
- Mehrfachauswahl/Stapel-Aktionen, Import/Export, Offline-Nutzung, Bilder/Anhänge — analog PROJ-3/PROJ-4 nicht Teil des MVP

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Probeklausuren-Route direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn der Probeklausuren-Hub lädt, dann werden alle eigenen Klausuren geladen und entsprechend der aktuellen Filter/Sortierung angezeigt (Standard: alle Fächer, alle Status, sortiert nach Datum absteigend)
- [ ] Angenommen es existieren noch keine Klausuren, wenn der Hub lädt, dann erscheint der Hinweis „Keine Probeklausuren" statt einer leeren Liste

### Anlegen
- [ ] Angenommen der Nutzer öffnet das Formular für eine neue Klausur, wenn er Bezeichnung, Datum und mindestens einen Teil (mit Fach) ausfüllt, dann wird die Klausur gespeichert und erscheint sofort in der Liste — auch ohne Punkte/Note
- [ ] Angenommen Bezeichnung, Datum oder mindestens ein vollständiger Teil (mit Fach) fehlen, wenn der Nutzer speichern möchte, dann wird das Speichern verhindert und für jedes fehlende Pflichtfeld eine Validierungsfehlermeldung angezeigt
- [ ] Angenommen der Nutzer fügt einen weiteren Teil hinzu, wenn er ein Fach für diesen Teil wählt, dann zeigt das zugehörige Themenfeld ausschließlich Themen dieses Fachs zur Auswahl oder Neuanlage (Themen sind pro Teil optional)
- [ ] Angenommen der Nutzer tippt im Themenfeld eines Teils einen im gewählten Fach noch nicht existierenden Namen ein, wenn er die Neuanlage-Option wählt, dann wird das Thema mit der Standard-Klausurrelevanz „Mittel" angelegt (PROJ-2-Verhalten) und dem Teil direkt zugeordnet
- [ ] Angenommen der Nutzer legt eine Klausur mit mehreren Teilen unterschiedlicher Fächer an, dann werden in der Kopfzeile der Klausur alle beteiligten Fächer als Badges angezeigt

### Punkte, Note und Status
- [ ] Angenommen eine Klausur wird ohne Punkte in irgendeinem Teil angelegt, dann zeigt sie den Status „Korrektur ausstehend" statt einer Quote
- [ ] Angenommen der Nutzer trägt bei einem Teil Erreichte Punkte ein, die die Max-Punkte dieses Teils übersteigen, dann wird das Speichern verhindert und eine Validierungsfehlermeldung angezeigt
- [ ] Angenommen alle Teile einer Klausur haben vollständige Max- und Erreichte-Punkte, dann werden Gesamt-Max-Punkte und Gesamt-Erreichte-Punkte automatisch als Summe der Teile berechnet und die Klausur wechselt zu Status „Korrigiert"
- [ ] Angenommen nur ein Teil von mehreren hat bereits Punkte, dann bleibt der Status weiterhin „Korrektur ausstehend" (keine Teil-Quote)
- [ ] Angenommen eine Klausur ist „Korrigiert" und die Gesamtquote liegt bei ≥ 40 % (`BESTEHEN_QUOTE`), dann zeigt sie das Badge „Bestanden", sonst „Nicht bestanden"
- [ ] Angenommen der Nutzer trägt eine Note ein, dann wird sie unverändert als eingegebener Text/Zahl angezeigt — die App berechnet daraus keine eigene Quote oder Ableitung
- [ ] Angenommen der Nutzer löscht nachträglich einen Teil mit bereits eingetragenen Punkten, dann werden Gesamt-Punkte und Status automatisch neu berechnet

### Drei-Stufen-Nacharbeitsmodell
- [ ] Angenommen eine Klausur wird angelegt, dann kann der Nutzer sofort ein Freitextfeld „Stufe 1 – Fachliche Nacharbeit" ausfüllen (optional)
- [ ] Angenommen eine Klausur existiert, dann kann der Nutzer jederzeit ein Freitextfeld „Stufe 2 – Analytische Nacharbeit" ausfüllen (optional, unabhängig davon ob Punkte/Note schon eingetragen sind)
- [ ] Angenommen eine Klausur wurde vor mindestens 75 Tagen geschrieben und ist noch nicht als nachgeschrieben markiert, dann zeigt sie den Hinweis „Nachschreiben fällig seit [Datum]"
- [ ] Angenommen eine Klausur ist jünger als 75 Tage, dann zeigt sie keinen Nachschreiben-Hinweis
- [ ] Angenommen der Nutzer markiert eine Klausur als nachgeschrieben, dann verschwindet der Hinweis dauerhaft — unabhängig davon, ob die 75 Tage bereits erreicht waren (jederzeitiges Markieren ist möglich)

### Listenansicht & Status-Badge
- [ ] Angenommen Klausuren mit Teilen unterschiedlicher Fächer existieren, wenn der Nutzer nach einem Fach filtert, dann zeigt die Liste nur Klausuren, die mindestens einen Teil mit diesem Fach haben
- [ ] Angenommen Klausuren mit unterschiedlichem Status existieren, wenn der Nutzer nach Status filtert (Korrektur ausstehend/Korrigiert), dann zeigt die Liste nur passende Klausuren
- [ ] Angenommen mehrere Klausuren existieren, dann sind sie standardmäßig nach Datum absteigend (neueste zuerst) sortiert

### Bearbeiten & Löschen
- [ ] Angenommen eine Klausur existiert, wenn der Nutzer sie zum Bearbeiten öffnet, dann sind alle Felder inkl. aller Teile vorausgefüllt und können geändert, ergänzt oder entfernt werden
- [ ] Angenommen eine Klausur existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor die Klausur inkl. aller Teile entfernt wird
- [ ] Angenommen der Lösch-Bestätigungsdialog ist geöffnet, wenn der Nutzer abbricht, dann bleibt die Klausur unverändert erhalten

### Fehler & Sicherheit
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Anlegen/Bearbeiten/Löschen einer Klausur fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" und der vorherige Zustand bleibt sichtbar
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf die Klausur-Tabellen zuzugreifen, dann verweigert RLS jeden Zugriff

## Edge Cases
- Klausurdatum liegt in der Zukunft → Validierungsfehler; eine Probeklausur kann nur für bereits geschriebene Klausuren erfasst werden
- Zwei Teile derselben Klausur haben dasselbe Fach (z.B. zwei getrennte Aufgabenblöcke im selben Fach) → ausdrücklich erlaubt, keine Restriktion
- Nutzer ändert nachträglich das Fach eines Teils, sodass bisher zugeordnete Themen nicht mehr passen → Themenzuordnung dieses Teils wird beim Fachwechsel geleert, Nutzer muss neu zuordnen (analog PROJ-3/PROJ-4)
- Nutzer trägt eine Note ein, aber noch keine Punkte (oder umgekehrt) → beide Felder sind unabhängig voneinander optional, kein gegenseitiger Zwang
- Letzter verbleibender Teil einer Klausur soll gelöscht werden → nicht möglich, mindestens ein Teil ist Pflicht (Löschen des letzten Teils erst zusammen mit der ganzen Klausur)
- Zwei Browser-Tabs gleichzeitig geöffnet, in beiden wird dieselbe Klausur bearbeitet → kein Konflikt-Handling, die zuletzt gespeicherte Aktion gewinnt (Single-User-Konvention wie PROJ-1–4)
- Extrem lange Bezeichnung/Quelle/Note/Stufe-1-/Stufe-2-Text → Validierungsfehler mit Zeichenlimit-Hinweis (genaues Limit wird in `/architecture` festgelegt, analog PROJ-2–4)

## Technical Requirements (optional)
- Security: Alle neuen Tabellen (Klausuren, Teile, Themen-Zuordnung der Teile) sind RLS-geschützt nach dem in PROJ-1 etablierten Muster (`auth.uid() = user_id`)
- Datenmodell: Jeder Teil referenziert seine Themen über `themen.id` (Fremdschlüssel, PROJ-2-Muster), nicht über eine Namenskopie
- Wiederverwendung: Die Thema-Mehrfachauswahl nutzt die in PROJ-2/PROJ-3/PROJ-4 etablierte `ThemaFeld`-Komponente unverändert, einmal pro Teil
- Algorithmus: Nachschreiben-Fälligkeit und Bestehensquote folgen `Berechnungsspezifikation_Kompetenzmodell.md`, Abschnitt 1 (Parameter) und Abschnitt 6. Relevante Parameter:

  | Parameter | Wert | Bedeutung |
  |---|---|---|
  | `NACHSCHREIBEN_TAGE` | 75 Tage | Abstand nach Klausurdatum, ab dem die Nachschreiben-Erinnerung erscheint |
  | `BESTEHEN_QUOTE` | 0,40 | Bestehensniveau (Anteil erreichter Punkte) — **korrigiert von ursprünglich 0,50 in der Berechnungsspezifikation, siehe Decision Log** |

- Performance: Laden der Klausurliste < 300ms (analog PROJ-1–4)

## Open Questions
- [ ] Zeichenlimits für Bezeichnung/Quelle/Note/Stufe-1-/Stufe-2-Text — analog PROJ-2–4 in `/architecture` festzulegen

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| PROJ-5 implementiert bereits die Teile-Struktur aus der aktualisierten Berechnungsspezifikation (nicht das einfachere Gesamtnote-Modell aus dem ursprünglichen Konzeptpapier) | Erfassung der Teile ist reine Dateneingabe und gehört zum Hub; die Auswertung zu Themen-Stufe-4-Evidenz bleibt PROJ-8 vorbehalten (analog PROJ-3/PROJ-4) | 2026-09-09 |
| Zwei-Phasen-Erfassung: Klausur wird direkt nach dem Schreiben angelegt (Stufe 1, Teile mit Fach/Themen), Punkte/Note/Stufe 2 werden optional sofort oder erst nach Erhalt der Korrektur nachgetragen | Entspricht dem realen Ablauf — Korrekturen bei StB-Klausuren dauern oft Wochen; eine erzwungene Einmalerfassung würde dazu führen, dass Klausuren gar nicht oder zu spät erfasst werden | 2026-09-09 |
| Kein Fach-Feld auf Klausur-Ebene — Fach existiert ausschließlich pro Teil | Eine Klausur kann wie am echten Klausurtag mehrere Fächer kombinieren; ein Klausur-weites Fach-Feld würde diesen Fall nicht abbilden können. Der einfache 1-Fach-Fall ist einfach eine Klausur mit genau einem Teil | 2026-09-09 |
| Themen existieren ausschließlich über Teile, nicht zusätzlich auf Klausur-Ebene | Konsistent mit der Berechnungsspezifikation; die Themen-Badges der Klausur-Kopfzeile sind die Vereinigung der Themen aller Teile | 2026-09-09 |
| Mindestens 1 Teil pro Klausur ist Pflicht; Themen pro Teil bleiben optional | Ein Teil ohne Themen liefert später nur Fach-Evidenz (PROJ-8), ein Teil mit Themen liefert zusätzlich Themen-Evidenz — deckt beide in der Berechnungsspezifikation genannten Fälle ab, ohne eine „Klausur ganz ohne Teile" als Sonderfall zu benötigen | 2026-09-09 |
| Gesamt-Max-/Erreichte-Punkte werden automatisch als Summe der Teile berechnet, sobald alle Teile vollständige Punkte haben — kein unabhängiges Eingabefeld auf Klausur-Ebene | Verhindert Inkonsistenz zwischen Teil-Summe und Gesamtwert; entspricht der Berechnungsspezifikation („Klausur-Gesamtquote = Summe der Teile") | 2026-09-09 |
| Note wird manuell eingetragen, nicht aus der Punktequote berechnet | Das StB-Punkte-Noten-Schema ist reguliert und nicht linear aus der Prozentquote ableitbar | 2026-09-09 |
| Status „Korrektur ausstehend"/„Korrigiert" sowie „Bestanden"/„Nicht bestanden"-Badge (Schwelle 40 %) werden bereits in PROJ-5 angezeigt | Einfache, unmittelbar aus den Klausur-Rohdaten ableitbare Kennzahl, analog zum Gültig/Verfallen-Badge in PROJ-3/PROJ-4 — kein Vorgriff auf die komplexere Themen-/Fach-Aggregation aus PROJ-8 | 2026-09-09 |
| **BESTEHEN_QUOTE korrigiert auf 0,40** (war 0,50 in der ursprünglichen Berechnungsspezifikation) | Nutzerkorrektur — die tatsächliche Bestehensgrenze der StB-Prüfung liegt bei 40 %, nicht 50 %. `Berechnungsspezifikation_Kompetenzmodell.md` wurde entsprechend korrigiert (betrifft auch die künftige PROJ-8-Spec) | 2026-09-09 |
| Stufe 1/2-Notizen sind immer direkt sichtbar, keine Verborgen/Aufdecken-Mechanik wie Fehlernotizen in PROJ-3/PROJ-4 | Es gibt keinen Retrieval-Practice-Moment bei der Nacharbeit einer bereits geschriebenen Klausur — das Verbergen dient dort der Vermeidung des Recognition-Effekts vor einem erneuten Abrufversuch, der hier nicht stattfindet | 2026-09-09 |
| Stufe 3 (Nachschreiben) erfasst nur eine Erledigt-Markierung, kein neues Punkte-/Notenfeld | Stichprobenartiger Selbsttest zur Kontrolle des Behaltens, kein offizielles Zweitergebnis, das in die Kompetenzanalyse einfließen soll | 2026-09-09 |
| Nachschreiben kann jederzeit als erledigt markiert werden, auch vor Ablauf der 75 Tage | Keine künstliche Sperre bis zum exakten Datum — der Nutzer bestimmt selbst, wann er tatsächlich nachschreibt (analog Bewerten-Formular in PROJ-4) | 2026-09-09 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| _Example: localStorage over Supabase_ | _No user accounts needed; data is device-local_ | YYYY-MM-DD |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## Frontend Implementation Notes (Frontend Developer)
_To be added by /frontend_

## Backend Implementation Notes (Backend Developer)
_To be added by /backend_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
