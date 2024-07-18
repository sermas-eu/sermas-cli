import { Command } from "commander";

export default {
  setup: async (command: Command) => {
    command.description("interact with dialogue models");
  },
};
