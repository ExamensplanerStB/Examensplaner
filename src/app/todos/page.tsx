import { AufgabenManager } from "@/components/aufgaben/aufgaben-manager";
import type {
  Aufgabe,
  EigeneKategorie,
  Prioritaet,
  Zeittyp,
} from "@/lib/aufgaben";
import { createClient } from "@/lib/supabase/server";

function kuerzeZeit(zeit: string | null): string | null {
  return zeit ? zeit.slice(0, 5) : null;
}

export default async function TodosPage() {
  const supabase = await createClient();

  const [{ data: aufgabenRows }, { data: kategorienRows }] = await Promise.all([
    supabase
      .from("aufgaben")
      .select(
        "id, titel, datum, zeittyp, start_zeit, end_zeit, kategorie_id, prioritaet, erledigt, im_kalender, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("aufgaben_kategorien").select("id, name, farbe").order("name"),
  ]);

  const initialAufgaben: Aufgabe[] = (aufgabenRows ?? []).map((row) => ({
    id: row.id,
    titel: row.titel,
    datum: row.datum,
    zeittyp: row.zeittyp as Zeittyp | null,
    startZeit: kuerzeZeit(row.start_zeit),
    endZeit: kuerzeZeit(row.end_zeit),
    kategorieId: row.kategorie_id,
    prioritaet: row.prioritaet as Prioritaet,
    erledigt: row.erledigt,
    imKalender: row.im_kalender,
    createdAt: row.created_at,
  }));

  const initialEigeneKategorien: EigeneKategorie[] = (kategorienRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    farbe: row.farbe,
  }));

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl text-foreground sm:text-4xl">Todo-Liste</h1>
          <p className="text-sm text-muted-foreground">
            Aufgaben und Fristen für die Examensvorbereitung — mit Datum, Priorität und Kategorie.
          </p>
        </header>
        <AufgabenManager initialAufgaben={initialAufgaben} initialEigeneKategorien={initialEigeneKategorien} />
      </div>
    </main>
  );
}
