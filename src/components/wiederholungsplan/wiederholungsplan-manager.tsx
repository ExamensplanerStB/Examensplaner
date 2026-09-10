"use client";

import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import type { Karteikarte } from "@/lib/karteikarten";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import { markiereNachschreibenErledigt } from "@/app/probeklausuren/actions";
import {
  CONNECTION_ERROR,
  GRUPPE_LABEL,
  wiederholungsEintraegeVon,
  type WiederholungsArt,
  type WiederholungsGruppe,
} from "@/lib/wiederholungsplan";

import { GRUPPE_FARBE, WiederholungsEintragCard } from "./wiederholungs-eintrag-card";

interface WiederholungsplanManagerProps {
  klausurtage: Klausurtag[];
  themen: Thema[];
  initialKarten: Karteikarte[];
  initialAufgaben: Uebungsaufgabe[];
  initialReviews: UebungsaufgabeReview[];
  initialKlausuren: Klausur[];
  initialTeile: KlausurTeil[];
}

type ArtFilter = "alle" | WiederholungsArt;
type FaelligkeitsFilter = "gruppen" | "ueberfaellig" | "heute" | "diese_woche" | "alle";

const ART_LABEL: Record<WiederholungsArt, string> = {
  karteikarte: "Karteikarten",
  uebungsaufgabe: "Übungsaufgaben",
  klausur: "Probeklausuren",
};

const STANDARD_GRUPPEN: WiederholungsGruppe[] = ["ueberfaellig", "heute", "diese_woche"];

export function WiederholungsplanManager({
  klausurtage,
  themen,
  initialKarten,
  initialAufgaben,
  initialReviews,
  initialKlausuren,
  initialTeile,
}: WiederholungsplanManagerProps) {
  const [klausuren, setKlausuren] = useState<Klausur[]>(initialKlausuren);

  const [artFilter, setArtFilter] = useState<ArtFilter>("alle");
  const [fachFilter, setFachFilter] = useState<string>("alle");
  const [faelligkeitsFilter, setFaelligkeitsFilter] = useState<FaelligkeitsFilter>("gruppen");

  const faecher = useMemo(() => klausurtage.flatMap((k) => k.faecher), [klausurtage]);

  function fachName(fachId: string): string {
    return faecher.find((f) => f.id === fachId)?.name ?? "Unbekanntes Fach";
  }

  function themenNamenVon(themenIds: string[]): string[] {
    return themenIds
      .map((id) => themen.find((t) => t.id === id)?.name)
      .filter((n): n is string => !!n);
  }

  async function handleNachschreibenErledigt(klausurId: string): Promise<string | null> {
    try {
      const result = await markiereNachschreibenErledigt(klausurId);
      if ("error" in result) return result.error;
      setKlausuren((prev) => prev.map((k) => (k.id === klausurId ? result.klausur : k)));
      return null;
    } catch {
      return CONNECTION_ERROR;
    }
  }

  const alleEintraege = useMemo(
    () =>
      wiederholungsEintraegeVon({
        karten: initialKarten,
        aufgaben: initialAufgaben,
        reviews: initialReviews,
        klausuren,
        teile: initialTeile,
      }),
    [initialKarten, initialAufgaben, initialReviews, klausuren, initialTeile]
  );

  const basisGefiltert = alleEintraege
    .filter((e) => artFilter === "alle" || e.art === artFilter)
    .filter((e) => fachFilter === "alle" || e.fachIds.includes(fachFilter));

  const zeigeGruppen = faelligkeitsFilter === "gruppen";
  const sichtbar = zeigeGruppen
    ? basisGefiltert.filter((e) => e.gruppe !== "spaeter")
    : faelligkeitsFilter === "alle"
      ? basisGefiltert
      : basisGefiltert.filter((e) => e.gruppe === faelligkeitsFilter);

  const filtersAktiv = artFilter !== "alle" || fachFilter !== "alle" || faelligkeitsFilter !== "gruppen";
  const leer = sichtbar.length === 0;
  const leerText = filtersAktiv
    ? "Keine Wiederholungen für diese Auswahl"
    : "Keine fälligen oder geplanten Wiederholungen";

  const gruppen = zeigeGruppen
    ? STANDARD_GRUPPEN.map((key) => ({
        key,
        eintraege: sichtbar.filter((e) => e.gruppe === key),
      })).filter((g) => g.eintraege.length > 0)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={artFilter} onValueChange={(v) => setArtFilter(v as ArtFilter)}>
          <SelectTrigger className="h-10 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Arten</SelectItem>
            {(Object.keys(ART_LABEL) as WiederholungsArt[]).map((art) => (
              <SelectItem key={art} value={art}>
                {ART_LABEL[art]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fachFilter} onValueChange={setFachFilter}>
          <SelectTrigger className="h-10 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Fächer</SelectItem>
            {faecher.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={faelligkeitsFilter} onValueChange={(v) => setFaelligkeitsFilter(v as FaelligkeitsFilter)}>
          <SelectTrigger className="h-10 w-[230px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gruppen">Überfällig / Heute / Diese Woche</SelectItem>
            <SelectItem value="ueberfaellig">Nur Überfällig</SelectItem>
            <SelectItem value="heute">Nur Heute fällig</SelectItem>
            <SelectItem value="diese_woche">Nur Diese Woche</SelectItem>
            <SelectItem value="alle">Alle (auch Zukunft)</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-ink-3">
          {sichtbar.length} {sichtbar.length === 1 ? "Eintrag" : "Einträge"}
        </span>
      </div>

      {leer ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center shadow-card">
          <p className="text-sm font-medium text-foreground">{leerText}</p>
        </div>
      ) : zeigeGruppen ? (
        <div className="space-y-6">
          {gruppen.map(({ key, eintraege }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", GRUPPE_FARBE[key])}>{GRUPPE_LABEL[key]}</span>
                <span className="text-xs text-ink-3">({eintraege.length})</span>
              </div>
              <div className="space-y-3.5">
                {eintraege.map((eintrag) => (
                  <WiederholungsEintragCard
                    key={`${eintrag.art}-${eintrag.id}`}
                    eintrag={eintrag}
                    fachName={fachName}
                    themenNamen={themenNamenVon}
                    onNachschreibenErledigt={handleNachschreibenErledigt}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {sichtbar.map((eintrag) => (
            <WiederholungsEintragCard
              key={`${eintrag.art}-${eintrag.id}`}
              eintrag={eintrag}
              fachName={fachName}
              themenNamen={themenNamenVon}
              onNachschreibenErledigt={handleNachschreibenErledigt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
