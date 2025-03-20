export interface CacheEntry<T> {
  data: T;
  /* Creation timestamp in milliseconds */
  createdAt: number;
  /* Expiration timestamp in milliseconds */
  expiresAt?: number;
}

export interface CacheOptions {
  /** TTL in seconds */
  ttl?: number;
}

/** Query Storage API */
export interface ResponseCache<T = any> {
  get<Data = T>(
    request: RequestInfo | URL,
    options?: CacheOptions
  ): Promise<Data | undefined>;
  getWithMetadata<Data = T>(
    request: RequestInfo | URL,
    options?: CacheOptions
  ): Promise<CacheEntry<Data> | undefined>;
  put<Data = T>(
    request: RequestInfo | URL,
    data: Data,
    options?: CacheOptions
  ): Promise<void>;
  delete(request: RequestInfo | URL): Promise<boolean>;
}

/**
 * Client-side cache implementation using the browser Cache API:
 * https://developer.mozilla.org/en-US/docs/Web/API/Cache
 */
export class BrowserCache<T> implements ResponseCache<T> {
  readonly cacheName: string;

  constructor(cacheName: string) {
    this.cacheName = cacheName;
  }

  private open = () => caches.open(this.cacheName);

  async get<Data = T>(
    request: RequestInfo | URL,
    options?: CacheOptions
  ): Promise<Data | undefined> {
    const entry = await this.getWithMetadata<Data>(request, options);
    return entry ? entry.data : undefined;
  }

  async getWithMetadata<Data = T>(
    request: RequestInfo | URL,
    options?: CacheOptions
  ): Promise<CacheEntry<Data> | undefined> {
    const cache = await this.open();
    const response = await cache.match(request);
    if (!response) return undefined;
    const entry: CacheEntry<Data> = await response.json();
    // Check if the entry has expired.
    // If the TTL option was provided, it will override the expiration time defined in the metadata.
    const ttl = options?.ttl;
    const expiresAt =
      ttl !== undefined ? entry.createdAt + ttl * 1000 : entry.expiresAt;
    if (expiresAt && Date.now() > expiresAt) {
      await this.delete(request);
      return undefined;
    }
    // Else, the cached entry is valid.
    return entry;
  }

  async put<Data = T>(
    request: RequestInfo | URL,
    data: Data,
    options?: CacheOptions
  ): Promise<void> {
    const cache = await this.open();
    const now = Date.now();
    const entry: CacheEntry<Data> = {
      data,
      createdAt: now,
      expiresAt: options?.ttl ? now + options.ttl * 1000 : undefined,
    };
    const response = new Response(JSON.stringify(entry), {
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(request, response);
  }

  async delete(request: RequestInfo | URL): Promise<boolean> {
    const cache = await this.open();
    return await cache.delete(request);
  }
}
