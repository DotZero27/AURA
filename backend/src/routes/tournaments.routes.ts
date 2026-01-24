import { Hono } from "hono";
import { authMiddleware, type AuthContext } from "@/middleware/auth";
import { zValidator } from "@/middleware/zodValidator";
import {
  tournamentQuerySchema,
  tournamentIdSchema,
  tournamentRoundSchema,
  tournamentMatchSchema,
  createTournamentSchema,
  addTournamentRefereeSchema,
  removeTournamentRefereeSchema,
  initializeGroupsSchema,
  swapTeamGroupSchema,
  setMatchWinnerSchema,
  engineMatchIdSchema,
  engineMatchFilterSchema,
} from "@/utils/validation";
import {
  getAllTournaments,
  getTournamentById,
  getTournamentRound,
  getTournamentRounds,
  getTournamentRoundStatus,
  getCurrentRoundMatches,
  joinAsReferee,
  getMatchDetails,
  getRefereeMatchDetails,
  createTournament,
  getHostedTournaments,
  getRefereeTournaments,
  getRegisteredTournaments,
  addTournamentReferee,
  removeTournamentReferee,
  deleteTournament,
  // Tournament Engine controllers
  getEngineInfo,
  getEngineStandings,
  getEngineTeams,
  getEngineMatches,
  getEngineNextAction,
  engineInitializeGroups,
  engineStartNextRound,
  engineSwapTeam,
  engineReset,
  engineSetAllWinners,
  engineSetMatchWinner,
} from "@/controllers/tournaments.controller";
import {
  getTournamentRegistrations,
  registerForTournament,
} from "@/controllers/registrations.controller";
import {
  inviteToTournament,
  generateShareableLink,
  getInviteByToken,
  acceptInviteByToken,
  updateTournamentInvite,
  getTournamentInvites,
} from "@/controllers/tournamentInvites.controller";
import {
  createRegistrationSchema,
  createTournamentInviteSchema,
  tournamentInviteTokenSchema,
  tournamentInviteIdSchema,
  updateTournamentInviteSchema,
} from "@/utils/validation";

export const tournamentsRoutes = new Hono<AuthContext>();

// POST /tournaments - Create a new tournament
tournamentsRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createTournamentSchema),
  createTournament
);

// GET /tournaments/hosted - Get tournaments hosted by current player
tournamentsRoutes.get(
  "/hosted",
  authMiddleware,
  getHostedTournaments
);

// GET /tournaments/referee - Get tournaments where current player is a referee
tournamentsRoutes.get(
  "/referee",
  authMiddleware,
  getRefereeTournaments
);

// GET /tournaments/registered - Get tournaments where current player is registered
tournamentsRoutes.get(
  "/registered",
  authMiddleware,
  getRegisteredTournaments
);

// GET /tournaments/invites/:token - Get invite details by token (PUBLIC - no auth required)
// IMPORTANT: This must come before /:id to avoid route conflicts
tournamentsRoutes.get(
  "/invites/:token",
  zValidator("param", tournamentInviteTokenSchema),
  getInviteByToken
);

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

// GET /tournaments/:id/rounds - Get tournament rounds from metadata
tournamentsRoutes.get(
  "/:id/rounds",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getTournamentRounds
);

// GET /tournaments/:id/round-status - Get current round status
tournamentsRoutes.get(
  "/:id/round-status",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getTournamentRoundStatus
);

// GET /tournaments/:id/current-round-matches - Get matches for current round
tournamentsRoutes.get(
  "/:id/current-round-matches",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getCurrentRoundMatches
);

// GET /tournaments/:id/invites - Get all invites for a tournament
// IMPORTANT: This must come before /:id/:round to avoid route conflicts
tournamentsRoutes.get(
  "/:id/invites",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getTournamentInvites
);

// ============================================================================
// TOURNAMENT ENGINE ROUTES (Group + Knockout Format)
// IMPORTANT: These must come before /:id/:round to avoid route conflicts
// ============================================================================

// GET /tournaments/:id/engine/info - Get tournament engine info
tournamentsRoutes.get(
  "/:id/engine/info",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getEngineInfo
);

