import { saveAppFromDirectory } from "../../libs/app/save";
import logger from "../../libs/logger";
import { Command } from "commander";
import * as path from "path";
import { CommandParams } from "../../libs//dto/cli.dto";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Create a new application")
      .option("--public", "Expose as a public application")
      .argument("[name]", "Application name");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const jwt = await api.getTokenInfo();
    if (!jwt) return fail(`Token is not available. Try to login first.`);

    const currentPwd = process.env.CURRENT_PWD || "";
    const userpath = args[0];
    if (!userpath)
      return fail(
        "Please provide the application definition path. Create one with `sermas-cli app init ./myapp`",
      );

    const filepath = currentPwd ? path.resolve(currentPwd, userpath) : userpath;
    try {
      return await saveAppFromDirectory({
        filepath,
        api,
        jwt,
      });
    } catch (e) {
      logger.debug(e.stack);
      return fail(e.message);
    }
  },
};
