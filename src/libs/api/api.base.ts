import { jwtDecode } from 'jwt-decode';
import mqtt from 'mqtt';
import { KeycloakJwtTokenDto } from '../dto/keycloak.dto';
import logger from '../logger';
import {
  AppModuleConfigDto,
  CreatePlatformAppDto,
  DialogueUserMessageDto,
  LoginRequestDto,
  PlatformAppDto,
  PlatformAppExportFilterDto,
  SermasApi,
} from '../openapi';
import { uuid } from '../util';
import { CliConfigHandler } from './config';
import { CliCredentialsHandler } from './credentials';

export const BASE_URL =
  process.env.BASE_URL || 'http://localhost:8080';

export class BaseApi {
  private readonly api: SermasApi;

  constructor(
    protected readonly clientId: string,
    protected readonly config: CliConfigHandler,
    protected readonly credentials: CliCredentialsHandler,
    protected readonly baseUrl = BASE_URL,
  ) {
    this.api = new SermasApi({
      BASE: this.baseUrl,
      TOKEN: () => this.getToken(),
    });
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
        await this.credentials.save('user', data);

        return credentials?.access_token || null;
      }
    }

    if (!credentials?.access_token) {
      logger.debug(`Token not available`);
      return;
    }

    // check if token is expired
    const expired = await this.isTokenExpired(credentials?.access_token);
    if (expired) {
      logger.debug('Token is expired');
      const res = await this.refreshToken();
      if (res === null) {
        await this.credentials.remove(this.clientId);
        return await this.loadToken();
      }
    }

    logger.debug(`Loaded token for ${this.clientId}`);
    return credentials?.access_token || null;
  }

  async isTokenExpired(token: string) {
    if (!token) return true;
    const info = await this.getTokenInfo(token);
    return info.exp * 1000 < Date.now();
  }

  getClient() {
    return this.api;
  }

  async requestWrapper<T = any>(req: (api: SermasApi) => Promise<T>) {
    try {
      const api = await this.getClient();
      return await req(api);
    } catch (e: any) {
      logger.error(`Request failed: ${e.message}`);
      logger.debug(`${e.stack}`);
    }
    return null;
  }

  async connectMqtt(appId: string, token?: string) {
    if (!token) {
      const credentials = await this.loadAppCredentials(appId);
      if (credentials === null) {
        logger.error(`Failed to get access token for ${appId}`);
        return null;
      }
      token = credentials?.access_token;
    }

    if (!token) {
      logger.error(`Token is missing`);
      return null;
    }

    const tokenInfo = await this.getTokenInfo(token);
    const mqttUrl = BASE_URL.replace('https', 'wss') + '/mqtt';
    const client = mqtt.connect(mqttUrl, {
      username: token,
      password: 'sermas-cli',
      clientId: `sermas-cli-${tokenInfo.sub}-${uuid()}`,
      // protocolVersion: 5,
    });

    client.on('disconnect', () => {
      logger.debug(`[${appId}] Disconnected`);
    });

    return await new Promise<mqtt.MqttClient>((resolve, reject) => {
      client.on('error', (e) => reject(e));
      client.on('connect', () => {
        logger.debug(`[${appId}] Connected`);
        resolve(client);
      });
    });
  }

  async refreshToken() {
    const client = await this.getClient();
    const credentials = await this.credentials.get(this.clientId);
    if (!credentials) return null;

    const tokenInfo = await this.getTokenInfo();
    if (!tokenInfo) return null;

    try {
      const res = await client.authentication.refreshToken({
        refreshToken: credentials.refresh_token,
        clientId: tokenInfo.clientId,
        clientSecret: '',
        appId: '',
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
    return await this.requestWrapper((api: SermasApi) =>
      api.authentication.login(data),
    );
  }

  async createApp(data: CreatePlatformAppDto) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.createApp(data),
    );
  }

  async listUserApps() {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.listUserApps(),
    );
  }

  async loadAppCredentials(appId: string) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.getClientAccessToken({
        clientId: 'application',
        appId,
      }),
    );
  }

  async removeApp(appId: string) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.removeApp(appId),
    );
  }

  async updateApp(app: PlatformAppDto) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.updateApp(app),
    );
  }

  async importApps(apps: PlatformAppDto[], skipClients?: boolean) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.importApps(
        skipClients === undefined ? undefined : skipClients ? 'true' : 'false',
        apps,
      ),
    );
  }

  async exportApps(filter: PlatformAppExportFilterDto = {}) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.exportApps(filter),
    );
  }

  async getPlatformSettings() {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.getSettings(),
    );
  }

  async getPlatformUserSettings() {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.getUserSettings(),
    );
  }

  async sendChatMessage(payload: DialogueUserMessageDto) {
    return await this.requestWrapper((api: SermasApi) =>
      api.dialogue.chatMessage(
        payload.appId,
        payload.sessionId,
        payload.language,
        payload.gender,
        payload.llm,
        payload,
      ),
    );
  }

  async savePlatformModule(cfg: AppModuleConfigDto) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.savePlatformModule(cfg),
    );
  }

  async removePlatformModule(moduleId: string) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.removePlatformModule(moduleId),
    );
  }

  async removeApps(appId: string[]) {
    return await this.requestWrapper((api: SermasApi) =>
      api.platform.removeApps({
        appId,
      }),
    );
  }
}
