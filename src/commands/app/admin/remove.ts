import { Command } from "commander";
import logger from "../../../libs/logger";
import { fail, quit } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command
      .description("Delete applications")
      .argument("<appId...>", "Applications ID");
  },

  run: async ({ args, feature, api }: CommandParams) => {
    const appId: string[] = args;

    if (!appId.length) {
      return quit(`No applications ID provided`);
    }

    logger.info(`Removing ${appId.join(", ")}`);
    const answers = await feature.prompt([
      {
        name: "confirm",
        message: "Are you sure?",
        type: "confirm",
      },
    ]);

    if (!answers.confirm) return fail(`App removal aborted.`);

    await api.removeApps(appId);

    logger.info(`Application removed appId=[${appId.join(", ")}]`);
    return appId;
  },
};
