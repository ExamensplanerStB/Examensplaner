"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  CONNECTION_ERROR,
  type Aufgabe,
  type EigeneKategorie,
  type Prioritaet,
  type Zeittyp,
} from "@/lib/aufgaben";
import {
  aufgabeSchema,
  eigeneKategorieSchema,
  type AufgabeFormValues,
} from "@/lib/schemas/aufgabe";

const UNIQUE_VIOLATION = "23505";

const AUFGABE_SELECT =
  "id, titel, datum, zeittyp, start_zeit, end_zeit, kategorie_id, prioritaet, erledigt, im_kalender, created_at";
const KATEGORIE_SELECT = "id, name, farbe";

type AufgabeRow = {
  id: string;
  titel: string;
  datum: string | null;
  zeittyp: Zeittyp | null;
  start_zeit: string | null;
  end_zeit: string | null;
  kategorie_id: string | null;
  prioritaet: Prioritaet;
  erledigt: boolean;
  im_kalender: boolean;
  created_at: string;
};

type KategorieRow = { id: string; name: string; farbe: string };

/** Postgres "time"-Spalten liefern "HH:MM:SS" — Formular/Anzeige nutzen "HH:MM". */
function kuerzeZeit(zeit: string | null): string | null {
  return zeit ? zeit.slice(0, 5) : null;
}

function toAufgabe(row: AufgabeRow): Aufgabe {
  return {
    id: row.id,
    titel: row.titel,
    datum: row.datum,
    zeittyp: row.zeittyp,
    startZeit: kuerzeZeit(row.start_zeit),
    endZeit: kuerzeZeit(row.end_zeit),
    kategorieId: row.kategorie_id,
    prioritaet: row.prioritaet,
    erledigt: row.erledigt,
    imKalender: row.im_kalender,
    createdAt: row.created_at,
  };
}

function toEigeneKategorie(row: KategorieRow): EigeneKategorie {
  return { id: row.id, name: row.name, farbe: row.farbe };
}

/**
 * Wandelt die Formularwerte in Spalten um — insbesondere das einzelne
 * `kategorie`-Feld ("keine" | `eigene:<id>`) in die Kategorie-Spalte (siehe
 * Tech Design).
 */
function werteZuSpalten(values: AufgabeFormValues) {
  const datum = values.datum || null;
  const zeittyp: Zeittyp | null = datum ? (values.zeittyp === "zeitslot" ? "zeitslot" : "ganztag") : null;
  const istZeitslot = zeittyp === "zeitslot";

  return {
    titel: values.titel.trim(),
    datum,
    zeittyp,
    start_zeit: istZeitslot ? values.startZeit : null,
    end_zeit: istZeitslot ? values.endZeit : null,
    kategorie_id: values.kategorie.startsWith("eigene:") ? values.kategorie.slice(7) : null,
    prioritaet: values.prioritaet,
    im_kalender: values.imKalender,
  };
}

export async function createAufgabe(
  values: AufgabeFormValues
): Promise<{ error: string } | { aufgabe: Aufgabe }> {
  const parsed = aufgabeSchema.safeParse(values);
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
      .from("aufgaben")
      .insert({ user_id: user.id, erledigt: false, ...werteZuSpalten(parsed.data) })
      .select(AUFGABE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    revalidatePath("/todos");
    return { aufgabe: toAufgabe(data) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function updateAufgabe(
  id: string,
  values: AufgabeFormValues
): Promise<{ error: string } | { aufgabe: Aufgabe }> {
  const parsed = aufgabeSchema.safeParse(values);
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
      .from("aufgaben")
      .update(werteZuSpalten(parsed.data))
      .eq("id", id)
      .select(AUFGABE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    revalidatePath("/todos");
    return { aufgabe: toAufgabe(data) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function setAufgabeErledigt(
  id: string,
  erledigt: boolean
): Promise<{ error: string } | { aufgabe: Aufgabe }> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("aufgaben")
      .update({ erledigt })
      .eq("id", id)
      .select(AUFGABE_SELECT)
      .single();
    if (error || !data) return { error: CONNECTION_ERROR };

    revalidatePath("/todos");
    return { aufgabe: toAufgabe(data) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function deleteAufgabe(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("aufgaben").delete().eq("id", id);
    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/todos");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

/**
 * Legt eine eigene Kategorie an — bei einem Namen, der (groß-/klein-
 * schreibungsunabhängig) bereits existiert, wird keine Dublette angelegt,
 * sondern die bestehende Kategorie zurückgegeben (siehe Spec, AC Kategorie).
 */
export async function createEigeneKategorie(
  name: string,
  farbe: string
): Promise<{ error: string } | { kategorie: EigeneKategorie }> {
  const parsed = eigeneKategorieSchema.safeParse({ name, farbe });
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
      .from("aufgaben_kategorien")
      .insert({ user_id: user.id, name: parsed.data.name, farbe: parsed.data.farbe })
      .select(KATEGORIE_SELECT)
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        const { data: alle, error: fetchError } = await supabase
          .from("aufgaben_kategorien")
          .select(KATEGORIE_SELECT)
          .eq("user_id", user.id);
        if (fetchError) return { error: CONNECTION_ERROR };
        const bestehend = (alle ?? []).find(
          (row: KategorieRow) => row.name.toLowerCase() === parsed.data.name.toLowerCase()
        );
        if (!bestehend) return { error: CONNECTION_ERROR };
        return { kategorie: toEigeneKategorie(bestehend) };
      }
      return { error: CONNECTION_ERROR };
    }
    if (!data) return { error: CONNECTION_ERROR };

    revalidatePath("/todos");
    return { kategorie: toEigeneKategorie(data) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

/**
 * Löscht eine eigene Kategorie. Aufgaben, die dieser Kategorie zugeordnet
 * waren, bleiben erhalten — die Zuordnung wird per "on delete set null"
 * auf `aufgaben.kategorie_id` automatisch von der Datenbank entfernt, kein
 * zusätzlicher Anwendungscode nötig (siehe Tech Design, Refine 2026-09-10).
 */
export async function deleteEigeneKategorie(id: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("aufgaben_kategorien").delete().eq("id", id);
    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/todos");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}
