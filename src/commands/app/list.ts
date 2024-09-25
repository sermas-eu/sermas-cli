import { Command, Option } from "commander";
import { fail, quit } from "../../libs/util";
import { CommandParams } from "../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command.description("List user applications");
  },

  run: async ({ args, feature, flags, api }: CommandParams) => {
    const { output } = flags;
    if (!output) return fail(
      "No output format set. Please use `--json`, `--yaml` " +
      "or `--output` global options"
    );
    const apps = await api.listUserApps();
    if (apps === null) return fail("Failed to load apps");
    if (!apps.length) {
      return quit("No application(s) found");
    }
    return apps;
  },
};

