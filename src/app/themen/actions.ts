"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { KLAUSURRELEVANZ_OPTIONEN, type Klausurrelevanz, type Thema } from "@/lib/klausurtage";
import { neuesThemaSchema, themaNameSchema } from "@/lib/schemas/thema";

const CONNECTION_ERROR =
  "Verbindung fehlgeschlagen, bitte später erneut versuchen";
const UNIQUE_VIOLATION = "23505";

type ThemaRow = {
  id: string;
  fach_id: string;
  name: string;
  klausurrelevanz: Klausurrelevanz;
};

function toThema(row: ThemaRow): Thema {
  return {
    id: row.id,
    fachId: row.fach_id,
    name: row.name,
    klausurrelevanz: row.klausurrelevanz,
  };
}

async function fachName(fachId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faecher")
    .select("name")
    .eq("id", fachId)
    .single();
  return data?.name ?? "diesem Fach";
}

export async function addThema(
  fachId: string,
  name: string
): Promise<{ error: string } | { thema: Thema }> {
  const parsed = neuesThemaSchema.safeParse({ fachId, name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: CONNECTION_ERROR };
  }

  try {
    const { data, error } = await supabase
      .from("themen")
      .insert({
        fach_id: parsed.data.fachId,
        name: parsed.data.name,
        user_id: user.id,
      })
      .select("id, fach_id, name, klausurrelevanz")
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return {
          error: `Dieses Thema existiert bereits in ${await fachName(parsed.data.fachId)}`,
        };
      }
      return { error: CONNECTION_ERROR };
    }

    revalidatePath("/themen");
    return { thema: toThema(data) };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function renameThema(
  id: string,
  newName: string
): Promise<{ error: string } | { success: true }> {
  const parsed = themaNameSchema.safeParse(newName);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültiger Themenname" };
  }

  const supabase = await createClient();

  try {
    const { data: existing } = await supabase
      .from("themen")
      .select("fach_id")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("themen")
      .update({ name: parsed.data })
      .eq("id", id);

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return {
          error: `Dieses Thema existiert bereits in ${
            existing ? await fachName(existing.fach_id) : "diesem Fach"
          }`,
        };
      }
      return { error: CONNECTION_ERROR };
    }

    revalidatePath("/themen");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function changeKlausurrelevanz(
  id: string,
  value: Klausurrelevanz
): Promise<{ error: string } | { success: true }> {
  const isValid = KLAUSURRELEVANZ_OPTIONEN.some((o) => o.value === value);
  if (!isValid) {
    return { error: "Ungültige Klausurrelevanz" };
  }

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("themen")
      .update({ klausurrelevanz: value })
      .eq("id", id);

    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/themen");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}

export async function deleteThema(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from("themen").delete().eq("id", id);
    if (error) return { error: CONNECTION_ERROR };

    revalidatePath("/themen");
    return { success: true };
  } catch {
    return { error: CONNECTION_ERROR };
  }
}
