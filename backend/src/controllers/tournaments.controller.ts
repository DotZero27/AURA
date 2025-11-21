import { HTTPException } from "hono/http-exception";
import { supabase } from "@/lib/supabase";
import type { Context } from "hono";
import type { AuthContext } from "@/middleware/auth";
import type { z } from "zod";
import type {
  tournamentQuerySchema,
  tournamentIdSchema,
  tournamentRoundSchema,
  tournamentMatchSchema,
  refereeMatchUpdateSchema,
} from "@/utils/validation";

// GET /tournaments - Get all tournaments with filtering
export async function getAllTournaments(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const queryParams = ((c.req as any).valid("query") as any) as z.infer<typeof tournamentQuerySchema>;
    const maxAge = queryParams.max_age;
    const eligibleGender = queryParams.eligible_gender;

    // Get player info for eligibility calculation
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, dob, gender")
      .eq("id", playerId)
      .single();

    if (playerError || !player) {
      throw new HTTPException(404, { message: "Player not found" });
    }

    const today = new Date();
    const birthDate = new Date(player.dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const gender = player.gender?.toLowerCase() || "";

    // Build query for tournaments
    let query = supabase.from("tournaments").select(`
      id,
      name,
      venue:venue (
        id,
        name,
        address
      ),
      image_url,
      start_time,
      end_time,
      registration_fee,
      capacity,
      match_format:match_format (
        id,
        total_rounds,
        max_age,
        eligible_gender
      ),
      metadata,
      registrations!left (
        player_id
      )
    `);

    // Apply filters if provided
    if (maxAge) {
      query = query.eq("match_format.max_age", maxAge);
    }
    if (eligibleGender) {
      const genderUpper = eligibleGender.toUpperCase();
      if (genderUpper === "MALE") {
        query = query.eq("match_format.eligible_gender", "M");
      } else if (genderUpper === "FEMALE") {
        query = query.eq("match_format.eligible_gender", "W");
      } else {
        query = query.eq("match_format.eligible_gender", genderUpper);
      }
    }

    const { data: tournaments, error: tourError } = await query;

    if (tourError) {
      throw new HTTPException(500, { message: tourError.message });
    }

    // Format tournaments with registration status and eligibility
    const formatted =
      tournaments?.map((t: any) => {
        const matchFormat = Array.isArray(t.match_format)
          ? t.match_format[0]
          : t.match_format;

        const maxAgeLimit = matchFormat?.max_age ?? 100;
        const eligibleGenderValue = matchFormat?.eligible_gender ?? "MW";

        // Eligibility logic
        const isAgeEligible = age <= maxAgeLimit;
        const isGenderEligible =
          eligibleGenderValue === "MW" ||
          (eligibleGenderValue === "M" && gender === "male") ||
          (eligibleGenderValue === "W" && gender === "female");

        const eligible = isAgeEligible && isGenderEligible;

        // Check if this player is registered
        const registrations = Array.isArray(t.registrations)
          ? t.registrations
          : [];
        const registered = registrations.some(
          (r: any) => r.player_id === playerId
        );

        // Get venue data (handle both object and array formats)
        const venue = Array.isArray(t.venue) ? t.venue[0] : t.venue;

        return {
          id: t.id,
          name: t.name,
          venue: {
            name: venue?.name || "",
            address: venue?.address || "",
            geocoords: venue?.metadata?.geocoords || null,
          },
          registration_fee: t.registration_fee || 0,
          registered,
          image_url: t.image_url,
          start_date: t.start_time,
          end_date: t.end_time,
          capacity: t.capacity,
          match_format: {
            total_rounds: matchFormat?.total_rounds || 0,
            max_age: matchFormat?.max_age || null,
            eligible_gender: matchFormat?.eligible_gender || "MW",
          },
        };
      }) || [];

    return c.json({ data: { tournaments: formatted } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /tournaments/:id - Get individual tournament details
export async function getTournamentById(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentIdSchema>;
    const queryParams = ((c.req as any).valid("query") as any) as Partial<z.infer<typeof tournamentQuerySchema>>;
    const tournamentId = params.id;
    const mini = queryParams.mini === "true";

    // Get player info
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, dob, gender")
      .eq("id", playerId)
      .single();

    if (playerError || !player) {
      throw new HTTPException(404, { message: "Player not found" });
    }

    const today = new Date();
    const birthDate = new Date(player.dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const gender = player.gender?.toLowerCase() || "";

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select(
        `
      id,
      name,
      description,
      image_url,
      start_time,
      end_time,
      capacity,
      registration_fee,
      venue:venue (
        id,
        name,
        address,
        metadata
      ),
      match_format:match_format (
        id,
        total_rounds,
        max_age,
        eligible_gender
      ),
      host_id,
      metadata
    `
      )
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.log(tournamentError, tournament);
      throw new HTTPException(404, { message: tournamentError?.message || "Tournament not found" });
    }

    // Mini mode - return minimal data
    if (mini) {
      const matchFormat = Array.isArray(tournament.match_format)
        ? tournament.match_format[0]
        : tournament.match_format;

      return c.json({
        data: {
          id: tournament.id,
          name: tournament.name,
          match_format: {
            total_rounds: matchFormat?.total_rounds || 0,
            max_age: matchFormat?.max_age || null,
            eligible_gender: matchFormat?.eligible_gender || "MW",
          },
        },
      });
    }

    // Full mode - get all details
    // Get host info
    const { data: host } = await supabase
      .from("players")
      .select("id, username, user_id, photo_url")
      .eq("id", tournament.host_id)
      .single();

    // Check if player is registered
    const { data: registration } = await supabase
      .from("registrations")
      .select("player_id")
      .eq("tournament_id", tournament.id)
      .eq("player_id", playerId)
      .single();

    const registered = !!registration;

    // Calculate eligibility
    const matchFormat = Array.isArray(tournament.match_format)
      ? tournament.match_format[0]
      : tournament.match_format;

    const eligibleGenderValue = matchFormat?.eligible_gender ?? "MW";
    const isAgeEligible = age <= (matchFormat?.max_age ?? 100);
    const isGenderEligible =
      eligibleGenderValue === "MW" ||
      (eligibleGenderValue === "M" && gender === "male") ||
      (eligibleGenderValue === "W" && gender === "female");
    const eligible = isAgeEligible && isGenderEligible;

    // Fetch referees
    const { data: referees } = await supabase
      .from("tournaments_referee")
      .select(
        `
      player_id,
      players!inner (
        username,
        user_id
      )
    `
      )
      .eq("tournament_id", tournament.id);

    // Get referee details
    // Note: Phone would need to be added to players table or fetched via service role client
    const refereeDetails = (referees || []).map((ref: any) => {
      const player = Array.isArray(ref.players) ? ref.players[0] : ref.players;
      return {
        player_id: ref.player_id,
        name: player?.username || null,
        phone: null, // Phone not available in current schema - would need players.phone column
      };
    });

    // Get venue data
    const venue = Array.isArray(tournament.venue)
      ? tournament.venue[0]
      : tournament.venue;

    return c.json({
      data: {
        id: tournament.id,
        name: tournament.name,
        venue: {
          name: venue?.name || "",
          address: venue?.address || "",
          geocoords: venue?.metadata?.geocoords || null,
        },
        registration_fee: tournament.registration_fee || 0,
        registered,
        image_url: tournament.image_url,
        start_date: tournament.start_time,
        end_date: tournament.end_time,
        capacity: tournament.capacity,
        match_format: {
          total_rounds: matchFormat?.total_rounds || 0,
          max_age: matchFormat?.max_age || null,
          eligible_gender: matchFormat?.eligible_gender || "MW",
        },
        hosted_by: host
          ? {
              id: host.id,
              name: host.username,
              username: host.username,
              photo_url: host.photo_url,
              phone: null, // Would need to fetch from user metadata
            }
          : null,
        referee: refereeDetails,
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /tournaments/:id/:round - Get tournament round details
export async function getTournamentRound(c: Context<AuthContext>) {
  try {
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentRoundSchema>;
    const tournamentId = params.id;
    const round = params.round;

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select(
        `
      id,
      name,
      match_format:match_format (
        id,
        total_rounds,
        max_age,
        eligible_gender
      )
    `
      )
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new HTTPException(404, { message: "Tournament not found" });
    }

    // Get all matches for this round
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
      id,
      status,
      court_id,
      round,
      pairing_id,
      winner_team,
      start_time,
      end_time,
      courts (
        court_number
      )
    `
      )
      .eq("tournament_id", tournamentId)
      .eq("round", round);

    if (matchesError) {
      throw new HTTPException(500, { message: matchesError.message });
    }

    // Get pairings for these matches
    const matchIds = matches?.map((m: any) => m.id) || [];
    const { data: pairings, error: pairingsError } = await supabase
      .from("pairing")
      .select(
        `
      id,
      match_id,
      team_id,
      team:team_id (
        id,
        name,
        avg_aura
      )
    `
      )
      .in("match_id", matchIds);

    if (pairingsError) {
      throw new HTTPException(500, { message: pairingsError.message });
    }

    // Get team players
    const teamIds = pairings?.map((p: any) => p.team_id).filter(Boolean) || [];
    const { data: teamPlayers, error: teamPlayersError } = await supabase
      .from("team_players")
      .select(
        `
      team_id,
      player_id,
      players (
        id,
        username,
        photo_url
      )
    `
      )
      .in("team_id", teamIds);

    if (teamPlayersError) {
      throw new HTTPException(500, { message: teamPlayersError.message });
    }

    // Get scores for matches
    const { data: scores, error: scoresError } = await supabase
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

    if (scoresError) {
      throw new HTTPException(500, { message: scoresError.message });
    }

    // Get ratings for players
    const playerIds =
      teamPlayers?.map((tp: any) => tp.player_id).filter(Boolean) || [];
    const { data: ratings } = await supabase
      .from("ratings")
      .select("player_id, aura_mu")
      .in("player_id", playerIds);

    const ratingsMap = new Map(
      ratings?.map((r: any) => [r.player_id, r.aura_mu]) || []
    );

    // Build pairings structure
    const pairingsMap = new Map();
    matches?.forEach((match: any) => {
      const matchPairings =
        pairings?.filter((p: any) => p.match_id === match.id) || [];
      const teams = matchPairings.map((p: any) => {
        const team = Array.isArray(p.team) ? p.team[0] : p.team;
        const players =
          teamPlayers
            ?.filter((tp: any) => tp.team_id === p.team_id)
            .map((tp: any) => {
              const player = Array.isArray(tp.players)
                ? tp.players[0]
                : tp.players;
              return {
                id: player?.id,
                name: player?.username,
                username: player?.username,
                photo_url: player?.photo_url,
                team_id: p.team_id,
                team: matchPairings.indexOf(p) === 0 ? "A" : "B",
                aura: ratingsMap.get(player?.id) || null,
                created_at: null, // Would need to get from team_players.created_at
              };
            }) || [];

        return {
          team_id: p.team_id,
          team_name: team?.name,
          players,
        };
      });

      const matchScores =
        scores?.filter((s: any) => s.match_id === match.id) || [];
      const latestScore = matchScores[matchScores.length - 1] || null;

      const court = Array.isArray(match.courts)
        ? match.courts[0]
        : match.courts;

      pairingsMap.set(match.id, {
        id: match.id,
        tournament_id: tournamentId,
        status: match.status,
        court: court?.court_number || null,
        match_id: match.id,
        players: teams.flatMap((t: any) => t.players),
        scores: {
          teamA: latestScore?.team_a || 0,
          teamB: latestScore?.team_b || 0,
        },
      });
    });

    // Build leaderboard (sort by wins)
    const playerWins = new Map();
    matches?.forEach((match: any) => {
      if (match.winner_team) {
        const winnerPairing = pairings?.find(
          (p: any) => p.team_id === match.winner_team
        );
        if (winnerPairing) {
          const winnerPlayers =
            teamPlayers?.filter(
              (tp: any) => tp.team_id === winnerPairing.team_id
            ) || [];
          winnerPlayers.forEach((tp: any) => {
            const currentWins = playerWins.get(tp.player_id) || 0;
            playerWins.set(tp.player_id, currentWins + 1);
          });
        }
      }
    });

    const leaderboard = Array.from(playerWins.entries())
      .map(([playerId, wins]) => {
        const tp = teamPlayers?.find((tp: any) => tp.player_id === playerId);
        const player = tp
          ? Array.isArray(tp.players)
            ? tp.players[0]
            : tp.players
          : null;
        return {
          id: player?.id,
          name: player?.username,
          username: player?.username,
          photo_url: player?.photo_url,
          aura: ratingsMap.get(playerId) || null,
          wins: wins,
        };
      })
      .sort((a, b) => b.wins - a.wins);

    const matchFormat = Array.isArray(tournament.match_format)
      ? tournament.match_format[0]
      : tournament.match_format;

    return c.json({
      data: {
        id: tournament.id,
        name: tournament.name,
        match_format: {
          total_rounds: matchFormat?.total_rounds || 0,
          max_age: matchFormat?.max_age || null,
          eligible_gender: matchFormat?.eligible_gender || "MW",
        },
        round: {
          pairings: Array.from(pairingsMap.values()),
          leaderboard,
        },
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// POST /tournaments/:id/join - Join as referee
export async function joinAsReferee(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentIdSchema>;
    const tournamentId = params.id;

    // Check if user is already a referee for this tournament
    const { data: existingReferee } = await supabase
      .from("tournaments_referee")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("player_id", playerId)
      .single();

    if (existingReferee) {
      return c.json({ data: { access: true } });
    }

    // Check if user can join as referee (basic validation - can be enhanced)
    // For now, we'll allow any authenticated user to join as referee
    // You can add additional checks here (e.g., referee certification, etc.)

    // Add referee
    const { error: insertError } = await supabase
      .from("tournaments_referee")
      .insert({
        tournament_id: tournamentId,
        player_id: playerId,
      });

    if (insertError) {
      throw new HTTPException(500, { message: insertError.message });
    }

    return c.json({ data: { access: true } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /tournaments/:id/:round/:match - Get match details
export async function getMatchDetails(c: Context<AuthContext>) {
  try {
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentMatchSchema>;
    const tournamentId = params.id;
    const round = params.round;
    const matchId = params.match;

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select(
        `
      id,
      name,
      match_format:match_format (
        id,
        total_rounds,
        max_age,
        eligible_gender
      )
    `
      )
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new HTTPException(404, { message: "Tournament not found" });
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        `
      id,
      status,
      court_id,
      round,
      winner_team,
      start_time,
      end_time,
      courts (
        court_number
      )
    `
      )
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .eq("round", round)
      .single();

    if (matchError || !match) {
      throw new HTTPException(404, { message: "Match not found" });
    }

    // Get pairings
    const { data: pairings, error: pairingsError } = await supabase
      .from("pairing")
      .select(
        `
      id,
      team_id,
      team:team_id (
        id,
        name
      )
    `
      )
      .eq("match_id", matchId);

    if (pairingsError) {
      throw new HTTPException(500, { message: pairingsError.message });
    }

    // Get team players
    const teamIds = pairings?.map((p: any) => p.team_id).filter(Boolean) || [];
    const { data: teamPlayers, error: teamPlayersError } = await supabase
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
      .in("team_id", teamIds);

    if (teamPlayersError) {
      throw new HTTPException(500, { message: teamPlayersError.message });
    }

    // Get all scores for this match
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select(
        `
      id,
      team_a,
      team_b,
      created_at
    `
      )
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (scoresError) {
      throw new HTTPException(500, { message: scoresError.message });
    }

    // Get ratings
    const playerIds =
      teamPlayers?.map((tp: any) => tp.player_id).filter(Boolean) || [];
    const { data: ratings } = await supabase
      .from("ratings")
      .select("player_id, aura_mu")
      .in("player_id", playerIds);

    const ratingsMap = new Map(
      ratings?.map((r: any) => [r.player_id, r.aura_mu]) || []
    );

    // Build players array with team assignments
    const teams =
      pairings?.map((p: any, index: number) => {
        const team = Array.isArray(p.team) ? p.team[0] : p.team;
        const players =
          teamPlayers
            ?.filter((tp: any) => tp.team_id === p.team_id)
            .map((tp: any) => {
              const player = Array.isArray(tp.players)
                ? tp.players[0]
                : tp.players;
              return {
                id: player?.id,
                name: player?.username,
                username: player?.username,
                photo_url: player?.photo_url,
                team_id: p.team_id,
                team: index === 0 ? "A" : "B",
                aura: ratingsMap.get(player?.id) || null,
                created_at: tp.created_at,
              };
            }) || [];
        return { team_id: p.team_id, players };
      }) || [];

    const allPlayers = teams.flatMap((t: any) => t.players);

    // Calculate win rate for team A
    const teamAScore =
      scores && scores.length > 0 ? scores[scores.length - 1].team_a : 0;
    const teamBScore =
      scores && scores.length > 0 ? scores[scores.length - 1].team_b : 0;
    const totalScore = teamAScore + teamBScore;
    const winRate =
      totalScore > 0
        ? ((teamAScore / totalScore) * 100).toFixed(1) + "%"
        : "0%";

    const court = Array.isArray(match.courts) ? match.courts[0] : match.courts;
    const matchFormat = Array.isArray(tournament.match_format)
      ? tournament.match_format[0]
      : tournament.match_format;

    return c.json({
      data: {
        match_id: match.id,
        tournament_name: tournament.name,
        round: match.round,
        status: match.status,
        court: court?.court_number || null,
        win_rate: winRate,
        match_format: {
          total_rounds: matchFormat?.total_rounds || 0,
          max_age: matchFormat?.max_age || null,
          eligible_gender: matchFormat?.eligible_gender || "MW",
        },
        scores:
          scores?.map((s: any) => ({
            id: s.id,
            team_a: s.team_a,
            team_b: s.team_b,
            created_at: s.created_at,
          })) || [],
        players: allPlayers,
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /tournaments/referee/:id/:round/:match - Get match details for referee
export async function getRefereeMatchDetails(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentMatchSchema>;
    const tournamentId = params.id;
    const round = params.round;
    const matchId = params.match;

    // Verify referee access
    const { data: referee } = await supabase
      .from("tournaments_referee")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("player_id", playerId)
      .single();

    if (!referee) {
      throw new HTTPException(403, { message: "Not authorized as referee" });
    }

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select(
        `
      id,
      name,
      match_format:match_format (
        id,
        total_rounds,
        max_age,
        eligible_gender
      )
    `
      )
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new HTTPException(404, { message: "Tournament not found" });
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        `
      id,
      status,
      court_id,
      round,
      courts (
        court_number
      )
    `
      )
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .eq("round", round)
      .single();

    if (matchError || !match) {
      throw new HTTPException(404, { message: "Match not found" });
    }

    // Get pairings
    const { data: pairings, error: pairingsError } = await supabase
      .from("pairing")
      .select(
        `
      id,
      team_id,
      team:team_id (
        id,
        name
      )
    `
      )
      .eq("match_id", matchId);

    if (pairingsError) {
      throw new HTTPException(500, { message: pairingsError.message });
    }

    // Get team players
    const teamIds = pairings?.map((p: any) => p.team_id).filter(Boolean) || [];
    const { data: teamPlayers, error: teamPlayersError } = await supabase
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
      .in("team_id", teamIds);

    if (teamPlayersError) {
      throw new HTTPException(500, { message: teamPlayersError.message });
    }

    // Get latest score
    const { data: latestScore, error: scoresError } = await supabase
      .from("scores")
      .select(
        `
      id,
      team_a,
      team_b
    `
      )
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (scoresError && scoresError.code !== "PGRST116") {
      // PGRST116 is "not found" which is okay
      throw new HTTPException(500, { message: scoresError.message });
    }

    // Get ratings
    const playerIds =
      teamPlayers?.map((tp: any) => tp.player_id).filter(Boolean) || [];
    const { data: ratings } = await supabase
      .from("ratings")
      .select("player_id, aura_mu")
      .in("player_id", playerIds);

    const ratingsMap = new Map(
      ratings?.map((r: any) => [r.player_id, r.aura_mu]) || []
    );

    // Build players array
    const teams =
      pairings?.map((p: any, index: number) => {
        const team = Array.isArray(p.team) ? p.team[0] : p.team;
        const players =
          teamPlayers
            ?.filter((tp: any) => tp.team_id === p.team_id)
            .map((tp: any) => {
              const player = Array.isArray(tp.players)
                ? tp.players[0]
                : tp.players;
              return {
                id: player?.id,
                name: player?.username,
                username: player?.username,
                photo_url: player?.photo_url,
                team_id: p.team_id,
                created_at: tp.created_at,
              };
            }) || [];
        return { team_id: p.team_id, players };
      }) || [];

    const allPlayers = teams.flatMap((t: any) => t.players);

    const court = Array.isArray(match.courts) ? match.courts[0] : match.courts;
    const matchFormat = Array.isArray(tournament.match_format)
      ? tournament.match_format[0]
      : tournament.match_format;

    return c.json({
      data: {
        match_id: match.id,
        tournament_name: tournament.name,
        round: match.round,
        status: match.status,
        court: court?.court_number || null,
        match_format: {
          total_rounds: matchFormat?.total_rounds || 0,
          max_age: matchFormat?.max_age || null,
          eligible_gender: matchFormat?.eligible_gender || "MW",
        },
        scores: {
          teamA: latestScore?.team_a || 0,
          teamB: latestScore?.team_b || 0,
        },
        players: allPlayers,
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// POST /tournaments/referee/:id/:round/:match - Update match score
export async function updateRefereeMatchScore(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof tournamentMatchSchema>;
    const body = ((c.req as any).valid("json") as any) as z.infer<typeof refereeMatchUpdateSchema>;
    const tournamentId = params.id;
    const round = params.round;
    const matchId = params.match;

    // Verify referee access
    const { data: referee } = await supabase
      .from("tournaments_referee")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("player_id", playerId)
      .single();

    if (!referee) {
      throw new HTTPException(403, { message: "Not authorized as referee" });
    }

    const { newScore, stepback, positions } = body;

    // Get current match and scores
    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("id", matchId)
      .single();

    if (!match) {
      throw new HTTPException(404, { message: "Match not found" });
    }

    // Get pairings to identify teams
    const { data: pairings } = await supabase
      .from("pairing")
      .select("id, team_id")
      .eq("match_id", matchId);

    if (!pairings || pairings.length < 2) {
      throw new HTTPException(400, { message: "Invalid match pairings" });
    }

    const teamAId = pairings[0].team_id;
    const teamBId = pairings[1].team_id;

    // Get latest score
    const { data: latestScore } = await supabase
      .from("scores")
      .select("id, team_a, team_b")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let newTeamAScore = latestScore?.team_a || 0;
    let newTeamBScore = latestScore?.team_b || 0;

    // Handle stepback
    if (stepback && latestScore) {
      // Delete the latest score
      await supabase.from("scores").delete().eq("id", latestScore.id);
      // Get previous score
      const { data: previousScore } = await supabase
        .from("scores")
        .select("team_a, team_b")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      newTeamAScore = previousScore?.team_a || 0;
      newTeamBScore = previousScore?.team_b || 0;
    } else {
      // Update score based on team_id
      if (newScore === teamAId) {
        newTeamAScore = (newTeamAScore || 0) + 1;
      } else if (newScore === teamBId) {
        newTeamBScore = (newTeamBScore || 0) + 1;
      } else {
        throw new HTTPException(400, {
          message: "Invalid team_id in newScore",
        });
      }

      // Insert new score
      const { error: scoreError } = await supabase.from("scores").insert({
        match_id: matchId,
        team_a: newTeamAScore,
        team_b: newTeamBScore,
      });

      if (scoreError) {
        throw new HTTPException(500, { message: scoreError.message });
      }
    }

    // Handle position updates if provided
    if (positions) {
      const { pos1, pos2, pos3, pos4 } = positions;

      // Validate positions - ensure 1,2 are one team and 3,4 are another
      if (!pos1 || !pos2 || !pos3 || !pos4) {
        throw new HTTPException(400, {
          message: "All positions must be provided",
        });
      }

      // Get current team assignments
      const { data: currentTeamPlayers } = await supabase
        .from("team_players")
        .select("team_id, player_id")
        .in("team_id", [teamAId, teamBId]);

      // Validate that positions 1,2 are on the same team and 3,4 are on the same team
      const pos1Team = currentTeamPlayers?.find(
        (tp: any) => tp.player_id === pos1
      )?.team_id;
      const pos2Team = currentTeamPlayers?.find(
        (tp: any) => tp.player_id === pos2
      )?.team_id;
      const pos3Team = currentTeamPlayers?.find(
        (tp: any) => tp.player_id === pos3
      )?.team_id;
      const pos4Team = currentTeamPlayers?.find(
        (tp: any) => tp.player_id === pos4
      )?.team_id;

      if (pos1Team !== pos2Team || pos3Team !== pos4Team) {
        throw new HTTPException(400, {
          message: "Positions must not be mixed between teams",
        });
      }

      // Update positions if needed (this would require a positions table or metadata)
      // For now, we'll just validate - actual position updates would need schema changes
    }

    return c.json({
      data: {
        success: true,
        scores: {
          teamA: newTeamAScore,
          teamB: newTeamBScore,
        },
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}
