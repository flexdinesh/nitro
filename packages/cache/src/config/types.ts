import { type HonoRequest } from "hono";

export type CacheKey = string;

export type CacheStrategyType =
  | "NO-STORE"
  | "MAX-AGE"
  | "STALE-WHILE-REVALIDATE";

export type CacheStrategy =
  | {
      /**
       * The caching strategy to use for storing this entry.
       * The default is 'MAX-AGE'.
       */
      type: Extract<CacheStrategyType, "NO-STORE">;
    }
  | {
      /**
       * The caching strategy to use for storing this entry.
       * The default is 'MAX-AGE'.
       */
      type: Extract<CacheStrategyType, "MAX-AGE">;
      /**
       * How long to cache the entry for in ms. Once it expires,
       * the request will be served from the origin.
       * Default is 0.
       */
      expiryTTL: number;
    }
  | {
      /**
       * The caching strategy to use for storing this entry.
       * The default is 'MAX-AGE'.
       */
      type: Extract<CacheStrategyType, "STALE-WHILE-REVALIDATE">;
      /**
       * How long to cache the entry for in ms. Once it expires,
       * the request will be served from the origin.
       * Default is 0.
       */
      expiryTTL: number;
      /**
       * How long is the entry fresh in ms. After this time,
       * the cache is considered stale.
       * This is an optional value. It's relevant only for
       * STALE-WHILE-REVALIDATE caching strategy.
       * The default value is the same value as expiryTTL.
       */
      staleTTL: number;
    };

export type CacheEntryMeta = {
  /** The key used to identify the data in the cache store */
  __key: CacheKey;
  request: {
    /** The origin URL of the original request */
    origin: string;
    /** The URL path of the original request */
    path: string;
  };
  /** ISO date string of when the entry was created */
  createdAt: string;
  strategy: CacheStrategy;
};

export type CacheEntry = {
  __meta: CacheEntryMeta;
  response: {
    /** Dump of body JSON */
    body: any;
  };
};

export type CacheableStrategy = Exclude<CacheStrategy, { type: "NO-STORE" }>;


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
