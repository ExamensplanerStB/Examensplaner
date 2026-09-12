import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Thema } from "@/lib/klausurtage";
import type { KompetenzanalyseQuellen } from "@/lib/kompetenzanalyse";

function chain(result: unknown) {
  const obj: Record<string, unknown> = {};
  obj.upsert = vi.fn(() => Promise.resolve(result));
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

const { speichereStufenSnapshot } = await import("./actions");

const THEMA: Thema = { id: "t1", fachId: "ao", name: "Bekanntgabe", klausurrelevanz: "hoch" };

function leereQuellen(): KompetenzanalyseQuellen {
  return { themen: [THEMA], karten: [], aufgaben: [], reviews: [], klausuren: [], teile: [] };
}

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
});

describe("speichereStufenSnapshot", () => {
  it("ruft Supabase gar nicht auf, wenn keine Themen übergeben werden", async () => {
    await speichereStufenSnapshot([], leereQuellen());
    expect(from).not.toHaveBeenCalled();
  });

  it("ruft Supabase nicht auf, wenn keine Session existiert", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await speichereStufenSnapshot([THEMA], leereQuellen());
    expect(from).not.toHaveBeenCalled();
  });

  it("schreibt für jedes Thema einen Snapshot mit heutigem Datum und berechneter Stufe, per Upsert ohne Überschreiben", async () => {
    const upsertChain = chain({ error: null });
    from.mockReturnValue(upsertChain);

    await speichereStufenSnapshot([THEMA], leereQuellen());

    expect(from).toHaveBeenCalledWith("stufen_verlauf");
    expect(upsertChain.upsert).toHaveBeenCalledTimes(1);
    const [rows, options] = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(rows).toEqual([
      expect.objectContaining({ user_id: "user-1", thema_id: "t1", stufe: 0, basis_broeckelt: false }),
    ]);
    expect(options).toEqual({ onConflict: "thema_id,datum", ignoreDuplicates: true });
  });

  it("wirft nicht, wenn Supabase einen Fehler zurückgibt (Historie darf den Seitenaufruf nie stören)", async () => {
    const upsertChain = chain({ error: { message: "boom" } });
    from.mockReturnValue(upsertChain);
    await expect(speichereStufenSnapshot([THEMA], leereQuellen())).resolves.toBeUndefined();
  });

  it("wirft nicht, wenn Supabase eine Exception auslöst", async () => {
    from.mockImplementation(() => {
      throw new Error("network down");
    });
    await expect(speichereStufenSnapshot([THEMA], leereQuellen())).resolves.toBeUndefined();
  });
});
