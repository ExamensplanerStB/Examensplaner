import { describe, expect, it } from "vitest";
import {
  istGueltig,
  naechstePflichtWdh,
  worst,
  type Bewertung,
} from "./uebungsaufgaben-wiederholung";

describe("worst", () => {
  it("liefert das Minimum aus Fachlich und Klausurtechnik", () => {
    expect(worst(5, 3)).toBe(3);
    expect(worst(2, 4)).toBe(2);
    expect(worst(4, 4)).toBe(4);
  });
});

describe("naechstePflichtWdh", () => {
  const heute = "2026-09-06";

  it("worst >= 4 bei Erstbewertung: keine Wiederholung, nicht geschlossen", () => {
    const ergebnis = naechstePflichtWdh(4, 0, heute);
    expect(ergebnis).toEqual({ pflichtWdhDatum: null, geschlossen: false });
  });

  it("worst == 3 bei Erstbewertung: Pflicht-Wiederholung in 7 Tagen", () => {
    const ergebnis = naechstePflichtWdh(3, 0, heute);
    expect(ergebnis.geschlossen).toBe(false);
    expect(ergebnis.pflichtWdhDatum).toBe("2026-09-13");
  });

  it("worst <= 2 bei Erstbewertung: Pflicht-Wiederholung in 5 Tagen", () => {
    const ergebnisEins = naechstePflichtWdh(1, 0, heute);
    const ergebnisZwei = naechstePflichtWdh(2, 0, heute);
    expect(ergebnisEins.pflichtWdhDatum).toBe("2026-09-11");
    expect(ergebnisZwei.pflichtWdhDatum).toBe("2026-09-11");
  });

  it("erste Wiederholung (wdhAnzahlVorher=1) mit worst <= 3: finale Wiederholung in 21 Tagen", () => {
    const ergebnis = naechstePflichtWdh(3 as Bewertung, 1, heute);
    expect(ergebnis.geschlossen).toBe(false);
    expect(ergebnis.pflichtWdhDatum).toBe("2026-09-27");
  });

  it("erste Wiederholung (wdhAnzahlVorher=1) mit worst >= 4: erledigt, keine weitere Wiederholung", () => {
    const ergebnis = naechstePflichtWdh(5, 1, heute);
    expect(ergebnis).toEqual({ pflichtWdhDatum: null, geschlossen: false });
  });

  it("finale Wiederholung ausgeschöpft (wdhAnzahlVorher=2) mit weiterhin worst <= 3: geschlossen", () => {
    const ergebnis = naechstePflichtWdh(2, 2, heute);
    expect(ergebnis).toEqual({ pflichtWdhDatum: null, geschlossen: true });
  });

  it("finale Wiederholung (wdhAnzahlVorher=2) mit worst >= 4: trotzdem erfolgreich abgeschlossen", () => {
    const ergebnis = naechstePflichtWdh(4, 2, heute);
    expect(ergebnis).toEqual({ pflichtWdhDatum: null, geschlossen: false });
  });
});

describe("istGueltig", () => {
  const heute = "2026-09-06";

  it("worst < 4 ist nie gültig, unabhängig vom Datum", () => {
    expect(istGueltig(3, heute, heute)).toBe(false);
  });

  it("worst >= 4 und innerhalb 56 Tagen ist gültig", () => {
    expect(istGueltig(4, "2026-07-15", heute)).toBe(true);
  });

  it("worst >= 4, aber mehr als 56 Tage vergangen: nicht mehr gültig", () => {
    expect(istGueltig(4, "2026-07-01", heute)).toBe(false);
  });

  it("genau an der 56-Tage-Grenze ist noch gültig", () => {
    expect(istGueltig(5, "2026-07-12", heute)).toBe(true);
  });
});
