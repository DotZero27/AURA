"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { ScrollablePage, ScrollablePageHeader, ScrollablePageContent } from "@/components/layout/ScrollablePage";

export default function ProfilePage() {
  const router = useRouter();
  const { data: userData, isLoading } = useUser();

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!userData) {
    return <div className="p-4 text-center">User not found</div>;
  }

  const { name, username, aura, age, gender, tournaments } = userData;
  console.log(tournaments);

  // Filter tournaments by status
  const liveTournaments = tournaments?.filter((t) => t.status === "live") || [];
  const pastTournaments = tournaments?.filter((t) => t.status !== "live") || [];

  return (
    <ScrollablePage>
      <ScrollablePageHeader>
        <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold">My AURA</h1>
            <Button
              onClick={() => router.push("/tournaments/new")}
              size="sm"
              className="gap-2"
            >
              <Plus className="size-4" />
              Create Tournament
            </Button>
          </div>
        </header>
      </ScrollablePageHeader>

      <ScrollablePageContent>

      {/* Profile Section */}
      <div className="flex flex-col items-center py-6">
        <div className="w-24 h-24 bg-purple-200 rounded-full mb-3" />
        <h2 className="text-xl font-bold capitalize">{name || username}</h2>
        <p className="text-sm text-gray-600 capitalize">
          {gender || "Other"} · {age} years
        </p>

        {/* Doubles Rating Card */}
        <Card className="mt-4 px-6 py-4 bg-purple-600 text-white">
          <div className="text-center">
            <div className="text-sm mb-1">DOUBLES</div>
            <div className="text-4xl font-bold">
              {aura ? aura.toFixed(2) : "0.00"}
            </div>
          </div>
        </Card>
      </div>

      {/* Tournaments Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">TOURNAMENTS</h3>
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="live">LIVE</TabsTrigger>
            <TabsTrigger value="past">PAST</TabsTrigger>
          </TabsList>

          {/* Live Tournaments Tab */}
          <TabsContent value="live" className="space-y-3 mt-0">
            {liveTournaments.length > 0 ? (
              liveTournaments.map((tournament) => (
                <Card key={tournament.match_id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">
                        {tournament.round} · Court {tournament.court} ·{" "}
                        {tournament.status === "won" ? "Won" : "Lost"} ·{" "}
                        {tournament.round && format(new Date(), "dd MMM yyyy")}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 font-semibold">
                          LIVE
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {tournament.players?.slice(0, 2).map((player, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-8 bg-purple-200 rounded-full" />
                          <span className="text-sm">
                            {player.name || player.username || "Player"}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <span
                            className={
                              idx === 0 &&
                              tournament.scores?.teamA >
                                tournament.scores?.teamB
                                ? "text-green-600 font-semibold"
                                : ""
                            }
                          >
                            {tournament.scores?.teamA || 0}
                          </span>
                          <span
                            className={
                              idx === 1 &&
                              tournament.scores?.teamB >
                                tournament.scores?.teamA
                                ? "text-green-600 font-semibold"
                                : ""
                            }
                          >
                            {tournament.scores?.teamB || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No live tournaments</p>
              </div>
            )}
          </TabsContent>

          {/* Past Tournaments Tab */}
          <TabsContent value="past" className="space-y-3 mt-0">
            {pastTournaments.length > 0 ? (
              pastTournaments.map((tournament) => (
                <Card key={tournament.match_id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">
                        {tournament.round} · Court {tournament.court} ·{" "}
                        {tournament.status === "won" ? "Won" : "Lost"} ·{" "}
                        {tournament.round && format(new Date(), "dd MMM yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {tournament.players?.slice(0, 2).map((player, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-8 bg-purple-200 rounded-full" />
                          <span className="text-sm">
                            {player.name || player.username || "Player"}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <span
                            className={
                              idx === 0 &&
                              tournament.scores?.teamA >
                                tournament.scores?.teamB
                                ? "text-green-600 font-semibold"
                                : ""
                            }
                          >
                            {tournament.scores?.teamA || 0}
                          </span>
                          <span
                            className={
                              idx === 1 &&
                              tournament.scores?.teamB >
                                tournament.scores?.teamA
                                ? "text-green-600 font-semibold"
                                : ""
                            }
                          >
                            {tournament.scores?.teamB || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No past tournaments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </ScrollablePageContent>
    </ScrollablePage>
  );
}
