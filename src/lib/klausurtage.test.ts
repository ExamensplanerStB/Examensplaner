import { describe, expect, it } from "vitest";

import { groupFaecherByKlausurtag, type Fach } from "./klausurtage";

const faecher: Fach[] = [
  { id: "ust", kuerzel: "USt", name: "Umsatzsteuer", klausurtag: 1 },
  { id: "ao", kuerzel: "AO", name: "Abgabenordnung", klausurtag: 1 },
  { id: "est", kuerzel: "ESt", name: "Einkommensteuer", klausurtag: 2 },
  { id: "bilanz", kuerzel: "Bilanz", name: "Buchführung & Bilanzwesen", klausurtag: 3 },
];

describe("groupFaecherByKlausurtag", () => {
  it("gruppiert Fächer nach ihrem Klausurtag mit den festen Titeln", () => {
    const result = groupFaecherByKlausurtag(faecher);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ tag: 1, titel: "Verfahrensrecht" });
    expect(result[1]).toMatchObject({ tag: 2, titel: "Ertragsteuern" });
    expect(result[2]).toMatchObject({ tag: 3, titel: "Bilanzsteuerrecht" });
  });

  it("sortiert Fächer innerhalb eines Klausurtags alphabetisch", () => {
    const result = groupFaecherByKlausurtag(faecher);
    const tag1Namen = result[0].faecher.map((f) => f.name);

    expect(tag1Namen).toEqual(["Abgabenordnung", "Umsatzsteuer"]);
  });

  it("ordnet jedes Fach genau seinem Klausurtag zu", () => {
    const result = groupFaecherByKlausurtag(faecher);

    expect(result[1].faecher.map((f) => f.id)).toEqual(["est"]);
    expect(result[2].faecher.map((f) => f.id)).toEqual(["bilanz"]);
  });

  it("liefert drei leere Gruppen zurück, wenn keine Fächer übergeben werden", () => {
    const result = groupFaecherByKlausurtag([]);

    expect(result).toHaveLength(3);
    expect(result.every((k) => k.faecher.length === 0)).toBe(true);
  });
});
