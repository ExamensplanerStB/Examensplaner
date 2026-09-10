"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TYP_LABEL, kurzerText as kurzerTextKarte } from "@/lib/karteikarten";
import { kurzerText as kurzerTextAufgabe } from "@/lib/uebungsaufgaben";
import { kurzerText as kurzerTextKlausur } from "@/lib/klausuren";
import {
  formatDatum,
  GRUPPE_LABEL,
  type WiederholungsEintrag,
  type WiederholungsGruppe,
} from "@/lib/wiederholungsplan";

export const GRUPPE_FARBE: Record<WiederholungsGruppe, string> = {
  ueberfaellig: "text-ampel-red",
  heute: "text-ampel-amber",
  diese_woche: "text-ampel-green",
  spaeter: "text-ink-3",
};

const GRUPPE_TINT: Record<WiederholungsGruppe, string> = {
  ueberfaellig: "var(--ampel-red-tint)",
  heute: "var(--ampel-amber-tint)",
  diese_woche: "var(--ampel-green-tint)",
  spaeter: "var(--secondary)",
};

const TYP_BADGE_STYLES: Record<"theorie" | "klausurtechnik", string> = {
  theorie: "border-transparent bg-hub-theorie text-white",
  klausurtechnik: "border-transparent bg-hub-klausurtechnik text-white",
};

const ZIEL_ROUTE: Record<WiederholungsEintrag["art"], string> = {
  karteikarte: "/karteikarten",
  uebungsaufgabe: "/uebungsaufgaben",
  klausur: "/probeklausuren",
};

const ZIEL_LABEL: Record<WiederholungsEintrag["art"], string> = {
  karteikarte: "Karteikarten-Hub",
  uebungsaufgabe: "Übungsaufgaben-Hub",
  klausur: "Probeklausuren-Hub",
};

interface WiederholungsEintragCardProps {
  eintrag: WiederholungsEintrag;
  fachName: (fachId: string) => string;
  themenNamen: (themenIds: string[]) => string[];
  onNachschreibenErledigt: (klausurId: string) => Promise<string | null>;
}

/**
 * Rendert einen einzelnen Eintrag des Wiederholungsplans — Inhalt hängt von
 * `eintrag.art` ab (Karteikarte/Übungsaufgabe/Probeklausur). Ein Klick auf
 * den Eintrag navigiert zum jeweiligen Hub, ohne vorausgewählten Filter
 * (siehe PROJ-7 Decision Log — bewusst keine Änderung an PROJ-3/4/5).
 * Einzige inline-Aktion ist „Nachschreiben erledigt" bei Probeklausuren.
 */
export function WiederholungsEintragCard({
  eintrag,
  fachName,
  themenNamen,
  onNachschreibenErledigt,
}: WiederholungsEintragCardProps) {
  const router = useRouter();
  const [nachschreibenError, setNachschreibenError] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  function navigiereZumHub() {
    router.push(ZIEL_ROUTE[eintrag.art]);
  }

  async function handleNachschreiben(event: MouseEvent) {
    event.stopPropagation();
    if (eintrag.art !== "klausur") return;
    setIsMarking(true);
    const error = await onNachschreibenErledigt(eintrag.klausur.id);
    setIsMarking(false);
    setNachschreibenError(error);
  }

  return (
    <div
      onClick={navigiereZumHub}
      title={`Zu ${ZIEL_LABEL[eintrag.art]} wechseln`}
      className="cursor-pointer rounded-lg border border-border bg-card p-[18px] shadow-card transition-colors hover:border-border-strong"
    >
      <div className="flex flex-wrap items-center gap-2">
        {eintrag.art === "karteikarte" && (
          <Badge className={TYP_BADGE_STYLES[eintrag.karte.typ]}>{TYP_LABEL[eintrag.karte.typ]}</Badge>
        )}

        {eintrag.art !== "klausur" && (
          <span className="text-sm font-semibold text-ink-2">{fachName(eintrag.fachIds[0])}</span>
        )}
        {eintrag.art === "klausur" &&
          eintrag.fachIds.map((fachId) => (
            <span
              key={fachId}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {fachName(fachId)}
            </span>
          ))}

        {eintrag.art === "karteikarte" &&
          themenNamen(eintrag.karte.themenIds).map((name) => (
            <span key={name} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
              {name}
            </span>
          ))}
        {eintrag.art === "uebungsaufgabe" &&
          themenNamen(eintrag.aufgabe.themenIds).map((name) => (
            <span key={name} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
              {name}
            </span>
          ))}

        <Badge
          variant="outline"
          className={cn("ml-auto", GRUPPE_FARBE[eintrag.gruppe])}
          style={{ backgroundColor: GRUPPE_TINT[eintrag.gruppe] }}
        >
          {GRUPPE_LABEL[eintrag.gruppe]}
        </Badge>
      </div>

      <p className="mb-1 mt-3 text-[15.5px] leading-relaxed text-foreground">
        {eintrag.art === "karteikarte" && kurzerTextKarte(eintrag.karte.frage, 140)}
        {eintrag.art === "uebungsaufgabe" && kurzerTextAufgabe(eintrag.aufgabe.titel, 140)}
        {eintrag.art === "klausur" && kurzerTextKlausur(eintrag.klausur.bezeichnung, 140)}
      </p>

      {eintrag.art === "uebungsaufgabe" && eintrag.nacharbeitEmpfohlen && (
        <p
          className="mb-2 inline-block rounded-md px-3 py-1 text-xs font-medium text-ampel-amber"
          style={{ backgroundColor: "var(--ampel-amber-tint)" }}
        >
          Erst Nacharbeit empfohlen
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-3">
          Fällig:{" "}
          <span className={cn("font-bold", GRUPPE_FARBE[eintrag.gruppe])}>
            {formatDatum(eintrag.faelligkeitsdatum)}
          </span>
        </span>

        {eintrag.art === "klausur" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleNachschreiben}
            disabled={isMarking}
            className="ml-auto"
            aria-label={`Nachschreiben erledigt: „${kurzerTextKlausur(eintrag.klausur.bezeichnung)}“`}
          >
            Nachschreiben erledigt
          </Button>
        )}
      </div>

      {nachschreibenError && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {nachschreibenError}
        </p>
      )}
    </div>
  );
}
