import { PetfinderAuth } from "./auth";
import type { CacheOptions, ResponseCache } from "./cache";
import type {
  Pet,
  PetQueryFilters,
  PetQueryResponseData,
  PetSortCriteria,
} from "./types";

export type QueryParams = Record<string, any>;

export class QueryError extends Error {
  response: Response;
  constructor(response: Response) {
    super(`[${response.status}] Request failed: ${response.statusText}`);
    this.response = response;
  }
}

export interface QueryInit<T> {
  baseUrl: string;
  path: string;
  params?: QueryParams;
  auth?: PetfinderAuth;
  cache?: ResponseCache<T>;
  cacheOptions?: CacheOptions;
}

/* Fields that can be changed without impacting the response type */
type QueryUpdateOptions<T> = Partial<Omit<QueryInit<T>, "path">>;

export class Query<T> {
  readonly baseUrl: string;
  readonly path: string;
  protected params: QueryParams;
  protected auth?: PetfinderAuth;
  protected cache?: ResponseCache<T>;
  protected cacheOptions?: CacheOptions;

  constructor({
    baseUrl,
    path,
    params,
    auth,
    cache,
    cacheOptions,
  }: QueryInit<T>) {
    this.baseUrl = baseUrl;
    this.path = path;
    this.params = params ?? {};
    this.auth = auth;
    this.cache = cache;
    this.cacheOptions = cacheOptions;
    this.update = this.update.bind(this);
    this.updateParams = this.updateParams.bind(this);
    this.buildURL = this.buildURL.bind(this);
    this.buildRequest = this.buildRequest.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }

  /* Returns a *new* instance of this query with the updated fields */
  update(changes: QueryUpdateOptions<T>): this {
    const ctor = this.constructor as new (init: QueryInit<T>) => this;
    const init = {
      baseUrl: this.baseUrl,
      path: this.path,
      params: this.params,
      auth: this.auth,
      cache: this.cache,
      cacheOptions: this.cacheOptions,
      ...changes,
    };
    return new ctor(init);
  }

  /* Returns a *new* instance of this query with the updated searchParams */
  updateParams(changes: QueryParams): this {
    return this.update({ params: { ...this.params, ...changes } });
  }

  buildURL(): URL {
    const url = new URL(`${this.baseUrl}/${this.path}`);
    for (const [key, value] of Object.entries(this.params)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(","));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }
    url.searchParams.sort();
    return url;
  }

  async buildRequest(options?: { updateToken?: boolean }): Promise<Request> {
    const url = this.buildURL();
    const requestInit: RequestInit = {};
    if (this.auth) {
      requestInit.headers = await this.auth.getHeaders(options);
    }
    return new Request(url, requestInit);
  }

  async fetchData(): Promise<T> {
    const request = await this.buildRequest();
    if (this.cache) {
      const cached = await this.cache.get(request, this.cacheOptions);
      if (cached) return cached;
    }
    const response = await (this.auth?.fetch ?? fetch)(request);
    if (!response.ok) throw new QueryError(response);
    const data = (await response.json()) as T;
    if (this.cache) {
      this.cache
        .put(request, data, this.cacheOptions)
        .catch((error) => console.error(`Failed to cache response`, error));
    }
    return data;
  }
}

export class PetQuery extends Query<PetQueryResponseData> {
  constructor(init: QueryInit<PetQueryResponseData>) {
    super(init);
    this.filter = this.filter.bind(this);
    this.limit = this.limit.bind(this);
    this.sortBy = this.sortBy.bind(this);
    this.page = this.page.bind(this);
    this.getBreeds = this.getBreeds.bind(this);
    this.getColors = this.getColors.bind(this);
    this.getTotalCount = this.getTotalCount.bind(this);
    this.getTotalPages = this.getTotalPages.bind(this);
    this.search = this.search.bind(this);
  }

  filter(params: PetQueryFilters): PetQuery {
    return this.updateParams(params);
  }

  limit(value: number): PetQuery {
    return this.updateParams({ limit: value });
  }

  sortBy(value: PetSortCriteria): PetQuery {
    return this.updateParams({ sort: value });
  }

  page(number: number): PetQuery {
    return this.updateParams({ page: number });
  }

  async getBreeds(): Promise<Set<string>> {
    if (!this.params.type) {
      throw new Error("Pet type must be set before getting breeds");
    }
    const query = new Query<{ breeds: Array<{ name: string }> }>({
      baseUrl: this.baseUrl,
      auth: this.auth,
      path: `types/${this.params.type}/breeds`,
      cache: this.cache,
      cacheOptions: { ttl: 1000 * 60 * 60 * 24 * 7 },
    });
    const data = await query.fetchData();
    return new Set(data.breeds.map((b) => b.name.toLowerCase()));
  }

  async getColors(): Promise<Set<string>> {
    if (!this.params.type) {
      throw new Error("Pet type must be set before getting colors");
    }
    const query = new Query<{ type: { colors: string[] } }>({
      baseUrl: this.baseUrl,
      auth: this.auth,
      path: `types/${this.params.type}`,
      cache: this.cache,
      cacheOptions: { ttl: 1000 * 60 * 60 * 24 * 7 },
    });
    const data = await query.fetchData();
    return new Set(data.type.colors.map((c) => c.toLowerCase()));
  }

  async getTotalCount(): Promise<number> {
    const response = await this.fetchData();
    return response.pagination.total_count;
  }

  async getTotalPages(): Promise<number> {
    const response = await this.fetchData();
    return response.pagination.total_pages;
  }

  async search(limit: number = 100, startPage: number = 1): Promise<Pet[]> {
    const numPages = Math.ceil(limit / 100);
    const promises = Array.from({ length: numPages }, (_, i) =>
      this.page(startPage + i)
        .limit(100)
        .fetchData()
    );
    const responses = await Promise.all(promises);
    return responses.flatMap((response) => response.animals);
  }
}
