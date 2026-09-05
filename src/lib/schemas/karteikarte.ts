import { z } from "zod";

export const frageSchema = z
  .string()
  .trim()
  .min(1, "Frage ist erforderlich")
  .max(1000, "Frage darf maximal 1.000 Zeichen lang sein");

export const quelleSchema = z
  .string()
  .trim()
  .max(200, "Quelle darf maximal 200 Zeichen lang sein");

export const fehlernotizSchema = z
  .string()
  .trim()
  .max(1000, "Fehlernotiz darf maximal 1.000 Zeichen lang sein");

export const karteikarteSchema = z.object({
  fachId: z.string().min(1, "Fach ist erforderlich"),
  // Bewusst ein einfacher String statt z.enum: Select-Felder starten mit
  // einem leeren Wert ("nicht gewählt"), das ein echtes Enum nicht als
  // Default zulässt (analog fachId). Auf KarteikartenTyp verengt beim
  // Übernehmen der validierten Werte durch den Aufrufer.
  typ: z.string().min(1, "Typ ist erforderlich"),
  themenIds: z.array(z.string()).min(1, "Mindestens ein Thema ist erforderlich"),
  frage: frageSchema,
  bewertung: z.enum(["1", "2", "3", "4", "5"]),
  quelle: quelleSchema,
  fehlernotiz: fehlernotizSchema,
});

export type KarteikarteFormValues = z.infer<typeof karteikarteSchema>;
