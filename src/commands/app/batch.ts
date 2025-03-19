import { Command } from "commander";
import { ChatHandler, ChatMessage } from "../../libs/chat/chat-handler";
import { ChatBatchLoader } from "../../libs/chat/loader/loader";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Run chats in batch to validate interactions")
      .option("-n, --name <string>", `Name of the batch to run`)
      .argument("[path]", `Path to load chat definitions`);
  },

  run: async ({ args, config, feature, flags, api }: CommandParams) => {
    const baseDir = args[0];
    const { name: batchName } = flags;

    if (!baseDir) {
      return fail(
        "Missing argument with base directory path with list of chats",
      );
    }

    const batchLoader = new ChatBatchLoader();
    const chatBatchs = await batchLoader.load(baseDir);

    for (const chatBatch of chatBatchs) {
      if (batchName && batchName !== chatBatch.name) {
        logger.info(`Skip ${chatBatch.name}`);
        continue;
      }

      logger.info(`------------------------------------------`);
      logger.info(`Running batch ${chatBatch.name}`);

      const chatHandler = new ChatHandler({
        api,
        appId: chatBatch.appId,
        language: chatBatch?.settings?.language,
        onMessage: (messages: ChatMessage[]) => {
          if (!messages.length) return;
          messages.forEach((m) =>
            logger.info(
              `[agent] ${new Date(m.ts).toTimeString().split(" ")[0]} ${
                m.text
              }`,
            ),
          );
        },
      });

      await chatHandler.init();

      // wait welcome message
      await chatHandler.waitResponse();

      for (const chatMessage of chatBatch.chat) {
        logger.info(`Sending message ${chatMessage.message}`);
        await chatHandler.sendChat(chatMessage.message);
        await chatHandler.waitResponse();
      }
    }
    // waitInterrupt().then(() => chatHandler.quit());

    // await chatHandler.init();

    // await chatHandler.loop(async () => {
    //   await sleep(2500);

    //   if (message) {
    //     await chatHandler.sendChat(message);
    //   }

    //   const answers = await feature.prompt([
    //     {
    //       name: "message",
    //       message: "Your message",
    //       type: "input",
    //     },
    //   ]);

    //   if (!answers.message || !answers.message.length) return;

    //   await chatHandler.sendChat(answers.message, language);
    // });
  },
};
