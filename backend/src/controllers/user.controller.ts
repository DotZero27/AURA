import { HTTPException } from "hono/http-exception";
import { supabase } from "@/lib/supabase";
import type { Context } from "hono";
import type { AuthContext } from "@/middleware/auth";

// GET /user/details - Get comprehensive user details
export async function getUserDetails(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const userId = c.get("userId");
    const email = c.get("userEmail");

    // Get player details
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, username, dob, gender, photo_url, user_id")
      .eq("id", playerId)
      .single();

    if (playerError || !player) {
      throw new HTTPException(404, { message: "Player not found" });
    }

    // Calculate age
    const today = new Date();
    const birthDate = new Date(player.dob);
    const age = today.getFullYear() - birthDate.getFullYear();

    // Get aura rating
    const { data: rating } = await supabase
      .from("ratings")
      .select("aura_mu, aura_sigma")
      .eq("player_id", playerId)
      .single();

    // Get tournaments where user is host
    const { data: hostedTournaments } = await supabase
      .from("tournaments")
      .select("id")
      .eq("host_id", playerId);

    const hostForTournaments = hostedTournaments?.map((t: any) => t.id) || [];

    // Get tournaments where user is referee
    const { data: refereeTournaments } = await supabase
      .from("tournaments_referee")
      .select("tournament_id")
      .eq("player_id", playerId);

    const refereeForTournaments =
      refereeTournaments?.map((r: any) => r.tournament_id) || [];

    // Get all matches for this player
    // First, get all teams this player is part of
    const { data: playerTeams } = await supabase
      .from("team_players")
      .select("team_id")
      .eq("player_id", playerId);

    const teamIds = playerTeams?.map((pt: any) => pt.team_id) || [];

    if (teamIds.length > 0) {
      // Get pairings for these teams
      const { data: pairings } = await supabase
        .from("pairing")
        .select("match_id, tournament_id")
        .in("team_id", teamIds);

      const matchIds =
        pairings?.map((p: any) => p.match_id).filter(Boolean) || [];
      const tournamentIds = Array.from(
        new Set(
          pairings?.map((p: any) => p.tournament_id).filter(Boolean) || []
        )
      );

      // Get match details
      const { data: matches } = await supabase
        .from("matches")
        .select(
          `
        id,
        tournament_id,
        status,
        court_id,
        round,
        winner_team,
        courts (
          court_number
        )
      `
        )
        .in("id", matchIds);

      // Get tournament names
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, name")
        .in("id", tournamentIds);

      const tournamentMap = new Map(
        tournaments?.map((t: any) => [t.id, t.name]) || []
      );

      // Get all pairings for these matches to get team info
      const { data: allPairings } = await supabase
        .from("pairing")
        .select(
          `
        id,
        match_id,
        team_id,
        team:team_id (
          id,
          name
        )
      `
        )
        .in("match_id", matchIds);

      // Get all team players for these teams
      const allTeamIds =
        allPairings?.map((p: any) => p.team_id).filter(Boolean) || [];
      const { data: allTeamPlayers } = await supabase
        .from("team_players")
        .select(
          `
        team_id,
        player_id,
        created_at,
        players (
          id,
          username,
          photo_url
        )
      `
        )
        .in("team_id", allTeamIds);

      // Get scores for all matches
      const { data: allScores } = await supabase
        .from("scores")
        .select(
          `
        id,
        match_id,
        team_a,
        team_b,
        created_at
      `
        )
        .in("match_id", matchIds);

      // Build match details
      const matchDetails =
        matches?.map((match: any) => {
          const matchPairings =
            allPairings?.filter((p: any) => p.match_id === match.id) || [];
          const matchScores =
            allScores?.filter((s: any) => s.match_id === match.id) || [];
          const latestScore = matchScores[matchScores.length - 1] || null;

          // Get teams for this match
          const teams =
            matchPairings.map((p: any, index: number) => {
              const team = Array.isArray(p.team) ? p.team[0] : p.team;
              const players =
                allTeamPlayers
                  ?.filter((tp: any) => tp.team_id === p.team_id)
                  .map((tp: any) => {
                    const player = Array.isArray(tp.players)
                      ? tp.players[0]
                      : tp.players;
                    return {
                      id: player?.id,
                      name: player?.username,
                      username: player?.username,
                      team_id: p.team_id,
                      team: index === 0 ? "A" : "B",
                      created_at: tp.created_at,
                    };
                  }) || [];
              return { team_id: p.team_id, players };
            }) || [];

          const allPlayers = teams.flatMap((t: any) => t.players);
          const court = Array.isArray(match.courts)
            ? match.courts[0]
            : match.courts;

          return {
            match_id: match.id,
            tournament_name: tournamentMap.get(match.tournament_id) || "",
            round: match.round,
            status: match.status,
            court: court?.court_number || null,
            scores: {
              teamA: latestScore?.team_a || 0,
              teamB: latestScore?.team_b || 0,
            },
            players: allPlayers,
          };
        }) || [];

      return c.json({
        data: {
          name: player.username,
          username: player.username,
          email: email,
          aura: rating?.aura_mu || null,
          age: age.toString(),
          gender: player.gender,
          host_for_tournaments: hostForTournaments,
          referee_for_tournaments: refereeForTournaments,
          tournaments: matchDetails,
        },
      });
    } else {
      // No teams/matches found
      return c.json({
        data: {
          name: player.username,
          username: player.username,
          email: email,
          aura: rating?.aura_mu || null,
          age: age.toString(),
          gender: player.gender,
          host_for_tournaments: hostForTournaments,
          referee_for_tournaments: refereeForTournaments,
          tournaments: [],
        },
      });
    }
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}
