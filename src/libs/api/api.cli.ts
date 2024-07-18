import { Logger, LoginResponseDto } from "@sermas/api-client";
import { CliConfig } from "../dto/cli.dto";
import { AppApi } from "./api.app";
import { BaseApi } from "./api.base";
import { CliConfigHandler } from "./config";
import { CliCredentialsHandler } from "./credentials";

export class CliApi extends BaseApi {
  protected readonly logger = new Logger(CliApi.name);

  constructor(
    protected override readonly config: CliConfigHandler,
    protected override readonly credentials: CliCredentialsHandler,
    baseUrl: string,
  ) {
    super("user", config, credentials, baseUrl);
  }

  async getAppClient(appId: string): Promise<AppApi> {
    const api = new AppApi(appId, this.config, this.credentials, this.baseUrl);

    let credentials = await this.credentials.get(this.baseUrl, appId);
    if (credentials) {
      this.logger.debug(`Found credentials`);
      const expired = await this.isTokenExpired(credentials?.access_token);
      if (expired) {
        await this.credentials.remove(this.baseUrl, appId);
        credentials = null;
        this.logger.debug(`Credentials expired`);
      }
    }

    if (!credentials) {
      this.logger.debug(`Loading credentials`);

      credentials = await this.loadAppCredentials(appId);
      if (credentials === null) {
        this.logger.warn(`Failed to load app credentials`);
        this.getClient().setToken(undefined);
        return null;
      }

      await this.credentials.save(this.baseUrl, appId, credentials);
    }

    if (credentials) {
      this.logger.debug(`Setting credentials`);
      api.getClient()?.setToken(credentials);
    } else {
      this.logger.warn(`Credentials not available`);
    }

    return api;
  }

  saveUserCredentials(res: LoginResponseDto): Promise<LoginResponseDto> {
    return this.saveClientCredentials(this.clientId, res);
  }

  async saveClientCredentials(
    clientId: string,
    res: LoginResponseDto,
  ): Promise<LoginResponseDto> {
    await this.credentials.save(this.baseUrl, clientId, res);
    return res;
  }

  async saveConfig(data: Partial<CliConfig>): Promise<CliConfig> {
    const res = await this.config.saveConfig(this.baseUrl, data);
    return res || null;
  }
}
