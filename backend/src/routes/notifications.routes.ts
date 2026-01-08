import { Hono } from "hono";
import { authMiddleware, type AuthContext } from "@/middleware/auth";
import { zValidator } from "@/middleware/zodValidator";
import { notificationIdSchema } from "@/utils/validation";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/controllers/notifications.controller";

export const notificationsRoutes = new Hono<AuthContext>();

// GET /notifications - Get all notifications for current user
notificationsRoutes.get("/", authMiddleware, getNotifications);

// GET /notifications/unread-count - Get unread count
notificationsRoutes.get("/unread-count", authMiddleware, getUnreadCount);

// PUT /notifications/:id/read - Mark notification as read
notificationsRoutes.put(
  "/:id/read",
  authMiddleware,
  zValidator("param", notificationIdSchema),
  markNotificationAsRead
);

// PUT /notifications/read-all - Mark all notifications as read
notificationsRoutes.put("/read-all", authMiddleware, markAllNotificationsAsRead);






