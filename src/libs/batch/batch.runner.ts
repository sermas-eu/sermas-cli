import fs from "fs/promises";
import { ulid } from "ulid";
import { CliApi } from "../api/api.cli";
import logger from "../logger";
import { fileExists, toYAML, writeFile } from "../util";
import { ChatBatchRunner } from "./chat.runner";
import { loadChatBatch } from "./loader";
import { ChatBatch } from "./loader.dto";
import { ChatBatchRunnerResult } from "./runner.dto";

type BatchRunnerStats = {
  id: string;
  createdAt: Date;
  batchs: {
    result: ChatBatchRunnerResult;
    batch: ChatBatch;
  }[];
};

export class BatchRunner {
  constructor(
    private readonly api: CliApi,
    private readonly baseDir: string,
    private readonly outputPath?: string,
  ) {}

  async run(batchName: string) {
    const chatBatchs = await loadChatBatch(this.baseDir);

    const stats: BatchRunnerStats = {
      id: ulid(),
      createdAt: new Date(),
      batchs: [],
    };

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
      stats.batchs.push({
        batch: chatBatch,
        result: res,
      });

      if (this.outputPath) {
        await this.saveResults(this.outputPath, stats);
      }
    }

    if (this.outputPath) {
      await this.saveResults(this.outputPath, stats);
    }

    return stats;
  }

  async clearResults(outputPath: string) {
    const exists = await fileExists(outputPath);
    if (exists) {
      logger.info(`Removing results from ${outputPath}`);
      // await fs.rmdir(outputPath, { recursive: true });
    }
  }

  async saveResults(outputPath: string, stats: BatchRunnerStats) {
    const exists = await fileExists(outputPath);
    if (!exists) {
      await fs.mkdir(outputPath, { recursive: true });
    }

    const resultsBaseDir = `${outputPath}/${stats.id}`;
    await fs.mkdir(resultsBaseDir, { recursive: true });

    for (const item of stats.batchs) {
      const resultsDir = `${resultsBaseDir}${
        item.batch.appId ? "/" + item.batch.appId : ""
      }`;
      await fs.mkdir(resultsDir, { recursive: true });

      const filepath = `${resultsDir}/${item.batch.name}.yaml`;

      const exists = await fileExists(filepath);
      if (exists) {
        continue;
      }

      logger.verbose(`Saving ${filepath}`);
      await writeFile(filepath, toYAML(item));
    }
  }
}
