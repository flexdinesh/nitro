import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { cacheMiddleware } from "./cache-middleware";
import { type Router } from "./router";
import { createInMemoryStore } from "../store/in-memory";
import { config } from "../cache/cache.config";

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

  router.use("*", cacheMiddleware({ store, config }));
}
