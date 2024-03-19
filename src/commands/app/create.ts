import { Command } from "commander";

import logger from "../../libs/logger";
import { fail } from "../../libs/util";
import { CommandParams } from "../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command
      .description("Create a new application")
      .option("--public", "Expose as a public application")
      .argument("[name]", "Application name");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const app = {
      name: args[0],
      public: flags.public || false,
    };

    const questions = [];

    if (!app.name) {
      questions.push({
        name: "name",
        message: "App name",
        type: "input",
      });
    }

    if (questions.length) {
      const answers = await feature.prompt(questions);
      if (answers.name) app.name = answers.name;
    }

    if (!app.name) return fail(`An app name is required`);

    const jwt = await api.getTokenInfo();
    if (!jwt) return fail(`Token is not available. Try to login first.`);

    const res = await api.createApp({
      ...app,
      description: `${app.name} application`,
      clients: [],
      modules: [],
      ownerId: jwt.sub,
      repository: {
        avatars: [],
        backgrounds: [],
      },
      settings: {
        login: false,
        avatar: "",
        language: "",
        background: "",
        llm: "",
      },
    });

    if (!res) return;

    logger.info(`Application ${app.name} created with id=${res.appId}`);
    return res;
  },
};
