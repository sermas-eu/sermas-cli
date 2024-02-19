import { Command } from 'commander';
import logger from '../../libs/logger';
import { fail, quit } from '../../libs/util';
import { CommandParams } from '../../libs/dto/cli.dto';

export default {
  setup: async (command: Command) => {
    command
      .description('Select an application')
      .argument('[appId]', 'Application ID');
  },

  run: async ({ args, feature, api }: CommandParams) => {
    let [appId] = args;

    const apps = await api.listUserApps();
    if (apps === null) return fail(`Failed to load apps`);
    if (!apps.length) {
      return quit(
        `No applications found. Create an application with 'cli app create'`,
      );
    }

    if (!appId) {
      try {
        const answers = await feature.prompt([
          {
            name: 'appId',
            type: 'rawlist',
            message: 'Select an application',
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

    await api.saveConfig({
      currentApp: appId,
    });

    logger.info(`Application selected (appId=${appId})`);
    return appId;
  },
};
