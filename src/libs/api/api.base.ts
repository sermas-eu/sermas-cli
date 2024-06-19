import { jwtDecode } from "jwt-decode";
import { KeycloakJwtTokenDto } from "../dto/keycloak.dto";
import logger from "../logger";
import { CliConfigHandler } from "./config";
import { CliCredentialsHandler } from "./credentials";

import {
  AppModuleConfigDto,
  CreatePlatformAppDto,
  DialogueMessageDto,
  LoginRequestDto,
  PlatformAppDto,
  PlatformAppExportFilterDto,
  RegistrationRequestDto,
  SermasApiClient,
  UIAssetDto,
} from "@sermas/api-client";

export class BaseApi {
  protected readonly apiClient: SermasApiClient;

  constructor(
    protected readonly clientId: string,
    protected readonly config: CliConfigHandler,
    protected readonly credentials: CliCredentialsHandler,
    protected readonly baseUrl,
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
    const credentials = await this.credentials.get(this.baseUrl, this.clientId);
    // logger.debug(`[${this.clientId}] Token ${credentials?.access_token}`);
    return credentials?.access_token || null;
  }

  async loadToken() {
    logger.verbose(`Loading token`);
    // load local credentials
    const credentials = await this.credentials.get(this.baseUrl, this.clientId);

    // no credentials, try login if params are avail
    if (!credentials?.access_token) {
      const config = await this.config.loadConfig(this.baseUrl);
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
        await this.credentials.save(this.baseUrl, "user", data);

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
        await this.credentials.remove(this.baseUrl, this.clientId);
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

  getClient() {
    return this.apiClient;
  }

  getBroker() {
    const apiClient = this.getClient();
    return apiClient.getBroker();
  }

  async requestWrapper<T = any>(req: (client: SermasApiClient) => Promise<T>) {
    try {
      const api = this.getClient();
      return await req(api);
    } catch (e: any) {
      logger.error(`Request failed: ${e.message}`);
      logger.debug(`${e.stack}`);
    }
    return null;
  }

  async refreshToken() {
    const client = this.getClient();
    const credentials = await this.credentials.get(this.baseUrl, this.clientId);
    if (!credentials) return null;

    const tokenInfo = await this.getTokenInfo();
    if (!tokenInfo) return null;

    try {
      const res = await client.api.authentication.refreshToken({
        requestBody: {
          refreshToken: credentials.refresh_token,
          clientId: tokenInfo.clientId,
          clientSecret: "",
          appId: "",
        },
      });

      await this.credentials.save(this.baseUrl, this.clientId, res);
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

  async login(requestBody: LoginRequestDto) {
    logger.verbose(`Performing user login`);
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.authentication.login({ requestBody }),
    );
  }

  async createApp(requestBody: CreatePlatformAppDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.createApp({ requestBody }),
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
        requestBody: {
          clientId: "application",
          appId,
        },
      }),
    );
  }

  async removeApp(appId: string) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.removeApp({ appId }),
    );
  }

  async updateApp(requestBody: PlatformAppDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.updateApp({ requestBody }),
    );
  }

  async importApps(
    requestBody: PlatformAppDto[],
    skipClients?: boolean,
    importWebsites?: boolean,
  ) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.importApps({
        skipClients: skipClients === true ? "true" : "",
        importWebsites: importWebsites === true ? "true" : "",
        requestBody,
      }),
    );
  }

  async exportApps(requestBody: PlatformAppExportFilterDto = {}) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.exportApps({ requestBody }),
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

  async sendChatMessage(payload: DialogueMessageDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.dialogue.chatMessage({
        appId: payload.appId,
        sessionId: payload.sessionId,
        requestBody: payload,
      }),
    );
  }

  async savePlatformModule(cfg: AppModuleConfigDto) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.savePlatformModule({ requestBody: cfg }),
    );
  }

  async removePlatformModule(moduleId: string) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.removePlatformModule({
        moduleId,
      }),
    );
  }

  async removeApps(appId: string[]) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.platform.removeApps({
        requestBody: { appId },
      }),
    );
  }

  async adminUploadAsset(
    model: Partial<UIAssetDto> & { appId: string },
    file: Blob,
  ) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.ui.adminSaveAsset({
        formData: this.createFormData(model, file),
      }),
    );
  }

  async saveAsset(model: Partial<UIAssetDto> & { appId: string }, file: Blob) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.ui.saveAsset({
        formData: this.createFormData(model, file),
      }),
    );
  }

  async getAsset(payload: { appId: string; type: string; assetId: string }) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.ui.getAsset(payload),
    );
  }

  private createFormData(model: any, file: Blob): any {
    // const formData = new FormData();
    // formData.append("file", file);
    // for (const key in model) {
    //   formData.append(key, model[key]);
    // }
    // return formData;
    return {
      ...model,
      file,
    };
  }

  async importUsers(users: RegistrationRequestDto[]) {
    return await this.requestWrapper((client: SermasApiClient) =>
      client.api.authentication.importUsers({
        requestBody: users,
      }),
    );
  }
}
