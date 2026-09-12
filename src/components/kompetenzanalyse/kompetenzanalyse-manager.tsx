"use client";

import { useMemo, useState } from "react";

import type { Fach, Klausurtag, Thema } from "@/lib/klausurtage";
import type { Karteikarte } from "@/lib/karteikarten";
import type { Uebungsaufgabe, UebungsaufgabeReview } from "@/lib/uebungsaufgaben";
import type { Klausur, KlausurTeil } from "@/lib/klausuren";
import type { StufenSnapshot } from "@/lib/kalibrierung";
import {
  type KompetenzanalyseQuellen,
  fachVerteilungVon,
  groesseBlockaden,
  klausurreifeVon,
  themenStufenVon,
} from "@/lib/kompetenzanalyse";

import { FaecherUebersicht } from "./faecher-uebersicht";
import { ThemenListe } from "./themen-liste";
import { ThemaDetail } from "./thema-detail";

interface KompetenzanalyseManagerProps {
  klausurtage: Klausurtag[];
  faecher: Fach[];
  themen: Thema[];
  karten: Karteikarte[];
  aufgaben: Uebungsaufgabe[];
  reviews: UebungsaufgabeReview[];
  klausuren: Klausur[];
  teile: KlausurTeil[];
  snapshots: StufenSnapshot[];
}

type Ansicht = { ebene: 1 } | { ebene: 2; fachId: string } | { ebene: 3; fachId: string; themaId: string };

export function KompetenzanalyseManager({
  klausurtage,
  faecher,
  themen,
  karten,
  aufgaben,
  reviews,
  klausuren,
  teile,
  snapshots,
}: KompetenzanalyseManagerProps) {
  const [ansicht, setAnsicht] = useState<Ansicht>({ ebene: 1 });

  const quellen: KompetenzanalyseQuellen = useMemo(
    () => ({ themen, karten, aufgaben, reviews, klausuren, teile }),
    [themen, karten, aufgaben, reviews, klausuren, teile]
  );

  const alleThemenStufen = useMemo(() => themenStufenVon(themen, quellen), [themen, quellen]);

  const themenStufenByFach = useMemo(() => {
    const map = new Map<string, typeof alleThemenStufen>();
    faecher.forEach((fach) => {
      map.set(
        fach.id,
        alleThemenStufen.filter((ts) => ts.thema.fachId === fach.id)
      );
    });
    return map;
  }, [faecher, alleThemenStufen]);

  const fachVerteilungen = useMemo(
    () => faecher.map((fach) => fachVerteilungVon(fach, themenStufenByFach.get(fach.id) ?? [])),
    [faecher, themenStufenByFach]
  );

  const klausurreifeEintraege = useMemo(
    () =>
      faecher
        .map((fach) => klausurreifeVon(fach, klausuren, teile))
        .filter((eintrag): eintrag is NonNullable<typeof eintrag> => eintrag !== null),
    [faecher, klausuren, teile]
  );

  const groessteBlockaden = useMemo(() => groesseBlockaden(alleThemenStufen, 6), [alleThemenStufen]);

  if (ansicht.ebene === 1) {
    return (
      <FaecherUebersicht
        klausurtage={klausurtage}
        fachVerteilungen={fachVerteilungen}
        klausurreifeEintraege={klausurreifeEintraege}
        groessteBlockaden={groessteBlockaden}
        klausuren={klausuren}
        teile={teile}
        aufgaben={aufgaben}
        reviews={reviews}
        snapshots={snapshots}
        onOpenFach={(fachId) => setAnsicht({ ebene: 2, fachId })}
        onOpenThema={(fachId, themaId) => setAnsicht({ ebene: 3, fachId, themaId })}
      />
    );
  }

  if (ansicht.ebene === 2) {
    const fach = faecher.find((f) => f.id === ansicht.fachId);
    if (!fach) return null;
    return (
      <ThemenListe
        fach={fach}
        themenStufen={themenStufenByFach.get(fach.id) ?? []}
        onBack={() => setAnsicht({ ebene: 1 })}
        onOpenThema={(themaId) => setAnsicht({ ebene: 3, fachId: fach.id, themaId })}
      />
    );
  }

  const fach = faecher.find((f) => f.id === ansicht.fachId);
  const themaStufe = alleThemenStufen.find((ts) => ts.thema.id === ansicht.themaId);
  if (!fach || !themaStufe) return null;

  return (
    <ThemaDetail
      fach={fach}
      themaStufe={themaStufe}
      quellen={quellen}
      onBackToEbene1={() => setAnsicht({ ebene: 1 })}
      onBackToEbene2={() => setAnsicht({ ebene: 2, fachId: fach.id })}
    />
  );
}
