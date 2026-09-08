import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProbeklausurenManager } from "@/components/probeklausuren/probeklausuren-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import { createClient } from "@/lib/supabase/server";

export default async function ProbeklausurenPage() {
  const supabase = await createClient();

  const [{ data: faecher }, { data: themen }, { data: klausuren }, { data: teile }, { data: teileThemen }] =
    await Promise.all([
      supabase.from("faecher").select("id, kuerzel, name, klausurtag").order("name"),
      supabase.from("themen").select("id, fach_id, name, klausurrelevanz").order("name"),
      supabase
        .from("klausuren")
        .select("id, bezeichnung, datum, quelle, note, stufe1_text, stufe2_text, nachschreiben_erledigt, created_at")
        .order("datum", { ascending: false }),
      supabase.from("klausur_teile").select("id, klausur_id, fach_id, max_punkte, erreichte_punkte"),
      supabase.from("klausur_teile_themen").select("teil_id, thema_id"),
    ]);

  const klausurtage = groupFaecherByKlausurtag((faecher ?? []) as Fach[]);
  const initialThemen: Thema[] = (themen ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    name: row.name,
    klausurrelevanz: row.klausurrelevanz,
  }));

  const themenIdsByTeil = new Map<string, string[]>();
  (teileThemen ?? []).forEach((row) => {
    const liste = themenIdsByTeil.get(row.teil_id) ?? [];
    liste.push(row.thema_id);
    themenIdsByTeil.set(row.teil_id, liste);
  });

  const initialKlausuren: Klausur[] = (klausuren ?? []).map((row) => ({
    id: row.id,
    bezeichnung: row.bezeichnung,
    datum: row.datum,
    quelle: row.quelle,
    note: row.note,
    stufe1Text: row.stufe1_text,
    stufe2Text: row.stufe2_text,
    nachschreibenErledigt: row.nachschreiben_erledigt,
    createdAt: row.created_at,
  }));

  const initialTeile: KlausurTeil[] = (teile ?? []).map((row) => ({
    id: row.id,
    klausurId: row.klausur_id,
    fachId: row.fach_id,
    themenIds: themenIdsByTeil.get(row.id) ?? [],
    maxPunkte: row.max_punkte === null ? null : Number(row.max_punkte),
    erreichtePunkte: row.erreichte_punkte === null ? null : Number(row.erreichte_punkte),
  }));

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl text-foreground sm:text-4xl">Probeklausuren</h1>
            <p className="text-sm text-muted-foreground">
              Klausuren erfassen, Drei-Stufen-Nacharbeit durchlaufen — fachlich, analytisch,
              stichprobenartig nachschreiben.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/themen">Themen verwalten</Link>
          </Button>
        </header>
        <ProbeklausurenManager
          klausurtage={klausurtage}
          initialThemen={initialThemen}
          initialKlausuren={initialKlausuren}
          initialTeile={initialTeile}
        />
      </div>
    </main>
  );
}
