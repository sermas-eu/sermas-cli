import { CliConfig } from "../dto/cli.dto";
import logger from "../logger";
import { loadFile, saveFile } from "../util";

export class CliConfigHandler {
  private config: CliConfig;

  constructor(private readonly cliConfigFile: string) {}

  async loadConfig(forceReload = false) {
    if (this.config && !forceReload) return this.config;
    let res: CliConfig;
    try {
      res = await loadFile<CliConfig>(this.cliConfigFile);
      logger.verbose(`Loaded CLI config from ${this.cliConfigFile}`);
    } catch {
    } finally {
      this.config = res || {};
      return this.config;
    }
  }

  async saveConfig(res: Partial<CliConfig>) {
    try {
      logger.verbose(`Saving CLI config to ${this.cliConfigFile}`);
      const sourceConfig = await this.loadConfig();
      this.config = { ...sourceConfig, ...res };
      await saveFile(this.cliConfigFile, this.config);
      return this.config;
    } catch (e) {
      logger.error(`Failed to save CLI config to ${this.cliConfigFile}`);
      return null;
    }
  }
}
