import { HTTPException } from "hono/http-exception";
import { supabase } from "@/lib/supabase";
import type { Context } from "hono";
import type { AuthContext } from "@/middleware/auth";

// GET /games - Get all enabled games
export async function getAllGames(c: Context<AuthContext>) {
  try {
    const { data: games, error } = await supabase
      .from("games")
      .select("id, name, metadata, enabled, created_at")
      .eq("enabled", true)
      .order("name", { ascending: true });

    if (error) {
      throw new HTTPException(500, { message: error.message });
    }

    return c.json({ data: { games } });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: (error as Error).message });
  }
}
