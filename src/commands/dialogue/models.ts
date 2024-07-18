import { Command } from "commander";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";

const languages = ["es-ES", "pt-PT", "it-IT", "de-DE", "en-GB", "fr-FR"];
const defaultLanguage = "en-GB";
const defaultLLM = "chatgpt";

export default {
  setup: async (command: Command) => {
    command.description("List available models");
  },

  run: async ({ args, config, feature, flags, api }: CommandParams) => {
    const client = api.getClient();

    const models: string[] = await client.api.dialogue.listModels();

    models.map((m) => logger.info(m));

    return models;
  },
};
