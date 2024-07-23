import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Retrieve a chat history by session ID")
      .argument("[appId]", `The appId reference`);
  },

  run: async ({ args, config, feature, flags, api }: CommandParams) => {
    const [appId] = args;

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    const appApi = await api.getAppClient(appId);
    const appApiClient = appApi.getClient();

    const list = await appApiClient.api.session.search({
      appId,
      requestBody: {
        sort: {
          createdAt: "desc",
        },
        limit: 10,
      },
    });

    console.warn(list);

    logger.info(`Created\t\t\tStatus\tsessionId`);
    list.forEach((session) => {
      logger.info(
        `${new Date(session.createdAt).toISOString().split(".")[0]}\t${
          session.closedAt ? "closed" : "ongoing"
        }\t${session.sessionId}`,
      );
    });

    return list;
  },
};
