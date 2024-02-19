import { CliConfig } from '../dto/cli.dto';
import { LoginResponseDto } from '../openapi';
import { AppApi } from './api.app';
import { BaseApi } from './api.base';
import { CliConfigHandler } from './config';
import { CliCredentialsHandler } from './credentials';

export class CliApi extends BaseApi {
  constructor(
    protected override readonly config: CliConfigHandler,
    protected override readonly credentials: CliCredentialsHandler,
    baseUrl?: string,
  ) {
    super('user', config, credentials, baseUrl);
  }

  async getAppClient(appId: string): Promise<AppApi> {
    const api = new AppApi(appId, this.config, this.credentials);

    let credentials = await this.credentials.get(appId);
    if (credentials) {
      const expired = await this.isTokenExpired(credentials?.access_token);
      if (expired) {
        await this.credentials.remove(appId);
        credentials = null;
      }
    }

    if (!credentials) {
      const credentials = await this.loadAppCredentials(appId);
      if (credentials === null) return null;
      await this.credentials.save(appId, credentials);
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
    await this.credentials.save(clientId, res);
    return res;
  }

  async saveConfig(data: Partial<CliConfig>): Promise<CliConfig> {
    const res = await this.config.saveConfig(data);
    return res || null;
  }
}
