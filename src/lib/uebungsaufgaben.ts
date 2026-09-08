import { PARAMETER, diffTage, heuteISO, istGueltig, worst } from "./uebungsaufgaben-wiederholung";

export type Bewertung = 1 | 2 | 3 | 4 | 5;

export type UebungsaufgabenStatus =
  | "unbewertet"
  | "gueltig"
  | "wiederholung_faellig"
  | "verfallen"
  | "geschlossen";

export interface Uebungsaufgabe {
  id: string;
  fachId: string;
  themenIds: string[];
  titel: string;
  quelle: string;
  /** Nächste Pflicht-Wiederholung, ISO-Datum (YYYY-MM-DD). `null` = keine offen. */
  pflichtWdhDatum: string | null;
  /** Anzahl bisheriger Bewertungen (0 = unbewertet, max. 3: Erst- + 2 Pflicht-Wdh.). */
  wdhAnzahl: number;
  createdAt: string;
}

export interface UebungsaufgabeReview {
  id: string;
  uebungsaufgabeId: string;
  /** Zeitpunkt der Bewertung, ISO-Datum (YYYY-MM-DD). */
  datum: string;
  fachlich: Bewertung;
  klausurtechnik: Bewertung;
  fehlernotiz: string;
}

export const BEWERTUNG_OPTIONEN: { value: `${Bewertung}`; label: string }[] = [
  { value: "1", label: "1 – Grundlegend verfehlt" },
  { value: "2", label: "2 – Erhebliche Mängel" },
  { value: "3", label: "3 – Teilweise überzeugend" },
  { value: "4", label: "4 – Gut, kleine Mängel" },
  { value: "5", label: "5 – Uneingeschränkt überzeugend" },
];

export const STATUS_LABEL: Record<UebungsaufgabenStatus, string> = {
  unbewertet: "Unbewertet",
  gueltig: "Gültig",
  wiederholung_faellig: "Wiederholung fällig",
  verfallen: "Verfallen",
  geschlossen: "Geschlossen",
};

/**
 * Status wird immer live aus den Rohdaten berechnet, nie gespeichert (siehe
 * Tech Design) — kippt sonst allein durch Zeitablauf unbemerkt.
 */
export function statusVon(
  aufgabe: Uebungsaufgabe,
  letzteReview: UebungsaufgabeReview | null,
  heute: string = heuteISO()
): UebungsaufgabenStatus {
  if (!letzteReview) return "unbewertet";
  if (aufgabe.pflichtWdhDatum !== null) return "wiederholung_faellig";
  const w = worst(letzteReview.fachlich, letzteReview.klausurtechnik);
  // naechstePflichtWdh() setzt pflichtWdhDatum nur in zwei Fällen auf null:
  // worst >= NIVEAU_SCHWELLE (erfolgreich) oder UEB_WDH_MAX ausgeschöpft
  // (geschlossen). Ist pflichtWdhDatum hier bereits null UND worst zu
  // niedrig, kann also nur Letzteres zutreffen (BUG-1 aus QA).
  if (w < PARAMETER.NIVEAU_SCHWELLE) return "geschlossen";
  return istGueltig(w, letzteReview.datum, heute) ? "gueltig" : "verfallen";
}

/** Letzte (jüngste) Review einer Aufgabe, oder `null` wenn noch unbewertet. */
export function letzteReviewVon(
  aufgabeId: string,
  reviews: UebungsaufgabeReview[]
): UebungsaufgabeReview | null {
  const eigene = reviews.filter((r) => r.uebungsaufgabeId === aufgabeId);
  if (eigene.length === 0) return null;
  // ">=" statt ">": bei gleichem Datum (mehrfache Bewertung am selben Tag)
  // gewinnt die zuletzt im Array eingetragene, also zuletzt gespeicherte Bewertung.
  return eigene.reduce((neueste, r) => (r.datum >= neueste.datum ? r : neueste));
}

export type Dringlichkeit = "ueberfaellig" | "heute" | "geplant";

export function wiederholungsDringlichkeit(
  pflichtWdhDatumISO: string,
  heute: string = heuteISO()
): Dringlichkeit {
  const differenz = diffTage(heute, pflichtWdhDatumISO);
  if (differenz < 0) return "ueberfaellig";
  if (differenz === 0) return "heute";
  return "geplant";
}

export function formatDatum(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

/** Einheitliche Meldung für fehlgeschlagene Server-Kommunikation (analog PROJ-3). */
export const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";

/**
 * Kürzt Text für die Verwendung in aria-labels (analog PROJ-3): entfernt
 * spitze Klammern und begrenzt die Länge.
 */
export function kurzerText(text: string, maxLength = 60): string {
  const bereinigt = text.trim().replace(/[<>]/g, "");
  if (bereinigt.length <= maxLength) return bereinigt;
  return bereinigt.slice(0, maxLength).trimEnd() + "…";
}
