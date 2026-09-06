import { z } from "zod";

export const titelSchema = z
  .string()
  .trim()
  .min(1, "Titel ist erforderlich")
  .max(300, "Titel darf maximal 300 Zeichen lang sein");

export const quelleSchema = z
  .string()
  .trim()
  .max(200, "Quelle darf maximal 200 Zeichen lang sein");

export const fehlernotizSchema = z
  .string()
  .trim()
  .max(1000, "Fehlernotiz darf maximal 1.000 Zeichen lang sein");

export const uebungsaufgabeSchema = z.object({
  fachId: z.string().min(1, "Fach ist erforderlich"),
  themenIds: z.array(z.string()).min(1, "Mindestens ein Thema ist erforderlich"),
  titel: titelSchema,
  quelle: quelleSchema,
});

export type UebungsaufgabeFormValues = z.infer<typeof uebungsaufgabeSchema>;

export const bewertenSchema = z.object({
  fachlich: z.enum(["1", "2", "3", "4", "5"]),
  klausurtechnik: z.enum(["1", "2", "3", "4", "5"]),
  fehlernotiz: fehlernotizSchema,
});

export type BewertenFormValues = z.infer<typeof bewertenSchema>;
