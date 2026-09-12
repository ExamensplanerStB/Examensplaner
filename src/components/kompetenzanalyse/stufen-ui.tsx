import { cn } from "@/lib/utils";
import { STUFE_LABEL, type AmpelFarbe, type FachVerteilung, type Stufe } from "@/lib/kompetenzanalyse";

export const AMPEL_TEXT_CLASS: Record<AmpelFarbe, string> = {
  green: "text-ampel-green",
  amber: "text-ampel-amber",
  red: "text-ampel-red",
  grey: "text-ampel-grey",
};

/** Stufe -> Segmentfarbe für die Stufenverteilung (Stufe 3 als grün/gelb-Mix, wie im Design-System). */
export const DIST_COLOR: Record<Stufe, string> = {
  0: "var(--ampel-grey)",
  1: "var(--ampel-red)",
  2: "var(--ampel-amber)",
  3: "color-mix(in srgb, var(--ampel-green) 62%, var(--ampel-amber))",
  4: "var(--ampel-green)",
};

interface AmpelDotProps {
  stufe: Stufe;
  hasData: boolean;
  size?: number;
}

export function AmpelDot({ stufe, hasData, size = 9 }: AmpelDotProps) {
  const farbe: AmpelFarbe = !hasData ? "grey" : (["red", "red", "amber", "amber", "green"] as const)[stufe];
  return (
    <span
      className="inline-block flex-none rounded-full"
      style={{ width: size, height: size, backgroundColor: `var(--ampel-${farbe})` }}
      aria-hidden="true"
    />
  );
}

interface StufenBalkenProps {
  segmente: FachVerteilung["segmente"];
  className?: string;
}

/** Gestapelter Balken: ein Segment je Stufe (0-4), proportional zur Themenanzahl. */
export function StufenBalken({ segmente, className }: StufenBalkenProps) {
  const gesamt = segmente.reduce((summe, seg) => summe + seg.anzahl, 0);
  return (
    <span className={cn("flex overflow-hidden rounded-full bg-secondary", className)}>
      {segmente
        .filter((seg) => seg.anzahl > 0)
        .map((seg) => (
          <span
            key={seg.stufe}
            title={`${seg.anzahl} Themen · Stufe ${seg.stufe}`}
            style={{ width: `${gesamt > 0 ? (seg.anzahl / gesamt) * 100 : 0}%`, backgroundColor: DIST_COLOR[seg.stufe] }}
          />
        ))}
    </span>
  );
}

export function StufenLegende() {
  return (
    <div className="mt-3.5 flex flex-wrap gap-3 border-t border-border pt-3">
      {([0, 1, 2, 3, 4] as Stufe[]).map((stufe) => (
        <span key={stufe} className="flex items-center gap-1.5 text-[11px] text-ink-3">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DIST_COLOR[stufe] }} />
          St. {stufe}
        </span>
      ))}
    </div>
  );
}

interface StufenSegmenteProps {
  stufe: Stufe;
  hasData: boolean;
}

/** 4-Segment-Anzeige (Ebene 3): zeigt, welche der Stufen 1-4 erreicht sind. */
export function StufenSegmente({ stufe, hasData }: StufenSegmenteProps) {
  const farbe: AmpelFarbe = !hasData ? "grey" : (["red", "red", "amber", "amber", "green"] as const)[stufe];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {([1, 2, 3, 4] as const).map((n) => {
        const reached = n <= stufe;
        return (
          <div key={n} className="flex flex-col gap-1.5">
            <span
              className="h-3 rounded-sm"
              style={{ backgroundColor: reached ? `var(--ampel-${farbe})` : "var(--border-subtle)" }}
            />
            <span
              className={cn(
                "text-balance text-center text-[11px] font-semibold",
                reached ? "text-foreground" : "text-ink-3"
              )}
            >
              {n} · {STUFE_LABEL[n]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
