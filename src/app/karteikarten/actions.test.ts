import { beforeEach, describe, expect, it, vi } from "vitest";

const CONNECTION_ERROR = "Verbindung fehlgeschlagen, bitte später erneut versuchen";

function chain(result: unknown) {
  const obj: Record<string, unknown> = {};
  obj.select = vi.fn(() => obj);
  obj.insert = vi.fn(() => obj);
  obj.update = vi.fn(() => obj);
  obj.delete = vi.fn(() => obj);
  obj.eq = vi.fn(() => obj);
  obj.single = vi.fn(() => Promise.resolve(result));
  obj.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return obj;
}

const getUser = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from,
  })),
}));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

const { createKarteikarte, bewerteKarteikarte, updateKarteikarte, deleteKarteikarte } =
  await import("./actions");

const GUELTIGE_WERTE = {
  fachId: "ust",
  typ: "theorie",
  themenIds: ["thema-1"],
  frage: "Wo ist der Ort der sonstigen Leistung?",
  bewertung: "4" as const,
  quelle: "",
  fehlernotiz: "",
};

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  revalidatePathMock.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("createKarteikarte", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await createKarteikarte({ ...GUELTIGE_WERTE, frage: "" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("lehnt eine Karte ohne Thema ab", async () => {
    const result = await createKarteikarte({ ...GUELTIGE_WERTE, themenIds: [] });
    expect(result).toEqual({ error: "Mindestens ein Thema ist erforderlich" });
    expect(from).not.toHaveBeenCalled();
  });

  it("legt eine Karte inkl. Themenzuordnung und erstem Historieneintrag an", async () => {
    const insertKarte = chain({
      data: {
        id: "karte-1",
        fach_id: "ust",
        typ: "theorie",
        frage: GUELTIGE_WERTE.frage,
        quelle: "",
        fehlernotiz: "",
        bewertung: 4,
        intervall: 3,
        wdh_anzahl: 1,
        wdh_datum: "2026-09-08",
        created_at: "2026-09-05T00:00:00.000Z",
      },
      error: null,
    });
    const deleteThemen = chain({ error: null });
    const insertThemen = chain({ error: null });
    const insertReview = chain({ error: null });
    from
      .mockReturnValueOnce(insertKarte)
      .mockReturnValueOnce(deleteThemen)
      .mockReturnValueOnce(insertThemen)
      .mockReturnValueOnce(insertReview);

    const result = await createKarteikarte(GUELTIGE_WERTE);

    expect("karte" in result).toBe(true);
    if ("karte" in result) {
      expect(result.karte.id).toBe("karte-1");
      expect(result.karte.themenIds).toEqual(["thema-1"]);
      expect(result.karte.bewertung).toBe(4);
    }
    expect(insertKarte.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        fach_id: "ust",
        typ: "theorie",
        frage: GUELTIGE_WERTE.frage,
        bewertung: 4,
        wdh_anzahl: 1,
      })
    );
    expect(insertThemen.insert).toHaveBeenCalledWith([{ karteikarte_id: "karte-1", thema_id: "thema-1" }]);
    expect(insertReview.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", karteikarte_id: "karte-1", bewertung: 4 })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/karteikarten");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await createKarteikarte(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Anlegen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await createKarteikarte(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("bewerteKarteikarte", () => {
  it("lehnt eine ungültige Bewertung ab, ohne Supabase aufzurufen", async () => {
    const result = await bewerteKarteikarte("karte-1", 7);
    expect(result).toEqual({ error: "Ungültige Bewertung" });
    expect(from).not.toHaveBeenCalled();
  });

  it("berechnet das neue Intervall, protokolliert die Historie und gibt die aktualisierte Karte zurück", async () => {
    const selectCurrent = chain({ data: { intervall: 10, fehlernotiz: "alte Notiz", wdh_anzahl: 2 }, error: null });
    const update = chain({
      data: {
        id: "karte-1",
        fach_id: "ust",
        typ: "theorie",
        frage: "Frage",
        quelle: "",
        fehlernotiz: "alte Notiz",
        bewertung: 5,
        intervall: 25,
        wdh_anzahl: 3,
        wdh_datum: "2026-10-01",
        created_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    const insertReview = chain({ error: null });
    const selectThemen = chain({ data: [{ thema_id: "thema-1" }], error: null });
    from.mockReturnValueOnce(selectCurrent).mockReturnValueOnce(update).mockReturnValueOnce(insertReview).mockReturnValueOnce(selectThemen);

    const result = await bewerteKarteikarte("karte-1", 5);

    expect("karte" in result).toBe(true);
    if ("karte" in result) {
      expect(result.karte.bewertung).toBe(5);
      expect(result.karte.themenIds).toEqual(["thema-1"]);
    }
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ bewertung: 5, wdh_anzahl: 3, fehlernotiz: "alte Notiz" })
    );
    expect(insertReview.insert).toHaveBeenCalledWith(
      expect.objectContaining({ karteikarte_id: "karte-1", bewertung: 5 })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/karteikarten");
  });

  it("überschreibt die Fehlernotiz nur, wenn eine neue explizit übergeben wird", async () => {
    const selectCurrent = chain({ data: { intervall: 5, fehlernotiz: "alte Notiz", wdh_anzahl: 1 }, error: null });
    const update = chain({ data: { id: "karte-1", fach_id: "ust", typ: "theorie", frage: "F", quelle: "", fehlernotiz: "neue Notiz", bewertung: 2, intervall: 1, wdh_anzahl: 2, wdh_datum: "2026-09-06", created_at: "2026-09-01T00:00:00.000Z" }, error: null });
    const insertReview = chain({ error: null });
    const selectThemen = chain({ data: [], error: null });
    from.mockReturnValueOnce(selectCurrent).mockReturnValueOnce(update).mockReturnValueOnce(insertReview).mockReturnValueOnce(selectThemen);

    await bewerteKarteikarte("karte-1", 2, "neue Notiz");

    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ fehlernotiz: "neue Notiz" }));
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Karte nicht gefunden wird", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "PGRST116" } }));
    const result = await bewerteKarteikarte("karte-unbekannt", 3);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await bewerteKarteikarte("karte-1", 3);
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });
});

describe("updateKarteikarte", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await updateKarteikarte("karte-1", { ...GUELTIGE_WERTE, fachId: "" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("aktualisiert Metadaten ohne Bewertungsänderung, ohne einen neuen Historieneintrag anzulegen", async () => {
    const selectCurrent = chain({ data: { bewertung: 4 }, error: null });
    const updateMeta = chain({ error: null });
    const deleteThemen = chain({ error: null });
    const insertThemen = chain({ error: null });
    const selectFinal = chain({
      data: {
        id: "karte-1",
        fach_id: "ust",
        typ: "theorie",
        frage: GUELTIGE_WERTE.frage,
        quelle: "",
        fehlernotiz: "",
        bewertung: 4,
        intervall: 3,
        wdh_anzahl: 1,
        wdh_datum: "2026-09-08",
        created_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    from
      .mockReturnValueOnce(selectCurrent)
      .mockReturnValueOnce(updateMeta)
      .mockReturnValueOnce(deleteThemen)
      .mockReturnValueOnce(insertThemen)
      .mockReturnValueOnce(selectFinal);

    const result = await updateKarteikarte("karte-1", GUELTIGE_WERTE);

    expect("karte" in result).toBe(true);
    expect(updateMeta.update).toHaveBeenCalledWith(
      expect.objectContaining({ fach_id: "ust", typ: "theorie", frage: GUELTIGE_WERTE.frage })
    );
    // Kein Aufruf von karteikarten_reviews, da sich die Bewertung nicht geändert hat
    expect(from).toHaveBeenCalledTimes(5);
    expect(revalidatePathMock).toHaveBeenCalledWith("/karteikarten");
  });

  it("löst bei geänderter Bewertung denselben Bewertungsalgorithmus wie bewerteKarteikarte aus", async () => {
    const selectCurrent = chain({ data: { bewertung: 3 }, error: null });
    const updateMeta = chain({ error: null });
    const deleteThemen = chain({ error: null });
    const insertThemen = chain({ error: null });
    // Ab hier: interner bewerteKarteikarte-Aufruf
    const selectIntervall = chain({ data: { intervall: 2, fehlernotiz: "", wdh_anzahl: 1 }, error: null });
    const updateBewertung = chain({
      data: {
        id: "karte-1",
        fach_id: "ust",
        typ: "theorie",
        frage: GUELTIGE_WERTE.frage,
        quelle: "",
        fehlernotiz: "",
        bewertung: 4,
        intervall: 4,
        wdh_anzahl: 2,
        wdh_datum: "2026-09-09",
        created_at: "2026-09-01T00:00:00.000Z",
      },
      error: null,
    });
    const insertReview = chain({ error: null });
    const selectThemenIds = chain({ data: [{ thema_id: "thema-1" }], error: null });
    from
      .mockReturnValueOnce(selectCurrent)
      .mockReturnValueOnce(updateMeta)
      .mockReturnValueOnce(deleteThemen)
      .mockReturnValueOnce(insertThemen)
      .mockReturnValueOnce(selectIntervall)
      .mockReturnValueOnce(updateBewertung)
      .mockReturnValueOnce(insertReview)
      .mockReturnValueOnce(selectThemenIds);

    const result = await updateKarteikarte("karte-1", GUELTIGE_WERTE);

    expect("karte" in result).toBe(true);
    if ("karte" in result) {
      expect(result.karte.bewertung).toBe(4);
    }
    expect(updateBewertung.update).toHaveBeenCalledWith(expect.objectContaining({ bewertung: 4, wdh_anzahl: 2 }));
    expect(insertReview.insert).toHaveBeenCalledWith(expect.objectContaining({ karteikarte_id: "karte-1", bewertung: 4 }));
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Karte nicht gefunden wird", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "PGRST116" } }));
    const result = await updateKarteikarte("karte-unbekannt", GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("deleteKarteikarte", () => {
  it("löscht eine Karte erfolgreich", async () => {
    const deleteChain = chain({ error: null });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteKarteikarte("karte-1");

    expect(result).toEqual({ success: true });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/karteikarten");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Löschen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ error: { code: "other" } }));
    const result = await deleteKarteikarte("karte-1");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});
