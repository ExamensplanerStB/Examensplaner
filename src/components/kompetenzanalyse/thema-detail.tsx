import { AlertTriangle, Flame } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Fach } from "@/lib/klausurtage";
import {
  STUFE_LABEL,
  ampelVonStufe,
  blockadeVon,
  empfehlungenVon,
  fehlernotizenVon,
  formatDatum,
  saeulenVon,
  type KompetenzanalyseQuellen,
  type SaeulenStatus,
  type ThemaStufe,
} from "@/lib/kompetenzanalyse";

import { AMPEL_TEXT_CLASS, StufenSegmente } from "./stufen-ui";

interface ThemaDetailProps {
  fach: Fach;
  themaStufe: ThemaStufe;
  quellen: KompetenzanalyseQuellen;
  onBackToEbene1: () => void;
  onBackToEbene2: () => void;
}

const SAEULEN_STATUS_LABEL: Record<SaeulenStatus, string> = {
  gueltig: "gültig",
  verfallen: "verfallen",
  keine_daten: "keine Daten",
};

const SAEULEN_STATUS_FARBE: Record<SaeulenStatus, string> = {
  gueltig: "var(--ampel-green)",
  verfallen: "var(--ampel-red)",
  keine_daten: "var(--ampel-grey)",
};

export function ThemaDetail({ fach, themaStufe, quellen, onBackToEbene1, onBackToEbene2 }: ThemaDetailProps) {
  const farbe = ampelVonStufe(themaStufe.stufe, themaStufe.hasData);
  const blockade = blockadeVon(themaStufe);
  const saeulen = saeulenVon(themaStufe);
  const notizen = fehlernotizenVon(themaStufe.thema, quellen);
  const empfehlungen = empfehlungenVon(themaStufe, notizen);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={onBackToEbene1} className="font-semibold text-primary hover:underline">
          Kompetenzanalyse
        </button>
        <span className="text-ink-3">/</span>
        <button type="button" onClick={onBackToEbene2} className="font-semibold text-primary hover:underline">
          {fach.name}
        </button>
        <span className="text-ink-3">/</span>
        <span className="font-semibold text-ink-2">{themaStufe.thema.name}</span>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 shadow-card">
        <div>
          <div className="text-xs text-ink-3">{fach.name}</div>
          <h1 className="mt-1 font-serif-display text-2xl leading-tight">{themaStufe.thema.name}</h1>
        </div>
        <div className="text-right">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-3">Kompetenzstufe</div>
          <span
            className={cn("rounded-full px-3.5 py-1.5 text-sm font-bold", AMPEL_TEXT_CLASS[farbe])}
            style={{ backgroundColor: `var(--ampel-${farbe}-tint)` }}
          >
            {themaStufe.hasData ? `Stufe ${themaStufe.stufe} · ${STUFE_LABEL[themaStufe.stufe]}` : "Keine Daten"}
          </span>
        </div>
      </Card>

      <Card className="p-5 shadow-card">
        <div className="mb-3.5 text-xs font-bold uppercase tracking-wide text-ink-3">
          Kompetenzstufe — Niveau + Haltbarkeit
        </div>
        <StufenSegmente stufe={themaStufe.stufe} hasData={themaStufe.hasData} />

        {blockade && (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{
              backgroundColor: "var(--ampel-amber-tint)",
              borderColor: "color-mix(in srgb, var(--ampel-amber) 26%, transparent)",
            }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-ampel-amber" />
            <span className="text-sm leading-relaxed text-foreground">
              Stufe {blockade.naechsteStufe} blockiert: {blockade.text}
            </span>
          </div>
        )}

        {themaStufe.basisBroeckelt && (
          <div
            className="mt-2.5 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{
              backgroundColor: "var(--ampel-red-tint)",
              borderColor: "color-mix(in srgb, var(--ampel-red) 26%, transparent)",
            }}
          >
            <Flame className="mt-0.5 h-4 w-4 flex-none text-ampel-red" />
            <span className="text-sm leading-relaxed text-foreground">
              Basis bröckelt: eine niedrigere Stufe ist nicht mehr direkt gedeckt. Die angezeigte Stufe trägt
              formal, steht aber auf verfallener Grundlage — frische die betroffene Säule auf.
            </span>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0 shadow-card">
        <div className="border-b border-border px-5 py-4 font-serif-display text-lg">
          Die vier Säulen — Gültigkeitsstatus
        </div>
        {saeulen.map((s) => (
          <div
            key={s.key}
            className={cn(
              "grid grid-cols-[1fr_auto] items-center gap-4 border-t border-border px-5 py-3.5 first:border-t-0",
              s.status === "keine_daten" && "opacity-60"
            )}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {s.label} <span className="font-medium text-ink-3">· {s.stufeRef}</span>
              </div>
              <div className="text-xs text-ink-3">{s.detail}</div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                color: SAEULEN_STATUS_FARBE[s.status],
                backgroundColor: `color-mix(in srgb, ${SAEULEN_STATUS_FARBE[s.status]} 13%, transparent)`,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SAEULEN_STATUS_FARBE[s.status] }} />
              {SAEULEN_STATUS_LABEL[s.status]}
            </span>
          </div>
        ))}
      </Card>

      <Card
        className="p-5"
        style={{ backgroundColor: "var(--brand-primary-tint)", borderColor: "color-mix(in srgb, var(--brand-primary) 26%, transparent)" }}
      >
        <h2 className="mb-3.5 font-serif-display text-lg">Handlungsempfehlung</h2>
        <div className="space-y-2.5">
          {empfehlungen.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-serif-display text-lg">Fehlernotizen</h2>
          <span className="text-xs text-ink-3">{notizen.length} Einträge · aus allen Hubs · chronologisch</span>
        </div>
        {notizen.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-3">Keine Fehlernotizen — sauber gearbeitet.</p>
        ) : (
          notizen.map((notiz, i) => (
            <div key={i} className="flex gap-3.5 border-t border-border px-5 py-3.5 first:border-t-0">
              <div className="w-[130px] flex-none">
                <span className="inline-flex h-[22px] items-center rounded-full bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground">
                  {notiz.hubLabel}
                </span>
                <div className="mt-1.5 text-xs text-ink-3">{formatDatum(notiz.datum)}</div>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-foreground">{notiz.text}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
