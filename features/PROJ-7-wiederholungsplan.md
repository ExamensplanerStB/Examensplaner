# PROJ-7: Wiederholungsplan

## Status: Architected
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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
