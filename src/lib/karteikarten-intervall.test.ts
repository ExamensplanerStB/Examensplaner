import { describe, expect, it } from "vitest";

import {
  berechneNaechstesIntervall,
  diffTage,
  istGueltig,
  karenz,
  naechsteFaelligkeit,
  PARAMETER,
  rundeIntervall,
} from "./karteikarten-intervall";

const KEIN_FUZZ = () => 0.5; // Mittelpunkt von [0,1) → Fuzzfaktor exakt 1

describe("berechneNaechstesIntervall — Erstbewertung (vorherigesIntervall = null)", () => {
  it("setzt GRADUIERUNG für Bewertung 4 (3 Tage)", () => {
    expect(berechneNaechstesIntervall(4, null, KEIN_FUZZ)).toBeCloseTo(3);
  });

  it("setzt GRADUIERUNG für Bewertung 5 (4 Tage)", () => {
    expect(berechneNaechstesIntervall(5, null, KEIN_FUZZ)).toBeCloseTo(4);
  });

  it("setzt 2 Tage für Bewertung 3", () => {
    expect(berechneNaechstesIntervall(3, null, KEIN_FUZZ)).toBeCloseTo(2);
  });

  it("setzt START_INTERVALL (1 Tag) für Bewertung 1 oder 2", () => {
    expect(berechneNaechstesIntervall(1, null, KEIN_FUZZ)).toBeCloseTo(1);
    expect(berechneNaechstesIntervall(2, null, KEIN_FUZZ)).toBeCloseTo(1);
  });
});

describe("berechneNaechstesIntervall — Folgebewertung (wächst/bleibt/resettet)", () => {
  it("multipliziert mit FAKTOR_5 (2,5) bei Bewertung 5", () => {
    expect(berechneNaechstesIntervall(5, 10, KEIN_FUZZ)).toBeCloseTo(25);
  });

  it("multipliziert mit FAKTOR_4 (2,0) bei Bewertung 4", () => {
    expect(berechneNaechstesIntervall(4, 10, KEIN_FUZZ)).toBeCloseTo(20);
  });

  it("lässt das Intervall bei Bewertung 3 unverändert", () => {
    expect(berechneNaechstesIntervall(3, 10, KEIN_FUZZ)).toBeCloseTo(10);
  });

  it("setzt bei Bewertung 1 oder 2 (Lapse) auf START_INTERVALL zurück, unabhängig vom vorherigen Wert", () => {
    expect(berechneNaechstesIntervall(1, 96, KEIN_FUZZ)).toBeCloseTo(1);
    expect(berechneNaechstesIntervall(2, 96, KEIN_FUZZ)).toBeCloseTo(1);
  });

  it("begrenzt das Intervall auf INTERVALL_MAX (120 Tage)", () => {
    expect(berechneNaechstesIntervall(5, 100, KEIN_FUZZ)).toBeCloseTo(120);
  });

  it("bildet die Beispielkette aus 4ern nach (1 → 3 → 6 → 12 → 24 → 48 → 96)", () => {
    let intervall: number | null = null;
    const erwartet = [3, 6, 12, 24, 48, 96];
    for (const wert of erwartet) {
      intervall = berechneNaechstesIntervall(4, intervall, KEIN_FUZZ);
      expect(intervall).toBeCloseTo(wert);
    }
  });
});

describe("berechneNaechstesIntervall — Fuzz-Streuung", () => {
  it("liegt bei zufall()=0 am unteren Rand (−15 %)", () => {
    expect(berechneNaechstesIntervall(4, 10, () => 0)).toBeCloseTo(20 * 0.85);
  });

  it("liegt bei zufall()=1 am oberen Rand (+15 %)", () => {
    expect(berechneNaechstesIntervall(4, 10, () => 1)).toBeCloseTo(20 * 1.15);
  });

  it("unterschreitet nie 1 Tag, selbst mit negativem Fuzz auf START_INTERVALL", () => {
    expect(berechneNaechstesIntervall(1, 5, () => 0)).toBeGreaterThanOrEqual(1);
  });
});

describe("rundeIntervall", () => {
  it("rundet kaufmännisch (0,5 aufwärts)", () => {
    expect(rundeIntervall(3.5)).toBe(4);
    expect(rundeIntervall(3.49)).toBe(3);
    expect(rundeIntervall(3.51)).toBe(4);
  });
});

describe("naechsteFaelligkeit", () => {
  it("addiert das gerundete Intervall in Tagen zum heutigen Datum", () => {
    expect(naechsteFaelligkeit("2026-09-02", 3)).toBe("2026-09-05");
    expect(naechsteFaelligkeit("2026-09-02", 3.6)).toBe("2026-09-06");
  });

  it("wechselt korrekt über einen Monatswechsel hinweg", () => {
    expect(naechsteFaelligkeit("2026-09-29", 5)).toBe("2026-10-04");
  });
});

describe("diffTage", () => {
  it("berechnet die Differenz in ganzen Tagen", () => {
    expect(diffTage("2026-09-02", "2026-09-05")).toBe(3);
    expect(diffTage("2026-09-05", "2026-09-02")).toBe(-3);
    expect(diffTage("2026-09-02", "2026-09-02")).toBe(0);
  });
});

describe("karenz", () => {
  it("nimmt KARENZ_FAKTOR (25 %) des Intervalls, wenn das über KARENZ_MIN liegt", () => {
    expect(karenz(20)).toBe(5);
  });

  it("greift auf KARENZ_MIN (2 Tage) zurück, wenn 25 % darunter läge", () => {
    expect(karenz(4)).toBe(PARAMETER.KARENZ_MIN);
    expect(karenz(1)).toBe(PARAMETER.KARENZ_MIN);
  });
});

describe("istGueltig", () => {
  it("ist gültig bei Bewertung ≥ 4 und nicht überschrittener Fälligkeit+Karenz", () => {
    expect(istGueltig(4, "2026-09-10", 20, "2026-09-05")).toBe(true);
  });

  it("ist ungültig bei Bewertung < 4, unabhängig von der Fälligkeit", () => {
    expect(istGueltig(3, "2026-09-10", 20, "2026-09-05")).toBe(false);
  });

  it("ist ungültig, wenn Fälligkeit + Karenz überschritten ist, selbst bei guter Bewertung", () => {
    // Intervall 20 → Karenz 5 Tage; Fälligkeit 2026-09-10 + 5 Tage Karenz = 2026-09-15
    expect(istGueltig(5, "2026-09-10", 20, "2026-09-16")).toBe(false);
  });

  it("ist noch gültig exakt am letzten Tag der Karenzzeit", () => {
    expect(istGueltig(5, "2026-09-10", 20, "2026-09-15")).toBe(true);
  });
});
