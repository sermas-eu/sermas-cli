import { Command } from "commander";
import logger from "../../../libs/logger.js";
import { confirmed, fail, quit } from "../../../libs/util.js";
import { CommandParams } from "../../../libs/dto/cli.dto.js";

export default {
  setup: async (command: Command) => {
    command
      .description("Delete applications")
      .option("--yes", "Remove without asking for confirmation")
      .argument("<appId...>", "Applications ID");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const appId: string[] = args;

    if (!appId.length) {
      return quit(`No applications ID provided`);
    }

    logger.info(`Removing ${appId.join(", ")}`);
    if (!(await confirmed(flags, feature))) return fail(`App removal aborted.`);

    // null: the request failed (requestWrapper logged why)
    if ((await api.removeApps(appId)) === null)
      return fail(`Failed to remove appId=[${appId.join(", ")}]`);

    logger.info(`Application removed appId=[${appId.join(", ")}]`);
    return appId;
  },
};
