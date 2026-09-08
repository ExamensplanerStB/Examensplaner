import { z } from "zod";
import { heuteISO } from "@/lib/klausuren-berechnung";

export const bezeichnungSchema = z
  .string()
  .trim()
  .min(1, "Bezeichnung ist erforderlich")
  .max(200, "Bezeichnung darf maximal 200 Zeichen lang sein");

export const quelleSchema = z
  .string()
  .trim()
  .max(200, "Quelle darf maximal 200 Zeichen lang sein");

export const noteSchema = z.string().trim().max(50, "Note darf maximal 50 Zeichen lang sein");

export const nacharbeitTextSchema = z
  .string()
  .trim()
  .max(2000, "Text darf maximal 2.000 Zeichen lang sein");

const punkteFeldSchema = z
  .string()
  .trim()
  .refine(
    (wert) => wert === "" || (!Number.isNaN(Number(wert)) && Number(wert) >= 0),
    "Bitte eine gültige, nicht-negative Zahl eingeben (oder leer lassen)"
  );

export const teilSchema = z
  .object({
    fachId: z.string().min(1, "Fach ist erforderlich"),
    themenIds: z.array(z.string()),
    maxPunkte: punkteFeldSchema,
    erreichtePunkte: punkteFeldSchema,
  })
  .refine(
    (teil) => {
      if (teil.maxPunkte === "" || teil.erreichtePunkte === "") return true;
      return Number(teil.erreichtePunkte) <= Number(teil.maxPunkte);
    },
    {
      message: "Erreichte Punkte dürfen die Max-Punkte nicht übersteigen",
      path: ["erreichtePunkte"],
    }
  );

export type TeilFormValues = z.infer<typeof teilSchema>;

export const klausurSchema = z.object({
  bezeichnung: bezeichnungSchema,
  datum: z
    .string()
    .min(1, "Datum ist erforderlich")
    .refine((wert) => wert <= heuteISO(), "Das Datum darf nicht in der Zukunft liegen"),
  quelle: quelleSchema,
  note: noteSchema,
  stufe1Text: nacharbeitTextSchema,
  stufe2Text: nacharbeitTextSchema,
  teile: z.array(teilSchema).min(1, "Mindestens ein Teil ist erforderlich"),
});

export type KlausurFormValues = z.infer<typeof klausurSchema>;
