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

const { createKlausur, updateKlausur, markiereNachschreibenErledigt, deleteKlausur } = await import(
  "./actions"
);

const GUELTIGE_WERTE = {
  bezeichnung: "ErbSt-02",
  datum: "2026-08-01",
  quelle: "",
  note: "",
  stufe1Text: "",
  stufe2Text: "",
  teile: [{ fachId: "erbst", themenIds: ["thema-1"], maxPunkte: "20", erreichtePunkte: "12" }],
};

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  revalidatePathMock.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("createKlausur", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await createKlausur({ ...GUELTIGE_WERTE, bezeichnung: "" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("lehnt eine Klausur ohne Teile ab", async () => {
    const result = await createKlausur({ ...GUELTIGE_WERTE, teile: [] });
    expect(result).toEqual({ error: "Mindestens ein Teil ist erforderlich" });
    expect(from).not.toHaveBeenCalled();
  });

  it("lehnt ein zukünftiges Datum ab", async () => {
    const result = await createKlausur({ ...GUELTIGE_WERTE, datum: "2099-01-01" });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("legt eine Klausur mit einem Teil inkl. Themenzuordnung an", async () => {
    const insertKlausur = chain({
      data: {
        id: "klausur-1",
        bezeichnung: "ErbSt-02",
        datum: "2026-08-01",
        quelle: "",
        note: "",
        stufe1_text: "",
        stufe2_text: "",
        nachschreiben_erledigt: false,
        created_at: "2026-09-08T00:00:00.000Z",
      },
      error: null,
    });
    const insertTeile = chain({
      data: [{ id: "teil-1", klausur_id: "klausur-1", fach_id: "erbst", max_punkte: 20, erreichte_punkte: 12 }],
      error: null,
    });
    const insertThemen = chain({ error: null });
    from.mockReturnValueOnce(insertKlausur).mockReturnValueOnce(insertTeile).mockReturnValueOnce(insertThemen);

    const result = await createKlausur(GUELTIGE_WERTE);

    expect("klausur" in result).toBe(true);
    if ("klausur" in result) {
      expect(result.klausur.id).toBe("klausur-1");
      expect(result.teile).toHaveLength(1);
      expect(result.teile[0].themenIds).toEqual(["thema-1"]);
      expect(result.teile[0].maxPunkte).toBe(20);
    }
    expect(insertKlausur.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", bezeichnung: "ErbSt-02" })
    );
    expect(insertTeile.insert).toHaveBeenCalledWith([
      { klausur_id: "klausur-1", fach_id: "erbst", max_punkte: 20, erreichte_punkte: 12 },
    ]);
    expect(insertThemen.insert).toHaveBeenCalledWith([{ teil_id: "teil-1", thema_id: "thema-1" }]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/probeklausuren");
  });

  it("legt eine Klausur mit zwei Teilen unterschiedlicher Fächer an, ohne Themen", async () => {
    const werte = {
      ...GUELTIGE_WERTE,
      teile: [
        { fachId: "erbst", themenIds: [], maxPunkte: "", erreichtePunkte: "" },
        { fachId: "ust", themenIds: [], maxPunkte: "", erreichtePunkte: "" },
      ],
    };
    const insertKlausur = chain({
      data: {
        id: "klausur-1",
        bezeichnung: "ErbSt-02",
        datum: "2026-08-01",
        quelle: "",
        note: "",
        stufe1_text: "",
        stufe2_text: "",
        nachschreiben_erledigt: false,
        created_at: "2026-09-08T00:00:00.000Z",
      },
      error: null,
    });
    const insertTeile = chain({
      data: [
        { id: "teil-1", klausur_id: "klausur-1", fach_id: "erbst", max_punkte: null, erreichte_punkte: null },
        { id: "teil-2", klausur_id: "klausur-1", fach_id: "ust", max_punkte: null, erreichte_punkte: null },
      ],
      error: null,
    });
    from.mockReturnValueOnce(insertKlausur).mockReturnValueOnce(insertTeile);

    const result = await createKlausur(werte);

    expect("klausur" in result).toBe(true);
    if ("klausur" in result) {
      expect(result.teile).toHaveLength(2);
      expect(result.teile.map((t) => t.fachId)).toEqual(["erbst", "ust"]);
    }
    // Kein Themen-Insert-Aufruf, da keine Themen zugeordnet sind
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn keine Session vorhanden ist", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await createKlausur(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
    expect(from).not.toHaveBeenCalled();
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Anlegen der Klausur fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await createKlausur(GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("updateKlausur", () => {
  it("lehnt ungültige Eingaben ab, ohne Supabase aufzurufen", async () => {
    const result = await updateKlausur("klausur-1", { ...GUELTIGE_WERTE, teile: [] });
    expect("error" in result).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });

  it("löscht bestehende Teile und legt sie neu an (Delete-then-Insert)", async () => {
    const updateChain = chain({
      data: {
        id: "klausur-1",
        bezeichnung: "ErbSt-02",
        datum: "2026-08-01",
        quelle: "",
        note: "4,5",
        stufe1_text: "",
        stufe2_text: "",
        nachschreiben_erledigt: false,
        created_at: "2026-09-08T00:00:00.000Z",
      },
      error: null,
    });
    const deleteTeile = chain({ error: null });
    const insertTeile = chain({
      data: [{ id: "teil-neu", klausur_id: "klausur-1", fach_id: "erbst", max_punkte: 20, erreichte_punkte: 12 }],
      error: null,
    });
    const insertThemen = chain({ error: null });
    from
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteTeile)
      .mockReturnValueOnce(insertTeile)
      .mockReturnValueOnce(insertThemen);

    const result = await updateKlausur("klausur-1", GUELTIGE_WERTE);

    expect("klausur" in result).toBe(true);
    expect(deleteTeile.delete).toHaveBeenCalled();
    expect(deleteTeile.eq).toHaveBeenCalledWith("klausur_id", "klausur-1");
    expect(insertTeile.insert).toHaveBeenCalledWith([
      { klausur_id: "klausur-1", fach_id: "erbst", max_punkte: 20, erreichte_punkte: 12 },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/probeklausuren");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn die Klausur nicht gefunden wird", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "PGRST116" } }));
    const result = await updateKlausur("unbekannt", GUELTIGE_WERTE);
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("markiereNachschreibenErledigt", () => {
  it("setzt nachschreiben_erledigt auf true", async () => {
    const updateChain = chain({
      data: {
        id: "klausur-1",
        bezeichnung: "ErbSt-02",
        datum: "2026-01-01",
        quelle: "",
        note: "",
        stufe1_text: "",
        stufe2_text: "",
        nachschreiben_erledigt: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });
    from.mockReturnValueOnce(updateChain);

    const result = await markiereNachschreibenErledigt("klausur-1");

    expect("klausur" in result).toBe(true);
    if ("klausur" in result) {
      expect(result.klausur.nachschreibenErledigt).toBe(true);
    }
    expect(updateChain.update).toHaveBeenCalledWith({ nachschreiben_erledigt: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/probeklausuren");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Update fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ data: null, error: { code: "other" } }));
    const result = await markiereNachschreibenErledigt("klausur-1");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});

describe("deleteKlausur", () => {
  it("löscht eine Klausur erfolgreich", async () => {
    const deleteChain = chain({ error: null });
    from.mockReturnValueOnce(deleteChain);

    const result = await deleteKlausur("klausur-1");

    expect(result).toEqual({ success: true });
    expect(deleteChain.delete).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/probeklausuren");
  });

  it("zeigt die Verbindungsfehler-Meldung, wenn das Löschen fehlschlägt", async () => {
    from.mockReturnValueOnce(chain({ error: { code: "other" } }));
    const result = await deleteKlausur("klausur-1");
    expect(result).toEqual({ error: CONNECTION_ERROR });
  });
});
