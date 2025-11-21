"use client";

import { useParams, useRouter } from "next/navigation";
import { useTournament } from "@/hooks/useTournament";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Users,
  Star,
} from "lucide-react";
import { formatTime, formatDateWithDay } from "@/lib/utils";

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: tournament, isLoading } = useTournament(params.id);

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-4 text-center">Tournament not found</div>;
  }

  const {
    name,
    start_date,
    end_date,
    venue,
    description,
    hosted_by,
    referee,
    capacity,
    match_format,
  } = tournament;

  const category =
    match_format?.eligible_gender === "M"
      ? "Men's Doubles"
      : match_format?.eligible_gender === "W"
      ? "Women's Doubles"
      : "Mixed Doubles";

  const registeredCount = 15; // This should come from backend
  const progress = (registeredCount / capacity) * 100;

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Tournaments</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {/* Image Placeholder */}
        <div className="w-full h-[412px] bg-gray-200 rounded-b-3xl" />

        {/* Tournament Overview Card */}
        <Card className="mx-4 p-4 -mt-12">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Pickleball</span>
                <span>·</span>
                <span>{category}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">4.8</span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Durations</span>
              <span className="ml-auto">
                {formatTime(start_date)} - {formatTime(end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Date</span>
              <span className="ml-auto">{formatDateWithDay(start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Players</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-xs">
                  {registeredCount}/{capacity}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Venue Section */}
        <div className="mx-4">
          <h3 className="font-bold text-lg mb-2">Venue</h3>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <p className="font-medium">{venue?.name || "Venue TBD"}</p>
                <p className="text-sm text-gray-600">
                  {venue?.address || "Address TBD"}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <MapPin className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Description Section */}
        <div className="mx-4">
          <h3 className="font-bold text-lg mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description ||
              "Proin lobortis porttitor leo sed mattis. Aliq vul convallis mauris, at dictum elit feugiat. Praesent in nulla porttitor, lobortis."}
          </p>
        </div>

        {/* Hosted By Section */}
        {hosted_by && (
          <div className="mx-4">
            <h3 className="font-bold text-lg mb-2">Hosted By</h3>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">{hosted_by.name}</p>
                  <p className="text-sm text-gray-600">Host</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Referees Section */}
        {referee && referee.length > 0 && (
          <div className="mx-4">
            <h3 className="font-bold text-lg mb-2">Referee&apos;s</h3>
            <div className="space-y-2">
              {referee.map((ref, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium">{ref.name}</p>
                      <p className="text-sm text-gray-600">
                        {ref.role || "Referee"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Phone className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Players Section */}
        <div className="mx-4">
          <h3 className="font-bold text-lg mb-2">Players</h3>
          <div className="space-y-2">
            {/* This would be populated from backend */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Player Name</p>
                  <p className="text-sm text-gray-600">7.0 AURA</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-4 mb-4">
          <h3 className="font-bold text-lg">FAQ&apos;s</h3>
        </div>
      </div>

      {/* Book Now Button */}
      <div className="border fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 max-w-[480px] mx-auto">
        <Button className="w-full" size="lg">
          BOOK NOW
        </Button>
      </div>
    </div>
  );
}
