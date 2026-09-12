import { Card } from "@/components/ui/card";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import { PARAMETER as KOMPETENZ_PARAMETER } from "@/lib/kompetenzanalyse";
import {
  anzahlKlausurenMitTeilen,
  durchschnittsBiasVon,
  kalibrierungBereit,
  praediktiveValiditaetVon,
  selbstbewertungsBiasVon,
  type StufenSnapshot,
} from "@/lib/kalibrierung";

interface KalibrierungsCardProps {
  klausuren: Klausur[];
  teile: KlausurTeil[];
  aufgaben: Uebungsaufgabe[];
  reviews: UebungsaufgabeReview[];
  snapshots: StufenSnapshot[];
}

export function KalibrierungsCard({ klausuren, teile, aufgaben, reviews, snapshots }: KalibrierungsCardProps) {
  const anzahl = anzahlKlausurenMitTeilen(klausuren, teile);
  const bereit = kalibrierungBereit(klausuren, teile);

  return (
    <Card className="p-5 shadow-card">
      <h2 className="mb-1 font-serif-display text-lg">Kalibrierung</h2>
      <p className="mb-4 text-xs text-ink-3">
        Selbstüberprüfung: sagt das Stufen-Modell tatsächlich Klausurergebnisse voraus?
      </p>

      {!bereit ? (
        <p className="py-6 text-center text-sm text-ink-3">
          Noch nicht genug Daten ({anzahl}/{KOMPETENZ_PARAMETER.KALIBRIERUNG_MIN_KLAUSUREN} Klausuren)
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <PraediktiveValiditaet klausuren={klausuren} teile={teile} snapshots={snapshots} />
          <SelbstbewertungsBias klausuren={klausuren} teile={teile} aufgaben={aufgaben} reviews={reviews} />
        </div>
      )}
    </Card>
  );
}

function PraediktiveValiditaet({
  klausuren,
  teile,
  snapshots,
}: {
  klausuren: Klausur[];
  teile: KlausurTeil[];
  snapshots: StufenSnapshot[];
}) {
  const matrix = praediktiveValiditaetVon(klausuren, teile, snapshots);
  const gesamt = matrix.reduce((summe, z) => summe + z.bestanden + z.nichtBestanden, 0);
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">Prädiktive Validität</h3>
      {gesamt === 0 ? (
        <p className="text-sm text-ink-3">
          Noch kein Klausurteil mit Stufen-Snapshot vom Vortag — Historie beginnt mit dem heutigen Tag.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-ink-3">
              <th className="pb-1.5 text-left font-medium">Stufe</th>
              <th className="pb-1.5 text-right font-medium">Bestanden</th>
              <th className="pb-1.5 text-right font-medium">Nicht bestanden</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((zelle) => (
              <tr key={zelle.stufe} className="border-t border-border">
                <td className="py-1.5">Stufe {zelle.stufe}</td>
                <td className="py-1.5 text-right tabular-nums">{zelle.bestanden}</td>
                <td className="py-1.5 text-right tabular-nums">{zelle.nichtBestanden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SelbstbewertungsBias({
  klausuren,
  teile,
  aufgaben,
  reviews,
}: {
  klausuren: Klausur[];
  teile: KlausurTeil[];
  aufgaben: Uebungsaufgabe[];
  reviews: UebungsaufgabeReview[];
}) {
  const eintraege = selbstbewertungsBiasVon(klausuren, teile, aufgaben, reviews);
  const durchschnitt = durchschnittsBiasVon(eintraege);
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">Selbstbewertungs-Bias</h3>
      {durchschnitt === null ? (
        <p className="text-sm text-ink-3">
          Noch keine Übungsaufgaben-Bewertung in den 8 Wochen vor einer Klausur desselben Themas.
        </p>
      ) : (
        <p className="text-sm text-foreground">
          Deine Selbsteinschätzung liegt im Schnitt{" "}
          <span className="font-bold">
            {durchschnitt > 0 ? "+" : ""}
            {durchschnitt.toFixed(1).replace(".", ",")}
          </span>{" "}
          {durchschnitt > 0 ? "über" : "unter"} der Klausurrealität.
        </p>
      )}
    </div>
  );
}
