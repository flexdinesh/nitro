import { Context, type MiddlewareHandler } from "hono";
import { type CacheConfig } from "../config/types";
import { type CacheStore } from "../types";

export const middleware = ({
  store,
  config,
}: {
  store: CacheStore;
  config: CacheConfig;
}): MiddlewareHandler => {
  return async function cacheMiddleware(context, next) {
    const { path } = context.req;

    const pathConfig = config.matchers.find((c) =>
      typeof c.path === "function" ? c.path(path) : c.path === path
    );

    /* 
      This header is a request to bypass cache and
      go straight to origin. Cache will not be involved.
    */
    if (context.req.header("X-Cache-Hint") === "BYPASS") {
      const originUrl = pathConfig
        ? `${pathConfig.origin}${path}`
        : `${config.origin}${path}`;
      const response = await fetch(originUrl);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-Cache-Strategy", "OVERRIDEN-BY-HEADER");
      newResponse.headers.set("X-Cache-Status", "BYPASS");
      return newResponse;
    }

    /* 
      This is a revalidation request from the queue - proxy
      to origin and refresh cache. No need to include data in response.
    */
    if (pathConfig && context.req.header("X-Cache-Hint") === "REVALIDATE") {
      console.log("Revalidation request received.", { url: context.req.url });
      await handleRevalidationHint({
        context,
        pathConfig,
        store,
      });
      return new Response(null, {
        status: 204,
      });
    } else if (pathConfig && pathConfig.strategy.type === "NO-STORE") {
      return handleNoStoreStrategy({
        context,
        pathConfig,
      });
    } else if (pathConfig && pathConfig.strategy.type === "MAX-AGE") {
      return handleMaxAgeStrategy({
        context,
        pathConfig,
        store,
      });
    } else if (
      pathConfig &&
      pathConfig.strategy.type === "STALE-WHILE-REVALIDATE"
    ) {
      return handleStaleWhileRevalidateStrategy({
        context,
        pathConfig,
        store,
      });
    }

    /* path did not match - proxy default origin */
    const originUrl = `${config.origin}${path}`;
    const originResponse = await fetchFromOrigin(originUrl);
    originResponse.headers.set("X-Cache-Status", "NO-MATCH");
    return originResponse;
  };
};

async function handleNoStoreStrategy({
  pathConfig,
  context,
}: {
  pathConfig: CacheConfig["matchers"][number];
  context: Context<any, string, {}>;
}) {
  const { path } = context.req;
  const originUrl = `${pathConfig.origin}${path}`;
  const originResponse = await fetchFromOrigin(originUrl);
  originResponse.headers.set("X-Cache-Strategy", pathConfig.strategy.type);
  originResponse.headers.set("X-Cache-Status", "BYPASS");
  return originResponse;
}

async function handleMaxAgeStrategy({
  pathConfig,
  store,
  context,
}: {
  pathConfig: CacheConfig["matchers"][number];
  store: CacheStore;
  context: Context<any, string, {}>;
}) {
  if (pathConfig.strategy.type !== "MAX-AGE") {
    // throwing here to make types happy
    throw new Error("oops this method doesn't handle that case");
  }

  const { path } = context.req;

  /* path matched - check cache */
  const originUrl = `${pathConfig.origin}${path}`;
  const cacheKey =
    typeof pathConfig.cacheKey === "function"
      ? pathConfig.cacheKey(context.req)
      : originUrl;

  let cacheEntry;
  try {
    cacheEntry = await store.get({ key: cacheKey });
  } catch (e) {
    return fetchFromOrigin(originUrl);
  }

  /* 
    proxy request to origin for either of these cases:
    1. cache entry not found (MISS) - 
    2. cache entry found but expired (MISS)
  */

  /* 
    cache entry not found (MISS) - proxy request to origin
  */
  if (!cacheEntry) {
    return proxyRequestToOriginAndCacheResponse({
      cacheKey,
      originUrl,
      path,
      pathConfig,
      store,
    });
  }

  const cacheCreatedAtISOString = cacheEntry.__meta.createdAt;
  const cacheExpiresAtMS =
    new Date(cacheCreatedAtISOString).getTime() + pathConfig.strategy.expiryTTL;
  const isCacheExpired = Date.now() > cacheExpiresAtMS;

  /* 
    cache entry found but expired (MISS) - proxy request to origin
  */
  if (isCacheExpired) {
    return proxyRequestToOriginAndCacheResponse({
      cacheKey,
      originUrl,
      path,
      pathConfig,
      store,
    });
  }

  /* 
    cache entry found and is fresh (HIT) - send cached value as json response 
  */
  context.header("X-Cache-Strategy", pathConfig.strategy.type);
  context.header("X-Cache-Status", "HIT");
  return context.json(cacheEntry.response.body);
}

