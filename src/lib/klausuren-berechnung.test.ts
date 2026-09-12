import { describe, expect, it } from "vitest";
import { istBestanden, istTeilGueltig, nachschreibenFaellig } from "./klausuren-berechnung";

describe("nachschreibenFaellig", () => {
  const heute = "2026-09-09";

  it("weniger als 75 Tage vergangen -> nicht fällig", () => {
    expect(nachschreibenFaellig("2026-08-01", false, heute)).toBe(false);
  });

  it("genau 75 Tage vergangen -> fällig", () => {
    // 2026-06-26 + 75 Tage = 2026-09-09
    expect(nachschreibenFaellig("2026-06-26", false, heute)).toBe(true);
  });

  it("mehr als 75 Tage vergangen -> fällig", () => {
    expect(nachschreibenFaellig("2026-05-01", false, heute)).toBe(true);
  });

  it("bereits als erledigt markiert -> nie fällig, unabhängig vom Datum", () => {
    expect(nachschreibenFaellig("2026-01-01", true, heute)).toBe(false);
  });
});

describe("istBestanden", () => {
  it("Quote >= 40% -> bestanden", () => {
    expect(istBestanden(40, 100)).toBe(true);
    expect(istBestanden(41, 100)).toBe(true);
  });

  it("Quote < 40% -> nicht bestanden", () => {
    expect(istBestanden(39, 100)).toBe(false);
  });

  it("max_punkte 0 -> nie bestanden (Division durch 0 vermieden)", () => {
    expect(istBestanden(0, 0)).toBe(false);
  });
});

describe("istTeilGueltig", () => {
  const heute = "2026-09-09";

  it("Quote >= BESTEHEN_SICHER (55%) und innerhalb 180 Tagen -> gültig", () => {
    expect(istTeilGueltig(55, 100, "2026-08-01", heute)).toBe(true);
  });

  it("Quote < BESTEHEN_SICHER, aber >= BESTEHEN_QUOTE -> nicht gültig als Stufe-4-Beleg", () => {
    expect(istTeilGueltig(45, 100, "2026-08-01", heute)).toBe(false);
  });

  it("Quote ausreichend, aber älter als KLAUSUR_HALTBARKEIT (180 Tage) -> nicht mehr gültig", () => {
    expect(istTeilGueltig(80, 100, "2026-01-01", heute)).toBe(false);
  });

  it("genau 180 Tage alt -> noch gültig (Grenzfall)", () => {
    // 2026-03-13 + 180 Tage = 2026-09-09
    expect(istTeilGueltig(80, 100, "2026-03-13", heute)).toBe(true);
  });

  it("max_punkte 0 -> nie gültig (Division durch 0 vermieden)", () => {
    expect(istTeilGueltig(0, 0, "2026-08-01", heute)).toBe(false);
  });
});
