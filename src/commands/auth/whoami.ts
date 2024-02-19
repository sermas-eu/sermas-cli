import { Command } from 'commander';
import logger from '../../libs/logger';
import { fail } from '../../libs/util';

export default {
  setup: async (command: Command) => {
    command.name('whoami').description('Show the user JWT information');
  },

  run: async ({ api }) => {
    const res = await api.getTokenInfo();
    if (!res) return fail(`Token is not available`);
    logger.verbose(JSON.stringify(res, null, 2));
    logger.info(
      `username=${res.preferred_username} userId=${res.sub} expires=${new Date(
        res.exp * 1000,
      )}`,
    );
    return res;
  },
};
