import { HTTPException } from "hono/http-exception";
import { supabase } from "@/lib/supabase";
import type { Context } from "hono";
import type { AuthContext } from "@/middleware/auth";
import type { z } from "zod";
import type {
  friendIdSchema,
  createFriendRequestSchema,
  updateFriendRequestSchema,
} from "@/utils/validation";

// GET /friends - Get user's friends list
export async function getFriends(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");

    const { data: friends, error } = await supabase
      .from("friends")
      .select(
        `
        id,
        friend_id,
        status,
        created_at,
        updated_at,
        friend:players!friends_friend_id_fkey (
          id,
          username,
          photo_url
        )
      `
      )
      .eq("player_id", playerId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    // Also get reverse friendships (where current user is the friend)
    const { data: reverseFriends, error: reverseError } = await supabase
      .from("friends")
      .select(
        `
        id,
        player_id,
        status,
        created_at,
        updated_at,
        player:players!friends_player_id_fkey (
          id,
          username,
          photo_url
        )
      `
      )
      .eq("friend_id", playerId)
      .eq("status", "accepted");

    if (reverseError) {
      throw new HTTPException(500, { message: reverseError.message });
    }

    // Combine both directions and format
    const allFriends = [
      ...(friends || []).map((f: any) => ({
        id: f.id,
        friend_id: f.friend_id,
        player: Array.isArray(f.friend) ? f.friend[0] : f.friend,
        status: f.status,
        created_at: f.created_at,
        updated_at: f.updated_at,
      })),
      ...(reverseFriends || []).map((f: any) => ({
        id: f.id,
        friend_id: f.player_id,
        player: Array.isArray(f.player) ? f.player[0] : f.player,
        status: f.status,
        created_at: f.created_at,
        updated_at: f.updated_at,
      })),
    ];

    return c.json({ data: { friends: allFriends } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /friends/pending - Get pending friend requests
export async function getPendingFriendRequests(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");

    // Get requests sent to me
    const { data: receivedRequests, error: receivedError } = await supabase
      .from("friends")
      .select(
        `
        id,
        player_id,
        status,
        created_at,
        player:players!friends_player_id_fkey (
          id,
          username,
          photo_url
        )
      `
      )
      .eq("friend_id", playerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (receivedError) {
      throw new HTTPException(500, { message: receivedError.message });
    }

    // Get requests I sent
    const { data: sentRequests, error: sentError } = await supabase
      .from("friends")
      .select(
        `
        id,
        friend_id,
        status,
        created_at,
        friend:players!friends_friend_id_fkey (
          id,
          username,
          photo_url
        )
      `
      )
      .eq("player_id", playerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (sentError) {
      throw new HTTPException(500, { message: sentError.message });
    }

    return c.json({
      data: {
        received: (receivedRequests || []).map((r: any) => ({
          id: r.id,
          player_id: r.player_id,
          player: Array.isArray(r.player) ? r.player[0] : r.player,
          status: r.status,
          created_at: r.created_at,
        })),
        sent: (sentRequests || []).map((r: any) => ({
          id: r.id,
          friend_id: r.friend_id,
          friend: Array.isArray(r.friend) ? r.friend[0] : r.friend,
          status: r.status,
          created_at: r.created_at,
        })),
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// POST /friends - Send friend request
export async function sendFriendRequest(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const body = ((c.req as any).valid("json") as any) as z.infer<typeof createFriendRequestSchema>;
    const friendId = body.friend_id;

    if (playerId === friendId) {
      throw new HTTPException(400, { message: "Cannot send friend request to yourself" });
    }

    // Check if friend exists
    const { data: friend, error: friendError } = await supabase
      .from("players")
      .select("id")
      .eq("id", friendId)
      .single();

    if (friendError || !friend) {
      throw new HTTPException(404, { message: "Player not found" });
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from("friends")
      .select("id, status")
      .or(`and(player_id.eq.${playerId},friend_id.eq.${friendId}),and(player_id.eq.${friendId},friend_id.eq.${playerId})`)
      .single();

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        throw new HTTPException(409, { message: "Already friends with this player" });
      }
      if (existingFriendship.status === "pending") {
        throw new HTTPException(409, { message: "Friend request already pending" });
      }
    }

    // Create friend request
    const { data: friendship, error: createError } = await supabase
      .from("friends")
      .insert({
        player_id: playerId,
        friend_id: friendId,
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      throw new HTTPException(500, { message: createError.message });
    }

    // Create notification for the friend
    const { data: friendPlayer } = await supabase
      .from("players")
      .select("username")
      .eq("id", playerId)
      .single();

    await supabase.from("notifications").insert({
      player_id: friendId,
      type: "friend_request",
      reference_id: String(friendship.id),
      title: "New Friend Request",
      message: `${friendPlayer?.username || "Someone"} sent you a friend request`,
      read: false,
    });

    return c.json({ data: friendship }, 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// PUT /friends/:id - Accept/reject friend request
export async function updateFriendRequest(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof friendIdSchema>;
    const body = ((c.req as any).valid("json") as any) as z.infer<typeof updateFriendRequestSchema>;
    const friendshipId = parseInt(params.id);

    if (isNaN(friendshipId)) {
      throw new HTTPException(400, { message: "Invalid friendship ID" });
    }

    // Get the friendship
    const { data: friendship, error: friendshipError } = await supabase
      .from("friends")
      .select("id, player_id, friend_id, status")
      .eq("id", friendshipId)
      .single();

    if (friendshipError || !friendship) {
      throw new HTTPException(404, { message: "Friend request not found" });
    }

    // Verify user is the recipient of the request
    if (friendship.friend_id !== playerId) {
      throw new HTTPException(403, { message: "Not authorized to update this friend request" });
    }

    if (friendship.status !== "pending") {
      throw new HTTPException(400, { message: "Friend request is not pending" });
    }

    // Update friendship status
    const { data: updatedFriendship, error: updateError } = await supabase
      .from("friends")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", friendshipId)
      .select()
      .single();

    if (updateError) {
      throw new HTTPException(500, { message: updateError.message });
    }

    // If accepted, create notification for the requester
    if (body.status === "accepted") {
      const { data: accepterPlayer } = await supabase
        .from("players")
        .select("username")
        .eq("id", playerId)
        .single();

      await supabase.from("notifications").insert({
        player_id: friendship.player_id,
        type: "friend_accepted",
        reference_id: String(friendshipId),
        title: "Friend Request Accepted",
        message: `${accepterPlayer?.username || "Someone"} accepted your friend request`,
        read: false,
      });
    }

    return c.json({ data: updatedFriendship });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// DELETE /friends/:id - Remove friend or cancel request
export async function removeFriend(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof friendIdSchema>;
    const friendshipId = parseInt(params.id);

    if (isNaN(friendshipId)) {
      throw new HTTPException(400, { message: "Invalid friendship ID" });
    }

    // Get the friendship
    const { data: friendship, error: friendshipError } = await supabase
      .from("friends")
      .select("id, player_id, friend_id")
      .eq("id", friendshipId)
      .single();

    if (friendshipError || !friendship) {
      throw new HTTPException(404, { message: "Friendship not found" });
    }

    // Verify user is part of this friendship
    if (friendship.player_id !== playerId && friendship.friend_id !== playerId) {
      throw new HTTPException(403, { message: "Not authorized to delete this friendship" });
    }

    // Delete the friendship
    const { error: deleteError } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendshipId);

    if (deleteError) {
      throw new HTTPException(500, { message: deleteError.message });
    }

    return c.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}






