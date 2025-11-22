"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tournamentsApi,
  playersApi,
  pairingsApi,
  matchesApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  UserPlus,
  X,
  Search,
  Users,
  Play,
  Clock,
  Trophy,
} from "lucide-react";
import {
  ScrollablePage,
  ScrollablePageHeader,
  ScrollablePageContent,
} from "@/components/layout/ScrollablePage";
import { toast } from "sonner";

export default function TournamentManagePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", params.id],
    queryFn: async () => {
      const response = await tournamentsApi.getById(params.id);
      return response.data.data;
    },
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["player-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { players: [] };
      const response = await playersApi.search(searchQuery);
      return response.data.data;
    },
    enabled: searchQuery.length >= 2 && isSearchDialogOpen,
  });

  const addRefereeMutation = useMutation({
    mutationFn: (playerId) => tournamentsApi.addReferee(params.id, playerId),
    onSuccess: () => {
      toast.success("Referee added successfully!");
      setIsSearchDialogOpen(false);
      setSearchQuery("");
      setSelectedPlayer(null);
      queryClient.invalidateQueries({ queryKey: ["tournament", params.id] });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to add referee";
      toast.error(errorMessage);
    },
  });

  const removeRefereeMutation = useMutation({
    mutationFn: (playerId) => tournamentsApi.removeReferee(params.id, playerId),
    onSuccess: () => {
      toast.success("Referee removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["tournament", params.id] });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to remove referee";
      toast.error(errorMessage);
    },
  });

  const { data: roundStatus, isLoading: isLoadingRoundStatus } = useQuery({
    queryKey: ["tournament-round-status", params.id],
    queryFn: async () => {
      const response = await tournamentsApi.getRoundStatus(params.id);
      return response.data.data;
    },
  });

  const generateRoundMutation = useMutation({
    mutationFn: () => pairingsApi.generateRound(parseInt(params.id)),
    onSuccess: () => {
      toast.success("Round started successfully!");
      queryClient.invalidateQueries({
        queryKey: ["tournament-round-status", params.id],
      });
      queryClient.invalidateQueries({ queryKey: ["tournament", params.id] });
      queryClient.invalidateQueries({
        queryKey: ["current-round-matches", params.id],
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to start round";
      toast.error(errorMessage);
    },
  });

  const { data: currentRoundMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["current-round-matches", params.id],
    queryFn: async () => {
      const response = await tournamentsApi.getCurrentRoundMatches(params.id);
      return response.data.data;
    },
    enabled: !!roundStatus?.currentRound,
  });

  const assignRefereeMutation = useMutation({
    mutationFn: ({ matchId, refereeId }) =>
      matchesApi.update(matchId, { referee_id: refereeId || null }),
    onSuccess: () => {
      toast.success("Referee assigned successfully!");
      queryClient.invalidateQueries({
        queryKey: ["current-round-matches", params.id],
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to assign referee";
      toast.error(errorMessage);
    },
  });

  if (isLoading) {
    return (
      <ScrollablePage>
        <ScrollablePageHeader>
          <header className="sticky top-0 bg-white border-b z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="size-5" />
              </Button>
              <h1 className="text-lg font-bold">Manage Tournament</h1>
              <div className="size-10" />
            </div>
          </header>
        </ScrollablePageHeader>
        <ScrollablePageContent>
          <div className="p-4 text-center">Loading...</div>
        </ScrollablePageContent>
      </ScrollablePage>
    );
  }

  if (!tournament) {
    return (
      <ScrollablePage>
        <ScrollablePageHeader>
          <header className="sticky top-0 bg-white border-b z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="size-5" />
              </Button>
              <h1 className="text-lg font-bold">Manage Tournament</h1>
              <div className="size-10" />
            </div>
          </header>
        </ScrollablePageHeader>
        <ScrollablePageContent>
          <div className="p-4 text-center">Tournament not found</div>
        </ScrollablePageContent>
      </ScrollablePage>
    );
  }

  const referees = tournament.referee || [];

  return (
    <ScrollablePage>
      <ScrollablePageHeader>
        <header className="sticky top-0 bg-white border-b z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-lg font-bold">Manage Tournament</h1>
            <div className="size-10" />
          </div>
        </header>
      </ScrollablePageHeader>

      <ScrollablePageContent className="p-4 space-y-4">
        {/* Tournament Info */}
        <div>
          <h2 className="text-2xl font-bold mb-2">{tournament.name}</h2>
          <p className="text-gray-600 text-sm">{tournament.description}</p>
        </div>

        {/* Round Status Section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock className="size-5" />
              Round Status
            </h3>
            {roundStatus?.canStartNextRound && (
              <Button
                onClick={() => generateRoundMutation.mutate()}
                disabled={generateRoundMutation.isPending}
                size="sm"
              >
                <Play className="size-4 mr-2" />
                {generateRoundMutation.isPending
                  ? "Starting..."
                  : roundStatus?.currentRound === null
                  ? "Start First Round"
                  : `Start Round ${roundStatus?.nextRound}`}
              </Button>
            )}
          </div>
          {isLoadingRoundStatus ? (
            <p className="text-gray-500 text-sm">Loading round status...</p>
          ) : (
            <div className="space-y-2">
              {roundStatus?.currentRound === null ? (
                <p className="text-gray-600">
                  No rounds have started yet. Click the button above to start the
                  first round.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Round:</span>
                    <span className="font-semibold">
                      Round {roundStatus?.currentRound}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-semibold ${
                        roundStatus?.isCurrentRoundComplete
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {roundStatus?.isCurrentRoundComplete
                        ? "Complete"
                        : "In Progress"}
                    </span>
                  </div>
                  {roundStatus?.isCurrentRoundComplete && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next Round:</span>
                      <span className="font-semibold">
                        Round {roundStatus?.nextRound}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>

        {/* Referees Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users className="size-5" />
              Referees
            </h3>
            <Dialog
              open={isSearchDialogOpen}
              onOpenChange={setIsSearchDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="size-4 mr-2" />
                  Add Referee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Referee</DialogTitle>
                  <DialogDescription>
                    Search for a player to add as a referee
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      placeholder="Search by username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {isSearching && (
                    <div className="text-center py-4 text-gray-500">
                      Searching...
                    </div>
                  )}
                  {searchResults?.players &&
                    searchResults.players.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.players.map((player) => (
                          <Card
                            key={player.id}
                            className="p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setSelectedPlayer(player);
                              addRefereeMutation.mutate(player.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {player.photo_url ? (
                                // <img
                                //   src={player.photo_url}
                                //   alt={player.username}
                                //   className="size-10 rounded-full"
                                // />
                                <div
                                  className="size-10 rounded-full bg-gray-200 flex items-center justify-center"
                                />
                              ) : (
                                <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Users className="size-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{player.username}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  {searchQuery.length >= 2 &&
                    !isSearching &&
                    searchResults?.players &&
                    searchResults.players.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No players found
                      </div>
                    )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSearchDialogOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {referees.length === 0 ? (
            <Card className="p-4 text-center text-gray-500">
              No referees added yet
            </Card>
          ) : (
            <div className="space-y-2">
              {referees.map((referee, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="size-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {referee.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">Referee</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (
                          confirm(
                            `Are you sure you want to remove ${referee.name} as a referee?`
                          )
                        ) {
                          removeRefereeMutation.mutate(referee.player_id);
                        }
                      }}
                      disabled={removeRefereeMutation.isPending}
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Current Round Matches Section */}
        {roundStatus?.currentRound && (
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
              <Trophy className="size-5" />
              Round {roundStatus?.currentRound} Matches
            </h3>
            {isLoadingMatches ? (
              <Card className="p-4 text-center text-gray-500">
                Loading matches...
              </Card>
            ) : currentRoundMatches?.matches?.length === 0 ? (
              <Card className="p-4 text-center text-gray-500">
                No matches found for this round
              </Card>
            ) : (
              <div className="space-y-3">
                {currentRoundMatches?.matches?.map((match) => (
                  <Card key={match.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Match {match.id}</p>
                          {match.court && (
                            <p className="text-sm text-gray-600">
                              Court {match.court}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-medium capitalize">
                            {match.status}
                          </p>
                        </div>
                      </div>

                      {/* Players */}
                      {match.players && match.players.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Players:</p>
                          <div className="flex flex-wrap gap-2">
                            {match.players.map((player, idx) => (
                              <span
                                key={idx}
                                className="text-sm bg-gray-100 px-2 py-1 rounded"
                              >
                                {player.username}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Referee Assignment */}
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Assign Referee:
                        </label>
                        <select
                          value={match.referee_id || ""}
                          onChange={(e) => {
                            const refereeId = e.target.value
                              ? parseInt(e.target.value)
                              : null;
                            assignRefereeMutation.mutate({
                              matchId: match.id,
                              refereeId,
                            });
                          }}
                          disabled={assignRefereeMutation.isPending}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">No Referee</option>
                          {referees.map((referee) => (
                            <option
                              key={referee.player_id}
                              value={referee.player_id}
                            >
                              {referee.name || `Referee ${referee.player_id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollablePageContent>
    </ScrollablePage>
  );
}