// GET /tournaments/:id/engine/standings - Get group standings
tournamentsRoutes.get(
  "/:id/engine/standings",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getEngineStandings
);

// GET /tournaments/:id/engine/teams - Get registered teams with group assignments
tournamentsRoutes.get(
  "/:id/engine/teams",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getEngineTeams
);

// GET /tournaments/:id/engine/matches - Get all matches (optional filter by round/status)
tournamentsRoutes.get(
  "/:id/engine/matches",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("query", engineMatchFilterSchema.partial()),
  getEngineMatches
);

// GET /tournaments/:id/engine/next-action - Get next action needed
tournamentsRoutes.get(
  "/:id/engine/next-action",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getEngineNextAction
);

// POST /tournaments/:id/engine/initialize - Initialize groups (host only)
tournamentsRoutes.post(
  "/:id/engine/initialize",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("json", initializeGroupsSchema),
  engineInitializeGroups
);

// POST /tournaments/:id/engine/next-round - Start next round (host only)
tournamentsRoutes.post(
  "/:id/engine/next-round",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  engineStartNextRound
);

// POST /tournaments/:id/engine/swap-team - Swap team between groups (host only)
tournamentsRoutes.post(
  "/:id/engine/swap-team",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("json", swapTeamGroupSchema),
  engineSwapTeam
);

// POST /tournaments/:id/engine/reset - Reset tournament (host only)
tournamentsRoutes.post(
  "/:id/engine/reset",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  engineReset
);

// POST /tournaments/:id/engine/set-all-winners - Set all pending matches with Team 1 as winner (testing)
tournamentsRoutes.post(
  "/:id/engine/set-all-winners",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  engineSetAllWinners
);

// POST /tournaments/engine/match/:matchId/winner - Set match winner
tournamentsRoutes.post(
  "/engine/match/:matchId/winner",
  authMiddleware,
  zValidator("param", engineMatchIdSchema),
  zValidator("json", setMatchWinnerSchema),
  engineSetMatchWinner
);

// GET /tournaments/:id/:round - Get tournament round details
// IMPORTANT: This MUST come AFTER all /engine/* routes to avoid conflicts
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

// GET /tournaments/:id/registrations - Get all registrations for a tournament
tournamentsRoutes.get(
  "/:id/registrations",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  getTournamentRegistrations
);

// POST /tournaments/:id/register - Register for a tournament
tournamentsRoutes.post(
  "/:id/register",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("json", createRegistrationSchema.partial()),
  registerForTournament
);

// POST /tournaments/:id/referees - Add a referee to a tournament
tournamentsRoutes.post(
  "/:id/referees",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("json", addTournamentRefereeSchema),
  addTournamentReferee
);

// DELETE /tournaments/:id/referees/:playerId - Remove a referee from a tournament
tournamentsRoutes.delete(
  "/:id/referees/:player_id",
  authMiddleware,
  zValidator("param", removeTournamentRefereeSchema),
  removeTournamentReferee
);

// DELETE /tournaments/:id - Delete tournament and all related data
tournamentsRoutes.delete(
  "/:id",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  deleteTournament
);

// POST /tournaments/:id/invite - Invite friend to tournament team
tournamentsRoutes.post(
  "/:id/invite",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("json", createTournamentInviteSchema),
  inviteToTournament
);

// POST /tournaments/:id/invite/link - Generate shareable invite link
tournamentsRoutes.post(
  "/:id/invite/link",
  authMiddleware,
  zValidator("param", tournamentIdSchema),
  zValidator("json", createTournamentInviteSchema.partial()),
  generateShareableLink
);

// POST /tournaments/invites/:token/accept - Accept invite via token (for new users)
tournamentsRoutes.post(
  "/invites/:token/accept",
  authMiddleware,
  zValidator("param", tournamentInviteTokenSchema),
  acceptInviteByToken
);

// PUT /tournaments/invites/:id - Accept/reject invite (for platform users)
tournamentsRoutes.put(
  "/invites/:id",
  authMiddleware,
  zValidator("param", tournamentInviteIdSchema),
  zValidator("json", updateTournamentInviteSchema),
  updateTournamentInvite
);

