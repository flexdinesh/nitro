import { type HonoRequest } from "hono";
import { type CacheEntryMeta, type CacheKey } from "../store/types";

type RESTRequestConfig = {
  type: "RESTRequest";
  /**
   * The origin URL without trailing slash.
   * Eg. https://myapiorigin.com
   */
  origin: string;
  /**
   * The URL path with a leading slash.
   * Eg. /my/path/to/data
   *
   * Or a function that takes the path and returns true/false when the path is a match.
   */
  path: string | ((path: string) => boolean);
  /**
   * The function to derive the cache entry key from the request.
   * This is optional. The request origin+path will be used as key
   * if this function is not defined.
   */
  cacheKey?: (request: HonoRequest) => CacheKey;
} & Pick<CacheEntryMeta, "strategy">;

type RequestConfig = RESTRequestConfig;

export type CacheConfig = {
  /**
   * The origin URL to route requests that don't have a matcher defined.
   * Eg. https://myapiorigin.com
   */
  origin: string;
  matchers: RequestConfig[];
};

export const config: CacheConfig = {
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
};
