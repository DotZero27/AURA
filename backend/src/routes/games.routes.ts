import { Hono } from "hono";
import { authMiddleware, type AuthContext } from "@/middleware/auth";
import { getAllGames } from "@/controllers/games.controller";

export const gamesRoutes = new Hono<AuthContext>();

// GET /games - Get all enabled games
gamesRoutes.get("/", authMiddleware, getAllGames);
