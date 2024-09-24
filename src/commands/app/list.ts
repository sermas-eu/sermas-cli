import { Command, Option } from "commander";
import logger from "../../libs/logger";
import { fail, quit } from "../../libs/util";
import { CommandParams } from "../../libs/dto/cli.dto";

const formats: string[] = ['table', 'json'];
const defaultFormat: string = 'table';

const truncateOrPad = (s: string | undefined, targetLength: number, withoutEllipsis?: boolean) => {
  s = s || "";
  withoutEllipsis = withoutEllipsis || false;
  if (s.length > targetLength) {
    if (withoutEllipsis) {
      s = s.substring(0, targetLength);
    } else {
      s = s.substring(0, targetLength - 1) + "…";
    }
  }
  s = s.padEnd(targetLength, " ");
  return s
}

export default {
  setup: async (command: Command) => {
    command.description("List user applications")
    .addOption(
      new Option(
        "-o, --output [output]",
        "Output format",
      )
        .default(defaultFormat)
        .choices(formats),
    );
  },

  run: async ({ args, feature, flags, api }: CommandParams) => {
    const { output } = flags;
    const apps = await api.listUserApps();
    if (apps === null) return fail("Failed to load apps");
    if (!apps.length) {
      return quit("No application(s) found");
    }
    let message: string = "";
    switch (output) {
      case 'table':
        message += `${apps.length} applications found:\n`;
        message += " appId                               | name            | description               | createdAt           | updatedAt\n";
        apps.forEach((app) => {
          const row: string = [
            truncateOrPad(app.appId, 36),
            truncateOrPad(app.name, 15),
            truncateOrPad(app.description, 25),
            truncateOrPad(app.createdAt, 19, true),
            truncateOrPad(app.updatedAt, 19, true)
          ].join(" | ");
          message += row + "\n";
        });
        break;
      case 'json':
        message += JSON.stringify(apps, null, 2);
    }

    logger.info(message)

    return apps;
  },
};

