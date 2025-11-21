import { z } from "zod";

// Tournament query parameters validation
export const tournamentQuerySchema = z.object({
  max_age: z.string().regex(/^\d+$/).transform(Number).optional(),
  eligible_gender: z.enum(["M", "W", "MW", "male", "female"]).optional(),
  mini: z.enum(["true", "false"]).optional(),
});

// Tournament ID parameter validation
export const tournamentIdSchema = z.object({
  id: z.string().min(1, "Tournament ID is required"),
});

// Tournament round parameter validation
export const tournamentRoundSchema = z.object({
  id: z.string().min(1, "Tournament ID is required"),
  round: z.string().min(1, "Round is required"),
});

// Tournament match parameter validation
export const tournamentMatchSchema = z.object({
  id: z.string().min(1, "Tournament ID is required"),
  round: z.string().min(1, "Round is required"),
  match: z.string().min(1, "Match ID is required"),
});

// Referee match update body validation
export const refereeMatchUpdateSchema = z.object({
  newScore: z.string().min(1, "newScore is required"),
  stepback: z.boolean().optional().default(false),
  positions: z
    .object({
      pos1: z.string().min(1, "pos1 is required"),
      pos2: z.string().min(1, "pos2 is required"),
      pos3: z.string().min(1, "pos3 is required"),
      pos4: z.string().min(1, "pos4 is required"),
    })
    .optional(),
});

