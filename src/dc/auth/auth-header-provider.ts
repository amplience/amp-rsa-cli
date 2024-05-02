export interface AuthHeaderProvider {
  getAuthHeader(): Promise<string>;
}

export interface AccessToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
