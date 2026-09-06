import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UebungsaufgabenManager } from "@/components/uebungsaufgaben/uebungsaufgaben-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import { createClient } from "@/lib/supabase/server";

export default async function UebungsaufgabenPage() {
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

  // Die "uebungsaufgaben"-/"uebungsaufgaben_reviews"-Tabellen existieren erst
  // nach /backend — bis dahin startet die Liste clientseitig leer.
  const initialAufgaben: Uebungsaufgabe[] = [];
  const initialReviews: UebungsaufgabeReview[] = [];

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl text-foreground sm:text-4xl">Übungsaufgaben</h1>
            <p className="text-sm text-muted-foreground">
              Extern gelöste Aufgaben erfassen, fachlich und klausurtechnisch bewerten —
              gezielt nacharbeiten statt vergessen.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/themen">Themen verwalten</Link>
          </Button>
        </header>
        <UebungsaufgabenManager
          klausurtage={klausurtage}
          initialThemen={initialThemen}
          initialAufgaben={initialAufgaben}
          initialReviews={initialReviews}
        />
      </div>
    </main>
  );
}
