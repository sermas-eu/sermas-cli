import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto.js";
import logger from "../../libs/logger.js";
import { fail } from "../../libs/util.js";

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
