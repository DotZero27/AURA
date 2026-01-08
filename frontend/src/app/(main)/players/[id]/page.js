"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayer } from "@/hooks/usePlayer";
import { useFriends } from "@/hooks/useFriends";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ScrollablePage,
  ScrollablePageHeader,
  ScrollablePageContent,
} from "@/components/layout/ScrollablePage";
import { ArrowLeft, UserPlus, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const playerId = parseInt(params.id);
  const { data: player, isLoading } = usePlayer(playerId);
  const { data: currentUser } = useUser();
  const { friends, pending, sendRequest, updateRequest, removeFriend } = useFriends();

  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // Check if this is the current user's profile by comparing username
  const isOwnProfile = currentUser?.username === player?.username;

  // Check friendship status
  const getFriendshipStatus = () => {
    if (!player) return null;

    // Check if they're friends
    const isFriend = friends.some((f) => {
      const friendPlayer = f.player || f.friend;
      return friendPlayer?.id === playerId;
    });

    if (isFriend) return "friend";

    // Check pending requests (sent by current user)
    const sentRequest = pending.sent?.find((r) => {
      const friend = r.friend || {};
      return friend.id === playerId;
    });

    if (sentRequest) return "pending_sent";

    // Check pending requests (received by current user)
    const receivedRequest = pending.received?.find((r) => {
      const requestPlayer = r.player || {};
      return requestPlayer.id === playerId;
    });

    if (receivedRequest) return "pending_received";

    return "none";
  };

  const friendshipStatus = getFriendshipStatus();

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSendFriendRequest = async () => {
    try {
      setIsSendingRequest(true);
      await sendRequest(playerId);
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send friend request");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await updateRequest({ id: requestId, status: "accepted" });
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    try {
      await removeFriend(friendshipId);
      toast.success("Friend removed");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove friend");
    }
  };

  if (isLoading) {
    return (
      <ScrollablePage>
        <ScrollablePageContent className="p-4">
          <div className="text-center">Loading...</div>
        </ScrollablePageContent>
      </ScrollablePage>
    );
  }

  if (!player) {
    return (
      <ScrollablePage>
        <ScrollablePageContent className="p-4">
          <div className="text-center">Player not found</div>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </ScrollablePageContent>
      </ScrollablePage>
    );
  }

  const age = calculateAge(player.dob);
  const aura = player.rating?.aura_mu || null;
  const friendship = friends.find((f) => {
    const friendPlayer = f.player || f.friend;
    return friendPlayer?.id === playerId;
  });
  const receivedRequest = pending.received?.find((r) => {
    const requestPlayer = r.player || {};
    return requestPlayer.id === playerId;
  });

  return (
    <ScrollablePage>
      <ScrollablePageHeader>
        <header className="sticky top-0 bg-white border-b z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-lg font-bold">Player Profile</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>
      </ScrollablePageHeader>

      <ScrollablePageContent className="space-y-4">
        {/* Profile Section */}
        <div className="flex flex-col items-center py-6">
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.username || "Profile"}
              className="size-32 rounded-full object-cover border-4 border-purple-200 mb-4"
            />
          ) : (
            <div className="size-32 bg-purple-200 rounded-full mb-4 flex items-center justify-center">
              <span className="text-4xl font-bold text-purple-600">
                {(player.username || "P")[0].toUpperCase()}
              </span>
            </div>
          )}
          <h2 className="text-2xl font-bold capitalize mb-1">
            {player.username || "Player"}
          </h2>
          <p className="text-sm text-gray-600 capitalize">
            {player.gender || "Other"}
            {age && ` · ${age} years`}
          </p>

          {/* AURA Rating Card */}
          <Card className="mt-6 px-8 py-6 bg-purple-600 text-white w-full max-w-xs">
            <div className="text-center">
              <div className="text-sm mb-2 opacity-90">DOUBLES RATING</div>
              <div className="text-5xl font-bold">
                {aura ? aura.toFixed(2) : "N/A"}
              </div>
            </div>
          </Card>
        </div>

        {/* Friend Action Button */}
        {!isOwnProfile && (
          <div className="px-4">
            {friendshipStatus === "friend" && friendship && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleRemoveFriend(friendship.id)}
              >
                <UserX className="size-4 mr-2" />
                Remove Friend
              </Button>
            )}
            {friendshipStatus === "pending_sent" && (
              <Button variant="outline" className="w-full" disabled>
                <UserCheck className="size-4 mr-2" />
                Friend Request Sent
              </Button>
            )}
            {friendshipStatus === "pending_received" && receivedRequest && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleAcceptRequest(receivedRequest.id)}
                >
                  <UserCheck className="size-4 mr-2" />
                  Accept Friend Request
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => updateRequest({ id: receivedRequest.id, status: "rejected" })}
                >
                  Decline
                </Button>
              </div>
            )}
            {friendshipStatus === "none" && (
              <Button
                className="w-full"
                onClick={handleSendFriendRequest}
                disabled={isSendingRequest}
              >
                <UserPlus className="size-4 mr-2" />
                {isSendingRequest ? "Sending..." : "Add Friend"}
              </Button>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="px-4 space-y-4">
          {player.dob && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Date of Birth</span>
                <span className="text-sm font-medium">
                  {new Date(player.dob).toLocaleDateString()}
                </span>
              </div>
            </Card>
          )}
          {player.created_at && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium">
                  {new Date(player.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Card>
          )}
        </div>
      </ScrollablePageContent>
    </ScrollablePage>
  );
}

