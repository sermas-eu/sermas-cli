import { jwtDecode } from "jwt-decode";
import { KeycloakJwtTokenDto } from "../dto/keycloak.dto";
import logger from "../logger";
import { CliConfigHandler } from "./config";
import { CliCredentialsHandler } from "./credentials";

import {
  AppModuleConfigDto,
  CreatePlatformAppDto,
  DialogueUserMessageDto,
  LoginRequestDto,
  PlatformAppDto,
  PlatformAppExportFilterDto,
  SermasApiClient,
} from "@sermas/api-client";

export const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

export class BaseApi {
  private readonly apiClient: SermasApiClient;

  constructor(
    protected readonly clientId: string,
    protected readonly config: CliConfigHandler,
    protected readonly credentials: CliCredentialsHandler,
    protected readonly baseUrl = BASE_URL,
  ) {
    this.apiClient = new SermasApiClient({
      baseURL: this.baseUrl,
      logger,
    });
  }

  async close() {
    this.apiClient.getBroker().disconnect();
  }

  async getToken() {
    const credentials = await this.credentials.get(this.clientId);
    // logger.debug(`[${this.clientId}] Token ${credentials?.access_token}`);
    return credentials?.access_token || null;
  }

  async loadToken() {
    logger.verbose(`Loading token`);
    // load local credentials
    const credentials = await this.credentials.get(this.clientId);

    // no credentials, try login if params are avail
    if (!credentials?.access_token) {
      const config = await this.config.loadConfig();
      if (config && config.auth?.username && config.auth?.password) {
        logger.debug(`Attempting login for ${config.auth?.username}`);
        const data = await this.login({
          appId: undefined,
          username: config.auth?.username,
          password: config.auth?.password,
        });
        if (!data) {
          logger.error(`Login failed`);
          return null;
        }

        logger.debug(`Updating credentials for ${config.auth?.username}`);
        await this.credentials.save("user", data);

        await this.apiClient.setToken(data);
        return data?.access_token || null;
      }
    }

    if (!credentials?.access_token) {
      logger.debug(`Token not available`);
      return;
    }

    // check if token is expired
    const expired = await this.isTokenExpired(credentials?.access_token);
    if (expired) {
      logger.debug("Token is expired");
      const res = await this.refreshToken();
      if (res === null) {
        await this.credentials.remove(this.clientId);
        return await this.loadToken();
      }
    }

    logger.debug(`Loaded token for ${this.clientId}`);
    await this.apiClient.setToken(credentials);
    return credentials?.access_token || null;
  }

  async isTokenExpired(token: string) {
    if (!token) return true;
    const info = await this.getTokenInfo(token);
    return info.exp * 1000 < Date.now();
  }

  async getClient() {
    await this.apiClient.init();
    return this.apiClient;
  }

  async getBroker() {
    const apiClient = await this.getClient();
    return apiClient.getBroker();
  }

  async requestWrapper<T = any>(req: (client: SermasApiClient) => Promise<T>) {
    try {
      const api = await this.getClient();
      return await req(api);
    } catch (e: any) {
      logger.error(`Request failed: ${e.message}`);
      logger.debug(`${e.stack}`);
    }
    return null;
  }

  async refreshToken() {
    const client = await this.getClient();
    const credentials = await this.credentials.get(this.clientId);
    if (!credentials) return null;

    const tokenInfo = await this.getTokenInfo();
    if (!tokenInfo) return null;

    try {
      const res = await client.api.authentication.refreshToken({
        refreshToken: credentials.refresh_token,
        clientId: tokenInfo.clientId,
        clientSecret: "",
        appId: "",
      });

      await this.credentials.save(this.clientId, res);
      return res;
    } catch (e: any) {
      logger.warn(`Failed to refresh token: ${e.message}`);
      logger.debug(e.stack);
    }
    return null;
  }

  async getTokenInfo(token?: string) {
    token = token || (await this.getToken());
    if (!token) return null;
    return jwtDecode<KeycloakJwtTokenDto>(token);
  }

  async login(data: LoginRequestDto) {
    logger.verbose(`Performing user login`);
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.authentication.login(data),
    );
  }

  async createApp(data: CreatePlatformAppDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.createApp(data),
    );
  }

  async listUserApps() {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.listUserApps(),
    );
  }

  async loadAppCredentials(appId: string) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.getClientAccessToken({
        clientId: "application",
        appId,
      }),
    );
  }

  async removeApp(appId: string) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.removeApp(appId),
    );
  }

  async updateApp(app: PlatformAppDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.updateApp(app),
    );
  }

  async importApps(apps: PlatformAppDto[], skipClients?: boolean) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.importApps(
        skipClients === undefined ? undefined : skipClients ? "true" : "false",
        apps,
      ),
    );
  }

  async exportApps(filter: PlatformAppExportFilterDto = {}) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.exportApps(filter),
    );
  }

  async getPlatformSettings() {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.getSettings(),
    );
  }

  async getPlatformUserSettings() {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.getUserSettings(),
    );
  }

  async sendChatMessage(payload: DialogueUserMessageDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.dialogue.chatMessage(
        payload.appId,
        payload.sessionId,
        payload.language,
        payload.gender,
        payload.llm,
        payload.actor,
        payload,
      ),
    );
  }

  async savePlatformModule(cfg: AppModuleConfigDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.savePlatformModule(cfg),
    );
  }

  async removePlatformModule(moduleId: string) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.removePlatformModule(moduleId),
    );
  }

  async removeApps(appId: string[]) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.removeApps({
        appId,
      }),
    );
  }
}
