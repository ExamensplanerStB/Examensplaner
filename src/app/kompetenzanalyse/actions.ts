"use server";

import { createClient } from "@/lib/supabase/server";
import { heuteISO, themenStufenVon, type KompetenzanalyseQuellen } from "@/lib/kompetenzanalyse";
import type { Thema } from "@/lib/klausurtage";

/**
 * Legt für jedes Thema genau einen Snapshot für den heutigen Tag in
 * `stufen_verlauf` an, falls noch keiner existiert (ON CONFLICT DO NOTHING
 * auf thema_id+datum, siehe Migration) — wiederholte Aufrufe am selben Tag
 * ändern nichts (PROJ-8 Edge Case "mehrmals am selben Tag").
 *
 * Wird direkt aus der Server Component beim Laden der Kompetenzanalyse
 * aufgerufen (kein Cron-Job, siehe Tech Design). Fehler werden bewusst
 * verschluckt: das Schreiben der Historie darf das Laden der Seite nie
 * blockieren oder sichtbar stören.
 */
export async function speichereStufenSnapshot(themen: Thema[], quellen: KompetenzanalyseQuellen): Promise<void> {
  if (themen.length === 0) return;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const heute = heuteISO();
    const alleThemenStufen = themenStufenVon(themen, quellen, heute);

    await supabase.from("stufen_verlauf").upsert(
      alleThemenStufen.map((ts) => ({
        user_id: user.id,
        thema_id: ts.thema.id,
        datum: heute,
        stufe: ts.stufe,
        basis_broeckelt: ts.basisBroeckelt,
      })),
      { onConflict: "thema_id,datum", ignoreDuplicates: true }
    );
  } catch {
    // Siehe Docstring: Snapshot-Schreiben darf den Seitenaufruf nie stören.
  }
}
