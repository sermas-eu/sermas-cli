import { LoginResponseDto } from "@sermas/api-client";
import { CliCredentialsCollection } from "../dto/cli.dto";
import logger from "../logger";
import { loadFile, rmFile, saveFile } from "../util";
import { CliConfigHandler } from "./config";

export class CliCredentialsHandler {
  private credentials: CliCredentialsCollection;

  constructor(
    private readonly config: CliConfigHandler,
    private readonly credentialsFile,
  ) {}

  async load(force = false) {
    if (!force && this.credentials) return this.credentials;
    let res: any;
    try {
      res = await loadFile<CliCredentialsCollection>(this.credentialsFile);
      logger.verbose(`Loaded credentials from ${this.credentialsFile}`);
    } catch {
    } finally {
      this.credentials = res || {};
      return this.credentials;
    }
  }

  async getAll() {
    await this.load();
    return this.credentials || null;
  }

  async get(clientId: string) {
    await this.load();
    return this.credentials[clientId] || null;
  }

  async save(clientId: string, data: LoginResponseDto) {
    const saved = await this.load();
    const exists = saved[clientId] || undefined;

    this.credentials[clientId] = data;
    const config = await this.config.loadConfig();

    if (
      config.auth?.saveLocally &&
      exists?.access_token !== this.credentials[clientId].access_token
    ) {
      const res = await this.saveAll(this.credentials);
      if (res === null) return null;
      logger.debug(`Updated credentials`);
    }
    return data;
  }

  async saveAll(res: CliCredentialsCollection) {
    await this.load();
    try {
      logger.verbose(`Saving credentials to ${this.credentialsFile}`);
      await saveFile(this.credentialsFile, res);
      return res;
    } catch (e) {
      logger.error(`Failed to save credentials to  ${this.credentialsFile}`);
      return null;
    }
  }

  async clear() {
    try {
      this.credentials = undefined;
      await rmFile(this.credentialsFile);
      logger.verbose(`Removed credentials to ${this.credentialsFile}`);
    } catch {}
  }

  async remove(clientId: string) {
    await this.load();
    try {
      if (this.credentials[clientId]) delete this.credentials[clientId];
      await this.saveAll(this.credentials);
    } catch {}
  }
}
