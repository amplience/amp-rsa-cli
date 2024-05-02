import { AuthHeaderProvider } from "./auth/auth-header-provider";
import { Oauth2AuthHeaderProvider } from "./auth/oauth2-auth-header-provider";
import { HttpClient, HttpMethod } from "./http-client";

export interface DCClientCredentials {
  clientId: string;
  clientSecret: string;
}

export interface DCClientOptions {
  apiUrl?: string;
  authUrl?: string;
}

export class DCClient {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private httpClient: HttpClient;
  private authHeaderProvider: AuthHeaderProvider;

  constructor(
    { clientId, clientSecret }: DCClientCredentials,
    { apiUrl, authUrl }: DCClientOptions,
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiUrl = apiUrl || "https://api.amplience.net/v2/content";

    this.httpClient = new HttpClient();

    this.authHeaderProvider = new Oauth2AuthHeaderProvider(
      { clientId: this.clientId, clientSecret: this.clientSecret },
      { authUrl },
      this.httpClient,
    );
  }

  async get(path: string) {
    return this.invoke({ path, method: HttpMethod.GET });
  }

  async post(path: string, body?: BodyInit | null | undefined) {
    return this.invoke({ path, method: HttpMethod.POST, body });
  }

  async delete(path: string) {
    return this.invoke({ path, method: HttpMethod.DELETE });
  }

  protected async invoke({
    path,
    method,
    body,
  }: {
    path: string;
    method: HttpMethod;
    body?: BodyInit | null | undefined;
  }) {
    const authHeader = await this.authHeaderProvider.getAuthHeader();
    const fullUrl = `${this.apiUrl}/${path.replace(/^\/+/, "")}`;
    const response = await this.httpClient.request({
      url: fullUrl,
      method,
      headers: {
        Authorization: authHeader,
      },
      ...(body ? { body } : {}),
    });

    if (!response.ok) {
      throw new Error(
        `Request failed with status code ${response.status}: ${method} - ${fullUrl}`,
      );
    }

    const text = await response.text();
    // Return an empty object if the 2xx response has no data
    return text ? JSON.parse(text) : {};
  }
}
