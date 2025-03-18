import { Command, Option } from "commander";
import { ChatHandler, defaultLanguage, languages } from "../../libs/chat";
import { CommandParams } from "../../libs/dto/cli.dto";
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
    const [appId, sessionId] = args;
    const { language } = flags;

    if (!appId) {
      appId = config.currentApp;
    }

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    const chatHandler = new ChatHandler(api, feature, appId);
    waitInterrupt().then(() => chatHandler.quit());

    await chatHandler.init(sessionId, language);
  },
};
