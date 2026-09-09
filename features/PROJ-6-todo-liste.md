# PROJ-6: Todo-Liste

## Status: Planned
**Created:** 2026-09-09
**Last Updated:** 2026-09-09

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Route und das RLS-Muster

## User Stories
- Als Lukas möchte ich eine Aufgabe mit Titel und optional Datum anlegen, damit ich mir Aufgaben und Fristen für die Examensvorbereitung merken kann, ohne sie extern zu notieren.
- Als Lukas möchte ich eine Aufgabe einer Kategorie (z.B. Wiederholung, Frist/Prüfung) und einer Priorität zuordnen, damit ich auf einen Blick erkenne, worum es sich handelt und wie dringend sie ist.
- Als Lukas möchte ich eine Aufgabe mit einem Klick als erledigt markieren, damit ich meinen Fortschritt sehe, ohne sie sofort zu löschen.
- Als Lukas möchte ich meine Aufgaben nach Offen/Erledigt/Alle filtern und nach Zeit, Priorität oder Kategorie sortieren, damit ich die Liste je nach Situation unterschiedlich einsehen kann.
- Als Lukas möchte ich sofort erkennen, welche offenen Aufgaben überfällig sind, damit ich sie nicht aus Versehen liegen lasse.
- Als Lukas möchte ich für eine Aufgabe mit Datum wählen, ob sie ganztägig ist oder zu einer festen Uhrzeit stattfindet, damit die Angabe später im Kalender (PROJ-9) korrekt dargestellt werden kann.

## Out of Scope
- Eigene Kalenderansicht (Wochen-/Monatsraster, Drag & Drop zum Verschieben/Verlängern) — vollständig Teil von PROJ-9 (Dashboard, das bereits einen eigenen „Wochenkalender"-Punkt führt und von PROJ-6 abhängt); PROJ-6 liefert dafür nur kalenderfertige Daten (Datum, Zeittyp, Kategorie, „Im Kalender anzeigen"-Flag)
- Eigener Eintragstyp „Termin" (kalenderspezifische Einträge ohne Checkbox/Priorität, z.B. feste Termine wie im Prototyp „Vorlesung/Seminar" als Ereignis) — ohne existierende Kalenderansicht wäre er aktuell nirgends sichtbar; kann bei Bedarf zusammen mit PROJ-9 ergänzt werden
- Dritter Zeitzustand „Ohne Uhrzeit" (Datum ohne Ganztägig-/Zeitslot-Angabe) — reduziert auf die zwei im Feature-Titel genannten Zustände Ganztägig/Zeitslot
- Verknüpfung mit dem Themenkatalog (Fach/Thema, PROJ-2) — Aufgaben sind nicht Teil der Kompetenzanalyse (PROJ-8 wertet ausschließlich PROJ-3/4/5 aus) und brauchen daher keine Themen-Zuordnung
- Wiederkehrende Aufgaben/Serientermine — nicht Teil des MVP
- Erinnerungen/Benachrichtigungen (Push, E-Mail, Browser-Notifications) — keine Notification-Infrastruktur im Projekt vorhanden
- Verwalten (Umbenennen/Löschen) eigener Kategorien nach dem Anlegen — MVP unterstützt nur das Anlegen; Verwaltung kann später ergänzt werden, analog zur Themenverwaltung in PROJ-2
- Aufnahme von Aufgaben in den hub-übergreifenden Wiederholungsplan (PROJ-7) — dieser aggregiert ausschließlich fällige Wiederholungen aus Karteikarten/Übungsaufgaben/Probeklausuren, keine Todos
- Mehrfachauswahl/Stapel-Aktionen, Import/Export, Offline-Nutzung, Bilder/Anhänge — analog PROJ-3/4/5 nicht Teil des MVP

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Todo-Route direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn die Todo-Liste lädt, dann werden alle eigenen Aufgaben geladen und mit dem Standardfilter „Offen" sowie der Standardsortierung „Zeit" angezeigt
- [ ] Angenommen es existieren noch keine Aufgaben, wenn der Hub lädt, dann erscheint der Hinweis „Keine Aufgaben" statt einer leeren Liste

