import { Command } from "commander";
import * as d3 from "d3";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail, writeFile } from "../../libs/util";

const parseDateTime = (
  dateTime: string,
  acceptIntervalCodes: boolean = false,
): Date => {
  if (!dateTime) return null;
  if (acceptIntervalCodes) {
    const interval = dateTime.match(/^(\d+)([dhms])$/);
    if (interval && interval.length) {
      const [, amount, unit] = interval;
      const multiplier = {
        d: 24 * 60 * 60 * 1000,
        h: 60 * 60 * 1000,
        m: 60 * 1000,
        s: 1000,
      }[unit];
      return new Date(Date.now() - parseInt(amount) * multiplier);
    }
  }
  if (dateTime.match(/^\d+$/)) {
    return new Date(parseInt(dateTime));
  } else {
    try {
      return new Date(dateTime);
    } catch (e) {
      logger.warning(`Failed to parse "${dateTime}" to date: ${e}`);
    }
  }
  return null;
};

const writeResultsToCSV = async (results: any[], outputFile: string) => {
  let output = "";
  const headers = [
    "label",
    "mean",
    "median",
    "variance",
    "max",
    "min",
    "count",
  ];
  output += headers.join(",") + "\n";
  for (const result of results) {
    const row = [
      result.label,
      result.mean,
      result.median,
      result.variance,
      result.max,
      result.min,
      result.count,
    ];
    output += row.join(",") + "\n";
  }
  await writeFile(outputFile, output);
};

export default {
  setup: async (command: Command) => {
    command.description("get stats");
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const [appId, sessionId] = args;
    const since: Date = parseDateTime(flags.since, true);
    if (!since) {
      return fail(`Failed to parse since="${flags.since}"`);
    }
    const now = new Date();
    if (since > now) {
      return fail("since date cannot be in the future");
    }
    const until: Date = parseDateTime(flags.until);
    if (until && until < since) {
      return fail("until date cannot be lower than since date");
    }
    const outputFile: string = flags.outputFile;

    const apiClient = await api.getClient();

    const stats = (await apiClient.api.platform.monitoringAdvancedSearch({
      requestBody: {
        appId: appId,
        sessionId: sessionId,
        //          type?: LogType,
        //          label?: string,
        sinceTs: since.toISOString(),
        untilTs: until?.toISOString(),
      },
    })) as any[];

    const valuesByLabel = d3.group(stats, (d) => d.data?.label ?? "unknown");
    const results = [];
    for (const [label, records] of valuesByLabel) {
      const values: number[] = records.map((d) => d.data?.value);
      const mean = d3.mean(values);
      const median = d3.median(values);
      const variance = d3.variance(values);
      const max = d3.max(values);
      const min = d3.min(values);
      const count = d3.count(values);
      results.push({
        label,
        mean,
        median,
        variance,
        max,
        min,
        count,
      });
    }

    if (outputFile) {
      await writeResultsToCSV(results, outputFile);
    }

    return results;
  },
};
