import { Command } from 'commander';

import { CommandParams } from '../../../libs/dto/cli.dto';
import logger from '../../../libs/logger';
import { PlatformAppExportFilterDto } from '../../../libs/openapi';
import { fail, saveFile } from '../../../libs/util';

export default {
  setup: async (command: Command) => {
    command
      .option(
        '-n, --filter-name [filterName]',
        'Filter applications with name matching the provided filter',
      )
      .option(
        '-id, --filter-id [filterName]',
        'Filter applications with id matching the provided filter',
      )
      .argument(
        '[filepath]',
        'File where to save the export. Leave empty to print to stdout',
      )
      .description('export applications');
  },

  run: async ({ args, flags, api }: CommandParams) => {
    const [exportFilePath] = args;
    const { filterId, filterName } = flags;

    const filter: PlatformAppExportFilterDto = {};

    if (filterId && filterId.length) {
      const appId = filterId.split(',').map((s) => s.trim());
      filter.appId = appId;
    }

    if (filterName && filterName.length) {
      filter.name = filterName;
    }

    const res = await api.exportApps(filter);
    if (res === null) fail(`Import failed`);

    logger.info(
      `${res.length} apps exported ${
        exportFilePath ? `to ${exportFilePath}` : ''
      }`,
    );

    if (exportFilePath) {
      const saveres = await saveFile(exportFilePath, res);
      if (saveres === null) return fail(`Failed to save ${exportFilePath}`);
    } else {
      logger.info(`\n\n${JSON.stringify(res, null, 2)}`);
    }

    return res;
  },
};
