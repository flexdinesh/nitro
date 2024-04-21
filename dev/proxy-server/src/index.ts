import { serve } from "@hono/node-server";

import { router } from "./hono/router";
import { setupRoutes } from "./hono/routes";

setupRoutes(router);

serve(
  {
    fetch: router.fetch,
    port: 8787,
  },
  (info) => {
    console.log(`Proxy server started at http://${info.address}:${info.port}`);
  }
);
