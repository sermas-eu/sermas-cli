import { Command } from "commander";
import logger from "../../libs/logger";
import { PlatformAppDto } from "@sermas/api-client";
import { fail, loadFile } from "../../libs/util";
import { CommandParams } from "../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command
      .argument("<path>", "a JSON with one or more application definition")
      .description("Update an new application");
  },

  run: async ({ args, api }: CommandParams) => {
    const [importFilePath] = args;

    logger.info(`Reading file ${importFilePath}`);
    let apps = await loadFile<PlatformAppDto | PlatformAppDto[]>(
      importFilePath,
    );

    if (apps === null) return fail(`Failed to load file`);

    apps = apps instanceof Array ? apps : [apps];

    for (const app of apps) {
      logger.info(`Updating ${app.name}`);
      const res = await api.updateApp(app);
      if (res === null) {
        logger.error(`Failed to import ${app.name} (appId=${app.appId})`);
      }
    }

    logger.info(`Completed`);
  },
};
