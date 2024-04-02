import { Command } from "commander";

import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

import { copyTemplate } from "@libs/app";

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
    const filepath = args[0];
    const force = flags.force;

    if (!filepath) return fail(`Please provide a destination path`);

    const fullpath = await copyTemplate(filepath, force);
    if (fullpath === null) {
      return fail();
    }

    logger.info(`Application template created at ${fullpath}`);
    return fullpath;
  },
};
