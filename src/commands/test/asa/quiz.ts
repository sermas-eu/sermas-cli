import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";
import { sleep } from "@sermas/api-client";

export default {
  setup: async (command: Command) => {
    command.description("answer the first question of a quiz");
  },

  run: async ({ flags }: CommandParams) => {
    const baseUrl = flags.baseUrl;
    const pace = parseInt(flags.pace);
    const browser: Browser = new Browser(`${baseUrl}/asa`, pace);
    let reply: string;
    try {
      await browser.initSession(true);
      await sleep(12000); // You need to wait for the initial message to complete...
      await browser.click({
        xpath:
          "//div[@id='ui-content']//button[text()='Take a quiz about them.']",
      });
      await browser.talkToAvatar("Quiz me on the DW running bag", 1000);
      await browser.click({
        xpath:
          "//div[@id='ui-content']//button[text()='Credit and debit cards.']",
      });
      sleep(2000);
      reply = await browser.getLastMessage();
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from Guardia");
    if (!reply.includes("Sorry, but that's a bad choice"))
      fail(`Not giving reason for wrong answer. Last reply: "${reply}"`);
    return [];
  },
};
