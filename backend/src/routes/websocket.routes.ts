import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

const websocketRoutes = new Hono();

websocketRoutes.get(
  "/dummy",
  upgradeWebSocket((c) => {
    return {
      onOpen(event: any, ws: any) {
        console.log("🔌 Dummy WebSocket opened");
      },
      onClose(event: any, ws: any) {
        console.log("🔌 Dummy WebSocket closed");
      },
      onError(error: any, ws: any) {
        console.error("❌ Dummy WebSocket error:", error);
      },
      onMessage(event: any, ws: any) {
        console.log("🔌 Dummy WebSocket message:", event.data);
      },
    };

  })
);

export default websocketRoutes;
