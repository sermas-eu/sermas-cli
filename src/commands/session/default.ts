import { Command } from "commander";

export default {
  setup: async (command: Command) => {
    command.description("handle sessions");
  },
};
