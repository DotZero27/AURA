"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useMatch } from "@/hooks/useMatch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createWebSocketConnection } from "@/lib/websocket";
import { toast } from "sonner";

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [currentSet, setCurrentSet] = useState(1);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winRate, setWinRate] = useState(50);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winnerTeamId, setWinnerTeamId] = useState(null);
  const wsConnectionRef = useRef(null);

  const { data: matchData, isLoading } = useMatch(
    params.id,
    params.round,
    params.match
  );

  // Update match ended state when matchData changes
  useEffect(() => {
    if (matchData?.status === "completed") {
      setMatchEnded(true);
      setWinnerTeamId(matchData?.winner_team_id || null);
    }
  }, [matchData?.status, matchData?.winner_team_id]);

  // Initialize score from DB and connect to WebSocket
  useEffect(() => {
    if (!matchData) return;

    // Initialize score from latest DB score
    const latestScore =
      matchData.scores && matchData.scores.length > 0
        ? matchData.scores[matchData.scores.length - 1]
        : null;

    if (latestScore) {
      const teamA = latestScore.team_a || 0;
      const teamB = latestScore.team_b || 0;
      setScoreA(teamA);
      setScoreB(teamB);

      // Use win_prob_A from backend if available, otherwise calculate fallback
      if (matchData.win_prob_A !== null && matchData.win_prob_A !== undefined) {
        setWinRate(matchData.win_prob_A);
      } else {
        // Fallback: calculate from score ratio
        const total = teamA + teamB;
        const initialWinRate = total > 0 ? Math.round((teamA / total) * 100) : 50;
        setWinRate(initialWinRate);
      }
    } else {
      // No scores yet, use win_prob_A if available or default to 50
      if (matchData.win_prob_A !== null && matchData.win_prob_A !== undefined) {
        setWinRate(matchData.win_prob_A);
      } else {
        setWinRate(50);
      }
    }

    // Connect to WebSocket for real-time updates
    const matchId = matchData.match_id;
    if (matchId) {
      // Get initial score from DB data
      const initialTeamA = latestScore?.team_a || 0;
      const initialTeamB = latestScore?.team_b || 0;

      const ws = createWebSocketConnection(`/ws/match/${matchId}/score`, {
        onOpen: (event, wsInstance) => {
          console.log("WebSocket connected for match", matchId);
          // Send initial score data to server
          if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
            wsInstance.send(
              JSON.stringify({
                type: "init",
                teamA: initialTeamA,
                teamB: initialTeamB,
              })
            );
          }
        },
        onClose: () => {
          console.log("WebSocket disconnected for match", matchId);
        },
        onError: (error) => {
          console.error("WebSocket error:", error);
        },
        onMessage: (data) => {
          if (data.type === "score_update") {
            setScoreA(data.teamA);
            setScoreB(data.teamB);
            // winRate from WebSocket is the win probability percentage
            if (data.winRate !== undefined && data.winRate !== null) {
              setWinRate(data.winRate);
            }
          } else if (data.type === "match_end") {
            setMatchEnded(true);
            setWinnerTeamId(data.winnerTeamId || null);
            toast.success("Match completed!");
          }
        },
        reconnect: true,
      });

      wsConnectionRef.current = ws;

      return () => {
        if (wsConnectionRef.current) {
          wsConnectionRef.current.close();
        }
      };
    }
  }, [matchData]);

  const handleIncrement = (team) => {
    if (matchEnded) {
      toast.error("Match has ended. Cannot add more points.");
      return;
    }
    if (wsConnectionRef.current) {
      wsConnectionRef.current.send({
        type: "increment",
        team: team,
      });
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!matchData) {
    return <div className="p-4 text-center">Match not found</div>;
  }

  const { players, round, court, match_format, tournament_name } = matchData;

  // Group players into teams
  const teamA = players?.filter((p) => p.team === "A") || [];
  const teamB = players?.filter((p) => p.team === "B") || [];

  // Get team IDs to determine winner
  const teamAId = teamA.length > 0 ? teamA[0]?.team_id : null;
  const teamBId = teamB.length > 0 ? teamB[0]?.team_id : null;
  const winnerTeamIdFromData = matchData?.winner_team_id || winnerTeamId;
  const isTeamAWinner =
    winnerTeamIdFromData &&
    teamAId &&
    String(winnerTeamIdFromData) === String(teamAId);
  const isTeamBWinner =
    winnerTeamIdFromData &&
    teamBId &&
    String(winnerTeamIdFromData) === String(teamBId);

  // Use WebSocket score state
  const currentScore = `${scoreA} - ${scoreB}`;

  // Calculate total sets (assuming best of 3)
  const totalSets = match_format?.total_rounds || 3;

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-bold">{tournament_name}</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </header>

      {/* Court and Round Info */}
      <div className="px-4 py-2">
        <div className="text-sm text-gray-600">
          <span>COURT {court}</span>
          <span className="mx-2">·</span>
          <span className="text-blue-600">Round {round}</span>
        </div>
      </div>

      {/* Players Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          {teamA.map((player, index) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {player.aura || "5.0"}
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center">
                {player.name || player.username || "Player"}
              </p>
            </div>
          ))}

          {/* Team B */}
          {teamB.map((player, index) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {player.aura || "5.0"}
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center">
                {player.name || player.username || "Player"}
              </p>
            </div>
          ))}
        </div>

        {/* Match Completed Indicator */}
        {matchEnded && (
          <div className="mt-6 flex items-center justify-center">
            <div className="px-4 py-2 bg-green-100 border-2 border-green-500 rounded-lg">
              <div className="text-sm font-semibold text-green-800 text-center">
                🏆 Match Completed
              </div>
              {winnerTeamIdFromData && (
                <div className="text-xs text-green-700 text-center mt-1">
                  {isTeamAWinner
                    ? "Team A Wins!"
                    : isTeamBWinner
                    ? "Team B Wins!"
                    : "Match Finished"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Score */}
        <div className="text-center mt-6 text-3xl font-bold mb-1">
          {currentScore}
        </div>
      </div>

      {/* Win Probability - Live from WebSocket */}
      <div className="px-4 py-4">
        <div className="text-sm text-gray-600 mb-2">WIN PROBABILITY</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-purple-600 font-semibold">{winRate.toFixed(1)}%</span>
            <span className="text-gray-400">{(100 - winRate).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <Card className="mx-4 p-4">
        <div className="h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">
          Graph visualization would go here
        </div>
      </Card>
    </div>
  );
}
