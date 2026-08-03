# Design System

Quelle: Claude-Design-Handoff-Prototyp (`Webapp/examensplaner-webapp-prototyp/project/`). Bei UI-Umsetzung mit `/frontend` maßgeblich — Farben, Typografie und Layout-Prinzipien 1:1 übernehmen, DOM-Struktur muss nicht identisch sein (siehe PRD Non-Goals).

## Referenzdateien im Prototyp
- `project/Examensplaner.dc.html` — Haupt-Layout aller 7 Hubs (Sidebar-Nav, Header, Dashboard, Kompetenzanalyse 3-Ebenen, Karteikarten, Übungsaufgaben, Probeklausuren, Wiederholungsplan, Todo, Modals)
- `project/ds/tokens/colors.css` — Farbtokens (Light + Dark Mode)
- `project/ds/tokens/typography.css` — Typografie-Skala
- `project/ds/styles.css` — kompiliertes Stylesheet
- `project/ds/_ds_bundle.js` — React-Komponentenbibliothek des Prototyps (SidebarNavItem, Button, MetricCard, AmpelDot, AmpelBadge, ProgressBar, ExamDayBadge, CountdownBadge)

## Farben (Light / Default)

| Token | Wert | Verwendung |
|---|---|---|
| `--bg` | `#F7F6F3` | App-Hintergrund |
| `--surface` | `#FFFFFF` | Card / erhöhte Fläche |
| `--surface-2` | `#F0EEEA` | Subtiler Hover/Inset-Fill |
| `--ink-1` | `#1a1a18` | Primärtext |
| `--ink-2` | `#5F5E5A` | Sekundärtext |
| `--ink-3` | `#888780` | Gedämpfter Text |
| `--border` | `rgba(0,0,0,.08)` | Standard-Rahmen |
| `--border-strong` | `rgba(0,0,0,.14)` | Betonter Rahmen |
| `--primary` | `#1B4F8A` | Akzentfarbe / Marke |
| `--primary-hover` | `#163f6f` | Hover-Zustand |
| `--primary-tint` | `rgba(27,79,138,.10)` | Primary-Fläche schwach |
| `--on-primary` | `#FFFFFF` | Text auf Primary |

### Ampelsystem (Kompetenzgrad)
| Token | Wert | Bedeutung |
|---|---|---|
| `--ampel-green` | `#1D9E75` | ≥ 70 % |
| `--ampel-amber` | `#BA7517` | 40–69 % |
| `--ampel-red` | `#C8392B` | < 40 % |
| `--ampel-grey` | `#9E9C96` | keine Daten |

### Hub-/Säulenfarben
| Token | Wert | Säule |
|---|---|---|
| `--hub-theorie` | `#1B4F8A` | Karteikarten – Theorie |
| `--hub-klausurtechnik` | `#6B4F9E` | Karteikarten – Klausurtechnik |
| `--hub-uebung` | `#BA7517` | Übungsaufgaben |
| `--hub-probeklausur` | `#C8392B` | Probeklausuren |

### Kalender-Kategorien
| Token | Wert | Kategorie |
|---|---|---|
| `--cal-vorlesung` | `#1B4F8A` | Vorlesung/Seminar |
| `--cal-lernen` | `#1D9E75` | Lernsession |
| `--cal-wiederholung` | `#BA7517` | Wiederholung |
| `--cal-frist` | `#C8392B` | Frist/Prüfungstermin |

### Dark Mode
Vollständiges Dark-Theme via `[data-theme="dark"]` vorhanden (siehe `colors.css`) — u. a. `--bg:#1e1e1c`, `--surface:#272724`, `--primary:#5b93d1`. Bei Umsetzung Light als Default, Dark als Umschaltoption (Prototyp hat funktionierenden Theme-Toggle im Header).

## Typografie
- **Headlines/Display:** `DM Serif Display` (Fallback Georgia, Times New Roman, serif)
- **Fließtext/UI:** `DM Sans` (Fallback system-ui, -apple-system, Segoe UI, sans-serif)

| Token | Wert |
|---|---|
| `--fs-h1` | 44px |
| `--fs-h2` | 30px |
| `--fs-h3` | 21px |
| `--fs-body` | 15px |
| `--fs-label` | 12px |
| `--fs-metric` | 52px (große Kennzahlen, z. B. Klausur-Zähler) |
| `--lh-tight` / `--lh-heading` / `--lh-body` | 1.1 / 1.2 / 1.55 |
| `--fw-regular…bold` | 400 / 500 / 600 / 700 |

## Layout-Prinzipien (aus Prototyp)
- Fixe linke Sidebar (250px) mit Serif-Logo, Nav-Items, Prüfungstag-Badges (K1/K2/K3) + Countdown
- Sticky Header pro Seite mit Serif-H1-Seitentitel + Subtitle + kontextabhängigem Primär-Action-Button
- Karten: `border-radius` groß, `box-shadow: var(--shadow-card)`, 1px Border in `--border`
- Kompetenzanalyse als 3-Ebenen-Drilldown mit Breadcrumb-Navigation
- Ampel-Farbcodierung durchgängig für Kompetenzgrade (Punkte, Balken, Badges)
