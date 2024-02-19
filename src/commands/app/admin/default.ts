import { Command } from 'commander';

export default {
  setup: async (command: Command) => {
    command.description('administer applications');
  },
};
