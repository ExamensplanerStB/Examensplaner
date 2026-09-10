import { z } from "zod";

export const titelSchema = z
  .string()
  .trim()
  .min(1, "Titel ist erforderlich")
  .max(200, "Titel darf maximal 200 Zeichen lang sein");

export const eigeneKategorieNameSchema = z
  .string()
  .trim()
  .min(1, "Name ist erforderlich")
  .max(60, "Name darf maximal 60 Zeichen lang sein");

/** "kategorie" bildet einen einzigen Auswahlwert ab: "keine" oder `eigene:<id>`. */
export const aufgabeSchema = z
  .object({
    titel: titelSchema,
    // Bewusst ein einfacher String statt z.string().date(): "" bedeutet
    // "kein Datum" (analog fachId-Leerwert in anderen Formularen).
    datum: z.string(),
    // "" nur möglich, solange kein Datum gesetzt ist (siehe Refine unten).
    zeittyp: z.enum(["", "ganztag", "zeitslot"]),
    startZeit: z.string(),
    endZeit: z.string(),
    kategorie: z.string(),
    prioritaet: z.enum(["hoch", "mittel", "niedrig", "keine"]),
    imKalender: z.boolean(),
  })
  .refine(
    (werte) => {
      if (!werte.datum || werte.zeittyp !== "zeitslot") return true;
      return !!werte.startZeit && !!werte.endZeit && werte.startZeit < werte.endZeit;
    },
    {
      message: "Endzeit muss nach der Startzeit liegen",
      path: ["endZeit"],
    }
  );

export type AufgabeFormValues = z.infer<typeof aufgabeSchema>;

export const eigeneKategorieFarbeSchema = z
  .string()
  .min(1, "Farbe ist erforderlich");

export const eigeneKategorieSchema = z.object({
  name: eigeneKategorieNameSchema,
  farbe: eigeneKategorieFarbeSchema,
});

export type EigeneKategorieFormValues = z.infer<typeof eigeneKategorieSchema>;
