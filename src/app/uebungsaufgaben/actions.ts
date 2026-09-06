"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  CONNECTION_ERROR,
  type Bewertung,
  type Uebungsaufgabe,
  type UebungsaufgabeReview,
} from "@/lib/uebungsaufgaben";
import { heuteISO, naechstePflichtWdh, worst } from "@/lib/uebungsaufgaben-wiederholung";
import {
  uebungsaufgabeSchema,
  type UebungsaufgabeFormValues,
} from "@/lib/schemas/uebungsaufgabe";

const GUELTIGE_BEWERTUNGEN = [1, 2, 3, 4, 5];

const AUFGABE_SELECT = "id, fach_id, titel, quelle, pflicht_wdh_datum, wdh_anzahl, created_at";

type AufgabeRow = {
  id: string;
  fach_id: string;
  titel: string;
  quelle: string;
  pflicht_wdh_datum: string | null;
  wdh_anzahl: number;
  created_at: string;
};

type ReviewRow = {
  id: string;
  uebungsaufgabe_id: string;
  datum: string;
  fachlich: number;
  klausurtechnik: number;
  fehlernotiz: string;
};

function toUebungsaufgabe(row: AufgabeRow, themenIds: string[]): Uebungsaufgabe {
  return {
    id: row.id,
    fachId: row.fach_id,
    themenIds,
    titel: row.titel,
    quelle: row.quelle,
    pflichtWdhDatum: row.pflicht_wdh_datum,
    wdhAnzahl: row.wdh_anzahl,
    createdAt: row.created_at,
  };
}

function toReview(row: ReviewRow): UebungsaufgabeReview {
  return {
    id: row.id,
    uebungsaufgabeId: row.uebungsaufgabe_id,
    // Nur der Datumsanteil wird für die Wiederholungslogik gebraucht (siehe
    // uebungsaufgaben-wiederholung.ts) — die Spalte selbst bleibt timestamptz
    // für eine verlässliche chronologische Reihenfolge in der DB.
    datum: row.datum.slice(0, 10),
    fachlich: row.fachlich as Bewertung,
    klausurtechnik: row.klausurtechnik as Bewertung,
    fehlernotiz: row.fehlernotiz,
  };
}

/** Ersetzt die Themenzuordnung einer Aufgabe vollständig (Delete-then-Insert), analog PROJ-3. */
async function setThemenZuordnung(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uebungsaufgabeId: string,
  themenIds: string[]
): Promise<{ error: string } | { success: true }> {
  const { error: deleteError } = await supabase
    .from("uebungsaufgaben_themen")
    .delete()
    .eq("uebungsaufgabe_id", uebungsaufgabeId);
  if (deleteError) return { error: CONNECTION_ERROR };

  if (themenIds.length === 0) return { success: true };

  const { error: insertError } = await supabase
    .from("uebungsaufgaben_themen")
    .insert(themenIds.map((thema_id) => ({ uebungsaufgabe_id: uebungsaufgabeId, thema_id })));
  if (insertError) return { error: CONNECTION_ERROR };

  return { success: true };
}

export async function createUebungsaufgabe(
  values: UebungsaufgabeFormValues
): Promise<{ error: string } | { aufgabe: Uebungsaufgabe }> {
  const parsed = uebungsaufgabeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: CONNECTION_ERROR };

  try {
    const { data, error } = await supabase
      .from("uebungsaufgaben")
      .insert({
        user_id: user.id,
        fach_id: parsed.data.fachId,
        titel: parsed.data.titel,
        quelle: parsed.data.quelle,
        pflicht_wdh_datum: null,
        wdh_anzahl: 0,
      })
      .select(AUFGABE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const zuordnung = await setThemenZuordnung(supabase, data.id, parsed.data.themenIds);
    if ("error" in zuordnung) return zuordnung;

    revalidatePath("/uebungsaufgaben");
    return { aufgabe: toUebungsaufgabe(data, parsed.data.themenIds) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function updateUebungsaufgabe(
  id: string,
  values: UebungsaufgabeFormValues
): Promise<{ error: string } | { aufgabe: Uebungsaufgabe }> {
  const parsed = uebungsaufgabeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: CONNECTION_ERROR };

  try {
    const { data, error } = await supabase
      .from("uebungsaufgaben")
      .update({
        fach_id: parsed.data.fachId,
        titel: parsed.data.titel,
        quelle: parsed.data.quelle,
      })
      .eq("id", id)
      .select(AUFGABE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const zuordnung = await setThemenZuordnung(supabase, id, parsed.data.themenIds);
    if ("error" in zuordnung) return zuordnung;

    revalidatePath("/uebungsaufgaben");
    return { aufgabe: toUebungsaufgabe(data, parsed.data.themenIds) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

/**
 * Einzige Stelle, die eine Bewertung entgegennimmt (siehe Tech Design):
 * berechnet `worst`, die nächste Pflicht-Wiederholung und protokolliert die
 * Bewertung unveränderlich in der Historie.
 */
export async function bewerteUebungsaufgabe(
  id: string,
  fachlichInput: number,
  klausurtechnikInput: number,
  fehlernotiz: string
): Promise<{ error: string } | { aufgabe: Uebungsaufgabe; review: UebungsaufgabeReview }> {
  if (!GUELTIGE_BEWERTUNGEN.includes(fachlichInput) || !GUELTIGE_BEWERTUNGEN.includes(klausurtechnikInput)) {
    return { error: "Ungültige Bewertung" };
  }
  const fachlich = fachlichInput as Bewertung;
  const klausurtechnik = klausurtechnikInput as Bewertung;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: CONNECTION_ERROR };

  try {
    const { data: current, error: fetchError } = await supabase
      .from("uebungsaufgaben")
      .select("wdh_anzahl")
      .eq("id", id)
      .single();
    if (fetchError || !current) return { error: CONNECTION_ERROR };

    const worstWert = worst(fachlich, klausurtechnik);
    const heute = heuteISO();
    const { pflichtWdhDatum } = naechstePflichtWdh(worstWert, current.wdh_anzahl, heute);

    const { data: reviewData, error: reviewError } = await supabase
      .from("uebungsaufgaben_reviews")
      .insert({
        user_id: user.id,
        uebungsaufgabe_id: id,
        fachlich,
        klausurtechnik,
        fehlernotiz,
      })
      .select("id, uebungsaufgabe_id, datum, fachlich, klausurtechnik, fehlernotiz")
      .single();
    if (reviewError || !reviewData) return { error: CONNECTION_ERROR };

    const { data, error } = await supabase
      .from("uebungsaufgaben")
      .update({
        pflicht_wdh_datum: pflichtWdhDatum,
        wdh_anzahl: current.wdh_anzahl + 1,
      })
      .eq("id", id)
      .select(AUFGABE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const { data: themenRows } = await supabase
      .from("uebungsaufgaben_themen")
      .select("thema_id")
      .eq("uebungsaufgabe_id", id);
    const themenIds = (themenRows ?? []).map((row: { thema_id: string }) => row.thema_id);

    revalidatePath("/uebungsaufgaben");
    return { aufgabe: toUebungsaufgabe(data, themenIds), review: toReview(reviewData) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function deleteUebungsaufgabe(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("uebungsaufgaben").delete().eq("id", id);
    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/uebungsaufgaben");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}
