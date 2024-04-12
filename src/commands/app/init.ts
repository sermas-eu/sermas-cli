import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs//logger";
import { fail } from "../../libs//util";
import { Command } from "commander";
import * as path from "path";

import { copyTemplate } from "../../libs//app/structure";

export default {
  setup: async (command: Command) => {
    command
      .description("Create a new application structure")
      .argument("<path>", "Destination path")
      .option(
        "-f, --force",
        "Force creation, overwriting the directory if it exists",
      );
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const currentPwd = process.env.CURRENT_PWD || "";

    const userpath = args[0];
    const force = flags.force;

    if (!userpath) return fail(`Please provide a destination path`);

    const filepath = currentPwd ? path.resolve(currentPwd, userpath) : userpath;

    const fullpath = await copyTemplate(filepath, force);
    if (fullpath === null) {
      return fail();
    }

    logger.info(`Application template created at ${fullpath}`);
    return fullpath;
  },
};
