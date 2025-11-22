"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// Format player name with dot (e.g., "Hugh . Saturation")
function formatPlayerName(player) {
  const name = player.name || player.username || "Player";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]} . ${parts.slice(1).join(" ")}`;
  }
  return name;
}

// Format scores for display
function formatScores(pairing) {
  if (!pairing.scores) return null;
  const { teamA, teamB } = pairing.scores;

  // Convert scores to arrays for multi-set display
  const formatScore = (score) => {
    if (score === null || score === undefined || score === "") return [];
    if (Array.isArray(score)) {
      return score.filter(
        (s) => s !== null && s !== undefined && s !== ""
      );
    }
    // For single score value, show it twice to match the design pattern
    return [score, score];
  };

  return {
    teamA: formatScore(teamA),
    teamB: formatScore(teamB),
  };
}

// Skeleton loader for pairings
function PairingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((pairing) => (
        <div key={pairing} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            {/* Team A - always shown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex flex-col gap-0.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
            {/* Team B - only show for some pairings to match real data */}
            {pairing % 2 === 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-4 w-6" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PairingsTab({ pairingsByCourt, selectedRound, isLoading }) {
  if (isLoading) {
    return <PairingsSkeleton />;
  }

  // Flatten pairingsByCourt into a single array of pairings with court info
  const allPairings = Object.entries(pairingsByCourt).flatMap(([court, courtPairings]) =>
    courtPairings.map((pairing) => ({
      ...pairing,
      court: court,
    }))
  );

  if (allPairings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-gray-500 py-8"
      >
        No pairings available for this round
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {allPairings.map((pairing) => {
        const teamA =
          pairing.players?.filter((p) => p.team === "A") || [];
        const teamB =
          pairing.players?.filter((p) => p.team === "B") || [];
        const scores = formatScores(pairing);
        const hasTeamB = teamB.length > 0;
        const isLive = pairing.status === "live";
        const isComplete = pairing.status === "complete";

        return (
          <div key={pairing.id} className="bg-white rounded-lg border">
            <div className="flex items-center justify-between rounded-t-lg p-4 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-purple-600">
                {selectedRound} Round • Court {pairing.court}
              </h3>
              {isLive && (
                <div className="flex items-center gap-1 text-green-600">
                  <span className="size-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              )}
              {isComplete && (
                <span className="text-sm text-purple-600 font-medium">
                  Complete
                </span>
              )}
            </div>
            <div className="space-y-2 px-4 py-2">
              {/* Team A */}
              {teamA.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 bg-linear-to-b from-white to-gray-300 rounded-full" />
                    <span className="text-sm capitalize">
                      {teamA.map((p) => formatPlayerName(p)).join(" & ")}
                    </span>
                  </div>
                  {scores && scores.teamA.length > 0 && (
                    <div className="flex flex-col gap-0.5 text-sm font-medium">
                      {scores.teamA.map((score, idx) => (
                        <span key={idx}>{score}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Team B - only show if team B exists */}
              {hasTeamB && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 bg-linear-to-b from-white to-gray-300 rounded-full" />
                    <span className="text-sm capitalize">
                      {teamB.map((p) => formatPlayerName(p)).join(" & ")}
                    </span>
                  </div>
                  {scores && scores.teamB.length > 0 && (
                    <div className="flex flex-col gap-0.5 text-sm font-medium">
                      {scores.teamB.map((score, idx) => (
                        <span key={idx}>{score}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

