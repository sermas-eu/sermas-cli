import fs from "fs/promises";
import { ulid } from "ulid";
import { CliApi } from "../api/api.cli";
import logger from "../logger";
import { fileExists, toYAML, writeFile } from "../util";
import { BatchRunnerOptions } from "./batch.runner.dto";
import { ChatBatchRunner } from "./chat.runner";
import { loadChatBatch } from "./loader";
import { ChatBatch } from "./loader.dto";
import { ChatBatchRunnerResult } from "./runner.dto";
import { AppSettingsDto, PlatformAppDto } from "@sermas/api-client";

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
    private readonly options: BatchRunnerOptions = {},
  ) {}

  private matchName(chatBatch: ChatBatch, batchName?: string) {
    // match all if empty
    if (!batchName) return true;

    // use pattern matching
    if (batchName.indexOf("*") > -1) {
      if (!chatBatch.filePath.match(new RegExp(batchName, "i"))) {
        logger.verbose(`Skip pattern ${chatBatch.name}`);
        return false;
      }
      logger.verbose(`Match pattern ${chatBatch.name} (${chatBatch.filePath})`);
      return true;
    }

    if (batchName !== chatBatch.name) {
      logger.verbose(`Skip match ${chatBatch.name}`);
      return false;
    }
    logger.verbose(`Match name ${chatBatch.name}`);
    return true;
  }

  async run(batchName: string) {
    const chatBatchs = await loadChatBatch(this.baseDir);

    const stats: BatchRunnerStats = {
      id: ulid(),
      createdAt: new Date(),
      batchs: [],
    };

    for (const chatBatch of chatBatchs) {
      for (const modifiedSettings of chatBatch.settingsOverrides || [null]) {
        const matches = this.matchName(chatBatch, batchName);
        if (!matches) continue;
        let originalApp: PlatformAppDto;
        if (modifiedSettings) {
          logger.debug(
            `Overriding app ${
              chatBatch.appId
            } with the following settings: ${JSON.stringify(modifiedSettings)}`,
          );
          originalApp = await this.api.loadApp(chatBatch.appId);
          const modifiedApp = structuredClone(originalApp);
          modifiedApp.settings.llm = {
            ...modifiedApp.settings.llm,
            ...(modifiedSettings.llm || {}),
          };
          await this.api.updateApp(modifiedApp);
        }

        const chatBatchRunner = new ChatBatchRunner(
          this.api,
          chatBatch,
          this.options,
        );
        await chatBatchRunner.init();

        const res = await chatBatchRunner.run();
        if (!res.success) {
          logger.error(`Batch ${chatBatch.name} failed: ${res.reason}`);
        }
        stats.batchs.push({
          batch: chatBatch,
          result: res,
        });

        await this.saveResults(stats);

        if (modifiedSettings && originalApp) {
          // Restoring original app settings
          this.api.updateApp(originalApp);
          originalApp = undefined;
        }
      }
    }

    await this.saveResults(stats);

    return stats;
  }

  async clearResults(outputPath: string) {
    const exists = await fileExists(outputPath);
    if (exists) {
      logger.info(`Removing results from ${outputPath}`);
      // await fs.rmdir(outputPath, { recursive: true });
    }
  }

  async saveResults(stats: BatchRunnerStats) {
    if (!this.options?.outputPath) return;

    const outputPath = this.options?.outputPath;

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
