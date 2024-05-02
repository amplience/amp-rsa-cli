import unfetch from "isomorphic-unfetch";
const fetch = require("fetch-retry")(unfetch, {
  retryOn: [429, 500, 501, 502, 503, 504],
  retries: 3,
  retryDelay: (attempt) => Math.pow(2, attempt) * 1000 * (Math.random() + 0.5),
});

import logger from "../common/logger";

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface DCRequestConfig {
  url: string;
  method: HttpMethod;
  headers?: { [key: string]: string };
  body?: BodyInit | null | undefined;
}

export class HttpClient {
  constructor() {}

  async request({
    url,
    method,
    headers,
    body,
  }: DCRequestConfig): Promise<Response> {
    return fetch(url, { method, body, headers });
  }
}
