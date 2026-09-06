import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UebungsaufgabenManager } from "@/components/uebungsaufgaben/uebungsaufgaben-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Bewertung, Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import { createClient } from "@/lib/supabase/server";

export default async function UebungsaufgabenPage() {
  const supabase = await createClient();

  const [{ data: faecher }, { data: themen }, { data: aufgaben }, { data: aufgabenThemen }, { data: reviews }] =
    await Promise.all([
      supabase.from("faecher").select("id, kuerzel, name, klausurtag").order("name"),
      supabase.from("themen").select("id, fach_id, name, klausurrelevanz").order("name"),
      supabase
        .from("uebungsaufgaben")
        .select("id, fach_id, titel, quelle, pflicht_wdh_datum, wdh_anzahl, created_at")
        .order("pflicht_wdh_datum"),
      supabase.from("uebungsaufgaben_themen").select("uebungsaufgabe_id, thema_id"),
      supabase
        .from("uebungsaufgaben_reviews")
        .select("id, uebungsaufgabe_id, datum, fachlich, klausurtechnik, fehlernotiz")
        .order("datum"),
    ]);

  const klausurtage = groupFaecherByKlausurtag((faecher ?? []) as Fach[]);
  const initialThemen: Thema[] = (themen ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    name: row.name,
    klausurrelevanz: row.klausurrelevanz,
  }));

  const themenIdsByAufgabe = new Map<string, string[]>();
  (aufgabenThemen ?? []).forEach((row) => {
    const liste = themenIdsByAufgabe.get(row.uebungsaufgabe_id) ?? [];
    liste.push(row.thema_id);
    themenIdsByAufgabe.set(row.uebungsaufgabe_id, liste);
  });

  const initialAufgaben: Uebungsaufgabe[] = (aufgaben ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    themenIds: themenIdsByAufgabe.get(row.id) ?? [],
    titel: row.titel,
    quelle: row.quelle,
    pflichtWdhDatum: row.pflicht_wdh_datum,
    wdhAnzahl: row.wdh_anzahl,
    createdAt: row.created_at,
  }));

  const initialReviews: UebungsaufgabeReview[] = (reviews ?? []).map((row) => ({
    id: row.id,
    uebungsaufgabeId: row.uebungsaufgabe_id,
    datum: String(row.datum).slice(0, 10),
    fachlich: row.fachlich as Bewertung,
    klausurtechnik: row.klausurtechnik as Bewertung,
    fehlernotiz: row.fehlernotiz,
  }));

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
