import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import { fail } from "../../libs/util";

import colors from "cli-color";

export default {
  setup: async (command: Command) => {
    command
      .description("Retrieve a chat history by session ID")
      .argument("[appId]", `The appId reference`)
      .argument("[sessionId]", `The sessionId to retrieve`);
  },

  run: async ({ args, config, feature, flags, api }: CommandParams) => {
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

    const history = await appApiClient.api.dialogue.getChatHistory({
      sessionId,
    });

    for (const message of history) {
      const color =
        (message.role as any) === "user" ? colors.white.bold : colors.cyan.bold;

      console.warn(message);
      if (message.type !== undefined && message.type !== "message") {
        // console.log(
        //   colors.magenta.italic(`[${message.type}] ${message.content}`) +
        //     colors.reset,
        // );
        continue;
      }

      console.log(`${color(message.role)}: ${message.content}`);
    }

    return history;
  },
};
