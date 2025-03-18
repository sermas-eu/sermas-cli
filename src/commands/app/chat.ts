import { Command, Option } from "commander";
import { ChatHandler } from "../../libs/chat";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail, uuid, waitInterrupt } from "../../libs/util";

const languages = ["es-ES", "pt-PT", "it-IT", "de-DE", "en-GB", "fr-FR"];
const defaultLanguage = "en-GB";

export default {
  setup: async (command: Command) => {
    command
      .description("Chat with an agent")
      .argument(
        "[appId]",
        `Reference to an application or the selected one will be used`,
      )
      .argument("[sessionId]", `A session ID to reuse or a new one is created`)
      .addOption(
        new Option(
          "-l, --language [language]",
          "Language used in the format `en-US`",
        )
          .default(defaultLanguage)
          .choices(languages),
      );
  },

  run: async ({ args, config, feature, flags, api }: CommandParams) => {
    let [appId, sessionId] = args;
    const { language } = flags;

    if (!appId) {
      appId = config.currentApp;
    }

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    const appApi = await api.getAppClient(appId);
    const appApiClient = appApi.getClient();

    if (!sessionId) {
      const session = await appApi.startSession({
        appId,
        agentId: uuid(),
      });
      sessionId = session.sessionId;
      logger.info(`Created sessionId=${sessionId}`);
    }

    const sendChat = async (text: string) => {
      const res = await appApi.sendChatMessage({
        text,
        appId,
        sessionId,
        language: language || defaultLanguage,
      });
      if (res === null) return fail();
      logger.info(`[you] ${text}`);
    };

    const chatHandler = new ChatHandler(appId, sessionId, appApiClient);
    await chatHandler.init();

    let quit = false;
    waitInterrupt().then(() => (quit = true));

    setInterval(() => {
      const message = chatHandler.getMessages();
      if (message) logger.info(message);
    }, 500);

    while (!quit) {
      const answers = await feature.prompt([
        {
          name: "message",
          message: "Your message",
          type: "input",
        },
      ]);

      if (answers.message && answers.message.length > 0) {
        await sendChat(answers.message);
      }
    }
  },
};
