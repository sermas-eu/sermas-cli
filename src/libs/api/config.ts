import { CliConfig, CliInstanceConfig } from "../dto/cli.dto";
import logger from "../logger";
import { loadFile, saveFile } from "../util";

export class CliConfigHandler {
  private config: CliInstanceConfig = {};

  constructor(private readonly cliConfigFile: string) {}

  async loadConfig(domain: string, forceReload = false) {
    if (this.config[domain] && !forceReload) return this.config[domain];
    let res: CliConfig;
    try {
      res = await loadFile<CliInstanceConfig>(this.cliConfigFile);
      logger.verbose(`Loaded CLI config from ${this.cliConfigFile}`);
    } catch {
    } finally {
      this.config = res || {};
      return this.config[domain];
    }
  }

  async saveConfig(domain: string, res: Partial<CliConfig>) {
    try {
      logger.verbose(`Saving CLI config to ${this.cliConfigFile}`);
      const sourceConfig = await this.loadConfig(domain);
      this.config[domain] = { ...sourceConfig, ...res };
      await saveFile(this.cliConfigFile, this.config);
      return this.config[domain];
    } catch (e) {
      logger.error(`Failed to save CLI config to ${this.cliConfigFile}`);
      return null;
    }
  }
}
