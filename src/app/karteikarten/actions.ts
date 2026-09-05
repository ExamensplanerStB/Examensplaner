"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { CONNECTION_ERROR, type Bewertung, type Karteikarte, type KarteikartenTyp } from "@/lib/karteikarten";
import { berechneNaechstesIntervall, heuteISO, naechsteFaelligkeit } from "@/lib/karteikarten-intervall";
import { karteikarteSchema, type KarteikarteFormValues } from "@/lib/schemas/karteikarte";

const GUELTIGE_BEWERTUNGEN = [1, 2, 3, 4, 5];

const KARTE_SELECT =
  "id, fach_id, typ, frage, quelle, fehlernotiz, bewertung, intervall, wdh_anzahl, wdh_datum, created_at";

type KarteikarteRow = {
  id: string;
  fach_id: string;
  typ: KarteikartenTyp;
  frage: string;
  quelle: string;
  fehlernotiz: string;
  bewertung: number;
  intervall: number;
  wdh_anzahl: number;
  wdh_datum: string;
  created_at: string;
};

function toKarteikarte(row: KarteikarteRow, themenIds: string[]): Karteikarte {
  return {
    id: row.id,
    fachId: row.fach_id,
    typ: row.typ,
    themenIds,
    frage: row.frage,
    quelle: row.quelle,
    fehlernotiz: row.fehlernotiz,
    bewertung: row.bewertung as Bewertung,
    intervall: Number(row.intervall),
    wdhAnzahl: row.wdh_anzahl,
    wdhDatum: row.wdh_datum,
    createdAt: row.created_at,
  };
}

/** Ersetzt die Themenzuordnung einer Karte vollständig (Delete-then-Insert). */
async function setThemenZuordnung(
  supabase: Awaited<ReturnType<typeof createClient>>,
  karteikarteId: string,
  themenIds: string[]
): Promise<{ error: string } | { success: true }> {
  const { error: deleteError } = await supabase
    .from("karteikarten_themen")
    .delete()
    .eq("karteikarte_id", karteikarteId);
  if (deleteError) return { error: CONNECTION_ERROR };

  if (themenIds.length === 0) return { success: true };

  const { error: insertError } = await supabase
    .from("karteikarten_themen")
    .insert(themenIds.map((thema_id) => ({ karteikarte_id: karteikarteId, thema_id })));
  if (insertError) return { error: CONNECTION_ERROR };

  return { success: true };
}

