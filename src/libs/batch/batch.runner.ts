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

export type BatchRunnerStats = {
  id: string;
  createdAt: Date;
  batchs: {
    result: ChatBatchRunnerResult;
    batch: ChatBatch;
  }[];
};

const deepCopy = <T = unknown>(o: T) => JSON.parse(JSON.stringify(o)) as T;

export class BatchRunner {
  constructor(
    private readonly api: CliApi,
    private readonly baseDir: string,
    private readonly options: BatchRunnerOptions = {},
  ) {}

  private matchName(chatBatch: ChatBatch, batchNames?: string[] | string) {
    batchNames = typeof batchNames === "string" ? [batchNames] : batchNames;

    // match all if empty
    if (!batchNames || !batchNames.length) return true;

    for (const batchName of batchNames) {
      // use pattern matching
      if (batchName.indexOf("*") > -1) {
        if (!chatBatch.filePath.match(new RegExp(batchName, "i"))) {
          // logger.verbose(`Skip pattern ${chatBatch.name}`);
          continue;
        }

        logger.verbose(
          `Match pattern ${chatBatch.name} (${chatBatch.filePath})`,
        );
        return true;
      }

      if (batchName !== chatBatch.name) {
        // logger.verbose(`Skip match ${chatBatch.name}`);
        continue;
      }

      logger.verbose(`Match name ${chatBatch.name}`);
      return true;
    }

    return false;
  }

  async run(batchNames: string[], parallelize = 1) {
    const chatBatchs = await loadChatBatch(this.baseDir);

    const stats: BatchRunnerStats = {
      id: ulid(),
      createdAt: new Date(),
      batchs: [],
    };

    const queue: (() => Promise<void>)[] = [];

    for (const chatBatch of chatBatchs) {
      const originalSettings = deepCopy(chatBatch.settings);

      for (const modifiedSettings of chatBatch.settingsOverrides || [null]) {
        const matches = this.matchName(chatBatch, batchNames);
        if (!matches) continue;

        // let originalApp: PlatformAppDto;

        // TODO avoid updating app, just set settings in chatBatch
        if (modifiedSettings) {
          logger.debug(
            `Overriding app ${
              chatBatch.appId
            } with the following settings: ${JSON.stringify(modifiedSettings)}`,
          );

          // originalApp = await this.api.loadApp(chatBatch.appId);
          // const modifiedApp = structuredClone(originalApp);
          // modifiedApp.settings = modifiedApp.settings || {
          //   avatar: null,
          //   background: null,
          // };
          // modifiedApp.settings.llm = {
          //   ...modifiedApp.settings.llm,
          //   ...(modifiedSettings.llm || {}),
          // };
          // await this.api.updateApp(modifiedApp);

          chatBatch.settings = {
            ...originalSettings,
            ...modifiedSettings,
          };
        }

        queue.push(async () => {
          try {
            const chatBatchRunner = new ChatBatchRunner(
              this.api,
              deepCopy(chatBatch),
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
          } catch (e) {
            logger.error(`Batch ${chatBatch.name} failed: ${e.message}`);
            logger.debug(e);
          }
        });

        // if (modifiedSettings && originalApp) {
        //   // Restoring original app settings
        //   this.api.updateApp(originalApp);
        //   originalApp = undefined;
        // }
      }
    }

    while (queue.length > 0) {
      const items = queue.splice(0, parallelize);
      logger.verbose(
        `Running ${items.length} batches (${queue.length} remaining)`,
      );
      await Promise.all(
        items.map(async (item) => {
          try {
            await item();
          } catch {}
        }),
      );
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
