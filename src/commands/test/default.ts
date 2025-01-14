import { Command } from "commander";

export default {
  setup: async (command: Command) => {
    command
      .description("test applications")
      .option("--pace <interval>", "wait after each action (in ms)", "0")
      .option("--base-url <url>", "website base URL", "http://localhost:8080");
  },
};
