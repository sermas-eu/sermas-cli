import { Command } from "commander";

export default {
  setup: async (command: Command) => {
    command
      .description("stats for the sermas api")
      .option(
        "--since <iso_datetime|timestamp_in_ms|interval_string>",
        "collect stats since this UTC moment. Also accepts XX[d|h|m|s] intervals like '10m', '30s', etc.",
        "60s",
      )
      .option(
        "--until <iso_datetime|timestamp_in_ms>",
        "collect stats until this UTC moment. Defaults to now.",
      );
    // .option("--output-file <file_path>", "Save CSV stats in this file")
  },
};
