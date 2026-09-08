"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  bestandenVon,
  faecherVon,
  formatDatum,
  gesamtPunkteVon,
  kurzerText,
  statusVon,
  zeigeNachschreibenHinweis,
  type Klausur,
  type KlausurStatus,
  type KlausurTeil,
} from "@/lib/klausuren";

const STATUS_TEXT: Record<KlausurStatus, string> = {
  korrektur_ausstehend: "text-ink-3",
  korrigiert: "text-ink-2",
};

interface KlausurCardProps {
  klausur: Klausur;
  teile: KlausurTeil[];
  fachName: (fachId: string) => string;
  themenNamen: (teil: KlausurTeil) => string[];
  onNachschreibenErledigt: () => Promise<string | null>;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export function KlausurCard({
  klausur,
  teile,
  fachName,
  themenNamen,
  onNachschreibenErledigt,
  onEdit,
  onDeleteRequest,
}: KlausurCardProps) {
  const [nacharbeitOffen, setNacharbeitOffen] = useState(false);
  const [nachschreibenError, setNachschreibenError] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  const status = statusVon(teile);
  const gesamt = gesamtPunkteVon(teile);
  const bestanden = bestandenVon(teile);
  const nachschreibenFaellig = zeigeNachschreibenHinweis(klausur);
  const faecher = faecherVon(teile).map(fachName);

  async function handleNachschreiben() {
    setIsMarking(true);
    const error = await onNachschreibenErledigt();
    setIsMarking(false);
    setNachschreibenError(error);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-[18px] shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          onClick={onEdit}
          title="Zum Bearbeiten klicken"
          className="cursor-pointer text-sm font-semibold text-ink-2"
        >
          {klausur.bezeichnung}
        </span>
        <span className="text-xs text-ink-3">{formatDatum(klausur.datum)}</span>
        {faecher.map((name) => (
          <span
            key={name}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
          >
            {name}
          </span>
        ))}
        <Badge variant="outline" className={cn("ml-auto", STATUS_TEXT[status])}>
          {STATUS_LABEL[status]}
        </Badge>
        {bestanden !== null && (
          <Badge
            variant="outline"
            className={bestanden ? "text-ampel-green" : "text-ampel-red"}
            style={{
              backgroundColor: bestanden ? "var(--ampel-green-tint)" : "var(--ampel-red-tint)",
            }}
          >
            {bestanden ? "Bestanden" : "Nicht bestanden"}
          </Badge>
        )}
      </div>

      {nachschreibenFaellig && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-ampel-amber" style={{ backgroundColor: "var(--ampel-amber-tint)" }}>
          <span>Nachschreiben fällig seit {formatDatum(klausur.datum)} (+75 Tage)</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleNachschreiben}
            disabled={isMarking}
            aria-label={`Nachschreiben erledigt: „${kurzerText(klausur.bezeichnung)}“`}
          >
            Nachschreiben erledigt
          </Button>
        </div>
      )}
      {nachschreibenError && (
        <p className="mb-3 text-xs text-destructive" role="alert">
          {nachschreibenError}
        </p>
      )}

      <div className="mb-3 space-y-1.5">
        {teile.map((teil) => (
          <div key={teil.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{fachName(teil.fachId)}</span>
            {themenNamen(teil).map((name) => (
              <span key={name} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {name}
              </span>
            ))}
            <span className="ml-auto text-xs text-ink-3">
              {teil.maxPunkte !== null && teil.erreichtePunkte !== null
                ? `${teil.erreichtePunkte} / ${teil.maxPunkte}`
                : "—"}
            </span>
          </div>
        ))}
        {gesamt && (
          <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-semibold">
            <span>Gesamt</span>
            <span>
              {gesamt.erreicht} / {gesamt.max} ({Math.round((gesamt.erreicht / gesamt.max) * 100)}%)
            </span>
          </div>
        )}
      </div>

      {klausur.note.trim().length > 0 && (
        <p className="mb-1 text-xs text-ink-3">Note: {klausur.note}</p>
      )}
      {klausur.quelle.trim().length > 0 && (
        <p className="mb-3 text-xs text-ink-3">Quelle: {klausur.quelle}</p>
      )}

      <div className="flex flex-wrap items-center gap-3.5">
        {(klausur.stufe1Text.trim().length > 0 || klausur.stufe2Text.trim().length > 0) && (
          <Button type="button" variant="outline" size="sm" onClick={() => setNacharbeitOffen((o) => !o)}>
            {nacharbeitOffen ? "Nacharbeit ausblenden" : "Nacharbeit anzeigen"}
          </Button>
        )}
        {klausur.stufe1Text.trim().length === 0 && klausur.stufe2Text.trim().length === 0 && (
          <span className="text-xs text-ink-3">Noch keine Nacharbeit-Notiz</span>
        )}

        <div className="ml-auto flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-ink-3"
            onClick={onEdit}
            aria-label="Bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-ink-3 hover:text-destructive"
            onClick={onDeleteRequest}
            aria-label="Löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {nacharbeitOffen && (
        <div className="mt-4 space-y-3">
          <div className="rounded-[11px] border p-3.5" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }}>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-2">
              Stufe 1 – Fachliche Nacharbeit
            </div>
            {klausur.stufe1Text.trim().length > 0 ? (
              <p className="text-sm leading-relaxed text-foreground">{klausur.stufe1Text}</p>
            ) : (
              <p className="text-sm text-ink-3">Noch keine Notiz.</p>
            )}
          </div>
          <div className="rounded-[11px] border p-3.5" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }}>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-2">
              Stufe 2 – Analytische Nacharbeit
            </div>
            {klausur.stufe2Text.trim().length > 0 ? (
              <p className="text-sm leading-relaxed text-foreground">{klausur.stufe2Text}</p>
            ) : (
              <p className="text-sm text-ink-3">Noch keine Notiz.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
