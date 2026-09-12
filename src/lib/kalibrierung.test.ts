import { describe, expect, it } from "vitest";

import type { Uebungsaufgabe, UebungsaufgabeReview } from "./uebungsaufgaben";
import type { Klausur, KlausurTeil } from "./klausuren";
import {
  anzahlKlausurenMitTeilen,
  durchschnittsBiasVon,
  kalibrierungBereit,
  praediktiveValiditaetVon,
  selbstbewertungsBiasVon,
  type StufenSnapshot,
} from "./kalibrierung";

function klausur(overrides: Partial<Klausur>): Klausur {
  return {
    id: "kl1",
    bezeichnung: "Klausur 1",
    datum: "2026-09-09",
    quelle: "",
    note: "",
    stufe1Text: "",
    stufe2Text: "",
    nachschreibenErledigt: false,
    createdAt: "2026-09-09T00:00:00Z",
    ...overrides,
  };
}

function teil(overrides: Partial<KlausurTeil>): KlausurTeil {
  return {
    id: "tl1",
    klausurId: "kl1",
    fachId: "ao",
    themenIds: ["t1"],
    maxPunkte: 100,
    erreichtePunkte: 60,
    ...overrides,
  };
}

function aufgabe(overrides: Partial<Uebungsaufgabe>): Uebungsaufgabe {
  return {
    id: "u1",
    fachId: "ao",
    themenIds: ["t1"],
    titel: "Aufgabe",
    quelle: "",
    pflichtWdhDatum: null,
    wdhAnzahl: 1,
    createdAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function review(overrides: Partial<UebungsaufgabeReview>): UebungsaufgabeReview {
  return {
    id: "r1",
    uebungsaufgabeId: "u1",
    datum: "2026-08-15",
    fachlich: 4,
    klausurtechnik: 4,
    fehlernotiz: "",
    ...overrides,
  };
}

describe("anzahlKlausurenMitTeilen / kalibrierungBereit", () => {
  it("zählt nur Klausuren mit mindestens einem Teil", () => {
    const klausuren = [klausur({ id: "k1" }), klausur({ id: "k2" })];
    const teile = [teil({ klausurId: "k1" })];
    expect(anzahlKlausurenMitTeilen(klausuren, teile)).toBe(1);
  });

  it("unter der Schwelle (10) -> nicht bereit", () => {
    const klausuren = Array.from({ length: 9 }, (_, i) => klausur({ id: `k${i}` }));
    const teile = klausuren.map((k) => teil({ id: `t${k.id}`, klausurId: k.id }));
    expect(kalibrierungBereit(klausuren, teile)).toBe(false);
  });

  it("ab der Schwelle (10) -> bereit", () => {
    const klausuren = Array.from({ length: 10 }, (_, i) => klausur({ id: `k${i}` }));
    const teile = klausuren.map((k) => teil({ id: `t${k.id}`, klausurId: k.id }));
    expect(kalibrierungBereit(klausuren, teile)).toBe(true);
  });
});

describe("praediktiveValiditaetVon", () => {
  it("ordnet einen bestandenen Teil der Stufe des Snapshots vom Vortag zu", () => {
    const klausuren = [klausur({ datum: "2026-09-09" })];
    const teile = [teil({ erreichtePunkte: 50, maxPunkte: 100 })]; // 50% >= BESTEHEN_QUOTE (40%)
    const snapshots: StufenSnapshot[] = [{ themaId: "t1", datum: "2026-09-08", stufe: 3, basisBroeckelt: false }];
    const matrix = praediktiveValiditaetVon(klausuren, teile, snapshots);
    const zelleStufe3 = matrix.find((z) => z.stufe === 3);
    expect(zelleStufe3?.bestanden).toBe(1);
    expect(zelleStufe3?.nichtBestanden).toBe(0);
  });

  it("nicht bestandener Teil landet in der nichtBestanden-Spalte", () => {
    const klausuren = [klausur({ datum: "2026-09-09" })];
    const teile = [teil({ erreichtePunkte: 20, maxPunkte: 100 })]; // 20% < 40%
    const snapshots: StufenSnapshot[] = [{ themaId: "t1", datum: "2026-09-08", stufe: 2, basisBroeckelt: false }];
    const matrix = praediktiveValiditaetVon(klausuren, teile, snapshots);
    expect(matrix.find((z) => z.stufe === 2)?.nichtBestanden).toBe(1);
  });

  it("kein Snapshot vom Vortag -> Teil wird ausgeschlossen, kein Fehler", () => {
    const klausuren = [klausur({ datum: "2026-09-09" })];
    const teile = [teil({})];
    const matrix = praediktiveValiditaetVon(klausuren, teile, []);
    const summe = matrix.reduce((s, z) => s + z.bestanden + z.nichtBestanden, 0);
    expect(summe).toBe(0);
  });

  it("unkorrigierter Teil (Punkte null) wird ausgeschlossen", () => {
    const klausuren = [klausur({})];
    const teile = [teil({ erreichtePunkte: null, maxPunkte: null })];
    const snapshots: StufenSnapshot[] = [{ themaId: "t1", datum: "2026-09-08", stufe: 3, basisBroeckelt: false }];
    const matrix = praediktiveValiditaetVon(klausuren, teile, snapshots);
    expect(matrix.reduce((s, z) => s + z.bestanden + z.nichtBestanden, 0)).toBe(0);
  });
});

describe("selbstbewertungsBiasVon", () => {
  it("berechnet den Ø-Worst nur aus Reviews innerhalb der 8 Wochen vor der Klausur", () => {
    const klausuren = [klausur({ datum: "2026-09-09" })];
    const teile = [teil({ erreichtePunkte: 40, maxPunkte: 100 })]; // Skala: 0,4*5 = 2
    const aufgaben = [aufgabe({})];
    const reviews = [
      review({ datum: "2026-08-01", fachlich: 5, klausurtechnik: 5 }), // innerhalb 56 Tage -> zählt
      review({ id: "r2", datum: "2026-06-01", fachlich: 1, klausurtechnik: 1 }), // zu weit zurück -> zählt nicht
    ];
    const eintraege = selbstbewertungsBiasVon(klausuren, teile, aufgaben, reviews);
    expect(eintraege).toHaveLength(1);
    expect(eintraege[0].avgWorst).toBe(5);
    expect(eintraege[0].teilQuoteAlsSkala).toBe(2);
    expect(eintraege[0].differenz).toBe(3); // Selbstüberschätzung
  });

  it("keine Übungsaufgaben-Reviews im Fenster -> kein Eintrag für dieses Thema", () => {
    const klausuren = [klausur({})];
    const teile = [teil({})];
    expect(selbstbewertungsBiasVon(klausuren, teile, [aufgabe({})], [])).toHaveLength(0);
  });
});

describe("durchschnittsBiasVon", () => {
  it("mittelt die Differenzen mehrerer Einträge", () => {
    const eintraege = [
      { themaId: "t1", klausurId: "k1", teilId: "tl1", avgWorst: 5, teilQuoteAlsSkala: 3, differenz: 2 },
      { themaId: "t2", klausurId: "k1", teilId: "tl2", avgWorst: 4, teilQuoteAlsSkala: 4, differenz: 0 },
    ];
    expect(durchschnittsBiasVon(eintraege)).toBe(1);
  });

  it("keine Einträge -> null", () => {
    expect(durchschnittsBiasVon([])).toBeNull();
  });
});
