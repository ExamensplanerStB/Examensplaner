import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Klausurtag } from "@/lib/klausurtage";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import type { StufenSnapshot } from "@/lib/kalibrierung";
import {
  ampelVonStufe,
  blockadeKurztext,
  type FachVerteilung,
  type KlausurreifeEintrag,
  type Stufe,
  type ThemaStufe,
} from "@/lib/kompetenzanalyse";

import { AMPEL_TEXT_CLASS, AmpelDot, StufenBalken, StufenLegende } from "./stufen-ui";
import { KalibrierungsCard } from "./kalibrierungs-card";

interface FaecherUebersichtProps {
  klausurtage: Klausurtag[];
  fachVerteilungen: FachVerteilung[];
  klausurreifeEintraege: KlausurreifeEintrag[];
  groessteBlockaden: ThemaStufe[];
  klausuren: Klausur[];
  teile: KlausurTeil[];
  aufgaben: Uebungsaufgabe[];
  reviews: UebungsaufgabeReview[];
  snapshots: StufenSnapshot[];
  onOpenFach: (fachId: string) => void;
  onOpenThema: (fachId: string, themaId: string) => void;
}

function formatStufeLabel(durchschnitt: number | null): string {
  if (durchschnitt === null) return "keine Daten";
  return `Ø ${durchschnitt.toFixed(1).replace(".", ",")}`;
}

function stufeGerundet(durchschnitt: number | null): Stufe {
  return durchschnitt === null ? 0 : (Math.round(durchschnitt) as Stufe);
}

/**
 * Trend-Text + Farbe für die Klausurreife-Card. `null` (< 6 Klausuren) -> "–".
 * ±2-Prozentpunkte-Schwelle für die Pfeilrichtung, analog Prototyp.
 */
function formatTrend(trend: number | null): { text: string; colorClass: string } {
  if (trend === null) return { text: "–", colorClass: "text-ink-3" };
  const prozentpunkte = Math.round(trend * 100);
  const vorzeichen = prozentpunkte > 0 ? "+" : "";
  if (trend > 0.02) return { text: `▲ ${vorzeichen}${prozentpunkte} %`, colorClass: "text-ampel-green" };
  if (trend < -0.02) return { text: `▼ ${prozentpunkte} %`, colorClass: "text-ampel-red" };
  return { text: `→ ${vorzeichen}${prozentpunkte} %`, colorClass: "text-ink-3" };
}

