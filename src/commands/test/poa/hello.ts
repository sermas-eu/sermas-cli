import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command.description("Say hello to Emma");
  },

  run: async ({ flags }: CommandParams) => {
    const baseUrl = flags.baseUrl;
    const pace = parseInt(flags.pace);
    const browser: Browser = new Browser(`${baseUrl}/poa`, pace);
    let reply: string;
    try {
      await browser.initSession();
      reply = await browser.talkToAvatar("Ciao, Emma! Come stai?");
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from Emma");
    if (!reply.includes("bene")) fail("Emma is not happy");
    return [];
  },
};
