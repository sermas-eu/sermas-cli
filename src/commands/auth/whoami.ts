import { CommandParams } from "@libs/dto/cli.dto";
import { Command } from "commander";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .name("whoami")
      .description("Show the user JWT information")
      .option("--token", "Return the JWT token");
  },

  run: async ({ api, flags }: CommandParams) => {
    const token = await api.getToken();
    if (!token) return fail(`Token not available, try to login first`);

    logger.verbose(token);
    if (flags.token) return token;

    const res = await api.getTokenInfo(token);
    if (!res) return fail(`Token is not available`);
    logger.verbose(JSON.stringify(res, null, 2));
    logger.info(
      `username=${res.preferred_username} userId=${res.sub} expires=${new Date(
        res.exp * 1000,
      )}`,
    );
    return res;
  },
};
