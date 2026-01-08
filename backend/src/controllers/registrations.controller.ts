import { HTTPException } from "hono/http-exception";
import { supabase } from "@/lib/supabase";
import type { Context } from "hono";
import type { AuthContext } from "@/middleware/auth";
import type { z } from "zod";
import type {
  tournamentIdSchema,
  registrationIdSchema,
  createRegistrationSchema,
} from "@/utils/validation";

// GET /registrations - Get all registrations for current player
export async function getMyRegistrations(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");

    const { data: registrations, error } = await supabase
      .from("registrations")
      .select(
        `
        id,
        tournament_id,
        txn_id,
        created_at,
        tournaments (
          id,
          name,
          start_time,
          end_time,
          registration_fee,
          image_url
        )
      `
      )
      .eq("player_id", playerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { registrations } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /tournaments/:id/registrations - Get all registrations for a tournament
export async function getTournamentRegistrations(c: Context<AuthContext>) {
  try {
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentIdSchema>;
    const tournamentId = parseInt(params.id);

    if (isNaN(tournamentId)) {
      throw new HTTPException(400, { message: "Invalid tournament ID" });
    }

    // Verify tournament exists
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, host_id")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      throw new HTTPException(404, { message: "Tournament not found" });
    }

    const playerId = c.get("playerId");
    // Only host can view registrations
    if (tournament.host_id !== playerId) {
      throw new HTTPException(403, { message: "Not authorized to view registrations" });
    }

    const { data: registrations, error } = await supabase
      .from("registrations")
      .select(
        `
        id,
        player_id,
        txn_id,
        created_at,
        players (
          id,
          username,
          photo_url
        )
      `
      )
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { registrations } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// POST /tournaments/:id/register - Register for a tournament
export async function registerForTournament(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentIdSchema>;
    const tournamentId = parseInt(params.id);
    const body = ((c.req as any).valid("json") as any) as Partial<z.infer<typeof createRegistrationSchema>>;

    if (isNaN(tournamentId)) {
      throw new HTTPException(400, { message: "Invalid tournament ID" });
    }

    // Get tournament details with match format
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select(
        `
        id,
        capacity,
        registration_fee,
        host_id,
        match_format:match_format (
          id,
          type
        )
      `
      )
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new HTTPException(404, { message: "Tournament not found" });
    }

    const matchFormat = Array.isArray(tournament.match_format)
      ? tournament.match_format[0]
      : tournament.match_format;

    const isDoubles = matchFormat?.type?.toLowerCase().includes("doubles") || false;

    // Host cannot register for their own tournament
    if (tournament.host_id === playerId) {
      throw new HTTPException(403, { message: "Tournament host cannot register as a player" });
    }

    // For doubles tournaments, require team_id
    if (isDoubles) {
      if (!body.team_id) {
        throw new HTTPException(400, { message: "team_id is required for doubles tournaments" });
      }

      // Verify team exists and player is a member
      const { data: teamMember, error: teamMemberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("team_id", body.team_id)
        .eq("player_id", playerId)
        .single();

      if (teamMemberError || !teamMember) {
        throw new HTTPException(403, { message: "You must be a member of the team to register" });
      }

      // Verify team has exactly 2 players
      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select("player_id")
        .eq("team_id", body.team_id);

      if (membersError) {
        throw new HTTPException(500, { message: membersError.message });
      }

      if (!teamMembers || teamMembers.length !== 2) {
        throw new HTTPException(400, { message: "Team must have exactly 2 players for doubles tournaments" });
      }

      // Check if any team member is the host
      const hostInTeam = teamMembers.some(member => member.player_id === tournament.host_id);
      if (hostInTeam) {
        throw new HTTPException(403, { message: "Tournament host cannot play in their own tournament" });
      }

      // Check if team is already registered
      const { data: existingTeamRegistration } = await supabase
        .from("registrations")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("team_id", body.team_id)
        .single();

      if (existingTeamRegistration) {
        throw new HTTPException(409, { message: "Team is already registered for this tournament" });
      }

      // Check capacity at team level (1 team = 1 slot for doubles)
      const { count: teamCount } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", tournamentId)
        .not("team_id", "is", null);

      if (teamCount !== null && teamCount >= tournament.capacity) {
        throw new HTTPException(400, { message: "Tournament is full" });
      }

      // Register team (create registration for each team member)
      const registrations = [];
      for (const member of teamMembers) {
        // Check if individual player is already registered
        const { data: existingRegistration } = await supabase
          .from("registrations")
          .select("id")
          .eq("tournament_id", tournamentId)
          .eq("player_id", member.player_id)
          .single();

        if (!existingRegistration) {
          const { data: registration, error: registrationError } = await supabase
            .from("registrations")
            .insert({
              tournament_id: tournamentId,
              player_id: member.player_id,
              team_id: body.team_id,
              txn_id: null,
            })
            .select()
            .single();

          if (registrationError) {
            throw new HTTPException(500, { message: registrationError.message });
          }

          registrations.push(registration);
        }
      }

      return c.json({ data: { registrations, team_id: body.team_id } }, 201);
    } else {
      // Singles tournament - individual registration
      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from("registrations")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("player_id", playerId)
        .single();

      if (existingRegistration) {
        throw new HTTPException(409, { message: "Already registered for this tournament" });
      }

      // Check capacity
      const { count } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", tournamentId);

      if (count !== null && count >= tournament.capacity) {
        throw new HTTPException(400, { message: "Tournament is full" });
      }

      // Create registration without transaction
      const { data: registration, error: registrationError } = await supabase
        .from("registrations")
        .insert({
          tournament_id: tournamentId,
          player_id: playerId,
          team_id: null,
          txn_id: null,
        })
        .select()
        .single();

      if (registrationError) {
        throw new HTTPException(500, { message: registrationError.message });
      }

      return c.json({ data: registration }, 201);
    }
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// DELETE /registrations/:id - Unregister from tournament
export async function unregisterFromTournament(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof registrationIdSchema>;
    const registrationId = parseInt(params.id);

    if (isNaN(registrationId)) {
      throw new HTTPException(400, { message: "Invalid registration ID" });
    }

    // Verify registration belongs to player
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, player_id")
      .eq("id", registrationId)
      .single();

    if (!registration) {
      throw new HTTPException(404, { message: "Registration not found" });
    }

    if (registration.player_id !== playerId) {
      throw new HTTPException(403, { message: "Not authorized to delete this registration" });
    }

    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", registrationId);

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

