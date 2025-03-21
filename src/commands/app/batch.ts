import { Command } from "commander";
import { BatchRunner } from "../../libs/batch/batch.runner";
import { CommandParams } from "../../libs/dto/cli.dto";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Run chats in batch to validate interactions")
      .option("-n, --name <string>", `Name of the batch to run`)
      .argument("[path]", `Path to load chat definitions`);
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const baseDir = args[0];
    const { name: batchName } = flags;

    if (!baseDir) {
      return fail(
        "Missing argument with base directory path with list of chats",
      );
    }

    const batchRunner = new BatchRunner(api, baseDir);
    const results = await batchRunner.run(batchName);

    const success = results.filter((r) => r.success === false).length === 0;
    if (!success) return fail();

    return results;
  },
};
