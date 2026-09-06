"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  formatDatum,
  kurzerText,
  letzteReviewVon,
  statusVon,
  wiederholungsDringlichkeit,
  type Uebungsaufgabe,
  type UebungsaufgabeReview,
  type UebungsaufgabenStatus,
} from "@/lib/uebungsaufgaben";

const STATUS_TEXT: Record<UebungsaufgabenStatus, string> = {
  unbewertet: "text-ink-3",
  gueltig: "text-ampel-green",
  wiederholung_faellig: "text-ampel-amber",
  verfallen: "text-ampel-red",
  geschlossen: "text-ink-3",
};

const STATUS_TINT: Record<UebungsaufgabenStatus, string> = {
  unbewertet: "var(--secondary)",
  gueltig: "var(--ampel-green-tint)",
  wiederholung_faellig: "var(--ampel-amber-tint)",
  verfallen: "var(--ampel-red-tint)",
  geschlossen: "var(--secondary)",
};

interface UebungsaufgabeCardProps {
  aufgabe: Uebungsaufgabe;
  reviews: UebungsaufgabeReview[];
  fachName: string;
  themenNamen: string[];
  onBewertenRequest: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export function UebungsaufgabeCard({
  aufgabe,
  reviews,
  fachName,
  themenNamen,
  onBewertenRequest,
  onEdit,
  onDeleteRequest,
}: UebungsaufgabeCardProps) {
  const [verlaufOffen, setVerlaufOffen] = useState(false);

  const eigeneReviews = reviews
    .filter((r) => r.uebungsaufgabeId === aufgabe.id)
    .sort((a, b) => (a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0));
  const letzteReview = letzteReviewVon(aufgabe.id, reviews);
  const status = statusVon(aufgabe, letzteReview);
  // Bewerten ist nur für Unbewertet/Wiederholung fällig vorgesehen (siehe AC).
  // Gültig/Verfallen/Geschlossen: keine erneute Bewertung derselben Aufgabe —
  // neue Evidenz entsteht über eine neue Aufgabe (Berechnungsspezifikation Abschnitt 3).
  const bewertenGesperrt = status === "gueltig" || status === "verfallen" || status === "geschlossen";

  const letzteReviewWorst =
    letzteReview !== null ? Math.min(letzteReview.fachlich, letzteReview.klausurtechnik) : null;
  const nacharbeitHinweis =
    status === "wiederholung_faellig" && letzteReviewWorst !== null && letzteReviewWorst <= 2;

  return (
    <div className="rounded-lg border border-border bg-card p-[18px] shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
          className={cn("ml-auto", STATUS_TEXT[status])}
          style={{ backgroundColor: STATUS_TINT[status] }}
        >
          {status === "wiederholung_faellig" && aufgabe.pflichtWdhDatum
            ? `Wiederholung fällig am ${formatDatum(aufgabe.pflichtWdhDatum)}${
                wiederholungsDringlichkeit(aufgabe.pflichtWdhDatum) === "ueberfaellig"
                  ? " (überfällig)"
                  : ""
              }`
            : STATUS_LABEL[status]}
        </Badge>
      </div>

      <p
        onClick={onEdit}
        title="Zum Bearbeiten klicken"
        className="mb-1 cursor-pointer text-[15.5px] leading-relaxed text-foreground"
      >
        {aufgabe.titel}
      </p>
      {aufgabe.quelle.trim().length > 0 && (
        <p className="mb-4 text-xs text-ink-3">Quelle: {aufgabe.quelle}</p>
      )}

      {nacharbeitHinweis && (
        <p
          className="mb-4 rounded-md px-3 py-2 text-xs font-medium text-ampel-amber"
          style={{ backgroundColor: "var(--ampel-amber-tint)" }}
        >
          Erst Nacharbeit empfohlen
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3.5">
        <Button
          type="button"
          size="sm"
          onClick={onBewertenRequest}
          disabled={bewertenGesperrt}
          aria-label={`Bewerten: „${kurzerText(aufgabe.titel)}“`}
        >
          Bewerten
        </Button>

        {eigeneReviews.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVerlaufOffen((o) => !o)}
          >
            {verlaufOffen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {verlaufOffen ? "Verlauf ausblenden" : "Bewertungshistorie anzeigen"}
          </Button>
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

      {verlaufOffen && (
        <div className="mt-4 space-y-2.5">
          {eigeneReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[11px] border p-3.5"
              style={{
                backgroundColor: "var(--secondary)",
                borderColor: "var(--border)",
              }}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink-2">
                <span>{formatDatum(review.datum)}</span>
                <span>Fachlich: {review.fachlich}</span>
                <span>Klausurtechnik: {review.klausurtechnik}</span>
              </div>
              {review.fehlernotiz.trim().length > 0 ? (
                <p className="text-sm leading-relaxed text-foreground">{review.fehlernotiz}</p>
              ) : (
                <p className="text-sm text-ink-3">Keine Fehlernotiz hinterlegt.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
