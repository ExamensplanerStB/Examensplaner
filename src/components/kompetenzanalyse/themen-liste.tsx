import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Fach } from "@/lib/klausurtage";
import { ampelVonStufe, priowertVon, sortierteThemenNachPrio, type Stufe, type ThemaStufe } from "@/lib/kompetenzanalyse";

import { AMPEL_TEXT_CLASS, AmpelDot } from "./stufen-ui";

interface ThemenListeProps {
  fach: Fach;
  themenStufen: ThemaStufe[];
  onBack: () => void;
  onOpenThema: (themaId: string) => void;
}

export function ThemenListe({ fach, themenStufen, onBack, onOpenThema }: ThemenListeProps) {
  const sortiert = sortierteThemenNachPrio(themenStufen);
  const mitDaten = themenStufen.filter((ts) => ts.hasData);
  const durchschnitt = mitDaten.length > 0 ? mitDaten.reduce((summe, ts) => summe + ts.stufe, 0) / mitDaten.length : null;
  const stufeGerundet: Stufe = durchschnitt === null ? 0 : (Math.round(durchschnitt) as Stufe);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <button type="button" onClick={onBack} className="font-semibold text-primary hover:underline">
          Kompetenzanalyse
        </button>
        <span className="text-ink-3">/</span>
        <span className="font-semibold text-ink-2">{fach.name}</span>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 shadow-card">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-ink-3">Klausur K{fach.klausurtag}</div>
          <h1 className="mt-1 font-serif-display text-2xl">{fach.name}</h1>
          <p className="mt-1 text-xs text-ink-3">
            {themenStufen.length} Themen · nach Blockade-Prio sortiert (dringendste zuerst)
          </p>
        </div>
        <span
          className={cn("rounded-full px-3.5 py-1.5 text-sm font-bold", AMPEL_TEXT_CLASS[ampelVonStufe(stufeGerundet, durchschnitt !== null)])}
          style={{ backgroundColor: `var(--ampel-${ampelVonStufe(stufeGerundet, durchschnitt !== null)}-tint)` }}
        >
          {durchschnitt !== null ? `Ø Stufe ${durchschnitt.toFixed(1).replace(".", ",")}` : "Keine Daten"}
        </span>
      </Card>

      <Card className="overflow-hidden p-0 shadow-card">
        {sortiert.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-3">
            Keine Themen — lege Themen unter /themen an.
          </p>
        ) : (
          sortiert.map((ts) => (
            <button
              key={ts.thema.id}
              type="button"
              onClick={() => onOpenThema(ts.thema.id)}
              className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-t border-border px-5 py-3.5 text-left first:border-t-0 hover:bg-secondary/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <AmpelDot stufe={ts.stufe} hasData={ts.hasData} size={10} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{ts.thema.name}</div>
                  <div className="text-xs text-ink-3">Priowert {priowertVon(ts)}</div>
                </div>
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-sm font-bold tabular-nums",
                  AMPEL_TEXT_CLASS[ampelVonStufe(ts.stufe, ts.hasData)]
                )}
              >
                {ts.hasData ? `Stufe ${ts.stufe}` : "keine Daten"}
              </span>
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
