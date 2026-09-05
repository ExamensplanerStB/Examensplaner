"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BEWERTUNG_OPTIONEN,
  TYP_LABEL,
  faelligkeitsDringlichkeit,
  faelligkeitsTag,
  formatDatum,
  gueltigkeitsStatus,
  type Bewertung,
  type Karteikarte,
} from "@/lib/karteikarten";

const TYP_BADGE_STYLES: Record<Karteikarte["typ"], string> = {
  theorie: "border-transparent bg-hub-theorie text-white",
  klausurtechnik: "border-transparent bg-hub-klausurtechnik text-white",
};

const GUELTIGKEIT_TEXT: Record<"gueltig" | "verfallen", string> = {
  gueltig: "text-ampel-green",
  verfallen: "text-ampel-red",
};

const DRINGLICHKEIT_FARBE: Record<ReturnType<typeof faelligkeitsDringlichkeit>, string> = {
  ueberfaellig: "text-ampel-red",
  heute: "text-ampel-amber",
  geplant: "text-primary",
};

interface KarteikarteCardProps {
  karte: Karteikarte;
  fachName: string;
  themenNamen: string[];
  onBewerten: (bewertung: Bewertung) => Promise<string | null>;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export function KarteikarteCard({
  karte,
  fachName,
  themenNamen,
  onBewerten,
  onEdit,
  onDeleteRequest,
}: KarteikarteCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [bewertungError, setBewertungError] = useState<string | null>(null);
  const [isBewerten, setIsBewerten] = useState(false);
  const status = gueltigkeitsStatus(karte);
  const dringlichkeit = faelligkeitsDringlichkeit(karte.wdhDatum);
  const hatFehlernotiz = karte.fehlernotiz.trim().length > 0;
  const hatQuelle = karte.quelle.trim().length > 0;

  async function handleBewertungChange(value: string) {
    setIsBewerten(true);
    const error = await onBewerten(Number(value) as Bewertung);
    setIsBewerten(false);
    setBewertungError(error);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-[18px] shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className={TYP_BADGE_STYLES[karte.typ]}>{TYP_LABEL[karte.typ]}</Badge>
        <span className="text-sm font-semibold text-ink-2">{fachName}</span>
        {themenNamen.map((name) => (
          <span
            key={name}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
          >
            {name}
          </span>
        ))}
        <Badge
          variant="outline"
          className={cn("ml-auto", GUELTIGKEIT_TEXT[status])}
          style={{
            backgroundColor:
              status === "gueltig" ? "var(--ampel-green-tint)" : "var(--ampel-red-tint)",
          }}
        >
          {status === "gueltig" ? "Gültig" : "Verfallen"}
        </Badge>
      </div>

      <p
        onClick={onEdit}
        title="Zum Bearbeiten klicken"
        className="mb-4 cursor-pointer text-[15.5px] leading-relaxed text-foreground"
      >
        {karte.frage}
      </p>

      <div className="flex flex-wrap items-end gap-3.5">
        <div className="w-[230px] space-y-1">
          <span className="text-xs font-medium text-ink-2">Selbsteinschätzung</span>
          <Select value={String(karte.bewertung)} onValueChange={handleBewertungChange} disabled={isBewerten}>
            <SelectTrigger className="h-9" aria-label={`Selbsteinschätzung für „${karte.frage}“`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BEWERTUNG_OPTIONEN.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bewertungError && (
            <p className="text-xs text-destructive" role="alert">
              {bewertungError}
            </p>
          )}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => setRevealed((r) => !r)}>
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {revealed ? "Fehler ausblenden" : "Fehler aufdecken"}
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-ink-3">
            Nächste Wdh.{" "}
            <span className={cn("font-bold", DRINGLICHKEIT_FARBE[dringlichkeit])}>
              {faelligkeitsTag(karte.wdhDatum)} · {formatDatum(karte.wdhDatum)}
            </span>
          </span>
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

      {revealed && (
        <div
          className="mt-4 rounded-[11px] border p-3.5"
          style={{
            backgroundColor: "var(--ampel-amber-tint)",
            borderColor: "color-mix(in srgb, var(--ampel-amber) 26%, transparent)",
          }}
        >
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ampel-amber">
            Fehleranalyse
          </div>
          {hatFehlernotiz ? (
            <p className="text-sm leading-relaxed text-foreground">{karte.fehlernotiz}</p>
          ) : (
            <p className="text-sm text-ink-3">Keine Fehlernotiz hinterlegt.</p>
          )}
          {hatQuelle && <div className="mt-2 text-xs text-ink-3">Quelle: {karte.quelle}</div>}
        </div>
      )}
    </div>
  );
}
