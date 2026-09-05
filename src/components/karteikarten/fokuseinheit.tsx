"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Klausurtag, Thema } from "@/lib/klausurtage";
import { GRADE_LABEL, TYP_LABEL } from "@/lib/karteikarten";
import { diffTage, heuteISO, berechneNaechstesIntervall, rundeIntervall } from "@/lib/karteikarten-intervall";
import type { Bewertung, Karteikarte } from "@/lib/karteikarten";

type Stage = "setup" | "run" | "done";

const KEIN_FUZZ_PREVIEW = () => 0.5;
const ALLE_TYPEN = "alle" as const;
const ALLE_FAECHER = "alle" as const;

interface FokuseinheitProps {
  karten: Karteikarte[];
  klausurtage: Klausurtag[];
  themen: Thema[];
  onBewerten: (karteId: string, bewertung: Bewertung, neueFehlernotiz?: string) => Promise<string | null>;
  onClose: () => void;
}

export function Fokuseinheit({ karten, klausurtage, themen, onBewerten, onClose }: FokuseinheitProps) {
  const [stage, setStage] = useState<Stage>("setup");
  const [fachSel, setFachSel] = useState<string>(ALLE_FAECHER);
  const [typSel, setTypSel] = useState<string>(ALLE_TYPEN);
  const [queue, setQueue] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [notizDraft, setNotizDraft] = useState("");
  const [results, setResults] = useState<Bewertung[]>([]);
  const [bewertungError, setBewertungError] = useState<string | null>(null);
  const [isBewerten, setIsBewerten] = useState(false);

  const heute = heuteISO();
  const faecherOptionen = klausurtage.flatMap((k) => k.faecher);

  const faelligeKarten = useMemo(() => {
    return karten
      .filter((k) => fachSel === ALLE_FAECHER || k.fachId === fachSel)
      .filter((k) => typSel === ALLE_TYPEN || k.typ === typSel)
      .filter((k) => diffTage(heute, k.wdhDatum) <= 0)
      .sort((a, b) => (a.wdhDatum < b.wdhDatum ? -1 : a.wdhDatum > b.wdhDatum ? 1 : 0));
  }, [karten, fachSel, typSel, heute]);

  const ueberfaellig = faelligeKarten.filter((k) => diffTage(heute, k.wdhDatum) < 0).length;
  const heuteFaellig = faelligeKarten.length - ueberfaellig;

  function starten() {
    setQueue(faelligeKarten.map((k) => k.id));
    setPos(0);
    setRevealed(false);
    setNotizDraft("");
    setResults([]);
    setBewertungError(null);
    setStage("run");
  }

  const aktuelleKarteId = queue[pos];
  const aktuelleKarte = karten.find((k) => k.id === aktuelleKarteId) ?? null;
  const fach = faecherOptionen.find((f) => f.id === aktuelleKarte?.fachId);
  const themenNamen =
    aktuelleKarte?.themenIds
      .map((id) => themen.find((t) => t.id === id)?.name)
      .filter((n): n is string => !!n) ?? [];

  async function bewerten(wert: Bewertung) {
    if (!aktuelleKarte || isBewerten) return;
    const notiz = notizDraft.trim();
    setIsBewerten(true);
    const error = await onBewerten(aktuelleKarte.id, wert, notiz !== "" ? notiz : undefined);
    setIsBewerten(false);
    if (error) {
      setBewertungError(error);
      return;
    }
    setBewertungError(null);
    setResults((prev) => [...prev, wert]);
    const naechstePos = pos + 1;
    if (naechstePos >= queue.length) {
      setStage("done");
    } else {
      setPos(naechstePos);
      setRevealed(false);
      setNotizDraft("");
    }
  }

  const verteilung = ([1, 2, 3, 4, 5] as Bewertung[]).map((v) => ({
    wert: v,
    anzahl: results.filter((r) => r === v).length,
  }));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="text-sm font-semibold text-ink-2">Fokuseinheit</span>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Schließen
        </Button>
      </div>
      {stage === "run" && <Progress value={queue.length ? (pos / queue.length) * 100 : 0} className="h-1 rounded-none" />}

      <div className="flex flex-1 justify-center overflow-auto px-6 py-8">
        <div className="w-full max-w-xl">
          {stage === "setup" && (
            <div className="rounded-lg border border-border bg-card p-7 shadow-card">
              <h2 className="font-serif-display text-2xl text-foreground">Fokuseinheit starten</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                Lerne alle fälligen und überfälligen Karten nacheinander — abrufen, aufdecken, einschätzen,
                Fehlernotiz hinterlassen.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-3">Fach</div>
                  <select
                    value={fachSel}
                    onChange={(e) => setFachSel(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value={ALLE_FAECHER}>Alle Fächer</option>
                    {faecherOptionen.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-3">Kartentyp</div>
                  <div className="inline-flex rounded-full bg-secondary p-0.5">
                    {(
                      [
                        { value: ALLE_TYPEN, label: "Alle" },
                        { value: "theorie", label: "Theorie" },
                        { value: "klausurtechnik", label: "Klausurtechnik" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTypSel(opt.value)}
                        className={cn(
                          "h-8 rounded-full px-4 text-xs font-semibold transition-colors",
                          typSel === opt.value ? "bg-background text-foreground shadow-sm" : "text-ink-2"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4 rounded-xl bg-secondary px-5 py-4">
                <div className="font-serif-display text-3xl text-foreground">{faelligeKarten.length}</div>
                <div className="text-sm leading-tight text-ink-2">
                  fällige &amp; überfällige Karten
                  <div className="mt-0.5 text-xs text-ink-3">
                    {faelligeKarten.length === 0
                      ? "Keine fälligen Karten für diese Auswahl"
                      : `${ueberfaellig} überfällig · ${heuteFaellig} heute fällig`}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="button" onClick={starten} disabled={faelligeKarten.length === 0}>
                  Session starten
                </Button>
              </div>
            </div>
          )}

          {stage === "run" && aktuelleKarte && (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3.5">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {TYP_LABEL[aktuelleKarte.typ]}
                </span>
                <span className="text-xs font-semibold text-ink-2">{fach?.name}</span>
                {themenNamen.map((name) => (
                  <span key={name} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {name}
                  </span>
                ))}
                <span className="ml-auto text-xs font-semibold text-ink-3">
                  {pos + 1} / {queue.length}
                </span>
              </div>

              <div className="flex min-h-[150px] items-center justify-center px-8 py-9">
                <p className="text-center text-xl leading-relaxed text-foreground">{aktuelleKarte.frage}</p>
              </div>

              {!revealed && (
                <div className="flex justify-center px-8 pb-8">
                  <Button type="button" onClick={() => setRevealed(true)}>
                    Antwort aufdecken
                  </Button>
                </div>
              )}

              {revealed && (
                <div className="flex flex-col gap-4 px-8 pb-7">
                  <div className="rounded-[11px] bg-secondary p-3.5">
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-3">
                      Zur Selbstkontrolle
                    </div>
                    {aktuelleKarte.fehlernotiz.trim() || aktuelleKarte.quelle.trim() ? (
                      <>
                        {aktuelleKarte.fehlernotiz.trim() && (
                          <p className="text-sm leading-relaxed text-foreground">{aktuelleKarte.fehlernotiz}</p>
                        )}
                        {aktuelleKarte.quelle.trim() && (
                          <div className="mt-2 text-xs text-ink-3">Quelle: {aktuelleKarte.quelle}</div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-ink-3">Keine Referenz hinterlegt — gleiche mit deiner Lösung ab.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-2">Fehlernotiz (optional)</label>
                    <Textarea
                      rows={2}
                      maxLength={1000}
                      value={notizDraft}
                      onChange={(e) => setNotizDraft(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-ink-3">
                      Wie sicher warst du?
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {([1, 2, 3, 4, 5] as Bewertung[]).map((wert) => {
                        // Vorschau bewusst ohne Fuzz berechnet (stabiler Wert),
                        // die tatsächlich gespeicherte Bewertung streut ±15 %.
                        const vorschauIntervall = rundeIntervall(
                          berechneNaechstesIntervall(wert, aktuelleKarte.intervall, KEIN_FUZZ_PREVIEW)
                        );
                        return (
                          <button
                            key={wert}
                            type="button"
                            onClick={() => bewerten(wert)}
                            disabled={isBewerten}
                            className="flex flex-col items-center gap-1 rounded-xl border border-border px-1.5 py-3.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="font-serif-display text-xl text-foreground">{wert}</span>
                            <span className="text-center text-[11px] font-semibold leading-tight text-ink-2">
                              {GRADE_LABEL[wert]}
                            </span>
                            <span className="text-[10px] text-ink-3">
                              in {vorschauIntervall} {vorschauIntervall === 1 ? "Tag" : "Tagen"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {bewertungError && (
                      <p className="mt-3 text-center text-xs text-destructive" role="alert">
                        {bewertungError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === "done" && (
            <div className="rounded-lg border border-border bg-card p-9 text-center shadow-card">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--ampel-green-tint)" }}
              >
                <CheckCircle2 className="h-6 w-6 text-ampel-green" />
              </div>
              <h2 className="font-serif-display text-2xl text-foreground">Fokuseinheit abgeschlossen</h2>
              <p className="mt-2 text-sm text-ink-3">
                {results.length} {results.length === 1 ? "Karte" : "Karten"} gelernt · Selbsteinschätzung verteilt sich so:
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {verteilung.map((v) => (
                  <div
                    key={v.wert}
                    className="flex min-w-[56px] flex-col items-center gap-1 rounded-[11px] bg-secondary px-2.5 py-3"
                  >
                    <span className="font-serif-display text-lg tabular-nums text-foreground">{v.anzahl}</span>
                    <span className="text-[11px] text-ink-3">Note {v.wert}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex justify-center">
                <Button type="button" onClick={onClose}>
                  Zurück zum Hub
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
