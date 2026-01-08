import { Hono } from "hono";
import { authMiddleware, type AuthContext } from "@/middleware/auth";
import { zValidator } from "@/middleware/zodValidator";
import {
  friendIdSchema,
  createFriendRequestSchema,
  updateFriendRequestSchema,
} from "@/utils/validation";
import {
  getFriends,
  getPendingFriendRequests,
  sendFriendRequest,
  updateFriendRequest,
  removeFriend,
} from "@/controllers/friends.controller";

export const friendsRoutes = new Hono<AuthContext>();

// GET /friends - Get user's friends list
friendsRoutes.get("/", authMiddleware, getFriends);

// GET /friends/pending - Get pending friend requests
friendsRoutes.get("/pending", authMiddleware, getPendingFriendRequests);

// POST /friends - Send friend request
friendsRoutes.post(
  "/",
  authMiddleware,
  zValidator("json", createFriendRequestSchema),
  sendFriendRequest
);

// PUT /friends/:id - Accept/reject friend request
friendsRoutes.put(
  "/:id",
  authMiddleware,
  zValidator("param", friendIdSchema),
  zValidator("json", updateFriendRequestSchema),
  updateFriendRequest
);

// DELETE /friends/:id - Remove friend or cancel request
friendsRoutes.delete(
  "/:id",
  authMiddleware,
  zValidator("param", friendIdSchema),
  removeFriend
);






