import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command.description("retrieve a user token");
  },

  run: async ({ api }: CommandParams) => {
    const token = await api.getToken();
    if (!token) return fail(`Failed to retrieve token`);
    logger.info(token);
    return token;
  },
};