export function FaecherUebersicht({
  klausurtage,
  fachVerteilungen,
  klausurreifeEintraege,
  groessteBlockaden,
  klausuren,
  teile,
  aufgaben,
  reviews,
  snapshots,
  onOpenFach,
  onOpenThema,
}: FaecherUebersichtProps) {
  const verteilungByFach = new Map(fachVerteilungen.map((v) => [v.fach.id, v]));
  const werteMitDaten = fachVerteilungen.map((v) => v.durchschnitt).filter((v): v is number => v !== null);
  const gesamtDurchschnitt = werteMitDaten.length > 0 ? werteMitDaten.reduce((s, v) => s + v, 0) / werteMitDaten.length : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="overflow-hidden py-0 shadow-card">
          <div className="border-b border-border px-4 py-3 font-serif-display text-lg">Fächer</div>
          {klausurtage.map((kt) => (
            <div key={kt.tag}>
              <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                <span className="inline-flex h-[18px] min-w-[22px] items-center justify-center rounded bg-primary px-1 text-[10.5px] font-bold text-primary-foreground">
                  K{kt.tag}
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-3">{kt.titel}</span>
              </div>
              {kt.faecher.map((fach) => {
                const verteilung = verteilungByFach.get(fach.id);
                const durchschnitt = verteilung?.durchschnitt ?? null;
                const stufe = stufeGerundet(durchschnitt);
                return (
                  <button
                    key={fach.id}
                    type="button"
                    onClick={() => onOpenFach(fach.id)}
                    className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2.5 border-t border-border px-4 py-2 text-left transition-colors hover:bg-secondary/60"
                  >
                    <AmpelDot stufe={stufe} hasData={durchschnitt !== null} size={9} />
                    <span className="truncate text-sm font-medium text-foreground">{fach.name}</span>
                    <span
                      className={cn(
                        "whitespace-nowrap text-xs font-bold tabular-nums",
                        AMPEL_TEXT_CLASS[ampelVonStufe(stufe, durchschnitt !== null)]
                      )}
                    >
                      {formatStufeLabel(durchschnitt)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </Card>

        <div className="space-y-6">
          <Card className="p-5 shadow-card">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <h2 className="font-serif-display text-lg">Stufenverteilung — alle 11 Fächer</h2>
              <span
                className={cn(
                  "whitespace-nowrap text-sm font-bold tabular-nums",
                  AMPEL_TEXT_CLASS[ampelVonStufe(stufeGerundet(gesamtDurchschnitt), gesamtDurchschnitt !== null)]
                )}
              >
                {gesamtDurchschnitt !== null ? `Ø Stufe ${gesamtDurchschnitt.toFixed(1).replace(".", ",")}` : "Keine Daten"}
              </span>
            </div>
            <div className="space-y-2.5">
              {fachVerteilungen.map((v) => (
                <button
                  key={v.fach.id}
                  type="button"
                  onClick={() => onOpenFach(v.fach.id)}
                  className="grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 text-left"
                >
                  <span className="text-xs font-semibold text-ink-2">{v.fach.kuerzel}</span>
                  <StufenBalken segmente={v.segmente} className="h-3.5" />
                  <span
                    className={cn(
                      "min-w-[52px] whitespace-nowrap text-right text-xs font-bold tabular-nums",
                      AMPEL_TEXT_CLASS[ampelVonStufe(stufeGerundet(v.durchschnitt), v.durchschnitt !== null)]
                    )}
                  >
                    {formatStufeLabel(v.durchschnitt)}
                  </span>
                </button>
              ))}
            </div>
            <StufenLegende />
          </Card>

          <Card className="p-5 shadow-card">
            <h2 className="font-serif-display text-lg">Klausurreife</h2>
            <p className="mb-3.5 text-xs text-ink-3">
              Aus den Probeklausuren je Fach — nicht mit der Stufenverteilung verrechnet.
            </p>
            {klausurreifeEintraege.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-3">Noch keine Probeklausuren erfasst.</p>
            ) : (
              klausurreifeEintraege.map((reife) => {
                const trend = formatTrend(reife.trend);
                return (
                  <div
                    key={reife.fach.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-border py-2.5 first:border-t-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{reife.fach.name}</div>
                      {reife.brauchtFrischeKlausur && (
                        <div className="text-xs text-ampel-amber">Fach braucht frische Klausur</div>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs text-ink-3">{reife.anzahl} Kl.</span>
                    <span className="whitespace-nowrap text-xs font-bold tabular-nums text-foreground">
                      {Math.round(reife.anteilBestanden * 100)} % best.
                    </span>
                    <span className={cn("min-w-[64px] whitespace-nowrap text-right text-xs font-semibold tabular-nums", trend.colorClass)}>
                      {trend.text}
                    </span>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden p-0 shadow-card">
        <div className="border-b border-border px-5 py-4 font-serif-display text-lg">Größte Blockaden — Prio zuerst</div>
        {groessteBlockaden.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-3">Keine Themen im Themenkatalog.</p>
        ) : (
          groessteBlockaden.map((ts) => {
            const fachName = verteilungByFach.get(ts.thema.fachId)?.fach.name ?? ts.thema.fachId;
            return (
              <button
                key={ts.thema.id}
                type="button"
                onClick={() => onOpenThema(ts.thema.fachId, ts.thema.id)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-t border-border px-5 py-3 text-left first:border-t-0 hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <AmpelDot stufe={ts.stufe} hasData={ts.hasData} size={10} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{ts.thema.name}</div>
                    <div className="truncate text-xs text-ink-3">
                      {fachName} · {blockadeKurztext(ts)}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-bold tabular-nums",
                    AMPEL_TEXT_CLASS[ampelVonStufe(ts.stufe, ts.hasData)]
                  )}
                >
                  {ts.hasData ? `Stufe ${ts.stufe}` : "keine Daten"}
                </span>
              </button>
            );
          })
        )}
      </Card>

      <KalibrierungsCard klausuren={klausuren} teile={teile} aufgaben={aufgaben} reviews={reviews} snapshots={snapshots} />
    </div>
  );
}
