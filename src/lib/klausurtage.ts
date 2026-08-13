export type Klausurrelevanz = "hoch" | "mittel" | "niedrig";

export const KLAUSURRELEVANZ_OPTIONEN: {
  value: Klausurrelevanz;
  label: string;
}[] = [
  { value: "hoch", label: "Hoch" },
  { value: "mittel", label: "Mittel" },
  { value: "niedrig", label: "Niedrig" },
];

export interface Fach {
  id: string;
  kuerzel: string;
  name: string;
  klausurtag: 1 | 2 | 3;
}

export interface Klausurtag {
  tag: 1 | 2 | 3;
  titel: string;
  faecher: Fach[];
}

export interface Thema {
  id: string;
  fachId: string;
  name: string;
  klausurrelevanz: Klausurrelevanz;
}

/**
 * Feste Titel der 3 Klausurtage (siehe PRD/PROJ-2 Decision Log, gegen § 37
 * StBerG und offizielle Quellen verifiziert). Die Fächer selbst kommen aus
 * der "faecher"-Tabelle (Migration 20260813211609_create_themenkatalog.sql).
 */
const KLAUSURTAG_TITEL: Record<1 | 2 | 3, string> = {
  1: "Verfahrensrecht",
  2: "Ertragsteuern",
  3: "Bilanzsteuerrecht",
};

export function groupFaecherByKlausurtag(faecher: Fach[]): Klausurtag[] {
  return ([1, 2, 3] as const).map((tag) => ({
    tag,
    titel: KLAUSURTAG_TITEL[tag],
    faecher: faecher
      .filter((fach) => fach.klausurtag === tag)
      .sort((a, b) => a.name.localeCompare(b.name, "de")),
  }));
}
