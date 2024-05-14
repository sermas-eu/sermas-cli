import { Command } from "commander";
import { CommandParams } from "../../../libs/dto/cli.dto";
import logger from "../../../libs/logger";
import { fail, loadFile } from "../../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .argument("<file>", "A file with the list of users to import")
      .description("import users");
  },

  run: async ({ api, args }: CommandParams) => {
    const [file] = args;

    const users = await loadFile(file);
    if (!users) return fail(`Cannot read file ${file}`);

    const res = await api.importUsers(users);
    if (!res) {
      return fail(`Import failed`);
    }

    logger.info(`Imported ${res.length} users`);

    return res;
  },
};
