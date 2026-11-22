import { Command } from "commander";
import logger from "../../libs/logger.js";
import { confirmed, fail, quit } from "../../libs/util.js";
import { CommandParams } from "../../libs/dto/cli.dto.js";

export default {
  setup: async (command: Command) => {
    command
      .description("Delete an application")
      .option("--yes", "Remove without asking for confirmation")
      .argument("[appId]", "Application ID");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    let [appId] = args;

    const apps = await api.listUserApps();
    if (apps === null) return fail(`Failed to load apps`);
    if (!apps.length) {
      return quit(`No applications found`);
    }

    if (!appId) {
      try {
        const answers = await feature.prompt([
          {
            name: "appId",
            type: "rawlist",
            message: "Select an application",
            choices: apps.map(({ name, appId: value }) => ({
              name,
              value,
            })),
          },
        ]);
        appId = answers.appId;
      } catch (e) {
        logger.debug(e.stack);
        return fail(e.message);
      }
    }

    if (!appId) return fail(`Please select an application to continue`);

    if (!apps.filter((app) => app.appId === appId).length)
      return fail(`Application not found for appId=${appId}`);

    if (!(await confirmed(flags, feature))) return fail(`App removal aborted.`);

    // null: the request failed (requestWrapper logged why)
    if ((await api.removeApp(appId)) === null)
      return fail(`Failed to remove appId=${appId}`);

    logger.info(`Application removed appId=${appId}`);
    return appId;
  },
};
