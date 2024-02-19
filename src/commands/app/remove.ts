import { Command } from 'commander';
import logger from '../../libs/logger';
import { fail, quit } from '../../libs/util';
import { CommandParams } from '../../libs/dto/cli.dto';

export default {
  setup: async (command: Command) => {
    command
      .description('Delete an application')
      .option('--public', 'Save credentials locally')
      .argument('[appId]', 'Application ID');
  },

  run: async ({ args, feature, api }: CommandParams) => {
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

    const answers = await feature.prompt([
      {
        name: 'confirm',
        message: 'Are you sure?',
        type: 'confirm',
      },
    ]);

    if (!answers.confirm) return fail(`App removal aborted.`);

    await api.removeApp(appId);

    logger.info(`Application removed appId=${appId}`);
    return appId;
  },
};
