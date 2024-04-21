import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { middleware } from "@nitro-cache/cache";
import { createInMemoryStore } from "@nitro-cache/in-memory";
import { type Router } from "./router";
import { config } from "../cache.config";

const store = createInMemoryStore();

export function setupRoutes(router: Router) {
  router.use("*", logger());
  router.use("*", cors());

  // Add X-Response-Time header
  router.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    c.header("X-Response-Time", `${ms}ms`);
  });

  router.get("/__health", (c) => c.json({ status: "ok" }));

  router.use("*", middleware({ store, config }));
}
