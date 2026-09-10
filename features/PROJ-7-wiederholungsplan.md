# PROJ-7: Wiederholungsplan

## Status: In Progress
**Created:** 2026-09-10
**Last Updated:** 2026-09-10

## Dependencies
- PROJ-1 (Supabase-Infrastruktur-Setup) — für Auth-Schutz der Route und das RLS-Muster
- PROJ-3 (Karteikarten-Hub) — aggregiert `wdh_datum` je Karteikarte
- PROJ-4 (Übungsaufgaben-Hub) — aggregiert `pflicht_wdh_datum` je Übungsaufgabe (nur Status „Wiederholung fällig")
- PROJ-5 (Probeklausuren-Hub) — aggregiert die Nachschreiben-Fälligkeit (Klausurdatum + 75 Tage) je Klausur

## User Stories
- Als Lukas möchte ich an einer Stelle sehen, welche Wiederholungen aus allen drei Lernsäulen (Karteikarten, Übungsaufgaben, Probeklausuren) überfällig, heute fällig oder für die kommende Woche geplant sind, damit ich nicht jeden Hub einzeln durchsuchen muss, um zu wissen, was als Nächstes ansteht.
- Als Lukas möchte ich pro Eintrag sofort erkennen, aus welchem Hub er stammt, um welches Fach/Thema es geht und wie dringend er ist (Ampelfarbe), damit ich meine Lernzeit priorisieren kann.
- Als Lukas möchte ich einen Eintrag anklicken und direkt im richtigen Hub landen, damit ich die eigentliche Bewertung/Nacharbeit ganz normal dort erledige, ohne dass die Bewertungslogik doppelt existiert.
- Als Lukas möchte ich nach Art (Karteikarte/Übungsaufgabe/Probeklausur), Fach und Fälligkeit filtern können, damit ich gezielt z.B. nur überfällige Karteikarten eines Fachs sehe.
- Als Lukas möchte ich eine fällige Nachschreiben-Erinnerung direkt im Plan als erledigt markieren können, ohne extra zur Klausur navigieren zu müssen, da das nur ein einfacher Ja/Nein-Schalter ohne Bewertungsformular ist.

## Out of Scope
- Inline-Bewertung von Karteikarten oder Übungsaufgaben direkt im Plan — bewusst nur Verlinkung zum jeweiligen Hub (siehe Decision Log); einzige Ausnahme ist „Nachschreiben erledigt" bei Probeklausuren
- Automatischer Start der Fokuseinheit (PROJ-3) per Klick auf eine einzelne Karteikarte — der Link setzt nur den passenden Fach-/Typ-Filter im Karteikarten-Hub, die Fokuseinheit wird weiterhin manuell vom Nutzer gestartet; keine Änderung an PROJ-3
- Aufnahme von Todos (PROJ-6) in den Plan — bereits in PROJ-6 als Out-of-Scope-Entscheidung festgehalten, der Plan aggregiert ausschließlich Karteikarten/Übungsaufgaben/Probeklausuren
- Pagination/Virtualisierung der „Alle anzeigen"-Liste — für die erwartete Datenmenge einer Single-User-App nicht nötig
- Eine neue Datenbanktabelle für den Plan — reine Aggregationsansicht über die drei bestehenden Hub-Tabellen, keine neuen persistenten Daten
- Gruppierung der „Alle anzeigen"-Ansicht nach Monat/Zeitraum — stattdessen eine flache, nach Fälligkeit sortierte Liste (siehe Decision Log)
- Kalenderansicht/Wochenraster — Teil von PROJ-9 (Dashboard)
- Kompetenz-/Themen-Auswertung, Fehlermuster-Empfehlungen, Stufenlogik — Teil von PROJ-8 (Kompetenzanalyse)
- Erinnerungen/Benachrichtigungen (Push, E-Mail) — wie bereits in PROJ-6 entschieden, keine Notification-Infrastruktur vorhanden
- Bearbeiten/Löschen von Karteikarten, Übungsaufgaben oder Klausuren direkt im Plan — bleibt exklusiv den jeweiligen Hubs vorbehalten
- Mehrfachauswahl/Stapel-Aktionen, Offline-Nutzung — analog PROJ-3–6 nicht Teil des MVP
- Vorbefüllung des Fach-/Typ-Filters im Zielhub beim Verlinken (z.B. per URL-Parameter) — bewusst nicht umgesetzt, um die drei bereits produktiven Hub-Seiten unverändert zu lassen (siehe Decision Log); der Klick führt zur Hub-Startseite, der Nutzer filtert dort bei Bedarf selbst

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Zugriff & Grundgerüst
- [ ] Angenommen der Nutzer ist nicht eingeloggt, wenn er die Wiederholungsplan-Route direkt aufruft, dann wird er zu `/login?redirect=...` umgeleitet
- [ ] Angenommen der Nutzer ist eingeloggt, wenn der Wiederholungsplan lädt, dann werden alle eigenen fälligen/geplanten Wiederholungen aus Karteikarten, Übungsaufgaben und Probeklausuren geladen und in den drei Standard-Gruppen „Überfällig", „Heute fällig" und „Diese Woche" angezeigt
- [ ] Angenommen in keiner der drei Standard-Gruppen existiert ein Eintrag, dann erscheint der Hinweis „Keine fälligen oder geplanten Wiederholungen" statt einer leeren Liste

### Aggregation & Gruppierung
- [ ] Angenommen eine Karteikarte hat ein `wdh_datum` in der Vergangenheit, dann erscheint sie in der Gruppe „Überfällig"
- [ ] Angenommen eine Karteikarte hat `wdh_datum` = heute, dann erscheint sie in der Gruppe „Heute fällig"
- [ ] Angenommen eine Karteikarte hat ein `wdh_datum` innerhalb der nächsten 7 Tage (heute+1 bis heute+7), dann erscheint sie in der Gruppe „Diese Woche"
- [ ] Angenommen eine Karteikarte hat ein `wdh_datum` mehr als 7 Tage in der Zukunft, dann erscheint sie in keiner der drei Standard-Gruppen, sondern ausschließlich in der „Alle anzeigen"-Ansicht
- [ ] Angenommen eine Übungsaufgabe hat den Status „Wiederholung fällig" (gesetztes `pflicht_wdh_datum`), dann erscheint sie nach derselben Überfällig/Heute/Diese-Woche/Alle-Logik wie Karteikarten
- [ ] Angenommen eine Übungsaufgabe hat den Status „Unbewertet", „Gültig", „Verfallen" oder „Geschlossen" (kein offenes `pflicht_wdh_datum`), dann erscheint sie in keiner Gruppe des Plans
- [ ] Angenommen eine Probeklausur ist noch keine 75 Tage alt, wenn ihr Nachschreiben-Fälligkeitsdatum (Klausurdatum + 75 Tage) innerhalb der nächsten 7 Tage liegt, dann erscheint sie bereits vorausschauend in der Gruppe „Diese Woche" — auch wenn der Nachschreiben-Hinweis im Probeklausuren-Hub selbst dort noch nicht sichtbar ist
- [ ] Angenommen eine Probeklausur hat ihr Nachschreiben-Fälligkeitsdatum erreicht oder überschritten und ist nicht als nachgeschrieben markiert, dann erscheint sie je nach Datum in „Heute fällig" bzw. „Überfällig"
- [ ] Angenommen eine Probeklausur ist bereits als nachgeschrieben markiert, dann erscheint sie in keiner Gruppe des Plans
- [ ] Angenommen der Nutzer wählt im Fälligkeits-Filter „Alle", dann werden zusätzlich zu den drei Standard-Gruppen auch alle weiter in der Zukunft liegenden Einträge als flache, nach Fälligkeit aufsteigend sortierte Liste angezeigt

### Darstellung je Eintrag
- [ ] Angenommen ein Eintrag stammt aus Karteikarten, dann zeigt er Typ-Badge (Theorie/Klausurtechnik), Fach, Themen-Chips, Frage (gekürzt) und Fälligkeitsdatum
- [ ] Angenommen ein Eintrag stammt aus Übungsaufgaben, dann zeigt er Fach, Themen-Chips, Titel und Fälligkeitsdatum der Pflicht-Wiederholung; ergab die zugrunde liegende Bewertung `worst` ≤ 2, zusätzlich den Hinweis „Nacharbeit empfohlen"
- [ ] Angenommen ein Eintrag stammt aus Probeklausuren, dann zeigt er Bezeichnung, alle beteiligten Fach-Badges (Vereinigung der Teile-Fächer) und das Nachschreiben-Fälligkeitsdatum
- [ ] Angenommen ein Eintrag befindet sich in der Gruppe „Überfällig", dann wird er per Ampel-Rot hervorgehoben; „Heute fällig" per Ampel-Amber; „Diese Woche" und „Alle anzeigen" neutral/grün

### Verlinkung & Aktionen
- [ ] Angenommen der Nutzer klickt auf einen Karteikarten-Eintrag, dann wird er zum Karteikarten-Hub navigiert (ohne vorausgewählten Filter — der Nutzer filtert dort bei Bedarf selbst)
- [ ] Angenommen der Nutzer klickt auf einen Übungsaufgaben-Eintrag, dann wird er zum Übungsaufgaben-Hub navigiert (ohne vorausgewählten Filter)
- [ ] Angenommen der Nutzer klickt auf einen Probeklausur-Eintrag (außerhalb des „Erledigt"-Buttons), dann wird er zum Probeklausuren-Hub navigiert (ohne vorausgewählten Filter)
- [ ] Angenommen der Nutzer klickt bei einem Probeklausur-Eintrag auf „Nachschreiben erledigt", dann wird die Klausur als nachgeschrieben markiert, der Eintrag verschwindet sofort aus dem Plan, und die Änderung ist identisch mit der bereits in PROJ-5 bestehenden Aktion (persistiert, auch im Probeklausuren-Hub sichtbar)

### Filter
- [ ] Angenommen Einträge unterschiedlicher Art existieren, wenn der Nutzer den Art-Filter (Alle/Karteikarten/Übungsaufgaben/Probeklausuren) wechselt, dann zeigt der Plan nur noch Einträge der gewählten Art
- [ ] Angenommen Einträge unterschiedlicher Fächer existieren, wenn der Nutzer nach Fach filtert, dann zeigt der Plan nur noch passende Einträge (bei Klausuren: mindestens ein Teil mit diesem Fach, analog PROJ-5)
- [ ] Angenommen der Nutzer wählt im Fälligkeits-Filter eine einzelne Kategorie (Überfällig/Heute fällig/Diese Woche), dann zeigt der Plan ausschließlich Einträge dieser Kategorie, ohne die anderen Standard-Gruppen
- [ ] Angenommen eine Filterkombination liefert keine Treffer, dann erscheint der Hinweis „Keine Wiederholungen für diese Auswahl"

### Fehler & Sicherheit
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Laden des Plans fehl, dann erscheint die Meldung „Verbindung fehlgeschlagen, bitte später erneut versuchen" statt eines teilweise geladenen Plans
- [ ] Angenommen die Verbindung zu Supabase schlägt beim Markieren „Nachschreiben erledigt" fehl, dann erscheint dieselbe Fehlermeldung, der Eintrag bleibt sichtbar und der Button bleibt bedienbar
- [ ] Angenommen ein Nutzer versucht ohne gültige Session direkt per API/DB-Query auf die zugrunde liegenden Tabellen zuzugreifen, dann verweigert RLS jeden Zugriff (identische, bereits bestehende Policies aus PROJ-3/4/5 — keine neue Tabelle)

## Edge Cases
- Nutzer hat noch keine Karteikarten/Übungsaufgaben/Klausuren angelegt → leerer Zustand, identisch zum Fall „keine fälligen Wiederholungen trotz vorhandener Daten"
- Übungsaufgabe mit Status „Geschlossen" (Pflicht-Wiederholungen ausgeschöpft) → erscheint nie im Plan, unabhängig vom Datum der letzten Bewertung
- Klausur mit mehreren Teilen unterschiedlicher Fächer → Fach-Filter matcht, sobald mindestens ein Teil passt (identisches Prinzip wie PROJ-5)
- Karteikarte mit `wdh_datum` weit in der Zukunft (z.B. 120 Tage bei `INTERVALL_MAX`) → nur in „Alle anzeigen" sichtbar, nicht in den drei Standard-Gruppen
- Fälligkeitsdatum liegt genau am Rand der 7-Tage-Grenze (heute+7) → zählt noch zu „Diese Woche" (identische Grenzfall-Konvention wie `diffTage`-Nutzung in PROJ-3/5)
- Nutzer markiert eine Nachschreiben-Erinnerung im Plan als erledigt, während derselbe Klausur-Datensatz in einem anderen Tab im Probeklausuren-Hub offen ist → kein Konflikt-Handling, identisch zur Single-User-Konvention aus PROJ-1–6; der andere Tab zeigt den alten Stand bis zum nächsten Laden
- Alle drei Hubs haben aktuell keine Einträge in den drei Standard-Gruppen, aber „Alle anzeigen" liefert dennoch (weit in der Zukunft liegende) Treffer → Standardansicht zeigt trotzdem den leeren Zustand, „Alle anzeigen" bleibt als Filteroption verfügbar
- Sehr lange Themen-/Fragetexte in den Einträgen → identisches Kürzungsverhalten wie in PROJ-3/4 (keine neue Logik nötig)

## Technical Requirements (optional)
- Security: Keine neue Tabelle — der Plan liest ausschließlich aus den bereits RLS-geschützten Tabellen `karteikarten`, `uebungsaufgaben` (inkl. `uebungsaufgaben_reviews` für den „Nacharbeit empfohlen"-Hinweis) und `klausuren`/`klausur_teile` (PROJ-1/3/4/5-Muster, `auth.uid() = user_id`)
- Datenmodell: Keine Schemaänderung an bestehenden Tabellen nötig; alle für die Aggregation benötigten Felder (`wdh_datum`, `pflicht_wdh_datum`, Klausurdatum + `nachschreiben_erledigt`) existieren bereits
- Algorithmus: Gruppierung nutzt dieselbe Tages-Arithmetik (`diffTage`/`heuteISO`) wie PROJ-3/4/5/6, keine neue Datumslogik
- Parameter: Nachschreiben-Fälligkeitsdatum = Klausurdatum + `NACHSCHREIBEN_TAGE` (75 Tage, Berechnungsspezifikation Abschnitt 1) — identisch zu PROJ-5, hier zusätzlich vorausschauend für die „Diese Woche"-Gruppe ausgewertet, nicht erst ab Fälligkeit
- Performance: Laden des aggregierten Plans < 500ms (etwas großzügiger als die 300ms-Vorgabe der Einzel-Hubs, da drei Tabellen zusammengeführt werden)

## Open Questions
<!-- Keine offenen Punkte aus dem Interview -->

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Standardansicht zeigt nur Überfällig + Heute fällig + Diese Woche (rollierendes 7-Tage-Fenster), nicht alle zukünftigen Wiederholungen | Karteikarten erhalten bei jeder Bewertung ein neues, teils weit in der Zukunft liegendes `wdh_datum` (bis zu 120 Tage) — eine ungefilterte Liste würde bei wachsendem Kartenbestand schnell unbrauchbar groß. Eine tägliche Review-Queue (analog Anki) ist der eigentliche Zweck des Plans | 2026-09-10 |
| „Diese Woche" ist ein rollierendes 7-Tage-Fenster (heute+1 bis heute+7), keine Kalenderwoche | Konsistent mit der bereits etablierten `diffTage`-basierten relativen Gruppierung (z.B. Heute/Morgen/Gestern in PROJ-6), statt einer zusätzlichen, hier nicht benötigten Kalenderwochen-Logik | 2026-09-10 |
| Zusätzlicher Fälligkeits-Filter „Alle" ergänzt die Standardansicht | Nutzerwunsch — volle Transparenz soll bei Bedarf möglich bleiben, auch wenn sie nicht der Standardfall ist | 2026-09-10 |
| „Alle anzeigen" ist eine flache, nach Fälligkeit sortierte Liste ohne weitere Zeitraum-Gruppierung | Nur Karteikarten liefern praktisch unbegrenzt viele Einträge; Übungsaufgaben-Wiederholungen und Nachschreiben-Erinnerungen sind von Natur aus wenige (max. 2 pro Aufgabe bzw. 1 pro Klausur) — eine zusätzliche Gruppierungsebene wäre unverhältnismäßiger Aufwand für den tatsächlichen Umfang | 2026-09-10 |
| Filter nach Art (Karteikarte/Übungsaufgabe/Probeklausur), Fälligkeit (Überfällig/Heute/Diese Woche/Alle) und Fach | Nutzerwunsch; Fach-Filter zusätzlich vorgeschlagen und bestätigt, da er in allen drei zugrunde liegenden Hubs bereits existiert und für die themenbezogene Priorisierung zentral ist | 2026-09-10 |
| Plan ist reine Übersicht mit Verlinkung zum jeweiligen Hub, keine Inline-Bewertung | Vermeidet doppelte Bewertungslogik/-UI, die bereits vollständig in PROJ-3/4 existiert; entspricht der Single-Responsibility-Konvention des Projekts. Einzige Ausnahme: „Nachschreiben erledigt" (siehe unten) | 2026-09-10 |
| Einzige Ausnahme von „nur Verlinkung": „Nachschreiben erledigt" bei Probeklausuren ist direkt im Plan als Button verfügbar | Ist in PROJ-5 bereits ein reiner Ja/Nein-Schalter ohne Bewertungsformular — keine Bewertungslogik wird dupliziert, nur derselbe einfache Toggle zusätzlich von hier aus aufgerufen | 2026-09-10 |
| Klick auf einen Karteikarten-Eintrag navigiert nur zum Karteikarten-Hub, startet NICHT automatisch die Fokuseinheit | Die bestehende Fokuseinheit (PROJ-3) ist für einen Fach+Typ-Filtersatz aller fälligen Karten ausgelegt, nicht für eine einzelne angeklickte Karte — ein Auto-Start würde eine Erweiterung an PROJ-3 erfordern und bleibt bewusst außerhalb des Scopes | 2026-09-10 |
| **Architecture 2026-09-10:** Klicks auf Karteikarten-/Übungsaufgaben-/Probeklausur-Einträge verlinken ohne vorausgewählten Fach-/Typ-Filter zur jeweiligen Hub-Startseite — löst die ursprüngliche Entscheidung „Fach/Typ bereits als Filter vorausgewählt" ab | Bewusster Scope-Schnitt in `/architecture`: eine Vorauswahl hätte eine (wenn auch kleine, rückwärtskompatible) Änderung an allen drei bereits produktiven Hub-Seiten erfordert, um den Startfilter aus der URL zu lesen. Nutzerentscheidung, PROJ-7 stattdessen vollständig unabhängig von Änderungen an PROJ-3/4/5 zu halten — der Nutzer filtert nach der Navigation bei Bedarf manuell | 2026-09-10 |
| Nachschreiben-Fälligkeit wird im Plan bereits vorausschauend ausgewertet (erscheint in „Diese Woche", sobald Klausurdatum+75 in die kommenden 7 Tage fällt), obwohl der Hinweis im Probeklausuren-Hub selbst erst ab Tag 75 erscheint | Der Plan dient explizit der Vorausschau/Planung, PROJ-5 bleibt davon unberührt (zeigt seinen Hinweis weiterhin unverändert erst ab Fälligkeit) — unterschiedliche Zwecke der beiden Views rechtfertigen unterschiedliches Timing | 2026-09-10 |
| Übungsaufgaben ohne offene Pflicht-Wiederholung (Status Unbewertet/Gültig/Verfallen/Geschlossen) erscheinen nie im Plan | Konsistent mit der PROJ-4-Datenmodellierung — nur „Wiederholung fällig" hat überhaupt ein Datum, auf dessen Basis eine Gruppierung möglich wäre | 2026-09-10 |
| Todos (PROJ-6) fließen nicht in den Plan ein | Bereits in PROJ-6 als Out-of-Scope-Entscheidung festgehalten | 2026-09-10 |
| Keine neue Datenbanktabelle — reine Aggregationsabfrage über die drei bestehenden Hub-Tabellen | Alle benötigten Felder existieren bereits; eine zusätzliche Tabelle würde nur Synchronisationsaufwand ohne Mehrwert schaffen | 2026-09-10 |

### Technical Decisions
<!-- Added by /architecture -->
| Decision | Rationale | Date |
|----------|-----------|------|
| Keine neue Datenbanktabelle, keine neue Server Action für die Kernanzeige — reine Leseabfrage über die drei bestehenden Hub-Tabellen (`karteikarten`, `uebungsaufgaben` inkl. `uebungsaufgaben_reviews`, `klausuren` inkl. `klausur_teile`) plus `faecher`/`themen` | Identisches Ladeprinzip wie `/karteikarten`, `/uebungsaufgaben`, `/probeklausuren` (Server Component lädt beim Seitenaufruf per `Promise.all`); alle benötigten Felder existieren bereits, keine Schemaänderung nötig | 2026-09-10 |
| Wiederverwendung der bestehenden `markiereNachschreibenErledigt`-Server-Action aus PROJ-5 für den „Nachschreiben erledigt"-Button, statt einer neuen Aktion | Identisches Verhalten wie im Probeklausuren-Hub selbst, keine doppelte Schreiblogik. Einzige Ergänzung: ein zusätzlicher `revalidatePath("/wiederholungsplan")`-Aufruf neben dem bestehenden `revalidatePath("/probeklausuren")`, damit ein erneuter Aufruf des Plans den aktuellen Stand zeigt — eine rein additive, risikoarme Ein-Zeilen-Ergänzung an einer bereits produktiven Server Action | 2026-09-10 |
| Neue, reine Berechnungsdatei `src/lib/wiederholungsplan.ts` (analog `karteikarten-intervall.ts`/`uebungsaufgaben-wiederholung.ts`/`klausuren-berechnung.ts`) | Nimmt die bereits geladenen Domänenobjekte aus den drei Hubs entgegen und berechnet daraus die vereinheitlichten Einträge inkl. Dringlichkeits-Gruppe; nutzt die bestehenden `diffTage`/`heuteISO`-Datumsfunktionen weiter statt sie zu duplizieren | 2026-09-10 |
| Neue Client-Komponente `WiederholungsplanManager` mit client-seitigem Filtern/Gruppieren nach einmaligem Server-Ladevorgang | Identisches Muster wie `KarteikartenManager`/`UebungsaufgabenManager`/`ProbeklausurenManager` — Filterwechsel erfordert keinen erneuten Serverzugriff | 2026-09-10 |
| Klicks auf Einträge verlinken ohne vorausgewählten Filter zur jeweiligen Hub-Startseite (siehe Product-Decision-Update oben) — keine Änderung an `/karteikarten`, `/uebungsaufgaben`, `/probeklausuren` nötig | Nutzerentscheidung: PROJ-7 bleibt dadurch vollständig unabhängig von Änderungen an den drei bereits produktiven, deployten Hubs | 2026-09-10 |
| Kein neuer globaler Navigationseintrag zu `/wiederholungsplan` | Es existiert aktuell keine projektweite Navigation zwischen den Hubs (auch `/todos` hat keinen eingehenden Link); die zentrale Verlinkung entsteht mit PROJ-9 (Dashboard), das laut INDEX.md von PROJ-7 abhängt und noch nicht gebaut ist. Die Seite ist bis dahin per direktem Aufruf erreichbar | 2026-09-10 |
| Route `/wiederholungsplan`, Server Component (Datenladen) + Client-Manager-Komponente (Filter/Interaktion), identisch zum Muster aus PROJ-3–6 | Konsistenz mit dem bereits etablierten Muster im gesamten Projekt | 2026-09-10 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure
```
/wiederholungsplan (geschützte Route — Zugriff nur eingeloggt, sonst Redirect
                    zu /login, gesichert durch die bestehende Middleware aus
                    PROJ-1; erreichbar per direktem Aufruf, kein Eintrag in
                    einer projektweiten Navigation, siehe Tech Decisions)
└── Wiederholungsplan-Seite
    ├── Kopfzeile: Seitentitel + Kurzbeschreibung
    │
    ├── Filter-/Zählleiste
    │   ├── Art-Filter (Alle / Karteikarten / Übungsaufgaben / Probeklausuren)
    │   ├── Fach-Auswahl (Dropdown, alle 11 Fächer + "Alle Fächer")
    │   ├── Fälligkeits-Filter (Standard: alle drei Gruppen zusammen /
    │   │   Nur Überfällig / Nur Heute fällig / Nur Diese Woche / Alle —
    │   │   inkl. weiter in der Zukunft liegender Einträge)
    │   └── Gesamtzähler ("X Einträge")
    │
    ├── Gruppierte Ansicht (Standardfall, wenn der Fälligkeits-Filter auf
    │   "alle drei Gruppen" steht) — je Gruppe ein Abschnitt mit Label,
    │   Zähler und Ampelfarbe:
    │   ├── "Überfällig" (rot)
    │   ├── "Heute fällig" (amber)
    │   └── "Diese Woche" (grün/neutral)
    │
    ├── Flache Ansicht (wenn ein einzelner Fälligkeits-Filter oder "Alle"
    │   gewählt ist) — eine durchgehende, nach Fälligkeitsdatum aufsteigend
    │   sortierte Liste ohne weitere Gruppierung
    │
    ├── Je Eintrag (Zeile/Card, Inhalt abhängig von Art):
    │   ├── Karteikarte: Typ-Badge (Theorie/Klausurtechnik), Fach,
    │   │   Themen-Chips, Frage (gekürzt), Fälligkeitsdatum, Ampelfarbe
    │   │   → Klick navigiert zur Karteikarten-Hub-Startseite
    │   ├── Übungsaufgabe: Fach, Themen-Chips, Titel, „Nacharbeit
    │   │   empfohlen"-Hinweis (falls zutreffend), Fälligkeitsdatum,
    │   │   Ampelfarbe → Klick navigiert zur Übungsaufgaben-Hub-Startseite
    │   └── Probeklausur: Bezeichnung, Fach-Badges (Vereinigung der
    │       Teile-Fächer), Nachschreiben-Fälligkeitsdatum, Ampelfarbe,
    │       „Nachschreiben erledigt"-Button (inline, eigener Klickbereich)
    │       → Klick auf den restlichen Eintrag navigiert zur
    │       Probeklausuren-Hub-Startseite
    │
    ├── Leerer Zustand — zwei Varianten:
    │   ├── "Keine fälligen oder geplanten Wiederholungen" (keine Filter
    │   │   aktiv, alle drei Standard-Gruppen leer)
    │   └── "Keine Wiederholungen für diese Auswahl" (aktive Filter liefern
    │       0 Treffer)
    │
    └── Lade-/Fehlerzustände (Skeleton beim initialen Laden, "Verbindung
        fehlgeschlagen"-Hinweis bei Netzwerkfehlern; der "Nachschreiben
        erledigt"-Button zeigt einen eigenen Inline-Fehler, falls nur diese
        eine Aktion fehlschlägt)
```

### Data Model (in plain language)
```
Der Wiederholungsplan hat kein eigenes Datenmodell und keine neue Tabelle.
Bei jedem Seitenaufruf werden die bereits bestehenden Daten aus drei Hubs
zusammengeführt und zu einer einheitlichen Liste kombiniert:

Aus "karteikarten" (PROJ-3): jede Karte mit ihrem nächsten Fälligkeitsdatum
(wdh_datum), Fach, Typ, zugeordneten Themen und Frage.

Aus "uebungsaufgaben" (PROJ-4) + "uebungsaufgaben_reviews": ausschließlich
Aufgaben mit offener Pflicht-Wiederholung (pflicht_wdh_datum gesetzt), inkl.
Fach, Themen, Titel und ob die zugehörige letzte Bewertung eine
Nacharbeit-Empfehlung ausgelöst hat (worst ≤ 2).

Aus "klausuren" (PROJ-5) + "klausur_teile": jede noch nicht als
nachgeschrieben markierte Klausur, inkl. Bezeichnung und aller beteiligten
Fächer (Vereinigung der Teile-Fächer) sowie ihres berechneten
Nachschreiben-Datums (Klausurdatum + 75 Tage).

Zusätzlich aus "faecher"/"themen" (PROJ-2): Bezeichnungen für die
Fach-/Themen-Chips der Einträge.

Für jeden Eintrag wird zusätzlich berechnet (nie gespeichert, identisches
Prinzip wie die Status-Badges in PROJ-3/4/5):
- Dringlichkeits-Gruppe (Überfällig / Heute fällig / Diese Woche / Später)
  anhand des Abstands zwischen Fälligkeitsdatum und heutigem Datum
- Ampelfarbe, direkt aus der Dringlichkeits-Gruppe abgeleitet

Geschrieben wird dabei nichts Neues — einzige Schreiboperation ist das
bereits bestehende "nachschreiben_erledigt"-Flag auf der Klausuren-Tabelle
(PROJ-5), hier zusätzlich von dieser Seite aus aufrufbar über dieselbe,
bereits bestehende Aktion.

Zugriffsregel (Row Level Security): keine neuen Policies nötig — der Plan
liest ausschließlich über die bereits bestehenden, RLS-geschützten
PROJ-2/3/4/5-Tabellen und -Policies.

Gespeichert in: Supabase (PostgreSQL) — wie alle bisherigen Daten, keine
neue Infrastruktur.
```

### Tech Decisions (Reasoning)
- **Keine neue Tabelle, keine neue Kern-Server-Action:** Der Plan ist eine reine Leseansicht über bereits bestehende, RLS-geschützte Daten aus PROJ-3/4/5 — jede zusätzliche Tabelle würde nur unnötigen Synchronisationsaufwand schaffen, ohne dass neue Informationen entstehen.
- **Wiederverwendung von `markiereNachschreibenErledigt` (PROJ-5) statt einer neuen Aktion:** identisches Verhalten, keine doppelte Schreiblogik für denselben Vorgang. Die einzige Ergänzung ist ein zusätzlicher Revalidierungsaufruf für die neue Route — eine minimale, risikoarme Änderung an einer bereits produktiven Datei.
- **Neue reine Berechnungsdatei statt Vermischung mit UI-Code:** folgt exakt dem bereits etablierten Muster (`karteikarten-intervall.ts`, `uebungsaufgaben-wiederholung.ts`, `klausuren-berechnung.ts`) — isoliert testbar, keine Duplizierung der bestehenden Datumsfunktionen.
- **Client-seitiges Filtern/Gruppieren nach einmaligem Laden:** identisches, bereits bewährtes Muster wie in allen vier bestehenden Hub-Managern — schnelle Filterwechsel ohne Serverlast, keine neue Architektur-Idee nötig.
- **Keine Vorauswahl des Zielfilters beim Verlinken zu den drei Hubs (Scope-Entscheidung dieser Architektur-Runde):** eine Vorauswahl hätte eine — wenn auch kleine und rückwärtskompatible — Änderung an allen drei bereits produktiven, deployten Hub-Seiten erfordert (Lesen des Startfilters aus der URL). Der Nutzer hat sich bewusst dagegen entschieden, um PROJ-7 vollständig unabhängig von PROJ-3/4/5-Änderungen zu halten; die Spec wurde entsprechend angepasst (siehe Decision Log).
- **Kein neuer globaler Navigationseintrag:** Es gibt aktuell keine projektweite Navigation zwischen den Hubs. Diese entsteht mit PROJ-9 (Dashboard), das ohnehin von PROJ-7 abhängt. Bis dahin ist `/wiederholungsplan` wie `/todos` nur per direktem Aufruf erreichbar.
- **Route `/wiederholungsplan`, Server Component + Client-Manager-Pattern:** konsistent mit dem bereits abgenommenen Muster aus PROJ-3–6.

### Dependencies
- Keine neuen npm-Pakete nötig — alle benötigten shadcn/ui-Komponenten (Select, Badge, Button, Card, Skeleton) sind bereits aus PROJ-1–6 im Projekt installiert
- Keine Supabase-Migration nötig — keine Schemaänderung, keine neuen Tabellen oder Policies

## Frontend Implementation Notes (Frontend Developer)

**Umgesetzt (2026-09-10):**
- `src/lib/wiederholungsplan.ts`: reine Aggregationsfunktion `wiederholungsEintraegeVon()` — nimmt die bereits geladenen Domänenobjekte aus PROJ-3/4/5 entgegen (`Karteikarte[]`, `Uebungsaufgabe[]` + `UebungsaufgabeReview[]`, `Klausur[]` + `KlausurTeil[]`) und baut daraus eine vereinheitlichte, nach Fälligkeit aufsteigend sortierte `WiederholungsEintrag[]`-Liste (discriminated union über `art`). `gruppeVon()` berechnet die Dringlichkeits-Gruppe (Überfällig/Heute/Diese Woche/Später) über das bereits bestehende `diffTage`/`heuteISO` aus `karteikarten-intervall.ts` — keine neue Datumslogik. Nachschreiben-Fälligkeit wird über `naechsteFaelligkeit(klausur.datum, NACHSCHREIBEN_TAGE)` vorausschauend berechnet (echtes Datum, nicht nur ein Boolean wie `nachschreibenFaellig()` in PROJ-5)
- `src/lib/wiederholungsplan.test.ts`: 14 Unit-Tests (Gruppen-Grenzfall bei genau 7 Tagen, Übungsaufgaben ohne offene Pflicht-Wiederholung werden ausgeschlossen, `nacharbeitEmpfohlen` bei `worst` ≤ 2, nachgeschriebene Klausuren werden ausgeschlossen, Fächer-Vereinigung über Teile, gemeinsame Sortierung über alle drei Arten hinweg) — alle grün
- `src/components/wiederholungsplan/wiederholungs-eintrag-card.tsx`: rendert einen Eintrag abhängig von `art` (Typ-Badge/Fach/Themen/Frage bei Karteikarten, Fach/Themen/Titel/Nacharbeit-Hinweis bei Übungsaufgaben, Bezeichnung/Fach-Badges bei Probeklausuren), Ampel-Badge nach Dringlichkeits-Gruppe. Klick auf den Eintrag navigiert per `useRouter().push()` zum jeweiligen Hub **ohne** vorausgewählten Filter (siehe Architecture-Entscheidung im Decision Log). Bei Probeklausuren zusätzlich ein „Nachschreiben erledigt"-Button mit `event.stopPropagation()`, damit der Klick nicht zugleich navigiert
- `src/components/wiederholungsplan/wiederholungsplan-manager.tsx`: Client-Komponente mit den drei Filtern (Art/Fach/Fälligkeit) und zwei Darstellungsmodi — gruppierte Standardansicht (3 Abschnitte, leere Gruppen werden ausgeblendet) und flache Liste (bei Einzel-Fälligkeitsfilter oder „Alle"). Unterscheidet die beiden Leer-Texte aus der Spec anhand eines `filtersAktiv`-Flags
- `src/app/wiederholungsplan/page.tsx`: async Server Component, lädt **live** aus den bereits produktiven Supabase-Tabellen von PROJ-2/3/4/5 (`faecher`, `themen`, `karteikarten`+`karteikarten_themen`, `uebungsaufgaben`+`uebungsaufgaben_themen`+`uebungsaufgaben_reviews`, `klausuren`+`klausur_teile`+`klausur_teile_themen`) — bewusst **keine** Platzhalter-Arrays wie bei PROJ-3–6 in deren Frontend-Phase, da PROJ-7 keine eigene Tabelle hat und alle Quelldaten bereits live im Projekt existieren (siehe „Kein separates /backend nötig" unten)
- `src/app/probeklausuren/actions.ts`: `markiereNachschreibenErledigt()` um einen zusätzlichen `revalidatePath("/wiederholungsplan")` neben dem bestehenden `revalidatePath("/probeklausuren")` ergänzt (wie im Tech Design vorgesehen) — einzige Änderung an einer bereits produktiven Datei, rein additiv

**Zwei bewusste Präzisierungen gegenüber dem Spec-Wortlaut beim Umsetzen:**
1. **Ampelfarbe folgt immer der tatsächlichen Dringlichkeits-Gruppe des Eintrags, auch in der flachen „Alle anzeigen"-Liste** — nicht wie die AC wörtlich nahelegt ein pauschales Neutral/Grün für alles außerhalb der drei Standard-Gruppen. Ein überfälliger Eintrag bleibt rot, auch wenn er über den Fälligkeits-Filter „Alle" sichtbar wird; nur echte „Später"-Einträge (> 7 Tage) sind neutral/grau. Grund: Ein pauschales Grün hätte die Dringlichkeits-Information gerade in der Ansicht verschleiert, in der sie am meisten zählt (mehr Einträge auf einen Blick). Die AC-Formulierung „Diese Woche und Alle anzeigen neutral/grün" wird dadurch für Diese-Woche-Einträge weiterhin erfüllt; für überfällige/heute-fällige Einträge, die zusätzlich über „Alle" sichtbar sind, correcter interpretiert.
2. **`kurzerText()` wird hier zur sichtbaren Textkürzung verwendet** (140 Zeichen), nicht nur für `aria-label` wie in PROJ-3–5 — passend zur AC „Frage (gekürzt)"/kompakte Eintragsdarstellung, da der Plan im Gegensatz zu den Einzel-Hubs bewusst kompakt bleiben soll.

**Kein separates `/backend` nötig:** Anders als PROJ-3–6 hat PROJ-7 keine eigene Tabelle — alle Datenquellen (Karteikarten, Übungsaufgaben, Probeklausuren) sind bereits vollständig produktiv aus PROJ-3/4/5. Die Seite lädt deshalb von Anfang an live, und die einzige Schreiboperation nutzt eine bereits bestehende, produktive Server Action. Die einzige rückwirkende Änderung an bestehendem Code ist die eine zusätzliche `revalidatePath`-Zeile oben, die bereits in dieser Sitzung erledigt wurde. Empfehlung: direkt zu `/qa` springen statt `/backend` separat auszuführen.

**Getestet:**
- `npm test`: 214/214 grün (14 neue Tests für `wiederholungsplan.ts`), `npm run build`: fehlerfrei, Route `/wiederholungsplan` korrekt als „ƒ Dynamic" gebaut (identisch zu den anderen Hubs)
- **Umgebungshinweis (Wiederholung des bekannten Musters aus PROJ-4/PROJ-6):** Der erste `npm test`-Lauf dieser Sitzung schlug mit `[vitest-pool-runner]: Timeout waiting for worker to respond` fehl (8 von 17 Testdateien betroffen, u.a. die neue `wiederholungsplan.test.ts`). `rm -rf node_modules/.vite` hat das Problem wie schon in PROJ-4 dokumentiert vollständig behoben — danach lief die komplette Suite sauber durch. Die neue Testdatei wurde zusätzlich isoliert (`npx vitest run src/lib/wiederholungsplan.test.ts`) mit 14/14 grün verifiziert, bevor der volle Lauf bestätigt wurde
- Per `curl` gegen den laufenden Dev-Server bestätigt: `/wiederholungsplan` ohne Session liefert `307` nach `/login?redirect=%2Fwiederholungsplan` (automatisch durch die bestehende Blocklist-Middleware aus PROJ-1 geschützt, `proxy.ts` musste nicht geändert werden). Regressionsspotcheck: `/karteikarten`, `/uebungsaufgaben`, `/probeklausuren`, `/todos`, `/dashboard` liefern weiterhin korrekt `307` → `/login`, `/login` selbst weiterhin `200`. Keine Server-Fehler im Dev-Log

**Bewusst noch nicht möglich:** Kein authentifizierter Live-Durchklick im Browser (Golden Path: Filter wechseln, auf einen Karteikarten-/Übungsaufgaben-/Klausur-Eintrag klicken → landet im richtigen Hub, „Nachschreiben erledigt" klicken → Eintrag verschwindet, Persistenz nach Reload) — mir liegt in dieser Sitzung kein Test-Account/Passwort für das echte Supabase-Projekt vor (identische, bereits in PROJ-4s Frontend-Phase dokumentierte Grenze). Da alle Datenquellen aber bereits live angebunden sind (kein lokaler Platzhalter-State wie sonst zu Beginn), sollte ein Login-Test direkt reale Daten zeigen. Bitte einmal selbst gegenprüfen: `/wiederholungsplan` aufrufen → falls fällige Karteikarten/Übungsaufgaben/Probeklausuren-Nachschreiben aus den bestehenden Hubs vorhanden sind, sollten sie hier gruppiert erscheinen; Filter durchspielen; bei einer fälligen Nachschreiben-Erinnerung „Nachschreiben erledigt" klicken und prüfen, dass sie sowohl hier als auch unter `/probeklausuren` verschwindet.

### Nachtrag: BUG-1 und BUG-2 behoben (2026-09-10)

**BUG-1 (Medium, aus QA):** Fehlende Fehlerbehandlung beim initialen Laden des Plans — ein fehlschlagender Supabase-Query wurde durch `?? []` wie „keine Daten" behandelt, statt die geforderte Verbindungsfehler-Meldung zu zeigen.
- Fix: `src/app/wiederholungsplan/page.tsx` sammelt jetzt alle zehn Query-Ergebnisse aus `Promise.all` in `results` und prüft `results.some((r) => r.error)`, **bevor** die Daten destrukturiert/gemappt werden. Bei einem Treffer wird statt des Plans eine Karte mit der bereits bestehenden `CONNECTION_ERROR`-Konstante aus `src/lib/wiederholungsplan.ts` gerendert (`role="alert"`, identischer Text wie bei den Server-Action-Fehlern der Hubs). Kopf-/Titelbereich wurde dafür in eine kleine `PageShell`-Hilfskomponente ausgelagert, damit Erfolgs- und Fehlerzustand denselben Rahmen teilen, ohne Duplizierung.
- Live verifiziert (gezielt sabotiert und sofort zurückgesetzt): ein Query gegen eine absichtlich falsch benannte Tabelle (`karteikarten_themen_QA_SABOTAGE_TEMP`) führte zuverlässig zur Fehlermeldung statt eines leeren/teilweisen Plans; nach dem Zurücksetzen lädt die Seite wieder normal mit den echten Daten (verifiziert per `git diff` — keine verbleibende Abweichung).

**BUG-2 (Medium, aus QA):** Karteikarten-/Übungsaufgaben-Einträge waren nur per Maus/Touch navigierbar, kein fokussierbares Element für die Tastatur.
- Fix: `src/components/wiederholungsplan/wiederholungs-eintrag-card.tsx` — die Card trägt jetzt `role="button"`, `tabIndex={0}`, einen `onKeyDown`-Handler (Enter/Leertaste lösen dieselbe Navigation wie der Klick aus) sowie ein `aria-label` und sichtbare `focus-visible`-Ring-Klassen (identisches Muster wie die shadcn-`Button`-Komponente). Der Handler prüft `event.target === event.currentTarget`, damit ein Enter auf dem verschachtelten „Nachschreiben erledigt"-Button nicht zusätzlich zur Card-Navigation bubbelt.
- Live verifiziert: Card lässt sich per `.focus()`/Tab fokussieren, Enter auf der fokussierten Karteikarten-Card navigiert korrekt zu `/karteikarten`.

**Getestet nach Fix:** `npm test` weiterhin 214/214 grün, `npm run build` weiterhin fehlerfrei. Live-Regression: normaler Seitenaufruf (ohne Sabotage) zeigt weiterhin korrekt die echten, gruppierten Einträge — keine Nebenwirkung durch die Fehlerbehandlung im Erfolgsfall.

## QA Test Results

**Tested:** 2026-09-10
**App URL:** http://localhost:3000 (Dev-Server, gegen das echte verlinkte Supabase-Projekt)
**Tester:** QA Engineer (AI)
**Browser:** Chromium (Playwright, headless) für den authentifizierten Golden Path inkl. Responsive-Viewports (375/768/1440px); zusätzlich Chromium + Mobile Safari für die committete, unauthentifizierte E2E-Suite
**Test-Account:** dedizierter QA-Test-Account (`trashkrause@aol.com`, vom Nutzer für diese Session bereitgestellt, wie schon in PROJ-1–6) — Zugangsdaten nur als Umgebungsvariable verwendet, nie committed

**Vorgehen:** Da PROJ-7 keine eigene Tabelle hat und bereits im Frontend live an Supabase angebunden ist (siehe Frontend Implementation Notes), wurde der komplette authentifizierte Funktionsumfang in dieser QA-Runde erstmals live durchgespielt — inkl. gezielt konstruierter Testdaten für alle vier Dringlichkeits-Gruppen. Ein automatisiertes Playwright-Treiberskript (lokal, nicht committed, da mit echten Test-Zugangsdaten) hat fünf Test-Probeklausuren mit präzise berechneten Daten angelegt (Klausurdatum − 80/75/72/68/60 Tage, um Überfällig/Heute/Diese-Woche/Grenzfall-7-Tage/Später gezielt zu treffen), dazu eine Test-Karteikarte und eine Test-Übungsaufgabe (bewertet mit `worst=2`, um „Nacharbeit empfohlen" auszulösen). Alle Testdaten wurden danach vollständig aus der Live-Datenbank entfernt (verifiziert: 0 verbliebene `QA7-*`-Einträge in allen drei Hubs sowie im Themenkatalog).

### Acceptance Criteria Status

#### Zugriff & Grundgerüst
- [x] Nicht eingeloggter Zugriff auf `/wiederholungsplan` → Redirect zu `/login?redirect=%2Fwiederholungsplan` (live verifiziert + E2E-Test)
- [x] Eingeloggt → eigene Daten geladen, drei Standard-Gruppen angezeigt (live verifiziert, Screenshot: Überfällig (3) / Heute fällig (1) / Diese Woche (4))
- [x] Keine Einträge in den drei Standard-Gruppen → „Keine fälligen oder geplanten Wiederholungen" (Code-Review: identischer Zweig wie die live verifizierte „Keine Wiederholungen für diese Auswahl"-Variante, nur mit `filtersAktiv=false`)

#### Aggregation & Gruppierung
- [x] Karteikarte mit `wdh_datum` in der Vergangenheit → „Überfällig" (live: bestehende reale Karteikarten des Accounts erscheinen korrekt dort)
- [x] Karteikarte mit `wdh_datum` = heute → „Heute fällig" (Unit-Test-Grenzfall `differenz===0`; identische Funktion `gruppeVon()` live über Klausur B bestätigt)
- [x] Karteikarte mit `wdh_datum` in den nächsten 7 Tagen → „Diese Woche" (live: neu angelegte Test-Karteikarte erscheint dort)
- [x] Karteikarte mit `wdh_datum` > 7 Tage → nur in „Alle anzeigen" (Unit-Test + live über Klausur D/„Später" bestätigt, identische `gruppeVon()`-Logik)
- [x] Übungsaufgabe „Wiederholung fällig" → gleiche Gruppen-Logik (live: Test-Aufgabe mit `worst=2` → Pflicht-Wdh. in 5 Tagen → korrekt „Diese Woche")
- [x] Übungsaufgabe ohne offenes `pflicht_wdh_datum` → nirgends im Plan (Code-Review: `continue`-Statement in `wiederholungsEintraegeVon()`)
- [x] Probeklausur < 75 Tage alt, Nachschreiben-Datum in den nächsten 7 Tagen → vorausschauend „Diese Woche", obwohl der Hub-eigene Hinweis noch nicht sichtbar ist (live gezielt verifiziert: Klausur C, 72 Tage — erscheint im Plan unter „Diese Woche", zeigt aber in `/probeklausuren` selbst noch **keinen** Nachschreiben-Hinweis — exakt die spezifizierte Vorausschau-Eigenschaft)
- [x] Probeklausur-Fälligkeitsdatum erreicht/überschritten, nicht nachgeschrieben → „Heute fällig"/„Überfällig" (live: Klausur A → Überfällig, Klausur B → Heute fällig, beide zeigen zusätzlich korrekt den Hub-eigenen Hinweis)
- [x] Probeklausur bereits nachgeschrieben → nirgends im Plan (live: nach Klick auf „Nachschreiben erledigt" verschwindet der Eintrag sofort)
- [x] Fälligkeits-Filter „Alle" → zusätzlich alle künftigen Einträge als flache Liste (live: Klausur D erscheint erst nach Umschalten auf „Alle (auch Zukunft)")

#### Darstellung je Eintrag
- [x] Karteikarte: Typ-Badge, Fach, Themen-Chips, Frage (gekürzt), Fälligkeitsdatum (live verifiziert, Screenshot)
- [x] Übungsaufgabe: Fach, Themen-Chips, Titel, Fälligkeitsdatum, „Erst Nacharbeit empfohlen"-Hinweis bei `worst` ≤ 2 (live verifiziert)
- [x] Probeklausur: Bezeichnung, Fach-Badges (Vereinigung der Teile-Fächer), Nachschreiben-Fälligkeitsdatum (live verifiziert)
- [x] Ampelfarben Rot/Amber/Grün je Gruppe (live verifiziert) — **mit der bereits in den Frontend Implementation Notes dokumentierten Präzisierung:** die Farbe folgt immer der tatsächlichen Dringlichkeits-Gruppe des Eintrags, auch in der „Alle anzeigen"-Liste (ein überfälliger Eintrag bleibt dort rot statt pauschal grün) — bewusste, sinnvollere Auslegung der AC, kein Bug

#### Verlinkung & Aktionen
- [x] Klick auf Karteikarten-Eintrag → Navigation zum Karteikarten-Hub, kein vorausgewählter Filter (live verifiziert)
- [x] Klick auf Übungsaufgaben-Eintrag → Navigation zum Übungsaufgaben-Hub (live verifiziert)
- [x] Klick auf Probeklausur-Eintrag (außerhalb des Buttons) → Navigation zum Probeklausuren-Hub (live verifiziert)
- [x] Klick auf „Nachschreiben erledigt" → Klausur markiert, Eintrag verschwindet sofort aus dem Plan, Änderung persistiert und ist auch in `/probeklausuren` sichtbar (live end-to-end verifiziert, inkl. Seitenwechsel)

#### Filter
- [x] Art-Filter (Alle/Karteikarten/Übungsaufgaben/Probeklausuren) filtert korrekt (live verifiziert)
- [x] Fach-Filter filtert korrekt (live für Karteikarten-Fach verifiziert; Klausur-„mind. ein Teil passt"-Logik zusätzlich per Unit-Test von `faecherVon()` sowie Code-Review abgedeckt)
- [x] Fälligkeits-Filter mit Einzelkategorie zeigt ausschließlich diese Kategorie (live: „Nur Überfällig" zeigte korrekt nur Klausur A)
- [x] Leere Filterkombination → „Keine Wiederholungen für diese Auswahl" (live verifiziert — der erste Testlauf mit einer zufällig ungünstig gewählten Filterkombination traf unerwartet eine echte, bereits im Account vorhandene fällige Karteikarte und war dadurch nicht leer; mit einer tatsächlich leeren Kombination bestätigt)

#### Fehler & Sicherheit
- [ ] **BUG-1:** Verbindung schlägt beim Laden des Plans fehl → **nicht erfüllt**, siehe Bugs Found
- [x] Verbindung schlägt bei „Nachschreiben erledigt" fehl → Fehlermeldung erscheint, Eintrag bleibt sichtbar, Button bleibt bedienbar (live verifiziert per Netzwerk-Interception, POST auf `/wiederholungsplan` abgebrochen)
- [x] RLS verweigert Zugriff ohne gültige Session (Code-Review: keine neue Tabelle, identische, bereits in PROJ-3/4/5 geprüfte Policies; kein Live-Multi-Account-Test — bewusste, bereits in PROJ-1–6 akzeptierte Grenze für diese Single-User-App)

### Edge Cases Status

#### EC-1: Keine Daten in einem/mehreren Hubs
- [x] Identischer Codepfad wie AC „Zugriff & Grundgerüst" (Code-Review)

#### EC-2: Übungsaufgabe „Geschlossen"
- [x] Erscheint nie im Plan (Code-Review: `pflicht_wdh_datum` ist in diesem Zustand `null`, dadurch `continue`)

#### EC-3: Klausur mit mehreren Fächern, Fach-Filter
- [x] Matched bei mindestens einem passenden Teil (Unit-Test `faecherVon()`, Wiederverwendung der bereits in PROJ-5 geprüften Funktion)

#### EC-4: Karteikarte weit in der Zukunft
- [x] Nur in „Alle anzeigen" sichtbar (Unit-Test + analoges Live-Verhalten über Klausur D)

#### EC-5: Grenzfall genau 7 Tage
- [x] Zählt noch zu „Diese Woche" — **gezielt live verifiziert** (Klausur E, Fälligkeit exakt heute+7) zusätzlich zum bereits bestehenden Unit-Test

#### EC-6: Zwei Tabs, gleichzeitige Bearbeitung
- [ ] NICHT SEPARAT LIVE GETESTET — bewusst kein Konflikt-Handling (Single-User-Konvention wie PROJ-1–6), akzeptierte Grenze

#### EC-7: Standard-Gruppen leer, „Alle anzeigen" liefert dennoch Treffer
- [x] Standardansicht zeigt trotzdem den leeren Zustand (identischer Codepfad wie AC „Fälligkeits-Filter Alle", Code-Review)

#### EC-8: Sehr lange Texte
- [x] Werden gekürzt (`kurzerText()`, live am XSS-Testtext beobachtet — zusätzlich zur Kürzung wurden auch die spitzen Klammern entfernt)

### Security Audit Results
- [x] Authentication: `/wiederholungsplan` ohne Session konsequent verweigert (live + E2E, kein Opt-out über Query-Strings)
- [x] Authorization (RLS): keine neue Tabelle, ausschließlich Wiederverwendung bereits geprüfter PROJ-2/3/4/5-Policies
- [x] Input-Validierung/XSS: `<img src=x onerror="...">`-Payload in einer Karteikarten-Frage live angelegt — Payload wurde weder beim Anlegen noch bei der Anzeige im Wiederholungsplan ausgeführt (React-Escaping **plus** zusätzliche `<>`-Entfernung durch `kurzerText()` als Verteidigung in der Tiefe)
- [x] Keine Secrets im Code; Test-Zugangsdaten wurden nur temporär als Umgebungsvariable verwendet, nie committed
- [x] Rate-Limiting: bewusst nicht implementiert (projektweite Entscheidung aus PROJ-1)
- [ ] **BUG-2:** Tastatur-Erreichbarkeit — siehe Bugs Found

### Bugs Found

#### BUG-1: Fehlerbehandlung beim initialen Laden des Plans fehlt vollständig
- **Severity:** Medium
- **Betroffene Datei:** `src/app/wiederholungsplan/page.tsx`
- **Steps to Reproduce:**
  1. Die Server Component lädt alle zehn Supabase-Queries per `Promise.all` und destrukturiert dabei ausschließlich `{ data: ... }` — das ebenfalls zurückgegebene `error`-Feld wird nirgends geprüft
  2. Jede Query fällt bei einem Fehler auf `(x ?? [])` zurück, wird also identisch zu „Tabelle ist leer" behandelt
  3. Erwartet laut AC: bei einem Verbindungsfehler erscheint „Verbindung fehlgeschlagen, bitte später erneut versuchen" statt eines (ggf. teilweise) geladenen Plans
  4. Tatsächlich: Schlagen eine oder mehrere Queries fehl (z.B. bei einem kurzen Netzwerk-Aussetzer zwischen Next.js-Server und Supabase), zeigt die Seite einfach weniger bzw. im Extremfall gar keine Einträge — inklusive des irreführenden Zustands „Keine fälligen oder geplanten Wiederholungen", obwohl in Wahrheit nur das Laden fehlgeschlagen ist
- **Root Cause:** Kein `try/catch` und keine `error`-Prüfung um die zehn Supabase-Aufrufe, anders als bei den Server Actions der Hubs (die für Mutationen konsequent `CONNECTION_ERROR` zurückgeben)
- **Impact:** Kein Datenverlust, keine Sicherheitslücke, per Neuladen der Seite selbstheilend — aber gerade in einer Prüfungsvorbereitungs-App könnte ein Nutzer bei einem kurzen Verbindungsaussetzer fälschlich glauben, nichts sei fällig, und eine dringende Wiederholung verpassen
- **Priority:** Fix before deployment (Empfehlung) — Entscheidung liegt beim Nutzer, da nicht blockierend (kein Critical/High)

#### BUG-2: Karteikarten-/Übungsaufgaben-Einträge sind nicht per Tastatur navigierbar
- **Severity:** Medium
- **Betroffene Datei:** `src/components/wiederholungsplan/wiederholungs-eintrag-card.tsx`
- **Steps to Reproduce:**
  1. `/wiederholungsplan` ausschließlich mit der Tastatur bedienen (Tab-Taste)
  2. Für einen Karteikarten- oder Übungsaufgaben-Eintrag gibt es kein fokussierbares Element, das die Navigation zum jeweiligen Hub auslöst — die gesamte Card ist ein reines `<div onClick=...>` ohne `role="button"`, `tabIndex` oder Keydown-Handler
  3. Erwartet: Tastatur-/Screenreader-Nutzer können jede interaktive Funktion erreichen (WCAG 2.1 AA, siehe auch Projekt-Vorgabe „Use semantic HTML and ARIA labels for accessibility" in `.claude/rules/frontend.md`)
  4. Tatsächlich: Für Karteikarten-/Übungsaufgaben-Einträge (2 von 3 Arten) ist die einzige Aktion des Eintrags rein maus-/touch-bedienbar. Bei Probeklausur-Einträgen ist wenigstens der „Nachschreiben erledigt"-Button per Tastatur bedienbar, die Navigation zum Hub selbst aber ebenso nicht
- **Root Cause:** Bewusste Umsetzung als klickbarer `<div>` (analog zum bereits bestehenden, ebenfalls nicht tastaturzugänglichen Muster für die klickbare Frage/den Titel in den Hub-Cards aus PROJ-3/4/5) — hier aber ohne die dort zusätzlich vorhandenen, separat fokussierbaren Bearbeiten-/Löschen-Icons als Alternative, wodurch die gesamte Karte für Tastaturnutzer funktionslos wird
- **Impact:** Kein Datenverlust, keine Sicherheitslücke — aber ein vollständiger Funktionsausfall der Kernaktion („zum Hub wechseln") für Tastatur-/Assistive-Technology-Nutzer bei 2 von 3 Eintragsarten
- **Priority:** Fix before deployment (Empfehlung) — Entscheidung liegt beim Nutzer, da nicht blockierend (kein Critical/High)

### Automatisierte Tests
- **Unit-Tests (Vitest):** `npm test` — 214/214 grün (14 Tests für `wiederholungsplan.ts`, Rest bestehende Suite unverändert, keine Regression)
- **Build:** `npm run build` — fehlerfrei, Route `/wiederholungsplan` korrekt als „ƒ Dynamic" gebaut
- **E2E-Tests (Playwright):** `tests/PROJ-7-wiederholungsplan.spec.ts` neu erstellt (2 Tests: nicht eingeloggter Redirect, kein Query-String-Opt-out) — `npm run test:e2e`: 26/26 grün (24 bestehende + 2 neue), über Chromium + Mobile Safari. Bewusst nicht in die committete Suite aufgenommen: die authentifizierten Abläufe (Aggregation, Gruppierung/Grenzfälle, Filter, Navigation, „Nachschreiben erledigt" inkl. Fehlerfall, XSS), da dafür echte Zugangsdaten nötig wären — diese wurden stattdessen live während dieser QA-Session mit einem eigens dafür angelegten, danach vollständig wieder entfernten Testdatensatz verifiziert (siehe oben)
- **Live-Test:** Ein automatisiertes, lokal ausgeführtes Playwright-Treiberskript (nicht committed, da mit echten Test-Zugangsdaten) gegen das echte Supabase-Projekt — 39/41 Prüfungen im ersten Durchlauf grün; die 2 abweichenden Prüfungen waren beide Fehler im Testskript selbst (ein zu naiver Text-Reihenfolge-Check, der versehentlich Text aus dem Fälligkeits-Filter-Dropdown mit einbezog, sowie eine Filterkombination, die unabsichtlich einen echten, bereits vorhandenen fälligen Datensatz traf) — beide per gezieltem Nachtest und Screenshot als korrektes App-Verhalten bestätigt. Alle Testdaten (5 Probeklausuren, 1 Karteikarte, 1 Übungsaufgabe, 1 Thema) vollständig aus der Live-Datenbank entfernt und verifiziert (0 verbliebene `QA7-*`-Einträge)
- **Regression:** `/karteikarten`, `/uebungsaufgaben`, `/probeklausuren`, `/todos`, `/dashboard` bleiben im eingeloggten Zustand normal erreichbar (HTTP 200), keine Beeinträchtigung durch PROJ-7
- **Responsive:** Chromium, Mobile (375px)/Tablet (768px)/Desktop (1440px) — kein horizontales Overflow auf `/wiederholungsplan` in allen drei Breiten

### Summary
- **Acceptance Criteria:** 27/28 vollständig verifiziert (live oder Code-Review); 1 nicht erfüllt (BUG-1)
- **Bugs Found:** 2 total (0 Critical, 0 High, 2 Medium)
- **Security:** Pass, mit einem Medium-Accessibility-Finding (BUG-2) und der dokumentierten, bereits aus PROJ-1–6 akzeptierten Grenze (kein Multi-Account-RLS-Live-Test)
- **Production Ready:** YES im engeren Sinn der Projekt-Regel (kein Critical/High offen) — beide gefundenen Bugs sind nicht blockierend, aber echte, reproduzierte Abweichungen von der Spec bzw. von den Accessibility-Vorgaben des Projekts
- **Recommendation:** Nutzer entscheidet über Priorität (siehe Frage unten) — bei sofortigem Fix: kurzer, lokal begrenzter `/frontend`-Nachtrag für beide Bugs (BUG-1: try/catch + Fehlerzustand in `page.tsx`; BUG-2: `role="button"`/`tabIndex`/`onKeyDown` auf der Eintrags-Card), danach erneutes `/qa`. Bei Zurückstellen: Status bleibt „In Review", Deploy möglich, sobald der Nutzer das für vertretbar hält

## Deployment
_To be added by /deploy_