### Anlegen
- [ ] Angenommen der Nutzer öffnet das Formular für eine neue Aufgabe, wenn er nur einen Titel eingibt und speichert, dann wird die Aufgabe ohne Datum, ohne Kategorie und mit Priorität „Keine" angelegt und erscheint sofort in der Gruppe „Ohne Datum"
- [ ] Angenommen der Titel ist leer oder besteht nur aus Leerzeichen, wenn der Nutzer speichern möchte, dann wird das Speichern verhindert und eine Validierungsfehlermeldung angezeigt
- [ ] Angenommen der Nutzer setzt kein Datum, dann ist die Auswahl „Ganztägig/Zeitslot" nicht verfügbar, da sie ohne Datum keine Bedeutung hat
- [ ] Angenommen der Nutzer setzt ein Datum, wenn er zusätzlich „Zeitslot" wählt und eine Start- und Endzeit einträgt, dann wird die Aufgabe mit dieser Zeitspanne gespeichert
- [ ] Angenommen der Nutzer wählt „Zeitslot", wenn die eingetragene Endzeit vor oder gleich der Startzeit liegt, dann wird das Speichern verhindert und eine Validierungsfehlermeldung angezeigt

### Kategorie
- [ ] Angenommen der Nutzer legt eine Aufgabe an, wenn er eine der vier festen Kategorien (Vorlesung/Seminar, Lernsession, Wiederholung, Frist/Prüfung) wählt, dann wird die Aufgabe mit der zugehörigen Kategorie-Farbe in der Liste angezeigt
- [ ] Angenommen der Nutzer klickt auf „Eigene Kategorie anlegen", wenn er einen Namen und eine Farbe aus der Farbauswahl wählt und bestätigt, dann steht die neue Kategorie sofort in der Kategorie-Auswahl zur Verfügung und ist direkt der aktuellen Aufgabe zugeordnet
- [ ] Angenommen der Nutzer gibt für eine eigene Kategorie einen Namen ein, der (unabhängig von Groß-/Kleinschreibung) bereits existiert, dann wird keine doppelte Kategorie angelegt, sondern die bestehende Kategorie der Aufgabe zugeordnet
- [ ] Angenommen eine Aufgabe hat keine Kategorie zugewiesen, dann wird kein Kategorie-Badge angezeigt

### Priorität
- [ ] Angenommen der Nutzer legt eine Aufgabe an, wenn er eine Priorität (Hoch/Mittel/Niedrig) wählt, dann wird die Priorität farblich (Ampel-Rot/Amber/Grün) in der Liste angezeigt
- [ ] Angenommen eine Aufgabe hat die Priorität „Keine" (Standardwert), dann wird kein Prioritäts-Indikator angezeigt

### Status & Überfälligkeit
- [ ] Angenommen eine Aufgabe ist offen, wenn der Nutzer auf die Checkbox klickt, dann wird sie sofort als erledigt markiert, durchgestrichen dargestellt und verschwindet je nach aktivem Filter aus der Ansicht
- [ ] Angenommen eine Aufgabe ist bereits erledigt, wenn der Nutzer erneut auf die Checkbox klickt, dann wird sie wieder als offen markiert
- [ ] Angenommen eine Aufgabe hat ein Datum in der Vergangenheit und ist nicht erledigt, dann wird sie optisch als überfällig hervorgehoben (Ampel-Rot)
- [ ] Angenommen eine Aufgabe hat ein Datum in der Vergangenheit, ist aber bereits erledigt, dann wird sie nicht als überfällig hervorgehoben
- [ ] Angenommen eine Aufgabe hat kein Datum, dann wird sie nie als überfällig markiert

### Bearbeiten & Löschen
- [ ] Angenommen eine Aufgabe existiert, wenn der Nutzer auf den Aufgabentext klickt, dann öffnet sich das Formular vorausgefüllt mit den aktuellen Werten
- [ ] Angenommen der Nutzer ändert Werte einer bestehenden Aufgabe, wenn er speichert, dann werden die Änderungen übernommen, das Formular schließt sich und die Liste zeigt sofort den neuen Stand
- [ ] Angenommen eine Aufgabe existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, bevor die Aufgabe endgültig entfernt wird
- [ ] Angenommen die API ist beim Speichern nicht erreichbar, wenn der Nutzer das Formular abschickt, dann wird eine Fehlermeldung angezeigt und die Eingaben bleiben im Formular erhalten

### Filter & Sortierung
- [ ] Angenommen Aufgaben mit unterschiedlichem Erledigt-Status existieren, wenn der Nutzer zwischen „Offen", „Erledigt" und „Alle" wechselt, dann zeigt die Liste ausschließlich die zum Filter passenden Aufgaben
- [ ] Angenommen die Sortierung „Zeit" ist aktiv, dann werden Aufgaben nach Datum gruppiert (Heute/Morgen/Gestern/Datum, „Ohne Datum" zuletzt) und innerhalb jeder Gruppe nach Uhrzeit sortiert (Aufgaben ohne Uhrzeit zuletzt)
- [ ] Angenommen der Nutzer wählt die Sortierung „Priorität", dann werden Aufgaben innerhalb jeder Datumsgruppe nach Priorität (Hoch → Mittel → Niedrig → Keine) sortiert
- [ ] Angenommen der Nutzer wählt die Sortierung „Kategorie", dann werden Aufgaben innerhalb jeder Datumsgruppe alphabetisch nach Kategoriename sortiert, Aufgaben ohne Kategorie zuletzt
- [ ] Angenommen für den aktiven Filter existieren keine passenden Aufgaben, dann erscheint der Hinweis „Keine Aufgaben" für diesen Filter

