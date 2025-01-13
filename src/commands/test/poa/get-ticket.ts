import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command.description("Say hello to Emma");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const baseUrl = flags.baseurl || "http://localhost:8080";
    const pace = parseInt(flags.pace) || 1000;
    const browser: Browser = new Browser(`${baseUrl}/poa`, pace);
    let reply: string;
    let ticketImageFound: boolean = false;
    try {
      await browser.initSession();
      reply = await browser.talkToAvatar("Ciao, Emma! Vorrei un ticket");
      await browser.select({
        xpath: "(//span[contains(@class, 'image-wrapper')])[last()]",
      });
      ticketImageFound = browser.found;
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from Emma");
    if (!reply.includes("Ecco il tuo numero"))
      fail("Emma did not present the ticket");
    if (!ticketImageFound) fail("Ticket image not shown");
    return [];
  },
};
