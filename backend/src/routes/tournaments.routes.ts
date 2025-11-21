import { Hono } from "hono";
import { authMiddleware, type AuthContext } from "@/middleware/auth";
import { zValidator } from "@/middleware/zodValidator";
import {
  tournamentQuerySchema,
  tournamentIdSchema,
  tournamentRoundSchema,
  tournamentMatchSchema,
  refereeMatchUpdateSchema,
} from "@/utils/validation";
import {
  getAllTournaments,
  getTournamentById,
  getTournamentRound,
  joinAsReferee,
  getMatchDetails,
  getRefereeMatchDetails,
  updateRefereeMatchScore,
} from "@/controllers/tournaments.controller";

export const tournamentsRoutes = new Hono<AuthContext>();

// GET /tournaments - Get all tournaments with filtering
tournamentsRoutes.get(
  "/",
  authMiddleware,
  zValidator("query", tournamentQuerySchema),
  getAllTournaments
);

// GET /tournaments/:id - Get individual tournament details
tournamentsRoutes.get(
  "/:id",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("query", tournamentQuerySchema.partial()),
  getTournamentById
);

// GET /tournaments/:id/:round - Get tournament round details
tournamentsRoutes.get(
  "/:id/:round",
  authMiddleware,
  zValidator("param", tournamentRoundSchema),
  getTournamentRound
);

// POST /tournaments/:id/join - Join as referee
tournamentsRoutes.post(
  "/:id/join",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  joinAsReferee
);

// GET /tournaments/:id/:round/:match - Get match details
tournamentsRoutes.get(
  "/:id/:round/:match",
  authMiddleware,
  zValidator("param", tournamentMatchSchema),
  getMatchDetails
);

// GET /tournaments/referee/:id/:round/:match - Get match details for referee
tournamentsRoutes.get(
  "/referee/:id/:round/:match",
  authMiddleware,
  zValidator("param", tournamentMatchSchema),
  getRefereeMatchDetails
);

// POST /tournaments/referee/:id/:round/:match - Update match score
tournamentsRoutes.post(
  "/referee/:id/:round/:match",
  authMiddleware,
  zValidator("param", tournamentMatchSchema),
  zValidator("json", refereeMatchUpdateSchema),
  updateRefereeMatchScore
);
