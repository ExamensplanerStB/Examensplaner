import Link from "next/link";

import { Button } from "@/components/ui/button";
import { KarteikartenManager } from "@/components/karteikarten/karteikarten-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Karteikarte, KarteikartenTyp } from "@/lib/karteikarten";
import { createClient } from "@/lib/supabase/server";

export default async function KarteikartenPage() {
  const supabase = await createClient();

  const [{ data: faecher }, { data: themen }, { data: karten }, { data: kartenThemen }] = await Promise.all([
    supabase.from("faecher").select("id, kuerzel, name, klausurtag").order("name"),
    supabase.from("themen").select("id, fach_id, name, klausurrelevanz").order("name"),
    supabase
      .from("karteikarten")
      .select("id, fach_id, typ, frage, quelle, fehlernotiz, bewertung, intervall, wdh_anzahl, wdh_datum, created_at")
      .order("wdh_datum"),
    supabase.from("karteikarten_themen").select("karteikarte_id, thema_id"),
  ]);

  const klausurtage = groupFaecherByKlausurtag((faecher ?? []) as Fach[]);
  const initialThemen: Thema[] = (themen ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    name: row.name,
    klausurrelevanz: row.klausurrelevanz,
  }));

  const themenIdsByKarte = new Map<string, string[]>();
  (kartenThemen ?? []).forEach((row) => {
    const liste = themenIdsByKarte.get(row.karteikarte_id) ?? [];
    liste.push(row.thema_id);
    themenIdsByKarte.set(row.karteikarte_id, liste);
  });

  const initialKarten: Karteikarte[] = (karten ?? []).map((row) => ({
    id: row.id,
    fachId: row.fach_id,
    typ: row.typ as KarteikartenTyp,
    themenIds: themenIdsByKarte.get(row.id) ?? [],
    frage: row.frage,
    quelle: row.quelle,
    fehlernotiz: row.fehlernotiz,
    bewertung: row.bewertung,
    intervall: Number(row.intervall),
    wdhAnzahl: row.wdh_anzahl,
    wdhDatum: row.wdh_datum,
    createdAt: row.created_at,
  }));

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl text-foreground sm:text-4xl">Karteikarten</h1>
            <p className="text-sm text-muted-foreground">
              Spaced Repetition für Theorie und Klausurtechnik — abrufen, aufdecken, einschätzen.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/themen">Themen verwalten</Link>
          </Button>
        </header>
        <KarteikartenManager
          klausurtage={klausurtage}
          initialThemen={initialThemen}
          initialKarten={initialKarten}
        />
      </div>
    </main>
  );
}
