import { SessionDto } from "@sermas/api-client";
import { Command } from "commander";
import { mkdir } from "fs/promises";
import * as path from "path";
import { CommandParams } from "../../libs/dto/cli.dto";
import { formatHistory } from "../../libs/history";
import logger from "../../libs/logger";
import { fail, fileExists, saveFile } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Retrieve a chat history by app ID")
      .argument("[appId]", `The appId reference`)
      .option(
        "-l, --limit [limit]",
        "Limit the number of results. Defaults to 10",
        "10",
      )
      .option("--from [from]", "From date")
      .option("--to [to]", "To date")
      .option(
        "-d, --dump [path]",
        "Export session contents as yaml files to path",
      )
      .option("-s, --stats", "Export also stats as yaml, depends on --dump")
      .option(
        "-f, --dump-format [format]",
        "history format (raw or simple). Default to simple",
        "simple",
      )
      .option(
        "-s, --skip-empty",
        "skip empty session, where the user has not interacted. default true",
        true,
      )
      .option("-p, --print", "print history to screen", false);
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const [appId] = args;

    if (!appId) {
      return fail(
        `Missing appId, select an application or provide it as argument.`,
      );
    }

    const appApi = await api.getAppClient(appId);
    const appApiClient = appApi.getClient();

    const limit =
      flags.limit && +flags.limit == flags.limit ? +flags.limit : 10;

    const query: any = {};

    if (flags.from) {
      const fromDate = new Date(flags.from);
      if (isNaN(fromDate.getTime()))
        return fail(`Cannot parse date from: ${flags.from}`);
      query.from = fromDate;
    }
    if (flags.to) {
      const toDate = new Date(flags.to);
      if (isNaN(toDate.getTime()))
        return fail(`Cannot parse date to: ${flags.to}`);
      query.to = toDate;
    }

    let list: SessionDto[] = [];

    try {
      logger.debug(`Query ${JSON.stringify(query)} limit=${limit}`);
      list = await appApiClient.api.session.search({
        appId,
        requestBody: {
          query,
          sort: {
            createdAt: "asc",
          },
          limit,
        },
      });
    } catch (e) {
      logger.error(e.body?.message ? e.body?.message : e.message);
      return fail();
    }

    if (!flags.dump) {
      logger.info(`Created\t\t\tStatus\tsessionId`);
    } else {
      const dumpPath = path.resolve(`${flags.dump}/${appId}`);
      try {
        if (!(await fileExists(dumpPath))) {
          await mkdir(dumpPath, { recursive: true });
        }
      } catch (e) {
        logger.error(`Error: ${e.message}`);
        return fail(`Failed to create directory ${dumpPath}`);
      }
    }

    for (const session of list) {
      logger.info(
        `${new Date(session.createdAt).toISOString().split(".")[0]}\t${
          session.closedAt ? "closed" : "ongoing"
        }\t${session.sessionId}`,
      );

      if (flags.dump) {
        const dateLabel = new Date(session.createdAt)
          .toISOString()
          .split(".")[0];

        const messagesFilepath = path.resolve(
          `${flags.dump}/${session.appId}/${dateLabel}-${session.sessionId}.yaml`,
        );

        if (flags.stats) {
          const statsFilepath = path.resolve(
            `${flags.dump}/${session.appId}/${dateLabel}-${session.sessionId}-stats.yaml`,
          );

          const stats = await appApiClient.api.platform.monitoringSearch({
            requestBody: {
              appId: session.appId,
              sessionId: session.sessionId,
            },
          });

          const output = [];
          for (const record of stats) {
            output.push({
              type: record.type,
              label: record.label,
              ts: record.ts,
            });
          }
          if (output.length) {
            await saveFile(statsFilepath, {
              appId: session.appId,
              sessionId: session.sessionId,
              createdAt: session.createdAt,
              closedAt: session.closedAt,
              stats: output,
            });
          } else {
            logger.info(`Skip stats, no records found`);
          }
        }

        logger.debug(`Saving messages ${messagesFilepath}`);

        const history = await appApiClient.api.dialogue.getChatHistory({
          sessionId: session.sessionId,
        });

        const messages = formatHistory(history, flags.print);

        if (flags.skipEmpty) {
          if (messages.length === 1) {
            logger.warn(`Skip empty session sessionId=${session.sessionId}`);
            continue;
          }
        }

        const output: any = {
          appId: session.appId,
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          closedAt: session.closedAt,
          history: flags.dumpFormat === "simple" ? messages : history,
        };

        await saveFile(messagesFilepath, output);
        if (flags.print)
          logger.info(
            "\n------------------------------------------------------------",
          );
      }
    }

    logger.info(`Found ${list.length} sessions`);

    return list;
  },
};
