import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { websocket } from "hono/bun";
import { showRoutes } from "hono/dev";
import errorHandler from "@/middleware/error";
import websocketRoutes from "@/routes/websocket.routes";
import { tournamentsRoutes } from "@/routes/tournaments.routes";
import { userRoutes } from "@/routes/user.routes";
import { env } from "./config/env";

const app = new Hono()
  .basePath("/api")
  // Middlewares
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: false,
    })
  )
  .use("*", prettyJSON())
  .use("*", secureHeaders())
  .use("*", timing())
  //Routes
  .route("/ws", websocketRoutes)
  .route("/tournaments", tournamentsRoutes)
  .route("/user", userRoutes)
  .onError(errorHandler);

showRoutes(app, {
  verbose: true,
});

export default {
  port: env.PORT,
  fetch: app.fetch,
  websocket,
};
