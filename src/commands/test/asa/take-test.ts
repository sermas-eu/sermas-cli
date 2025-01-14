import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";
import { sleep } from "@sermas/api-client";

export default {
  setup: async (command: Command) => {
    command.description("Chat with Guardia");
  },

  run: async ({ flags }: CommandParams) => {
    const baseUrl = flags.baseUrl;
    const pace = parseInt(flags.pace);
    const browser: Browser = new Browser(`${baseUrl}/asa`, pace);
    let reply: string;
    try {
      await browser.initSession(true);
      await sleep(12000); // You need to wait for the initial message to complete...
      reply = await browser.talkToAvatar("I want to chat with you");
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from Guardia");
    if (!reply.includes("Let's chat about DW security protocols"))
      fail(
        `Guardia is not speaking about DW security protocols. Last reply: "${reply}"`,
      );
    return [];
  },
};
