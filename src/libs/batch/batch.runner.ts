import { CliApi } from "../api/api.cli";
import logger from "../logger";
import { ChatBatchRunner } from "./chat.runner";
import { loadChatBatch } from "./loader";
import { ChatBatchRunnerResult } from "./runner.dto";

export class BatchRunner {
  constructor(
    private readonly api: CliApi,
    private readonly baseDir: string,
  ) {}

  async run(batchName: string) {
    const chatBatchs = await loadChatBatch(this.baseDir);
    const results: ChatBatchRunnerResult[] = [];
    for (const chatBatch of chatBatchs) {
      if (batchName && batchName !== chatBatch.name) {
        logger.info(`Skip ${chatBatch.name}`);
        continue;
      }

      const chatBatchRunner = new ChatBatchRunner(this.api, chatBatch);
      await chatBatchRunner.init();

      const res = await chatBatchRunner.run();
      if (!res.success) {
        logger.error(`Batch ${chatBatch.name} failed: ${res.reason}`);
      }
      results.push(res);
    }
    return results;
  }
}
