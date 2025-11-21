'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTournamentRound } from '@/hooks/useTournamentRound';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronDown, Maximize2 } from 'lucide-react';

export default function TournamentRoundPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pairings');
  const [selectedRound, setSelectedRound] = useState(params.round || 'R1');

  const { data: roundData, isLoading } = useTournamentRound(params.id, selectedRound);

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  const pairings = roundData?.round?.pairings || [];
  const leaderboard = roundData?.round?.leaderboard || [];

  // Group pairings by court
  const pairingsByCourt = pairings.reduce((acc, pairing) => {
    const court = pairing.court || 'Unknown';
    if (!acc[court]) acc[court] = [];
    acc[court].push(pairing);
    return acc;
  }, {});

  // Get top 3 and remaining players
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const rounds = ['R1', 'R2', 'R3', 'R4', 'QF', 'SF', 'F'];

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold">ATP World Tour</h1>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Men&apos;s Doubles</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Round Navigation */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {rounds.map((round) => (
            <Button
              key={round}
              variant={selectedRound === round ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRound(round)}
              className={selectedRound === round ? 'bg-purple-600 text-white' : ''}
            >
              {round}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pairings')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'pairings'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500'
          }`}
        >
          Pairings
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'leaderboard'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'pairings' ? (
          <div className="space-y-4">
            {Object.entries(pairingsByCourt).map(([court, courtPairings]) => (
              <div key={court}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-purple-600">
                    {selectedRound} Round • Court {court}
                  </h3>
                  {courtPairings.some((p) => p.status === 'live') && (
                    <Badge className="bg-green-100 text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      LIVE
                    </Badge>
                  )}
                  {!courtPairings.some((p) => p.status === 'live') && (
                    <span className="text-sm text-purple-600">Complete</span>
                  )}
                </div>
                {courtPairings.map((pairing) => (
                  <Card key={pairing.id} className="p-3 mb-2">
                    <div className="space-y-2">
                      {pairing.players?.slice(0, 2).map((player, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                            <span className="text-sm">
                              {player.name || `${player.username || 'Player'}`}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {pairing.scores && (
                              <>
                                <span className={idx === 0 && pairing.scores.teamA > pairing.scores.teamB ? 'text-green-600 font-semibold' : ''}>
                                  {pairing.scores.teamA}
                                </span>
                                <span className={idx === 1 && pairing.scores.teamB > pairing.scores.teamA ? 'text-green-600 font-semibold' : ''}>
                                  {pairing.scores.teamB}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Display */}
            {topThree.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-6">
                {topThree.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex flex-col items-center ${
                      index === 1 ? 'order-first' : ''
                    }`}
                  >
                    <div className="relative mb-2">
                      <div className="w-20 h-20 bg-gray-200 rounded-full" />
                      <Badge
                        className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 ${
                          index === 0
                            ? 'bg-purple-600 text-white'
                            : index === 1
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-400 text-white'
                        }`}
                      >
                        {index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-center mb-1">
                      {player.name || player.username}
                    </p>
                    <Badge className="bg-purple-100 text-purple-700">
                      {player.wins || 0}pts
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Remaining Players */}
            <div className="space-y-2">
              {remaining.map((player, index) => (
                <Card key={player.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                      {index + 4}
                    </Badge>
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {player.name || player.username}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-gray-600">
                      {player.wins || 0}pts
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

