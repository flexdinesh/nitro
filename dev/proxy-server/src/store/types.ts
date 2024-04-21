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

type CacheableStrategy = Exclude<CacheStrategy, { type: "NO-STORE" }>;

export type CacheStore = {
  get: (arg: { key: CacheKey }) => Promise<CacheEntry | undefined>;
  set: (
    arg: {
      key: CacheKey;
      data: CacheEntry["response"]["body"];
    } & Pick<CacheEntryMeta, "request"> & {
        strategy: CacheableStrategy;
      }
  ) => Promise<CacheKey>;
};
