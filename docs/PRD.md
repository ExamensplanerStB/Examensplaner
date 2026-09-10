# Product Requirements Document

## Vision
Der Examensplaner StB ist eine digitale Webanwendung zur strukturierten Vorbereitung auf das Steuerberaterexamen, die lernpsychologische Prinzipien (Spaced Repetition, Retrieval Practice, Transfer-Appropriate Processing, Bloom'sche Taxonomie) in eine datengetriebene Kompetenzanalyse übersetzt. Sie macht sichtbar, wo abrufbares Wissen unter Klausurbedingungen tatsächlich vorhanden ist – nicht nur, was einmal gelesen wurde.

## Target Users
- **Primär:** Lukas Krause, StB-Kandidat, Prüfungsdatum 05.10.2027 — nutzt den Planer ab September 2026 selbst zur Vorbereitung
- **Sekundär (langfristige Vision, nicht Teil dieser Version):** weitere StB-Prüflinge (~4.000–5.000 Kandidaten/Jahr, ~50% Bestehensquote), für die bislang kein StB-spezifisches digitales Tool existiert

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Supabase-Infrastruktur (Auth, DB-Schema, RLS) | Planned |
| P0 (MVP) | Zentraler Themenkatalog (fachbezogen, Dropdown-verwaltet) | Planned |
| P0 (MVP) | Dashboard (Zeitstrahl, Kalender, Todos, Wdh.-Übersicht, Klausur-Zähler) | Planned |
| P0 (MVP) | Todo-Liste (Aufgaben/Fristen, kalenderverzahnt) | Planned |
| P0 (MVP) | Karteikarten (Theorie/Klausurtechnik, adaptive Spaced-Repetition, Selbsteinschätzung) | Planned |
| P0 (MVP) | Übungsaufgaben (Zwei-Dropdown-Bewertung, adaptive Wiederholung) | Planned |
| P0 (MVP) | Probeklausuren (Drei-Stufen-Nacharbeit) | Planned |
| P0 (MVP) | Wiederholungsplan (hub-übergreifende Aggregation) | Planned |
| P0 (MVP) | Kompetenzanalyse (3-Ebenen-Drilldown, Stufenmodell 2.0, Kalibrierung, Fehlermuster-Empfehlungen) | Planned |
| P1 | 3-Phasen-Struktur der Vorbereitung (Phasen-Modul, phasenabhängige Priorisierung) | Roadmap |
| P1 | Erweitertes Klausur-Zähler-Meilensteinsystem | Roadmap |
| P1 | Zeitmanagement-Tracking in Probeklausuren (Stufe 2) | Roadmap |
| P2 | Lernzeittracking (Timer, Wochenübersicht) | Roadmap |
| P2 | Vergessenskurven-Simulation (Ebbinghaus) | Roadmap |
| P2 | Digitales-Schreiben-Tracking | Roadmap |
| P2 | KI-Integration (Claude API: Fallgenerierung, Fehleranalyse, Chat) | Roadmap |
| P2 | Regeneration/Resilienz-Tracking | Roadmap |
| P2 | Lernplan-Generator | Roadmap |
| P2 | Peer-Feedback-Modul | Roadmap |
| P2 | Kommerzieller Betrieb (Stripe, Multi-Tenant, rechtliche Seiten) | Roadmap |

## Success Metrics
- Tägliche/wöchentliche Nutzung ohne Abbruch bis zum Prüfungsdatum (05.10.2027)
- Vollständige Datenbasis: alle vier Lernsäulen (Karteikarten, Übungsaufgaben, Probeklausuren, Themenkatalog) werden durchgängig befüllt
- Kompetenzanalyse wird handlungsleitend genutzt — Handlungsempfehlungen beeinflussen die tatsächliche Lernplanung
- Langfristig (bei Kommerzialisierung): Anzahl zahlender Nutzer, Bestehensquote der Nutzer vs. Marktdurchschnitt (~50%)

## Constraints
- **Harte Deadline: alle 7 Hubs funktionsfähig bis Ende August 2026**, damit ab September eigene Daten hinterlegt werden können
- Team: nur Lukas + Claude Code, kein externes Team
- Kein Budget vorgesehen — Supabase- und Vercel-Free-Tier für die persönliche Nutzungsphase
- Backend: Supabase (PostgreSQL + Auth, Row Level Security aktiviert)
- Design-System bereits vorhanden — siehe `docs/design-system.md` (aus Claude-Design-Prototyp übernommen: Farben, Typografie DM Serif Display/DM Sans, Ampelsystem, Hub-Farben)
- Fachlicher Rahmen: 11 Prüfungsfächer, gruppiert nach 3 Klausurtagen (Verfahrensrecht, Ertragsteuern, Bilanzsteuerrecht)
- Berechnungsspezifikation der Kompetenzanalyse: `Berechnungsspezifikation_Kompetenzmodell.md` (Stufenmodell 2.0, Niveau+Haltbarkeit) ist verbindlich und ersetzt das ursprüngliche Konzeptpapier vollständig — geklärt im Rahmen von PROJ-3/PROJ-4/PROJ-5 und final bestätigt in PROJ-8

## Non-Goals
- Keine Mehrbenutzerfähigkeit / kein Multi-Tenant-Betrieb in dieser Version
- Keine Zahlungsabwicklung (Stripe), kein kommerzieller Betrieb
- Keine KI-Integration (Claude API)
- Keine 3-Phasen-Struktur, kein erweiterter Meilenstein-Ausbau, kein Zeitmanagement-Tracking, keine Vergessenskurven-Simulation, kein Lernzeittracking, kein Peer-Feedback, kein Regeneration/Resilienz-Tracking
- Kein pixelgenauer 1:1-Rebuild des HTML-Prototyps — Ziel ist gleiche Funktionalität und Design-Sprache, nicht identisches DOM

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above.
