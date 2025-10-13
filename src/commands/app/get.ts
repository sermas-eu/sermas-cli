import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Retrieve application")
      .argument("[appId]", "Application ID");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const jwt = await api.getTokenInfo();
    if (!jwt) return fail(`Token is not available. Try to login first.`);

    if (!args.length || !args[0]) {
      fail("Missing appId");
    }

    const appId = args[0];
    const client = await api.getAppClient(appId);

    const app = await client.loadApp(appId);

    logger.info(JSON.stringify(app, null, 2));

    return app;
  },
};
