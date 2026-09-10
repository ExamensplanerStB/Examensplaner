"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { CONNECTION_ERROR, type Klausur, type KlausurTeil } from "@/lib/klausuren";
import { klausurSchema, type KlausurFormValues, type TeilFormValues } from "@/lib/schemas/klausur";

const KLAUSUR_SELECT =
  "id, bezeichnung, datum, quelle, note, stufe1_text, stufe2_text, nachschreiben_erledigt, created_at";
const TEIL_SELECT = "id, klausur_id, fach_id, max_punkte, erreichte_punkte";

type KlausurRow = {
  id: string;
  bezeichnung: string;
  datum: string;
  quelle: string;
  note: string;
  stufe1_text: string;
  stufe2_text: string;
  nachschreiben_erledigt: boolean;
  created_at: string;
};

type TeilRow = {
  id: string;
  klausur_id: string;
  fach_id: string;
  max_punkte: number | null;
  erreichte_punkte: number | null;
};

function toKlausur(row: KlausurRow): Klausur {
  return {
    id: row.id,
    bezeichnung: row.bezeichnung,
    datum: row.datum,
    quelle: row.quelle,
    note: row.note,
    stufe1Text: row.stufe1_text,
    stufe2Text: row.stufe2_text,
    nachschreibenErledigt: row.nachschreiben_erledigt,
    createdAt: row.created_at,
  };
}

function toTeil(row: TeilRow, themenIds: string[]): KlausurTeil {
  return {
    id: row.id,
    klausurId: row.klausur_id,
    fachId: row.fach_id,
    themenIds,
    maxPunkte: row.max_punkte === null ? null : Number(row.max_punkte),
    erreichtePunkte: row.erreichte_punkte === null ? null : Number(row.erreichte_punkte),
  };
}

/**
 * Legt alle Teile einer Klausur neu an (Batch-Insert), inkl. ihrer
 * Themenzuordnung. Wird sowohl beim Anlegen als auch beim Bearbeiten
 * verwendet — bei Bearbeiten werden vorher alle bisherigen Teile gelöscht
 * (Delete-then-Insert, analog Themen-Zuordnung in PROJ-3/4).
 */
async function insertTeile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  klausurId: string,
  teileValues: TeilFormValues[]
): Promise<{ error: string } | { teile: KlausurTeil[] }> {
  const { data: insertedTeile, error } = await supabase
    .from("klausur_teile")
    .insert(
      teileValues.map((t) => ({
        klausur_id: klausurId,
        fach_id: t.fachId,
        max_punkte: t.maxPunkte === "" ? null : Number(t.maxPunkte),
        erreichte_punkte: t.erreichtePunkte === "" ? null : Number(t.erreichtePunkte),
      }))
    )
    .select(TEIL_SELECT);
  if (error || !insertedTeile) return { error: CONNECTION_ERROR };

  const themenRows = insertedTeile.flatMap((row: TeilRow, i: number) =>
    teileValues[i].themenIds.map((thema_id) => ({ teil_id: row.id, thema_id }))
  );
  if (themenRows.length > 0) {
    const { error: themenError } = await supabase.from("klausur_teile_themen").insert(themenRows);
    if (themenError) return { error: CONNECTION_ERROR };
  }

  const teile = insertedTeile.map((row: TeilRow, i: number) => toTeil(row, teileValues[i].themenIds));
  return { teile };
}

export async function createKlausur(
  values: KlausurFormValues
): Promise<{ error: string } | { klausur: Klausur; teile: KlausurTeil[] }> {
  const parsed = klausurSchema.safeParse(values);
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
      .from("klausuren")
      .insert({
        user_id: user.id,
        bezeichnung: parsed.data.bezeichnung,
        datum: parsed.data.datum,
        quelle: parsed.data.quelle,
        note: parsed.data.note,
        stufe1_text: parsed.data.stufe1Text,
        stufe2_text: parsed.data.stufe2Text,
        nachschreiben_erledigt: false,
      })
      .select(KLAUSUR_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const teileResult = await insertTeile(supabase, data.id, parsed.data.teile);
    if ("error" in teileResult) return teileResult;

    revalidatePath("/probeklausuren");
    return { klausur: toKlausur(data), teile: teileResult.teile };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function updateKlausur(
  id: string,
  values: KlausurFormValues
): Promise<{ error: string } | { klausur: Klausur; teile: KlausurTeil[] }> {
  const parsed = klausurSchema.safeParse(values);
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
      .from("klausuren")
      .update({
        bezeichnung: parsed.data.bezeichnung,
        datum: parsed.data.datum,
        quelle: parsed.data.quelle,
        note: parsed.data.note,
        stufe1_text: parsed.data.stufe1Text,
        stufe2_text: parsed.data.stufe2Text,
      })
      .eq("id", id)
      .select(KLAUSUR_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    const { error: deleteError } = await supabase.from("klausur_teile").delete().eq("klausur_id", id);
    if (deleteError) return { error: CONNECTION_ERROR };

    const teileResult = await insertTeile(supabase, id, parsed.data.teile);
    if ("error" in teileResult) return teileResult;

    revalidatePath("/probeklausuren");
    return { klausur: toKlausur(data), teile: teileResult.teile };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function markiereNachschreibenErledigt(
  id: string
): Promise<{ error: string } | { klausur: Klausur }> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("klausuren")
      .update({ nachschreiben_erledigt: true })
      .eq("id", id)
      .select(KLAUSUR_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    revalidatePath("/probeklausuren");
    // Auch den Wiederholungsplan (PROJ-7) invalidieren, der dieselbe Aktion
    // wiederverwendet — sonst zeigt ein erneuter Aufruf dort einen veralteten
    // Stand, bis die Cache-Zeit abläuft.
    revalidatePath("/wiederholungsplan");
    return { klausur: toKlausur(data) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function deleteKlausur(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("klausuren").delete().eq("id", id);
    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/probeklausuren");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}
