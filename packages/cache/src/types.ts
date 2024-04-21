import type {
  CacheEntry,
  CacheEntryMeta,
  CacheKey,
  CacheableStrategy,
} from "./config/types";


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
