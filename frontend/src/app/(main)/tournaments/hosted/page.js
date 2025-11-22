"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { tournamentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { ArrowLeft, Plus } from "lucide-react";
import {
  ScrollablePage,
  ScrollablePageHeader,
  ScrollablePageContent,
} from "@/components/layout/ScrollablePage";

export default function HostedTournamentsPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["hosted-tournaments"],
    queryFn: async () => {
      const response = await tournamentsApi.getHosted();
      return response.data.data;
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
              <h1 className="text-lg font-bold">My Tournaments</h1>
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

  const tournaments = data?.tournaments || [];

  return (
    <ScrollablePage>
      <ScrollablePageHeader>
        <header className="sticky top-0 bg-white border-b z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-lg font-bold">My Tournaments</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/tournaments/new")}
            >
              <Plus className="size-5" />
            </Button>
          </div>
        </header>
      </ScrollablePageHeader>

      <ScrollablePageContent className="p-4">
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't hosted any tournaments yet.</p>
            <Button onClick={() => router.push("/tournaments/new")}>
              Create Tournament
            </Button>
          </div>
        ) : (
          <div>
            {tournaments.map((tournament, index) => (
              <div key={tournament.id} onClick={() => router.push(`/tournaments/${tournament.id}/manage`)}>
                <TournamentCard tournament={tournament} index={index} />
              </div>
            ))}
          </div>
        )}
      </ScrollablePageContent>
    </ScrollablePage>
  );
}

