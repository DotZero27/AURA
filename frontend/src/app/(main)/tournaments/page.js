"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Zap, Users, Trophy, Dot } from "lucide-react";
import { gamesApi } from "@/lib/api";
import {
  ScrollablePage,
  ScrollablePageHeader,
  ScrollablePageContent,
} from "@/components/layout/ScrollablePage";
import { GENDER_FILTERS } from "@/config";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");

  // Fetch games for filter
  const { data: gamesData } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const response = await gamesApi.getAll();
      return response.data.data;
    },
  });

  const games = gamesData?.games || [];

  // Build filters object
  const queryFilters = useMemo(() => {
    const filterObj = {};
    
    // Add gender filter if set
    if (filters.eligible_gender) {
      filterObj.eligible_gender = filters.eligible_gender;
    }
    
    // Add status filter
    if (showCompleted) {
      filterObj.status = "completed";
    } else if (showLiveOnly) {
      filterObj.status = "live";
    }
    
    // Add game filter
    if (selectedGameId) {
      filterObj.game_id = selectedGameId;
    }
    
    return filterObj;
  }, [filters, showLiveOnly, showCompleted, selectedGameId]);

  const { data: tournamentsData, isLoading, error } = useTournaments(queryFilters);

  const allTournaments = tournamentsData?.tournaments || [];

  const tournaments = useMemo(() => {
    let filtered = allTournaments;

    // Note: Status filtering is now handled by backend via queryFilters
    // Only apply client-side filtering for search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tournament) =>
          tournament.name?.toLowerCase().includes(query) ||
          tournament.venue?.name?.toLowerCase().includes(query) ||
          tournament.venue?.address?.toLowerCase().includes(query) ||
          tournament.game?.name?.toLowerCase().includes(query)
      );
    }

    // Sort tournaments: tournaments starting within an hour on top
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    filtered.sort((a, b) => {
      const aStart = a.start_date ? new Date(a.start_date) : null;
      const bStart = b.start_date ? new Date(b.start_date) : null;
      
      // Check if tournament starts within an hour
      const aStartsSoon = aStart && aStart > now && aStart <= oneHourFromNow;
      const bStartsSoon = bStart && bStart > now && bStart <= oneHourFromNow;
      
      // Tournaments starting within an hour come first
      if (aStartsSoon && !bStartsSoon) return -1;
      if (!aStartsSoon && bStartsSoon) return 1;
      
      // Then sort by start date (earliest first)
      if (aStart && bStart) {
        return aStart - bStart;
      }
      if (aStart) return -1;
      if (bStart) return 1;
      return 0;
    });

    return filtered;
  }, [allTournaments, searchQuery]);


  const handleFilterClick = (gender) => {
    setFilters((prev) => {
      // If clicking the same filter, clear it
      if (prev.eligible_gender === gender) {
        const { eligible_gender, ...rest } = prev;
        return rest;
      }
      // Otherwise, set the new filter
      return {
        ...prev,
        eligible_gender: gender,
      };
    });
  };

  const handleGameFilterClick = (gameId) => {
    setSelectedGameId((prev) => {
      // If clicking the same game, clear it
      if (prev === gameId) {
        return "";
      }
      // Otherwise, set the new game filter
      return gameId;
    });
  };

  return (
    <ScrollablePage className="bg-background">
      <ScrollablePageHeader className="pb-2 bg-transparent">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/40 supports-backdrop-filter:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black italic tracking-tighter text-foreground">
                AURA
              </span>
            </div>
          </div>
        </header>

        {/* Search & Filters */}
        <div className="px-4 py-2 space-y-3 pt-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-muted/40 border-transparent focus:bg-background focus:border-input transition-all rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none mask-[linear-gradient(to_right,transparent,white_2%,white_92%,transparent)]">
              <Button
                variant={showLiveOnly ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setShowLiveOnly(!showLiveOnly);
                  setShowCompleted(false);
                }}
                className={`rounded-full px-4 h-8 text-xs font-medium border ${
                  showLiveOnly
                    ? "border-transparent animate-pulse"
                    : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap
                  className={`size-3.5 mr-1.5 ${
                    showLiveOnly ? "fill-current" : ""
                  }`}
                />
                Live Now
              </Button>
              <Button
                variant={showCompleted ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setShowCompleted(!showCompleted);
                  setShowLiveOnly(false);
                }}
                className={`rounded-full px-4 h-8 text-xs font-medium border ${
                  showCompleted
                    ? "border-transparent"
                    : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Trophy className="size-3.5 mr-1.5" />
                Completed
              </Button>

              <Button
                size="sm"
                onClick={() => handleFilterClick(GENDER_FILTERS.Men)}
                variant={
                  filters.eligible_gender === GENDER_FILTERS.Men ? "default" : "outline"
                }
                className={`rounded-full h-8 text-xs border ${
                  filters.eligible_gender === GENDER_FILTERS.Men
                    ? ""
                    : "border-dashed border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                <Users className="size-3.5 mr-1.5" />
                Men's Doubles
              </Button>
              <Button
                size="sm"
                onClick={() => handleFilterClick(GENDER_FILTERS.Women)}
                variant={
                  filters.eligible_gender === GENDER_FILTERS.Women ? "default" : "outline"
                }
                className={`rounded-full h-8 text-xs border ${
                  filters.eligible_gender === GENDER_FILTERS.Women
                    ? ""
                    : "border-dashed border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                <Users className="size-3.5 mr-1.5" />
                Women's Doubles
              </Button>
              <Button
                size="sm"
                onClick={() => handleFilterClick(GENDER_FILTERS.Mixed)}
                variant={
                  filters.eligible_gender === GENDER_FILTERS.Mixed ? "default" : "outline"
                }
                className={`rounded-full h-8 text-xs border ${
                  filters.eligible_gender === GENDER_FILTERS.Mixed
                    ? ""
                    : "border-dashed border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                <Users className="size-3.5 mr-1.5" />
                Mixed Doubles
              </Button>
            </div>

            {/* Game Filter */}
            {games.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                {games.map((game) => (
                  <Button
                    key={game.id}
                    size="sm"
                    onClick={() => handleGameFilterClick(String(game.id))}
                    variant={selectedGameId === String(game.id) ? "default" : "outline"}
                    className={`rounded-full h-8 text-xs border ${
                      selectedGameId === String(game.id)
                        ? ""
                        : "border-dashed border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {game.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollablePageHeader>

      <ScrollablePageContent className="pb-24 pt-2 relative">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 inset-x-0 h-48 bg-linear-to-b from-brand-blue/10 to-transparent skew-y-3 origin-top-left scale-110 pointer-events-none -z-10" />
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none -z-10" />

        <div className="px-4 space-y-4">
          {/* Tournament List */}
          {isLoading && (
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 w-full bg-muted/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="bg-destructive/10 p-4 rounded-full">
                <Zap className="size-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Oops! Something went wrong
                </h3>
                <p className="text-muted-foreground text-sm">
                  Failed to load tournaments.
                </p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && tournaments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="bg-muted/30 p-8 rounded-full">
                <Filter className="size-12 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground">
                  No tournaments found
                </h3>
                <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                  {searchQuery || showLiveOnly || showCompleted || filters.eligible_gender || selectedGameId
                    ? "Try adjusting your filters or search query."
                    : "There are no upcoming tournaments at the moment."}
                </p>
              </div>
              {!searchQuery && !showLiveOnly && !showCompleted && !filters.eligible_gender && !selectedGameId && (
                <Button
                  onClick={() => router.push("/tournaments/new")}
                  className="rounded-full px-6"
                >
                  Create First Tournament
                </Button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {tournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                index={index}
              />
            ))}
          </div>
        </div>
      </ScrollablePageContent>
    </ScrollablePage>
  );
}
