import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProbeklausurenManager } from "@/components/probeklausuren/probeklausuren-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import { createClient } from "@/lib/supabase/server";

export default async function ProbeklausurenPage() {
  const supabase = await createClient();

  const [{ data: faecher }, { data: themen }] = await Promise.all([
    supabase.from("faecher").select("id, kuerzel, name, klausurtag").order("name"),
    supabase.from("themen").select("id, fach_id, name, klausurrelevanz").order("name"),
  ]);

  const klausurtage = groupFaecherByKlausurtag((faecher ?? []) as Fach[]);
  const initialThemen: Thema[] = (themen ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    name: row.name,
    klausurrelevanz: row.klausurrelevanz,
  }));

  // Die "klausuren"-/"klausur_teile"-/"klausur_teile_themen"-Tabellen
  // existieren erst nach /backend — bis dahin starten Liste/Teile
  // clientseitig leer.
  const initialKlausuren: Klausur[] = [];
  const initialTeile: KlausurTeil[] = [];

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
