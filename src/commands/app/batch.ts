import { Command } from "commander";
import { BatchRunner, BatchRunnerStats } from "../../libs/batch/batch.runner";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

const parseIntArg = (value, previous) => {
  const val = parseInt(value || previous);
  if (isNaN(val)) {
    throw new Error("Invalid parallelize value");
  }
  return val < 1 ? 1 : val;
};

export default {
  setup: async (command: Command) => {
    command
      .description("Run chats in batch to validate interactions")
      .option(
        "-n, --name <string...>",
        `Name of the batch to run (can be repeated)`,
      )
      .option("-o, --output <string>", `Output path where to store results`)
      .option("-s, --show-chat", `Show chat messages`)
      .option("-p, --parallelize <number>", `Parallelize tests`, parseIntArg, 1)
      .argument("[path]", `Path to load chat definitions`);
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const baseDir = args[0];
    const {
      name: batchNames,
      output: outputPath,
      showChat: showChatLogs,
      parallelize,
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

    let stats: BatchRunnerStats = undefined;

    const evaluateResults = () => {
      const failedTasks: string[] = [];
      stats?.batchs.forEach((b) => {
        if (b.result.success) return;
        logger.warn(`${b.result.name}`);
        logger.warn(`\t\t${b.result.reason}`);
        failedTasks.push(b.result.name);
      });

      if (failedTasks.length) {
        logger.info(`Failed tasks: ${failedTasks.join(" ")}`);
      }
      const success =
        stats?.batchs.filter((r) => r.result.success === false).length === 0;

      if (!success) return fail();

      return stats;
    };

    process.on("SIGINT", function () {
      logger.warn("Caught interrupt signal");
      evaluateResults();
      process.exit();
    });

    stats = await batchRunner.run(batchNames, parallelize);

    return evaluateResults();
  },
};