export async function createKarteikarte(
  values: KarteikarteFormValues
): Promise<{ error: string } | { karte: Karteikarte }> {
  const parsed = karteikarteSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: CONNECTION_ERROR };

  const bewertung = Number(parsed.data.bewertung) as Bewertung;
  const heute = heuteISO();
  const intervall = berechneNaechstesIntervall(bewertung, null);
  const wdhDatum = naechsteFaelligkeit(heute, intervall);

  try {
    const { data, error } = await supabase
      .from("karteikarten")
      .insert({
        user_id: user.id,
        fach_id: parsed.data.fachId,
        typ: parsed.data.typ,
        frage: parsed.data.frage,
        quelle: parsed.data.quelle,
        fehlernotiz: parsed.data.fehlernotiz,
        bewertung,
        intervall,
        wdh_anzahl: 1,
        wdh_datum: wdhDatum,
      })
      .select(KARTE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const zuordnung = await setThemenZuordnung(supabase, data.id, parsed.data.themenIds);
    if ("error" in zuordnung) return zuordnung;

    const { error: reviewError } = await supabase.from("karteikarten_reviews").insert({
      user_id: user.id,
      karteikarte_id: data.id,
      bewertung,
      intervall_danach: intervall,
    });
    if (reviewError) return { error: CONNECTION_ERROR };

    revalidatePath("/karteikarten");
    return { karte: toKarteikarte(data, parsed.data.themenIds) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

/**
 * Einzige Stelle, die eine Selbsteinschätzung entgegennimmt und den
 * Intervall-Algorithmus anwendet — genutzt von der Listenansicht, der
 * Fokuseinheit UND (intern) von `updateKarteikarte`, wenn die Bewertung im
 * Bearbeiten-Formular geändert wurde. Siehe Tech Design.
 */
export async function bewerteKarteikarte(
  id: string,
  bewertungInput: number,
  neueFehlernotiz?: string
): Promise<{ error: string } | { karte: Karteikarte }> {
  if (!GUELTIGE_BEWERTUNGEN.includes(bewertungInput)) {
    return { error: "Ungültige Bewertung" };
  }
  const bewertung = bewertungInput as Bewertung;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: CONNECTION_ERROR };

  try {
    const { data: current, error: fetchError } = await supabase
      .from("karteikarten")
      .select("intervall, fehlernotiz, wdh_anzahl")
      .eq("id", id)
      .single();
    if (fetchError || !current) return { error: CONNECTION_ERROR };

    const heute = heuteISO();
    const neuesIntervall = berechneNaechstesIntervall(bewertung, Number(current.intervall));
    const neuesWdhDatum = naechsteFaelligkeit(heute, neuesIntervall);
    const fehlernotiz = neueFehlernotiz !== undefined ? neueFehlernotiz : current.fehlernotiz;

    const { data, error } = await supabase
      .from("karteikarten")
      .update({
        bewertung,
        intervall: neuesIntervall,
        wdh_datum: neuesWdhDatum,
        wdh_anzahl: current.wdh_anzahl + 1,
        fehlernotiz,
      })
      .eq("id", id)
      .select(KARTE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const { error: reviewError } = await supabase.from("karteikarten_reviews").insert({
      user_id: user.id,
      karteikarte_id: id,
      bewertung,
      intervall_danach: neuesIntervall,
    });
    if (reviewError) return { error: CONNECTION_ERROR };

    const { data: themenRows } = await supabase
      .from("karteikarten_themen")
      .select("thema_id")
      .eq("karteikarte_id", id);
    const themenIds = (themenRows ?? []).map((row: { thema_id: string }) => row.thema_id);

    revalidatePath("/karteikarten");
    return { karte: toKarteikarte(data, themenIds) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function updateKarteikarte(
  id: string,
  values: KarteikarteFormValues
): Promise<{ error: string } | { karte: Karteikarte }> {
  const parsed = karteikarteSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: CONNECTION_ERROR };

  const neueBewertung = Number(parsed.data.bewertung) as Bewertung;

  try {
    const { data: current, error: fetchError } = await supabase
      .from("karteikarten")
      .select("bewertung")
      .eq("id", id)
      .single();
    if (fetchError || !current) return { error: CONNECTION_ERROR };

    const { error: updateError } = await supabase
      .from("karteikarten")
      .update({
        fach_id: parsed.data.fachId,
        typ: parsed.data.typ,
        frage: parsed.data.frage,
        quelle: parsed.data.quelle,
        fehlernotiz: parsed.data.fehlernotiz,
      })
      .eq("id", id);
    if (updateError) return { error: CONNECTION_ERROR };

    const zuordnung = await setThemenZuordnung(supabase, id, parsed.data.themenIds);
    if ("error" in zuordnung) return zuordnung;

    if (current.bewertung !== neueBewertung) {
      const bewertetResult = await bewerteKarteikarte(id, neueBewertung);
      if ("error" in bewertetResult) return bewertetResult;
      revalidatePath("/karteikarten");
      return { karte: { ...bewertetResult.karte, themenIds: parsed.data.themenIds } };
    }

    const { data, error } = await supabase.from("karteikarten").select(KARTE_SELECT).eq("id", id).single();
    if (error || !data) return { error: CONNECTION_ERROR };

    revalidatePath("/karteikarten");
    return { karte: toKarteikarte(data, parsed.data.themenIds) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function deleteKarteikarte(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("karteikarten").delete().eq("id", id);
    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/karteikarten");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}
