import { Command, Option } from "commander";
import {
  ChatHandler,
  ChatMessage,
  defaultLanguage,
  languages,
} from "../../libs/chat/chat-handler";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail, waitInterrupt } from "../../libs/util";
import { sleep } from "@sermas/api-client";

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
      )
      .addOption(
        new Option("-m, --message [message]", "Message to send to the avatar"),
      );
  },

  run: async ({ args, config, feature, flags, api }: CommandParams) => {
    let appId = args[0];
    const sessionId = args[1];
    const { language, message } = flags;

    if (!appId) {
      appId = config.currentApp;
    }

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    const chatHandler = new ChatHandler({
      api,
      appId,
      sessionId,
      language,
      onMessage: (messages: ChatMessage[]) => {
        if (!messages.length) return;
        messages.forEach((m) =>
          logger.info(
            `[agent] ${new Date(m.ts).toTimeString().split(" ")[0]} ${m.text}`,
          ),
        );
      },
    });

    waitInterrupt().then(() => chatHandler.quit());

    await chatHandler.init();

    await chatHandler.loop(async () => {
      await sleep(2500);

      if (message) {
        await chatHandler.sendChat(message);
      }

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
