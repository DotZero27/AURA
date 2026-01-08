import { HTTPException } from "hono/http-exception";
import { supabase } from "@/lib/supabase";
import type { Context } from "hono";
import type { AuthContext } from "@/middleware/auth";
import type { z } from "zod";
import type { notificationIdSchema } from "@/utils/validation";

// GET /notifications - Get all notifications for current user
export async function getNotifications(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const queryParams = c.req.query();
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
    const offset = queryParams.offset ? parseInt(queryParams.offset) : 0;

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { notifications: notifications || [] } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// GET /notifications/unread-count - Get unread count
export async function getUnreadCount(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("player_id", playerId)
      .eq("read", false);

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { count: count || 0 } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// PUT /notifications/:id/read - Mark notification as read
export async function markNotificationAsRead(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");
    const params = ((c.req as any).valid("param") as any) as z.infer<typeof notificationIdSchema>;
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      throw new HTTPException(400, { message: "Invalid notification ID" });
    }

    // Verify notification belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("id, player_id")
      .eq("id", notificationId)
      .single();

    if (fetchError || !notification) {
      throw new HTTPException(404, { message: "Notification not found" });
    }

    if (notification.player_id !== playerId) {
      throw new HTTPException(403, { message: "Not authorized to update this notification" });
    }

    // Update notification
    const { data: updatedNotification, error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()
      .single();

    if (updateError) {
      throw new HTTPException(500, { message: updateError.message });
    }

    return c.json({ data: updatedNotification });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}

// PUT /notifications/read-all - Mark all notifications as read
export async function markAllNotificationsAsRead(c: Context<AuthContext>) {
  try {
    const playerId = c.get("playerId");

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("player_id", playerId)
      .eq("read", false);

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}






