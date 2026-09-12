import { KompetenzanalyseManager } from "@/components/kompetenzanalyse/kompetenzanalyse-manager";
import { groupFaecherByKlausurtag, type Fach, type Thema } from "@/lib/klausurtage";
import type { Karteikarte, KarteikartenTyp } from "@/lib/karteikarten";
import type { Bewertung, Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import { CONNECTION_ERROR, type Stufe } from "@/lib/kompetenzanalyse";
import type { StufenSnapshot } from "@/lib/kalibrierung";
import { createClient } from "@/lib/supabase/server";

import { speichereStufenSnapshot } from "./actions";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl text-foreground sm:text-4xl">Kompetenzanalyse</h1>
          <p className="text-sm text-muted-foreground">
            Lernstand über alle vier Säulen — Fächer, Themen und Handlungsempfehlungen im Drilldown.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}

/**
 * Lädt live aus den bereits produktiven Tabellen von PROJ-2/3/4/5 — die
 * Stufe selbst wird bei jedem Laden aus den Rohdaten berechnet, keine eigene
 * Tabelle dafür (siehe Tech Design). Einzige Ausnahme: `stufen_verlauf`
 * (täglicher Snapshot für Kalibrierung/späteren Trend) wird geladen UND nach
 * dem Laden per Server-Aktion für heute ergänzt, falls noch nicht vorhanden
 * (siehe `speichereStufenSnapshot`).
 */
export default async function KompetenzanalysePage() {
  const supabase = await createClient();

  const results = await Promise.all([
    supabase.from("faecher").select("id, kuerzel, name, klausurtag").order("name"),
    supabase.from("themen").select("id, fach_id, name, klausurrelevanz").order("name"),
    supabase
      .from("karteikarten")
      .select("id, fach_id, typ, frage, quelle, fehlernotiz, bewertung, intervall, wdh_anzahl, wdh_datum, created_at"),
    supabase.from("karteikarten_themen").select("karteikarte_id, thema_id"),
    supabase.from("uebungsaufgaben").select("id, fach_id, titel, quelle, pflicht_wdh_datum, wdh_anzahl, created_at"),
    supabase.from("uebungsaufgaben_themen").select("uebungsaufgabe_id, thema_id"),
    supabase.from("uebungsaufgaben_reviews").select("id, uebungsaufgabe_id, datum, fachlich, klausurtechnik, fehlernotiz"),
    supabase
      .from("klausuren")
      .select("id, bezeichnung, datum, quelle, note, stufe1_text, stufe2_text, nachschreiben_erledigt, created_at"),
    supabase.from("klausur_teile").select("id, klausur_id, fach_id, max_punkte, erreichte_punkte"),
    supabase.from("klausur_teile_themen").select("teil_id, thema_id"),
    supabase.from("stufen_verlauf").select("thema_id, datum, stufe, basis_broeckelt"),
  ]);

  if (results.some((r) => r.error)) {
    return (
      <PageShell>
        <div className="rounded-lg border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm font-medium text-destructive" role="alert">
            {CONNECTION_ERROR}
          </p>
        </div>
      </PageShell>
    );
  }

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
    { data: snapshots },
  ] = results;

  const alleFaecher = (faecher ?? []) as Fach[];
  const klausurtage = groupFaecherByKlausurtag(alleFaecher);
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

  const initialSnapshots: StufenSnapshot[] = (snapshots ?? []).map((row) => ({
    themaId: row.thema_id,
    datum: String(row.datum).slice(0, 10),
    stufe: row.stufe as Stufe,
    basisBroeckelt: row.basis_broeckelt,
  }));

  await speichereStufenSnapshot(initialThemen, {
    themen: initialThemen,
    karten: initialKarten,
    aufgaben: initialAufgaben,
    reviews: initialReviews,
    klausuren: initialKlausuren,
    teile: initialTeile,
  });

  return (
    <PageShell>
      <KompetenzanalyseManager
        klausurtage={klausurtage}
        faecher={alleFaecher}
        themen={initialThemen}
        karten={initialKarten}
        aufgaben={initialAufgaben}
        reviews={initialReviews}
        klausuren={initialKlausuren}
        teile={initialTeile}
        snapshots={initialSnapshots}
      />
    </PageShell>
  );
}
