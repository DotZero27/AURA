'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMatch } from '@/hooks/useMatch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [currentSet, setCurrentSet] = useState(1);

  const { data: matchData, isLoading } = useMatch(params.id, params.round, params.match);

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!matchData) {
    return <div className="p-4 text-center">Match not found</div>;
  }

  const { players, scores, win_rate, round, court, match_format } = matchData;

  // Group players into teams
  const teamA = players?.filter((p) => p.team === 'A') || [];
  const teamB = players?.filter((p) => p.team === 'B') || [];

  // Get latest score
  const latestScore = scores && scores.length > 0 ? scores[scores.length - 1] : null;
  const currentScore = latestScore
    ? `${latestScore.team_a} - ${latestScore.team_b}`
    : '0 - 0';

  // Calculate total sets (assuming best of 3)
  const totalSets = match_format?.total_rounds || 3;

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">ATP World Tour</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
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
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          {teamA.map((player, index) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {player.aura || '5.0'}
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center">
                {player.name || player.username || 'Player'}
              </p>
            </div>
          ))}

          {/* Team B */}
          {teamB.map((player, index) => (
            <div key={player.id} className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {player.aura || '5.0'}
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center">
                {player.name || player.username || 'Player'}
              </p>
            </div>
          ))}
        </div>

        {/* Current Score */}
        <div className="text-center mt-6">
          <div className="text-3xl font-bold mb-1">{currentScore}</div>
          <div className="text-sm text-blue-600">SET {currentSet}/{totalSets}</div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="px-4 py-4">
        <div className="text-sm text-gray-600 mb-2">WIN RATE</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${win_rate || 50}%` }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-purple-600 font-semibold">{win_rate || 50}%</span>
            <span className="text-gray-400">{100 - (win_rate || 50)}%</span>
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <Card className="mx-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentSet(Math.max(1, currentSet - 1))}
            disabled={currentSet === 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-semibold">SET {currentSet}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentSet(Math.min(totalSets, currentSet + 1))}
            disabled={currentSet === totalSets}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">
          Graph visualization would go here
        </div>
      </Card>
    </div>
  );
}

