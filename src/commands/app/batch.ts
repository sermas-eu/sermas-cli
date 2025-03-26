import { Command } from "commander";
import { BatchRunner } from "../../libs/batch/batch.runner";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Run chats in batch to validate interactions")
      .option("-n, --name <string>", `Name of the batch to run`)
      .option("-o, --output <string>", `Output path where to store results`)
      .option("-s, --show-chat", `Show chat messages`)
      .argument("[path]", `Path to load chat definitions`);
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const baseDir = args[0];
    const {
      name: batchName,
      output: outputPath,
      showChat: showChatLogs,
    } = flags;

    if (!baseDir) {
      return fail(
        "Missing argument with base directory path with list of chats",
      );
    }

    const batchRunner = new BatchRunner(api, baseDir, {
      outputPath,
      showChatLogs,
    });
    const stats = await batchRunner.run(batchName);

    stats.batchs.forEach((b) => {
      if (b.result.success) return;
      logger.warn(`Batch ${b.result.name} FAILED: ${b.result.reason}`);
    });

    const success =
      stats.batchs.filter((r) => r.result.success === false).length === 0;
    if (!success) return fail();

    return stats;
  },
};
