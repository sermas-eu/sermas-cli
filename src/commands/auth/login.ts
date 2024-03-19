import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Login and obtain user credentials")
      .option("--saveLocally", "Save credentials locally")
      .argument("[username]", "Your username")
      .argument("[password]", "Your password");
  },

  run: async ({ args, flags, feature, config, api }: CommandParams) => {
    const [username, password] = args;
    let saveLocally = flags.saveLocally || config.auth?.saveLocally;
    const data = {
      appId: undefined,
      username,
      password,
    };

    const questions = [];

    if (!data.username || !data.username.length) {
      questions.push({
        name: "username",
        message: "Your username",
        type: "input",
        default: config.auth?.username,
      });
    }

    if (!data.password || !data.password.length) {
      questions.push({
        name: "password",
        message: "Your password",
        type: "password",
        default: config.auth?.password,
      });
    }

    if (saveLocally === undefined) {
      questions.push({
        name: "saveLocally",
        message:
          "Save your credentials locally? NOTE This will create an unecrypted local file which may expose to security risks.",
        type: "confirm",
      });
    }

    if (questions.length) {
      const answers = await feature.prompt(questions);
      if (answers.username) data.username = answers.username;
      if (answers.password) data.password = answers.password;
      if (answers.saveLocally) saveLocally = answers.saveLocally;
    }

    const res = await api.login(data);
    if (!res) return fail(`Login failed`);

    if (saveLocally) {
      const savedCredentials = await api.saveUserCredentials(res);
      if (savedCredentials === null) return fail(`Cannot save credentials`);
      await api.saveConfig({
        auth: { saveLocally, username: data.username, password: data.password },
      });
    }

    logger.info(`Login successful`);
    return res;
  },
};
