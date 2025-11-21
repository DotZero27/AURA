"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useRefereeMatch,
  useUpdateRefereeMatch,
} from "@/hooks/useRefereeMatch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MoreVertical, RotateCcw, Plus, Undo2, User } from "lucide-react";

export default function RefereeMatchPage() {
  const params = useParams();
  const router = useRouter();
  const [positions, setPositions] = useState({
    pos1: null,
    pos2: null,
    pos3: null,
    pos4: null,
  });

  const { data: matchData, isLoading } = useRefereeMatch(
    params.id,
    params.round,
    params.match
  );
  const updateMutation = useUpdateRefereeMatch();

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!matchData) {
    return <div className="p-4 text-center">Match not found</div>;
  }

  const { players, scores, round, court, match_format } = matchData;

  // Group players into teams by team_id
  const teamIds = [
    ...new Set(players?.map((p) => p.team_id).filter(Boolean) || []),
  ];
  const teamA = players?.filter((p) => p.team_id === teamIds[0]) || [];
  const teamB = players?.filter((p) => p.team_id === teamIds[1]) || [];

  const currentScore = scores ? `${scores.teamA} - ${scores.teamB}` : "0 - 0";

  const handleScoreUpdate = (teamId) => {
    updateMutation.mutate({
      tournamentId: params.id,
      round: params.round,
      matchId: params.match,
      data: {
        newScore: teamId,
        stepback: false,
        positions: positions,
      },
    });
  };

  const handleStepBack = () => {
    updateMutation.mutate({
      tournamentId: params.id,
      round: params.round,
      matchId: params.match,
      data: {
        stepback: true,
        positions: positions,
      },
    });
  };

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-bold">ATP World Tour</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </header>

      {/* Score Section */}
      <div className="px-4 py-4">
        <div className=" flex items-center justify-center gap-3 mb-4">
          <div className="relative bg-[#2ABF93] text-4xl font-bold py-4 px-12 rounded-lg text-center">
            <span className="text-white">{currentScore}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleStepBack}
              className="absolute top-1/2 -translate-y-1/2 -left-12"
            >
              <Undo2 className="size-5" />
            </Button>
          </div>
        </div>

        {/* Court Layout - Complex Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-5 gap-0.5">
            {/* Left Dark Green Rectangle */}
            <div className="col-span-1 bg-[#3E7D68] flex items-center justify-center min-h-[200px]">
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-[#ABD1C4] rounded-full"
              >
                <Plus className="size-6 text-gray-800" />
              </Button>
            </div>

            {/* Center 2x2 Grid */}
            <div className="col-span-3 grid grid-cols-2 gap-0.5 border-t border-b">
              {/* Top Left */}
              <div className=" flex items-center justify-center min-h-[100px] border-r border-b">
                <div className="size-12 bg-[#DBEAE5] rounded-full" />
              </div>
              {/* Top Right */}
              <div className="flex items-center justify-center min-h-[100px] border-b">
                <div className="size-12 bg-[#DBEAE5] rounded-full" />
              </div>
              {/* Bottom Left */}
              <div className="flex items-center justify-center min-h-[100px] border-r">
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-[#E5E4EA] rounded-full"
              >
                <Plus className="size-6 text-white" />
              </Button>
              </div>
              {/* Bottom Right */}
              <div className="flex items-center justify-center min-h-[100px]">
                <div className="size-12 bg-[#DBEAE5] rounded-full" />
              </div>
            </div>

            {/* Right Dark Green Rectangle */}
            <div className="col-span-1 bg-[#3E7D68] flex items-center justify-center min-h-[200px]">
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-[#ABD1C4] rounded-full"
              >
                <Plus className="size-6 text-gray-800" />
              </Button>
            </div>
          </div>
        </div>

        {/* Player Icon */}
        <div className="flex justify-center mb-4">
          <User className="size-8 text-gray-500" />
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="border-r border-gray-200">
            <div className="text-xs text-gray-600 mb-1">ROUND</div>
            <div className="font-semibold">{round}</div>
          </div>
          <div className="border-r border-gray-200">
            <div className="text-xs text-gray-600 mb-1">COURT</div>
            <div className="font-semibold">{court}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">VIEWER</div>
            <div className="font-semibold">3</div>
          </div>
        </div>

        {/* Teams Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Teams</h3>
          </div>

          <Tabs defaultValue="right" className="w-full">
            <TabsList className="mb-3 w-fit">
              <TabsTrigger value="left">Left</TabsTrigger>
              <TabsTrigger value="right">Right</TabsTrigger>
            </TabsList>

            <TabsContent value="left" className="space-y-2 mt-0">
              {teamA.length > 0 ? (
                teamA.map((player) => (
                  <div key={player.id} className="flex items-center gap-3">
                    <div className="size-10 bg-green-200 rounded-full" />
                    <span className="font-medium">
                      {player.name || player.username || "Player"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No players in team Left
                </div>
              )}
            </TabsContent>

            <TabsContent value="right" className="space-y-2 mt-0">
              {teamB.length > 0 ? (
                teamB.map((player) => (
                  <div key={player.id} className="flex items-center gap-3">
                    <div className="size-10 bg-green-200 rounded-full" />
                    <span className="font-medium">
                      {player.name || player.username || "Player"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No players in team Right
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
