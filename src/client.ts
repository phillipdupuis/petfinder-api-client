import { PetfinderAuth } from "./auth";
import type { CacheOptions, ResponseCache } from "./cache";
import { PetQuery } from "./query";

export const DEFAULT_BASE_URL = "https://api.petfinder.com/v2";

export interface PetfinderClientInit {
  baseUrl?: string;
  apiKey?: string;
  secret?: string;
  defaultCache?: ResponseCache;
  defaultCacheOptions?: CacheOptions;
}

export class PetfinderClient {
  readonly baseUrl: string;
  auth?: PetfinderAuth;
  defaultCache?: ResponseCache<any>;
  defaultCacheOptions?: CacheOptions;
  pets: PetQuery;

  constructor({
    baseUrl,
    apiKey,
    secret,
    defaultCache,
    defaultCacheOptions,
  }: PetfinderClientInit) {
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    this.auth =
      apiKey && secret
        ? new PetfinderAuth({
            tokenUrl: `${this.baseUrl}/oauth2/token`,
            apiKey,
            secret,
          })
        : undefined;
    this.defaultCache = defaultCache;
    this.defaultCacheOptions = defaultCacheOptions;
    this.pets = new PetQuery({
      baseUrl: this.baseUrl,
      path: "animals",
      auth: this.auth,
      cache: this.defaultCache,
      cacheOptions: this.defaultCacheOptions,
    });
  }
}
