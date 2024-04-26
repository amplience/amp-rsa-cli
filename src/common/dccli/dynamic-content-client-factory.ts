/* eslint-disable @typescript-eslint/camelcase */
import { DynamicContent } from "dc-management-sdk-js";
import { ConfigurationParameters } from "./configure";

const dynamicContentClientFactory = (
  config: ConfigurationParameters,
): DynamicContent =>
  new DynamicContent(
    {
      client_id: config.clientId,
      client_secret: config.clientSecret,
    },
    {
      apiUrl: process.env.API_URL,
      authUrl: process.env.AUTH_URL,
    },
  );

export default dynamicContentClientFactory;
