import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import { fail } from "../../libs/util";

import { formatHistory } from "../../libs/history";
import logger from "../../libs/logger";

export default {
  setup: async (command: Command) => {
    command
      .description("Retrieve a chat history by session ID")
      .argument("[appId]", `The appId reference`)
      .argument("[sessionId]", `The sessionId to retrieve`);
  },

  run: async ({ args, api }: CommandParams) => {
    const [appId, sessionId] = args;

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    if (!sessionId) {
      return fail(`sessionId is required`);
    }

    const appApi = await api.getAppClient(appId);
    const appApiClient = appApi.getClient();

    const session = await appApiClient.api.session.readSession({
      sessionId,
    });

    logger.info(
      `session settings ${JSON.stringify(session.settings || {}, null, 2)}`,
    );

    const history = await appApiClient.api.dialogue.getChatHistory({
      sessionId,
    });

    formatHistory(history, true);

    return history;
  },
};
