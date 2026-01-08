"use client";

import { useState } from "react";
import { useFriends } from "@/hooks/useFriends";
import { useTournamentInvites } from "@/hooks/useTournamentInvites";
import { tournamentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Copy, Check, UserPlus, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function TeamInviteDialog({ open, onOpenChange, tournamentId, teamId }) {
  const { friends, isLoading: isLoadingFriends } = useFriends();
  const { invites } = useTournamentInvites(tournamentId);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [shareableLink, setShareableLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleInviteFriend = async () => {
    if (!selectedFriendId) {
      toast.error("Please select a friend");
      return;
    }

    try {
      await tournamentsApi.invite(tournamentId, {
        invitee_id: selectedFriendId,
        team_id: teamId,
      });
      toast.success("Invite sent!");
      setSelectedFriendId(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send invite");
    }
  };

  const handleGenerateLink = async () => {
    try {
      setIsGeneratingLink(true);
      const response = await tournamentsApi.generateInviteLink(tournamentId, teamId ? { team_id: teamId } : {});
      if (response?.data?.data?.link) {
        setShareableLink(response.data.data.link);
        toast.success("Link generated!");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to generate link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (shareableLink) {
      const fullUrl = `${window.location.origin}${shareableLink}`;
      navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const pendingInvites = invites?.filter((invite) => invite.status === "pending") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Partner</DialogTitle>
          <DialogDescription>
            Invite a friend from your list or generate a shareable link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Invite from Friends List */}
          <div>
            <Label htmlFor="friend-select">Select Friend</Label>
            <div className="mt-2 space-y-2">
              {isLoadingFriends ? (
                <p className="text-sm text-gray-500">Loading friends...</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-gray-500">No friends yet. Add friends to invite them.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {friends.map((friend) => {
                    const friendPlayer = friend.player || friend.friend;
                    return (
                      <Card
                        key={friend.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedFriendId === friendPlayer?.id
                            ? "bg-purple-100 border-purple-500"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedFriendId(friendPlayer?.id)}
                      >
                        <div className="flex items-center gap-3">
                          {friendPlayer?.photo_url ? (
                            <img
                              src={friendPlayer.photo_url}
                              alt={friendPlayer.username}
                              className="size-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-600">
                                {(friendPlayer?.username || "F")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{friendPlayer?.username}</p>
                          </div>
                          {selectedFriendId === friendPlayer?.id && (
                            <Check className="size-5 text-purple-600" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              className="w-full mt-3"
              onClick={handleInviteFriend}
              disabled={!selectedFriendId || isLoadingFriends}
            >
              <UserPlus className="size-4 mr-2" />
              Send Invite
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Generate Shareable Link */}
          <div>
            <Label>Shareable Link</Label>
            <div className="mt-2 space-y-2">
              {shareableLink ? (
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}${shareableLink}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    {linkCopied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleGenerateLink}
                  disabled={isGeneratingLink}
                >
                  <LinkIcon className="size-4 mr-2" />
                  {isGeneratingLink ? "Generating..." : "Generate Shareable Link"}
                </Button>
              )}
            </div>
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div>
              <Label>Pending Invites</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {pendingInvites.map((invite) => {
                  const invitee = invite.invitee || {};
                  return (
                    <Card key={invite.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {invitee.photo_url ? (
                            <img
                              src={invitee.photo_url}
                              alt={invitee.username}
                              className="size-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600">
                                {invite.token ? "?" : (invitee.username || "I")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {invite.token ? "Pending (via link)" : invitee.username || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(invite.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

