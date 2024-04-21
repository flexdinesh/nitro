import { LRUCache } from "lru-cache";
import { type CacheStore } from "@nitro-cache/cache";

export function createInMemoryStore(): CacheStore {
  const options: LRUCache.Options<{}, {}, {}> = {
    max: 500,
  };

  const store = new LRUCache(options);

  return {
    get({ key }) {
      const val = store.get(key);
      if (typeof val !== "undefined") {
        type CacheEntry = NonNullable<ReturnType<CacheStore["get"]>>;
        return Promise.resolve(val) as CacheEntry;
      }
      return Promise.resolve(val);
    },
    set(args) {
      const { key, data, request, strategy } = args;
      const cacheEntry: NonNullable<Awaited<ReturnType<CacheStore["get"]>>> = {
        __meta: {
          __key: key,
          createdAt: new Date().toISOString(),
          strategy,
          request,
        },
        response: {
          body: data,
        },
      };
      store.set(key, cacheEntry);
      return Promise.resolve(key);
    },
  };
}
