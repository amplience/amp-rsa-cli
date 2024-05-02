import { AccessToken, AuthHeaderProvider } from "./auth-header-provider";
import { HttpClient, HttpMethod } from "../http-client";

export class Oauth2AuthHeaderProvider implements AuthHeaderProvider {
  private clientId: string;
  private clientSecret: string;
  private authUrl: string;
  private token: AccessToken;
  private tokenExpires: number;
  private inFlight: Promise<AccessToken> | null;
  private EXPIRY_OFFSET_SECONDS = 30;
  private httpClient: HttpClient;

  constructor({ clientId, clientSecret }, { authUrl }, httpClient: HttpClient) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.authUrl = authUrl || "https://auth.amplience.net/oauth/token";
    this.httpClient = httpClient;
  }

  async getAccessToken(): Promise<AccessToken> {
    if (this.inFlight != null) {
      return this.inFlight;
    }

    if (
      this.token &&
      this.tokenExpires - this.EXPIRY_OFFSET_SECONDS * 1000 > Date.now()
    ) {
      return this.token;
    }

    try {
      const request = this.httpClient.request({
        url: this.authUrl,
        method: HttpMethod.POST,
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(this.clientId)}&client_secret=${encodeURIComponent(this.clientSecret)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      this.inFlight = request
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error - failed to fetch auth token with status: ${response.status}`,
            );
          }
          return response.json();
        })
        .then((token) => {
          this.token = token;
          this.tokenExpires = Date.now() + this.token.expires_in * 1000;
          this.inFlight = null;

          return this.token;
        });
    } catch (e) {
      throw new Error(`Error - unable to fetch auth token: ${e.message}`);
    }

    return this.inFlight;
  }

  async getAuthHeader(): Promise<string> {
    const token = await this.getAccessToken();

    return `bearer ${token.access_token}`;
  }
}
