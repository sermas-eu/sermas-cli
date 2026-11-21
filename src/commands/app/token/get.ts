import { Command } from "commander";
import { CommandParams } from "../../../libs/dto/cli.dto.js";
import logger from "../../../libs/logger.js";
import { fail } from "../../../libs/util.js";

export default {
  setup: async (command: Command) => {
    command.description("retrieve an app token");
  },

  run: async ({ config, api }: CommandParams) => {
    const appId = config.currentApp;
    if (!appId) return fail("Please select or create an application");

    const res = await api.loadAppCredentials(appId);
    if (!res) return fail(`Failed to retrieve app token`);

    await api.saveClientCredentials(appId, res);

    logger.info("Retrieved app token");
    logger.verbose(JSON.stringify(res, null, 2));
    return res;
  },
};
