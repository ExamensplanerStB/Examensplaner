# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

| ID | Feature | Priority | Dependencies | Status | Spec | Created |
|----|---------|----------|---------------|--------|------|---------|
| PROJ-1 | Supabase-Infrastruktur-Setup — Projekt-Setup, Env-Variablen, DB-Schema-Grundgerüst, Auth (E-Mail+Passwort), RLS | P0 | None | Approved | [Spec](PROJ-1-supabase-infrastruktur-setup.md) | 2026-07-28 |
| PROJ-2 | Zentraler Themenkatalog — fachbezogene Themen (Mehrfachauswahl), Klausurrelevanz-Einstufung, eigene Verwaltungsseite `/themen`, von allen Hubs referenziert | P0 | PROJ-1 | Approved | [Spec](PROJ-2-zentraler-themenkatalog.md) | 2026-07-28 |
| PROJ-3 | Karteikarten-Hub — Typ Theorie/Klausurtechnik, Selbsteinschätzung mit adaptiver Wiederholungslogik (Berechnungsspezifikation_Kompetenzmodell.md), Fokuseinheit, verborgene Fehlernotizen | P0 | PROJ-1, PROJ-2 | In Progress | [Spec](PROJ-3-karteikarten-hub.md) | 2026-07-28 |
| PROJ-4 | Übungsaufgaben-Hub — Zwei-Dropdown-Bewertung (Fachlich/Klausurtechnik), adaptive Wiederholungslogik, getrennte Fehleranalyse | P0 | PROJ-1, PROJ-2 | Roadmap | — | 2026-07-28 |
| PROJ-5 | Probeklausuren-Hub — Drei-Stufen-Nacharbeitsmodell (fachlich, analytisch, Nachschreiben nach 75 Tagen) | P0 | PROJ-1, PROJ-2 | Roadmap | — | 2026-07-28 |
| PROJ-6 | Todo-Liste — Aufgaben/Fristen, ganztägig/Zeitslot, kalenderverzahnt | P0 | PROJ-1 | Roadmap | — | 2026-07-28 |
| PROJ-7 | Wiederholungsplan — hub-übergreifende Aggregation fälliger/geplanter Wiederholungen, Filter, Ampelfarben | P0 | PROJ-3, PROJ-4, PROJ-5 | Roadmap | — | 2026-07-28 |
| PROJ-8 | Kompetenzanalyse — 3-Ebenen-Drilldown, gewichtete Berechnung (10/20/30/40%), Fehlermuster-Handlungsempfehlungen. ⚠ Berechnungsspezifikation vor Spec final klären (Konzept weicht von Prototyp ab) | P0 | PROJ-3, PROJ-4, PROJ-5 | Roadmap | — | 2026-07-28 |
| PROJ-9 | Dashboard — Zeitstrahl/Countdown, Wochenkalender, Todos, fällige Wdh., Kompetenz-Mini-Übersicht, Klausur-Zähler, Top-3-Schwachstellen | P0 | PROJ-6, PROJ-7, PROJ-8 | Roadmap | — | 2026-07-28 |

<!-- Add features above this line -->

## Next Available ID: PROJ-10