### Kalender-Vorbereitung (Datenfeld für PROJ-9)
- [ ] Angenommen der Nutzer legt eine Aufgabe an, dann ist der Schalter „Im Kalender anzeigen" standardmäßig aktiviert und kann vom Nutzer deaktiviert werden
- [ ] Angenommen der Schalter „Im Kalender anzeigen" ist deaktiviert, dann wird dieser Zustand zusammen mit der Aufgabe gespeichert, hat aber innerhalb der Todo-Liste selbst keine sichtbare Auswirkung (wirkt erst in der Kalenderansicht von PROJ-9)

## Edge Cases
- Titel enthält nur Leerzeichen → wird wie ein leeres Pflichtfeld behandelt, Speichern wird verhindert
- Zeitslot mit Endzeit gleich oder vor der Startzeit → Speichern wird verhindert, Validierungsfehlermeldung erscheint
- Netzwerkfehler beim Speichern oder Löschen → Fehlermeldung wird angezeigt, Formular bzw. bestehender Eintrag bleiben unverändert
- Aufgabe ohne Datum wird als erledigt markiert → landet unter dem „Erledigt"-Filter in der Gruppe „Ohne Datum", kann nie als überfällig gelten
- Neue eigene Kategorie mit einem Namen, der (groß-/kleinschreibungsunabhängig) bereits existiert → keine Dublette, bestehende Kategorie wird wiederverwendet
- Zwei Browser-Tabs bearbeiten dieselbe Aufgabe parallel → der zuletzt gespeicherte Stand gewinnt, kein Konflikt-Dialog im MVP
- Datum liegt weit in der Vergangenheit oder Zukunft → uneingeschränkt erlaubt, auch für rückwirkend erfasste Aufgaben

## Open Questions
<!-- Keine offenen Punkte aus dem Interview -->

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Kein eigenes Kalender-Grid in PROJ-6; nur kalenderfertige Datenfelder (Datum, Zeittyp, Kategorie, „Im Kalender anzeigen") | PROJ-9 (Dashboard) führt „Wochenkalender" bereits als eigenen Punkt und hängt von PROJ-6 ab — klare Trennung Datenhaltung (PROJ-6) vs. Kalenderdarstellung (PROJ-9) | 2026-09-09 |
| Kein eigener Typ „Termin"; nur „Aufgabe" mit optionaler Frist | Ohne existierende Kalenderansicht wäre ein reiner Kalendertermin (nicht in der Liste sichtbar) aktuell nirgends darstellbar | 2026-09-09 |
| Zeittyp auf „Ganztägig" und „Zeitslot" reduziert (kein drittes „Ohne Uhrzeit") | Deckt sich mit dem Feature-Titel in INDEX.md und vereinfacht das Datenmodell | 2026-09-09 |
| Kategorien 1:1 aus dem Prototyp übernommen (4 feste + eigene mit Farbwahl) | Nutzerwunsch; erhält die im Design-System dokumentierte Kalender-Kategorien-Farbcodierung vollständig | 2026-09-09 |
| „Frist" ist keine eigene Entität, sondern eine Aufgabe mit Kategorie „Frist/Prüfung" | Vermeidet ein doppeltes Datenmodell; deckt sich mit dem Prototyp-Verhalten | 2026-09-09 |
| Überfällige offene Aufgaben werden optisch hervorgehoben (Ampel-Rot) | Sichtbarkeit von Fristdruck ist für die Examensvorbereitung wichtig | 2026-09-09 |
| Löschen nur mit Bestätigungsdialog (AlertDialog) | Konsistent mit der bestehenden Konvention in PROJ-3/4/5 | 2026-09-09 |
| Keine Verknüpfung mit dem Themenkatalog (Fach/Thema) | Todos fließen nicht in die Kompetenzanalyse (PROJ-8) ein; Abhängigkeit in INDEX.md listet nur PROJ-1 | 2026-09-09 |

### Technical Decisions
<!-- Wird von /architecture ergänzt -->

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