async function handleStaleWhileRevalidateStrategy({
  pathConfig,
  store,
  context,
}: {
  pathConfig: CacheConfig["matchers"][number];
  store: CacheStore;
  context: Context<any, string, {}>;
}) {
  if (pathConfig.strategy.type !== "STALE-WHILE-REVALIDATE") {
    // throwing here to make types happy
    throw new Error("oops this method doesn't handle that case");
  }

  const { path } = context.req;

  /* path matched - check cache */
  const originUrl = `${pathConfig.origin}${path}`;
  const cacheKey =
    typeof pathConfig.cacheKey === "function"
      ? pathConfig.cacheKey(context.req)
      : originUrl;

  let cacheEntry;
  try {
    cacheEntry = await store.get({ key: cacheKey });
  } catch (e) {
    return fetchFromOrigin(originUrl);
  }

  /* 
    proxy request to origin for either of these cases:
    1. cache entry not found (MISS) - 
    2. cache entry found but expired (MISS)
  */

  /* 
    cache entry not found (MISS) - proxy request to origin
  */
  if (!cacheEntry) {
    return proxyRequestToOriginAndCacheResponse({
      cacheKey,
      originUrl,
      path,
      pathConfig,
      store,
    });
  }

  const cacheCreatedAtISOString = cacheEntry.__meta.createdAt;
  const cacheExpiresAtMS =
    new Date(cacheCreatedAtISOString).getTime() + pathConfig.strategy.expiryTTL;
  const cacheStaleAtMS =
    new Date(cacheCreatedAtISOString).getTime() + pathConfig.strategy.staleTTL;
  const isCacheStale = Date.now() > cacheStaleAtMS;
  const isCacheExpired = Date.now() > cacheExpiresAtMS;

  /* 
    cache entry found but expired (MISS) - proxy request to origin
  */
  if (isCacheExpired) {
    return proxyRequestToOriginAndCacheResponse({
      cacheKey,
      originUrl,
      path,
      pathConfig,
      store,
    });
  }

  /* 
    cache entry found, is stale but not expired (STALE) - 
    return stale cache and queue for revalidation
  */
  if (isCacheStale) {
    // if stale - queue and return stale
    const url = context.req.url;
    const method = context.req.method;
    const host = context.req.header("host");
    const path = context.req.path;
    const body = (await context.req.json().catch((e) => {})) ?? undefined;
    const urlForQueryString = new URL(url);
    const queryString = urlForQueryString.searchParams.toString();
    let headers: Record<string, unknown> = {};
    context.req.raw.headers.forEach((val, key) => (headers[key] = val));

    // TODO: use config
    const queueStatus = await fetch("http://localhost:3001/queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request: {
          url,
          host,
          method,
          path,
          queryString,
          body,
          headers,
        },
      }),
    });
    const resStatus = queueStatus.status;
    console.log("Queued for revalidation.", { status: resStatus });

    context.header("X-Cache-Strategy", pathConfig.strategy.type);
    context.header("X-Cache-Status", "STALE");
    return context.json(cacheEntry.response.body);
  }

  /* 
    cache entry found and is fresh (HIT) - send cached value as json response 
  */
  context.header("X-Cache-Strategy", pathConfig.strategy.type);
  context.header("X-Cache-Status", "HIT");
  return context.json(cacheEntry.response.body);
}

async function proxyRequestToOriginAndCacheResponse({
  pathConfig,
  originUrl,
  store,
  cacheKey,
  path,
}: {
  pathConfig: CacheConfig["matchers"][number];
  originUrl: string;
  store: CacheStore;
  cacheKey: string;
  path: string;
}) {
  if (pathConfig.strategy.type === "NO-STORE") {
    // throwing here to make types happy
    throw new Error("oops this method doesn't handle that case");
  }

  const response = await fetch(originUrl);
  // we need to clone the response before processing it
  // we send the original back as response
  const clonedResponse = response.clone();

  /* if response is not cacheable, don't cache it.  */
  if (!isResponseCacheable(clonedResponse)) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("X-Cache-Strategy", pathConfig.strategy.type);
    newResponse.headers.set("X-Cache-Status", "SKIP");
    return newResponse;
  }

  /* save response body to cache */
  try {
    const responseBody = await clonedResponse.json();
    await store.set({
      key: cacheKey,
      data: responseBody,
      request: {
        origin: pathConfig.origin,
        path,
      },
      strategy: pathConfig.strategy,
    });
  } catch (e) {
    return fetchFromOrigin(originUrl);
  }

  const newResponse = new Response(response.body, response);
  newResponse.headers.set("X-Cache-Strategy", pathConfig.strategy.type);
  newResponse.headers.set("X-Cache-Status", "MISS");
  return newResponse;
}

async function handleRevalidationHint({
  pathConfig,
  store,
  context,
}: {
  pathConfig: CacheConfig["matchers"][number];
  store: CacheStore;
  context: Context<any, string, {}>;
}) {
  if (context.req.header("X-Cache-Hint") !== "REVALIDATE") {
    // throwing here to make types happy
    throw new Error("oops this method doesn't handle that case");
  }
  const { path } = context.req;

  /* path matched - check cache */
  const originUrl = `${pathConfig.origin}${path}`;
  const cacheKey =
    typeof pathConfig.cacheKey === "function"
      ? pathConfig.cacheKey(context.req)
      : originUrl;

  /* 
    This is a revalidation request from the queue - proxy
    to origin and refresh cache.
  */
  return proxyRequestToOriginAndCacheResponse({
    cacheKey,
    originUrl,
    path,
    pathConfig,
    store,
  });
}

async function fetchFromOrigin(originUrl: string) {
  const response = await fetch(originUrl);
  const newResponse = new Response(response.body, response);
  return newResponse;
}

function isResponseCacheable(clonedResponse: Response) {
  const contentType = clonedResponse.headers.get("Content-Type");
  return (
    clonedResponse.status === 200 &&
    contentType?.includes("application/json") === true
  );
}
