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

/**
 * Platzhalter-Referenzdaten, bis /backend die "faecher"-Tabelle anlegt und
 * befüllt (siehe PROJ-2 Tech Design). Die Fach-zu-Klausurtag-Zuordnung wurde
 * gegen § 37 StBerG und offizielle Quellen verifiziert (siehe PROJ-2
 * Decision Log) — nicht ungeprüft aus dem Design-Prototyp übernommen.
 */
export const KLAUSURTAGE: Klausurtag[] = [
  {
    tag: 1,
    titel: "Verfahrensrecht",
    faecher: [
      { id: "ao", kuerzel: "AO", name: "Abgabenordnung", klausurtag: 1 },
      {
        id: "fgo",
        kuerzel: "FGO",
        name: "Finanzgerichtsordnung",
        klausurtag: 1,
      },
      { id: "ust", kuerzel: "USt", name: "Umsatzsteuer", klausurtag: 1 },
      { id: "bewg", kuerzel: "BewG", name: "Bewertungsrecht", klausurtag: 1 },
      {
        id: "erbst",
        kuerzel: "ErbSt",
        name: "Erbschaftsteuer",
        klausurtag: 1,
      },
    ],
  },
  {
    tag: 2,
    titel: "Ertragsteuern",
    faecher: [
      { id: "est", kuerzel: "ESt", name: "Einkommensteuer", klausurtag: 2 },
      {
        id: "kst",
        kuerzel: "KSt",
        name: "Körperschaftsteuer",
        klausurtag: 2,
      },
      { id: "gewst", kuerzel: "GewSt", name: "Gewerbesteuer", klausurtag: 2 },
      {
        id: "intstr",
        kuerzel: "IntStR",
        name: "Internationales Steuerrecht",
        klausurtag: 2,
      },
    ],
  },
  {
    tag: 3,
    titel: "Bilanzsteuerrecht",
    faecher: [
      {
        id: "bilanz",
        kuerzel: "Bilanz",
        name: "Buchführung & Bilanzwesen",
        klausurtag: 3,
      },
      {
        id: "umwstr",
        kuerzel: "UmwStR",
        name: "Umwandlungssteuerrecht",
        klausurtag: 3,
      },
    ],
  },
];

export interface Thema {
  id: string;
  fachId: string;
  name: string;
  klausurrelevanz: Klausurrelevanz;
}
