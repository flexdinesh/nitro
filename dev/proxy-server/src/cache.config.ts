import { createConfig } from "@nitro-cache/cache";

export const config = createConfig({
  origin: "http://localhost:3000",
  matchers: [
    {
      type: "RESTRequest",
      origin: "http://localhost:3000",
      path: "/rest/users",
      strategy: {
        type: "MAX-AGE",
        expiryTTL: 20_000,
      },
    },
    {
      type: "RESTRequest",
      origin: "http://localhost:3000",
      path: "/rest/users/uncached",
      strategy: {
        type: "NO-STORE",
      },
    },
    {
      type: "RESTRequest",
      origin: "http://localhost:3000",
      path: "/rest/users/swr",
      strategy: {
        type: "STALE-WHILE-REVALIDATE",
        expiryTTL: 20_000,
        staleTTL: 5_000,
      },
    },
  ],
});
