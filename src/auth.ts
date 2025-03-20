export const DEFAULT_AUTH_TOKEN_URL =
  "https://api.petfinder.com/v2/oauth2/token";

export interface PetfinderAuthInit {
  apiKey: string;
  secret: string;
  tokenUrl?: string;
  token?: string;
}

/**
 * Access token provider for the Petfinder API.
 */
export class PetfinderAuth {
  readonly apiKey: string;
  readonly secret: string;
  readonly tokenUrl: string;
  _token?: string;

  constructor({ apiKey, secret, tokenUrl, token }: PetfinderAuthInit) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.tokenUrl = tokenUrl ?? DEFAULT_AUTH_TOKEN_URL;
    this._token = token;
    this.fetch = this.fetch.bind(this);
    this.getHeaders = this.getHeaders.bind(this);
    this.getToken = this.getToken.bind(this);
    this.updateToken = this.updateToken.bind(this);
  }

  /* Sends a request with Authorization headers */
  async fetch(request: Request): Promise<Response> {
    request = request.clone();
    request.headers.set("Authorization", `Bearer ${await this.getToken()}`);
    let response = await fetch(request);
    if (response.status === 401) {
      request = request.clone();
      request.headers.set(
        "Authorization",
        `Bearer ${await this.getToken({ updateToken: true })}`
      );
      response = await fetch(request);
    }
    return response;
  }

  async getHeaders(
    options: { updateToken?: boolean } = {}
  ): Promise<{ Authorization: string }> {
    return { Authorization: `Bearer ${await this.getToken(options)}` };
  }

  async getToken(options: { updateToken?: boolean } = {}): Promise<string> {
    if (options.updateToken || !this._token) await this.updateToken();
    if (!this._token) throw new Error("updateToken failed, no token available");
    return this._token;
  }

  async updateToken(): Promise<void> {
    this._token = undefined;
    const credentials = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.apiKey,
      client_secret: this.secret,
    });
    const request = new Request(this.tokenUrl, {
      body: credentials,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(
        `[${response.status}] Request for access_token failed: ${response.statusText}`
      );
    }
    const data = await response.json();
    if (
      data &&
      typeof data === "object" &&
      "access_token" in data &&
      typeof data.access_token === "string"
    ) {
      this._token = data.access_token;
    } else {
      throw new Error(
        `'access_token' not found in response data: ${JSON.stringify(data)}`
      );
    }
  }
}
