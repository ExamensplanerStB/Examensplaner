import { WiederholungsplanManager } from "@/components/wiederholungsplan/wiederholungsplan-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Karteikarte, KarteikartenTyp } from "@/lib/karteikarten";
import type { Bewertung, Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import { createClient } from "@/lib/supabase/server";

/**
 * Lädt live aus den bereits produktiven Tabellen von PROJ-3/4/5 — keine
 * eigene Tabelle, kein Platzhalter-State (siehe PROJ-7 Tech Design: reine
 * Aggregationsansicht über bereits bestehende, RLS-geschützte Daten).
 */
export default async function WiederholungsplanPage() {
  const supabase = await createClient();

  const [
    { data: faecher },
    { data: themen },
    { data: karten },
    { data: kartenThemen },
    { data: aufgaben },
    { data: aufgabenThemen },
    { data: reviews },
    { data: klausuren },
    { data: teile },
    { data: teileThemen },
  ] = await Promise.all([
    supabase.from("faecher").select("id, kuerzel, name, klausurtag").order("name"),
    supabase.from("themen").select("id, fach_id, name, klausurrelevanz").order("name"),
    supabase
      .from("karteikarten")
      .select("id, fach_id, typ, frage, quelle, fehlernotiz, bewertung, intervall, wdh_anzahl, wdh_datum, created_at")
      .order("wdh_datum"),
    supabase.from("karteikarten_themen").select("karteikarte_id, thema_id"),
    supabase
      .from("uebungsaufgaben")
      .select("id, fach_id, titel, quelle, pflicht_wdh_datum, wdh_anzahl, created_at")
      .order("pflicht_wdh_datum"),
    supabase.from("uebungsaufgaben_themen").select("uebungsaufgabe_id, thema_id"),
    supabase
      .from("uebungsaufgaben_reviews")
      .select("id, uebungsaufgabe_id, datum, fachlich, klausurtechnik, fehlernotiz")
      .order("datum"),
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

  const themenIdsByTeil = new Map<string, string[]>();
  (teileThemen ?? []).forEach((row) => {
    const liste = themenIdsByTeil.get(row.teil_id) ?? [];
    liste.push(row.thema_id);
    themenIdsByTeil.set(row.teil_id, liste);
  });
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
        <header className="space-y-1">
          <h1 className="text-3xl text-foreground sm:text-4xl">Wiederholungsplan</h1>
          <p className="text-sm text-muted-foreground">
            Fällige und geplante Wiederholungen aus Karteikarten, Übungsaufgaben und
            Probeklausuren — hub-übergreifend an einer Stelle.
          </p>
        </header>
        <WiederholungsplanManager
          klausurtage={klausurtage}
          themen={initialThemen}
          initialKarten={initialKarten}
          initialAufgaben={initialAufgaben}
          initialReviews={initialReviews}
          initialKlausuren={initialKlausuren}
          initialTeile={initialTeile}
        />
      </div>
    </main>
  );
}
