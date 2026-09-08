import { describe, expect, it } from "vitest";
import { statusVon, type Uebungsaufgabe, type UebungsaufgabeReview } from "./uebungsaufgaben";

const heute = "2026-09-08";

function aufgabe(overrides: Partial<Uebungsaufgabe> = {}): Uebungsaufgabe {
  return {
    id: "a1",
    fachId: "erbst",
    themenIds: ["t1"],
    titel: "Testaufgabe",
    quelle: "",
    pflichtWdhDatum: null,
    wdhAnzahl: 0,
    createdAt: heute,
    ...overrides,
  };
}

function review(overrides: Partial<UebungsaufgabeReview> = {}): UebungsaufgabeReview {
  return {
    id: "r1",
    uebungsaufgabeId: "a1",
    datum: heute,
    fachlich: 4,
    klausurtechnik: 4,
    fehlernotiz: "",
    ...overrides,
  };
}

describe("statusVon", () => {
  it("keine Review -> unbewertet", () => {
    expect(statusVon(aufgabe(), null, heute)).toBe("unbewertet");
  });

  it("offene Pflicht-Wiederholung -> wiederholung_faellig, unabhängig von worst", () => {
    const a = aufgabe({ pflichtWdhDatum: "2026-09-15", wdhAnzahl: 1 });
    expect(statusVon(a, review({ fachlich: 5, klausurtechnik: 5 }), heute)).toBe("wiederholung_faellig");
  });

  it("worst >= 4, innerhalb 56 Tagen, keine offene Wiederholung -> gueltig", () => {
    const a = aufgabe({ pflichtWdhDatum: null, wdhAnzahl: 1 });
    expect(statusVon(a, review({ fachlich: 4, klausurtechnik: 5, datum: heute }), heute)).toBe("gueltig");
  });

  it("worst >= 4, aber 56-Tage-Gültigkeit abgelaufen -> verfallen", () => {
    const a = aufgabe({ pflichtWdhDatum: null, wdhAnzahl: 1 });
    expect(statusVon(a, review({ fachlich: 4, klausurtechnik: 4, datum: "2026-07-01" }), heute)).toBe(
      "verfallen"
    );
  });

  it("BUG-1 Regression: worst < 4 nach ausgeschöpfter finaler Wiederholung -> geschlossen, NICHT verfallen", () => {
    // wdhAnzahl=3 entspricht Erstbewertung + 2 Pflicht-Wiederholungen
    // (UEB_WDH_MAX), pflichtWdhDatum ist dann bewusst null (siehe
    // naechstePflichtWdh in uebungsaufgaben-wiederholung.ts).
    const a = aufgabe({ pflichtWdhDatum: null, wdhAnzahl: 3 });
    expect(statusVon(a, review({ fachlich: 3, klausurtechnik: 2, datum: heute }), heute)).toBe(
      "geschlossen"
    );
  });
});
