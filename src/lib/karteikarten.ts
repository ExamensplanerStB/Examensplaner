import { diffTage, heuteISO, istGueltig } from "./karteikarten-intervall";

export type KarteikartenTyp = "theorie" | "klausurtechnik";

export type Bewertung = 1 | 2 | 3 | 4 | 5;

export type GueltigkeitsStatus = "gueltig" | "verfallen";

export interface Karteikarte {
  id: string;
  fachId: string;
  typ: KarteikartenTyp;
  themenIds: string[];
  frage: string;
  quelle: string;
  fehlernotiz: string;
  bewertung: Bewertung;
  /** Aktuelles Intervall in Tagen, mit Nachkommastellen (siehe Berechnungsspezifikation). */
  intervall: number;
  wdhAnzahl: number;
  /** Nächste Fälligkeit, ISO-Datum (YYYY-MM-DD). */
  wdhDatum: string;
  createdAt: string;
}

export interface KarteikartenReview {
  id: string;
  karteikarteId: string;
  datum: string;
  bewertung: Bewertung;
  intervallDanach: number;
}

export const TYP_OPTIONEN: { value: KarteikartenTyp; label: string }[] = [
  { value: "theorie", label: "Theorie" },
  { value: "klausurtechnik", label: "Klausurtechnik" },
];

export const TYP_LABEL: Record<KarteikartenTyp, string> = {
  theorie: "Theorie",
  klausurtechnik: "Klausurtechnik",
};

export const BEWERTUNG_OPTIONEN: { value: `${Bewertung}`; label: string }[] = [
  { value: "1", label: "1 – Nicht gewusst" },
  { value: "2", label: "2 – Grob gewusst, viele Lücken" },
  { value: "3", label: "3 – Teilweise richtig" },
  { value: "4", label: "4 – Fast vollständig" },
  { value: "5", label: "5 – Vollständig und sicher" },
];

export const GRADE_LABEL: Record<Bewertung, string> = {
  1: "Nicht gewusst",
  2: "Viele Lücken",
  3: "Teilweise",
  4: "Fast ganz",
  5: "Sicher",
};

export function gueltigkeitsStatus(karte: Karteikarte, heute: string = heuteISO()): GueltigkeitsStatus {
  return istGueltig(karte.bewertung, karte.wdhDatum, karte.intervall, heute) ? "gueltig" : "verfallen";
}

/** Relative Fälligkeitsangabe wie im Prototyp ("heute", "morgen", "in 3d", "2d überf."). */
export function faelligkeitsTag(wdhDatumISO: string, heute: string = heuteISO()): string {
  const differenz = diffTage(heute, wdhDatumISO);
  if (differenz < 0) return `${Math.abs(differenz)}d überf.`;
  if (differenz === 0) return "heute";
  if (differenz === 1) return "morgen";
  return `in ${differenz}d`;
}

export type FaelligkeitsDringlichkeit = "ueberfaellig" | "heute" | "geplant";

export function faelligkeitsDringlichkeit(
  wdhDatumISO: string,
  heute: string = heuteISO()
): FaelligkeitsDringlichkeit {
  const differenz = diffTage(heute, wdhDatumISO);
  if (differenz < 0) return "ueberfaellig";
  if (differenz === 0) return "heute";
  return "geplant";
}

export function formatDatum(iso: string): string {
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}
