import { saveAppFromDirectory } from "@libs/app/save";
import { CommandParams } from "@libs/dto/cli.dto";
import logger from "@libs/logger";
import { PlatformAppDto } from "@sermas/api-client";
import { Command } from "commander";
import { glob } from "glob";
import * as path from "path";

export default {
  setup: async (command: Command) => {
    command
      .option(
        "-s, --skip-clients",
        "Skip the update of the authorization clients and only update the application. Defaults to false",
      )
      .option(
        "-u, --skip-upload",
        "Skip upload of the repository files. Default to false",
      )
      .option(
        "-f, --filter-name [filterName]",
        "Import only applications with name or appId matching the provided filter",
      )
      .argument(
        "<dirpath>",
        "The repository containing applications structures to import",
      )
      .description("import applications");
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const jwt = await api.getTokenInfo();
    if (!jwt) return fail(`Token is not available. Try to login first.`);

    const currentPwd = process.env.CURRENT_PWD || "";
    const userpath = args[0];
    if (!userpath) return fail(`Please provide a path`);

    const importDirPath = currentPwd
      ? path.resolve(currentPwd, userpath)
      : userpath;
    const { skipClients, skipUpload, filterName } = flags;

    logger.info(`Searching apps in ${importDirPath}`);

    const files = await glob([
      path.resolve(importDirPath, "./**/app.{yaml,yml,json}"),
      path.resolve(importDirPath, "./app.{yaml,yml,json}"),
    ]);

    const apps = files.map((file) => path.dirname(file));

    const res: PlatformAppDto[] = [];
    for (const appPath of apps) {
      try {
        res.push(
          await saveAppFromDirectory({
            api,
            filepath: appPath,
            jwt,
            saveApp: async (app: PlatformAppDto) => {
              await api.importApps([app], false);
              return app;
            },
            skipUpload,
          }),
        );
      } catch (e: any) {
        logger.warn(`Failed to import ${path.basename(appPath)} (${appPath})`);
      }
    }

    logger.info(`${res.length} apps imported`);
    return res;
  },
};
