import { Command, Option } from "commander";
import {
  ChatHandler,
  ChatMessage,
  defaultLanguage,
  languages,
} from "../../libs/chat";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail, waitInterrupt } from "../../libs/util";

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
    let appId = args[0];
    const sessionId = args[1];
    const { language } = flags;

    if (!appId) {
      appId = config.currentApp;
    }

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    const chatHandler = new ChatHandler(
      api,
      appId,
      (messages: ChatMessage[]) => {
        if (!messages.length) return;
        messages.forEach((m) => logger.info(`[agent] ${m.ts} ${m.text}`));
      },
    );
    await chatHandler.init(sessionId, language);

    waitInterrupt().then(() => chatHandler.quit());

    await chatHandler.loop(async () => {
      const answers = await feature.prompt([
        {
          name: "message",
          message: "Your message",
          type: "input",
        },
      ]);

      if (!answers.message || !answers.message.length) return;

      await chatHandler.sendChat(answers.message, language);
    });
  },
};
