import { Command } from 'commander';
import { CommandParams } from '../../../libs/dto/cli.dto';
import logger from '../../../libs/logger';
import { PlatformAppDto } from '../../../libs/openapi';
import { fail, loadFile } from '../../../libs/util';

export default {
  setup: async (command: Command) => {
    command
      .option(
        '-s, --skip-clients',
        'Use to skip updating the authorization clients and only update the application. Defaults to false',
      )
      .option(
        '-f, --filter-name [filterName]',
        'Import only applications with name or appId matching the provided filter',
      )
      .argument(
        '<filepath>',
        'A file with the list of applications to import (yaml or json)',
      )
      .description('import applications');
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const [importFilePath] = args;
    const { skipClients, filterName } = flags;

    logger.info(`Reading file ${importFilePath}`);

    let apps = await loadFile<PlatformAppDto | PlatformAppDto[]>(
      importFilePath,
    );
    if (apps === null) return fail(`Failed to load file`);

    apps = apps instanceof Array ? apps : [apps];

    if (filterName && filterName.length) {
      const appNames = filterName.split(',').map((name) => name.trim());
      apps = apps.filter(
        (app) =>
          appNames.filter((filter) => {
            const nameMatch = app.name.match(new RegExp(filter, 'i'))
              ? true
              : false;
            const appIdMatch = app.appId === filter;

            if (nameMatch) logger.info(`${app.name} matches by name`);
            if (appIdMatch)
              logger.info(`${app.name} matches by appId ${app.appId}`);

            return nameMatch || appIdMatch;
          }).length,
      );
      logger.info(`${apps.length} apps matches by name`);
    }

    if (!apps || !apps.length) return fail(`Nothing to import`);
    const res = await api.importApps(apps, skipClients);
    if (res === null) fail(`Import failed`);

    logger.info(`${apps.length} apps imported`);
    return res;
  },
};
