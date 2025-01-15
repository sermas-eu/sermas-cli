import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";
import { sleep } from "@sermas/api-client";

export default {
  setup: async (command: Command) => {
    command.description("start a lesson");
  },

  run: async ({ flags }: CommandParams) => {
    const baseUrl = flags.baseUrl;
    const pace = parseInt(flags.pace);
    const browser: Browser = new Browser(`${baseUrl}/asa`, pace);
    let reply: string;
    try {
      await browser.initSession(true);
      await sleep(12000); // You need to wait for the initial message to complete...
      await browser.talkToAvatar("I want to learn first");
      const buttonText =
        "Learn about reporting from political demonstrations and areas of unrest";
      await browser.click({
        xpath: `//div[@id='ui-content']//button[text()='${buttonText}']`,
      });
      reply = await browser.getLastMessage();
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from Guardia");
    if (!reply.includes("Here's a checklist of things"))
      fail(`Guardia is not starting a lesson. Last reply: "${reply}"`);
    return [];
  },
};
