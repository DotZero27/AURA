"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { useTournament } from "@/hooks/useTournament";
import { useTournamentRound } from "@/hooks/useTournamentRound";
import { useTournamentRounds } from "@/hooks/useTournamentRounds";
import { useTournamentEngine } from "@/hooks/useTournamentEngine";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TournamentStatsHeader } from "@/components/tournaments/TournamentStatsHeader";
import { RoundNavigation } from "@/components/tournaments/RoundNavigation";
import { PairingsTab } from "@/components/tournaments/PairingsTab";
import { LeaderboardTab } from "@/components/tournaments/LeaderboardTab";
import { ScrollablePage, ScrollablePageHeader, ScrollablePageContent } from "@/components/layout/ScrollablePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Crown, Medal } from "lucide-react";

// Group Standings Component for Group+Knockout format
function GroupStandings({ standings, groups, teams }) {
  if (!standings || Object.keys(standings).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No standings available yet</p>
        <p className="text-sm">Matches need to be played first</p>
      </div>
    );
  }

  const groupKeys = Object.keys(standings).sort();

  return (
    <div className="space-y-4">
      {groupKeys.map((groupKey) => {
        const groupStandings = standings[groupKey] || [];
        
        return (
          <Card key={groupKey} className="overflow-hidden">
            <CardHeader className="py-3 bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {groupKey}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {groupStandings.map((team, idx) => (
                  <div 
                    key={team.team_id}
                    className={`flex items-center justify-between p-3 ${
                      team.qualified ? 'bg-green-50 dark:bg-green-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-6 ${
                        idx === 0 ? 'text-yellow-500' : 
                        idx === 1 ? 'text-gray-400' : 
                        'text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {team.name || team.display_name || `Team ${team.team_id}`}
                        </p>
                        {(team.player1_name || team.player2_name) && (
                          <p className="text-xs text-muted-foreground">
                            {team.player1_name} & {team.player2_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {team.wins}W - {team.losses}L
                      </Badge>
                      {team.qualified && (
                        <Badge className="text-xs bg-green-500">
                          Q
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {groupStandings.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No standings yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Matches List Component for Group+Knockout format
function MatchesList({ matches, stage }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No matches yet</p>
        <p className="text-sm">Start the first round to generate matches</p>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 'Unknown';
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  // Sort rounds: Group stage rounds first (GS-*), then knockout (QF, SF, F)
  const knockoutOrder = { 'QF': 1, 'SF': 2, 'F': 3 };
  const roundKeys = Object.keys(matchesByRound).sort((a, b) => {
    // Group stage rounds (GS-A-R1, GS-B-R1, etc.)
    const isGroupA = a.startsWith('GS-');
    const isGroupB = b.startsWith('GS-');
    
    if (isGroupA && isGroupB) {
      return a.localeCompare(b);
    }
    if (isGroupA) return -1;
    if (isGroupB) return 1;
    
    // Knockout rounds
    const orderA = knockoutOrder[a] || 0;
    const orderB = knockoutOrder[b] || 0;
    if (orderA && orderB) return orderA - orderB;
    
    // Fallback: numeric sort
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Helper to format round name
  const formatRoundName = (roundKey) => {
    if (roundKey.startsWith('GS-')) {
      // GS-A-R1 -> Group A - Round 1
      const parts = roundKey.split('-');
      if (parts.length === 3) {
        return `Group ${parts[1]} - Round ${parts[2].replace('R', '')}`;
      }
    }
    if (roundKey === 'QF') return 'Quarter Finals';
    if (roundKey === 'SF') return 'Semi Finals';
    if (roundKey === 'F') return 'Final';
    return `Round ${roundKey}`;
  };

  return (
    <div className="space-y-4">
      {roundKeys.map((roundKey) => {
        const roundMatches = matchesByRound[roundKey];
        
        return (
          <Card key={roundKey} className="overflow-hidden">
            <CardHeader className="py-3 bg-muted/30">
              <CardTitle className="text-sm font-bold">
                {formatRoundName(roundKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roundMatches.map((match) => {
                  // Get team names - backend returns 'name', not 'display_name'
                  // Fallback chain: name -> display_name -> team_id -> 'TBD'
                  const team1Name = match.team1?.name || match.team1?.display_name || 
                    (match.team1?.team_id ? `Team ${match.team1.team_id}` : 'TBD');
                  const team2Name = match.team2?.name || match.team2?.display_name || 
                    (match.team2?.team_id ? `Team ${match.team2.team_id}` : 'TBD');
                  
                  return (
                    <div 
                      key={match.match_id || match.id}
                      className="p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium text-sm ${
                            match.winner_team_id === match.team1?.team_id ? 'text-green-600 font-bold' : ''
                          }`}>
                            {team1Name}
                          </span>
                          {match.winner_team_id === match.team1?.team_id && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${
                            match.winner_team_id === match.team2?.team_id ? 'text-green-600 font-bold' : ''
                          }`}>
                            {team2Name}
                          </span>
                          {match.winner_team_id === match.team2?.team_id && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          match.status === 'completed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : match.status === 'in_progress'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : ''
                        }`}
                      >
                        {match.status?.replace('_', ' ') || 'pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function TournamentStatsPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [selectedRound, setSelectedRound] = useState("1");

  const { data: tournament, isLoading: tournamentLoading } = useTournament(
    params.id
  );
  const { data: roundsData, isLoading: roundsLoading } = useTournamentRounds(
    params.id
  );
  const { data: roundData, isLoading: roundLoading } = useTournamentRound(
    params.id,
    selectedRound
  );
  
  // Tournament Engine data for Group+Knockout format
  const { 
    info: engineInfo, 
    standings: engineStandings,
    teams: engineTeams,
    matches: engineMatches,
    isLoading: engineLoading,
    isGroupKnockout 
  } = useTournamentEngine(params.id);

  // Determine tournament format
  const tournamentFormat = useMemo(() => {
    if (!tournament) return 'swiss';
    let metadata = tournament.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }
    return metadata?.format || 'swiss';
  }, [tournament]);

  const isGroupKnockoutFormat = tournamentFormat === 'group_knockout' || isGroupKnockout;

  if (tournamentLoading) {
    return (
      <div className="pb-20">
        <div className="p-4 text-center">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="pb-20">
        <div className="p-4 text-center">Tournament not found</div>
      </div>
    );
  }

  const category =
    tournament.match_format?.eligible_gender === "M"
      ? "Men's Doubles"
      : tournament.match_format?.eligible_gender === "W"
      ? "Women's Doubles"
      : "Mixed Doubles";

  // Swiss format data
  const pairings = roundData?.round?.pairings || [];
  const leaderboard = roundData?.round?.leaderboard || [];

  // Group pairings by court (Swiss format)
  const pairingsByCourt = pairings.reduce((acc, pairing) => {
    const court = pairing.court || "Unknown";
    if (!acc[court]) acc[court] = [];
    acc[court].push(pairing);
    return acc;
  }, {});

  // Get top 3 and remaining players (Swiss format)
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Get rounds from API endpoint (parsed from metadata)
  const rounds = roundsData?.rounds || [];
  
  // Fallback: Generate rounds based on total_rounds if API data not available
  const fallbackRounds = [];
  if (rounds.length === 0 && !roundsLoading) {
    const totalRounds = tournament.match_format?.total_rounds || 7;
    // Add numbered rounds (1-4)
    for (let i = 1; i <= Math.min(totalRounds, 4); i++) {
      fallbackRounds.push(String(i));
    }
    // Add special rounds only if they don't conflict with numbered rounds
    if (totalRounds >= 5 && !fallbackRounds.includes("4")) fallbackRounds.push("4");
    if (totalRounds >= 6) fallbackRounds.push("8");
    if (totalRounds >= 7) fallbackRounds.push("16");
  }
  
  const displayRounds = rounds.length > 0 ? rounds : fallbackRounds;

  // Generate rounds for Group+Knockout format
  const groupKnockoutRounds = useMemo(() => {
    if (!isGroupKnockoutFormat || !engineInfo) return [];
    
    const rounds = [];
    const totalGroupRounds = engineInfo.total_group_rounds || 0;
    
    // Add group stage rounds
    for (let i = 1; i <= totalGroupRounds; i++) {
      rounds.push(`${i}`);
    }
    
    // Add knockout rounds based on teams advancing
    const teamsAdvancing = (engineInfo.number_of_groups || 2) * (engineInfo.teams_to_advance || 2);
    if (teamsAdvancing >= 8) rounds.push('QF');
    if (teamsAdvancing >= 4) rounds.push('SF');
    rounds.push('F');
    
    return rounds;
  }, [isGroupKnockoutFormat, engineInfo]);

  // Render Group+Knockout format
  if (isGroupKnockoutFormat) {
    return (
      <ScrollablePage className="bg-background">
        <ScrollablePageHeader className="pb-0 bg-transparent">
          <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40 supports-backdrop-filter:bg-background/60">
            <TournamentStatsHeader
              tournamentName={tournament.name}
              category={category}
            />
            {/* Stage indicator */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase">
                Group + Knockout
              </Badge>
              {engineInfo?.stage && (
                <Badge 
                  className={`text-xs ${
                    engineInfo.stage === 'knockout' 
                      ? 'bg-purple-500' 
                      : engineInfo.stage === 'group_stage'
                      ? 'bg-blue-500'
                      : engineInfo.stage === 'complete'
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                  }`}
                >
                  {engineInfo.stage?.replace('_', ' ')}
                </Badge>
              )}
              {engineInfo?.current_round > 0 && (
                <Badge variant="outline" className="text-xs">
                  Round {engineInfo.current_round}
                </Badge>
              )}
            </div>
          </header>
        </ScrollablePageHeader>

        <ScrollablePageContent className="pb-24 pt-4">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 inset-x-0 h-48 bg-linear-to-b from-brand-blue/10 to-transparent skew-y-3 origin-top-left scale-110 pointer-events-none -z-10" />
          <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none -z-10" />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <div className="px-4 mb-4">
              <TabsList className="w-full h-12 p-1.5 bg-muted/30 rounded-xl grid grid-cols-2">
                <TabsTrigger 
                  value="matches"
                  className="rounded-lg text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Matches
                </TabsTrigger>
                <TabsTrigger 
                  value="leaderboard"
                  className="rounded-lg text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  Standings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 px-4">
              <TabsContent value="matches" className="mt-0 space-y-4">
                {engineLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading matches...
                  </div>
                ) : (
                  <MatchesList 
                    matches={engineMatches} 
                    stage={engineInfo?.stage}
                  />
                )}
              </TabsContent>
              <TabsContent value="leaderboard" className="mt-0 space-y-4">
                {engineLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading standings...
                  </div>
                ) : (
                  <GroupStandings 
                    standings={engineStandings}
                    groups={engineInfo?.groups}
                    teams={engineTeams?.teams}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </ScrollablePageContent>
      </ScrollablePage>
    );
  }

  // Render Swiss format (original)
  return (
    <ScrollablePage className="bg-background">
      <ScrollablePageHeader className="pb-0 bg-transparent">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40 supports-backdrop-filter:bg-background/60">
          <TournamentStatsHeader
            tournamentName={tournament.name}
            category={category}
          />
          <div className="px-0 pb-2">
            <RoundNavigation
              rounds={displayRounds}
              selectedRound={selectedRound}
              onRoundChange={setSelectedRound}
            />
          </div>
        </header>
      </ScrollablePageHeader>

      <ScrollablePageContent className="pb-24 pt-4">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 inset-x-0 h-48 bg-linear-to-b from-brand-blue/10 to-transparent skew-y-3 origin-top-left scale-110 pointer-events-none -z-10" />
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none -z-10" />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
          <div className="px-4 mb-4">
            <TabsList className="w-full h-12 p-1.5 bg-muted/30 rounded-xl grid grid-cols-2">
              <TabsTrigger 
                value="pairings"
                className="rounded-lg text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                Pairings
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard"
                className="rounded-lg text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                Leaderboard
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content */}
          <div className="flex-1 px-4">
            <TabsContent value="pairings" className="mt-0 space-y-4">
              <PairingsTab
                pairingsByCourt={pairingsByCourt}
                selectedRound={selectedRound}
                isLoading={roundLoading}
              />
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-0 space-y-4">
              <LeaderboardTab
                topThree={topThree}
                remaining={remaining}
                isLoading={roundLoading}
              />
            </TabsContent>
          </div>
        </Tabs>
      </ScrollablePageContent>
    </ScrollablePage>
  );
}
